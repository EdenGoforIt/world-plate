import { Ionicons } from "@expo/vector-icons";
import NetInfo from "@react-native-community/netinfo";
import * as Clipboard from "expo-clipboard";
import React, {
    Component,
    createContext,
    ErrorInfo,
    ReactNode,
    useContext,
    useMemo,
} from "react";
import {
    AccessibilityInfo,
    ActivityIndicator,
    Animated,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    Vibration,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { logger } from "../../config/env";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  maxRetries?: number;
  autoRetryDelay?: number;
  enableAutoRecovery?: boolean;
  enableVibration?: boolean;
  enableMetrics?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  errorTimestamp?: Date;
  isOnline: boolean;
  isAutoRetrying: boolean;
  errorHistory: ErrorHistoryItem[];
}

interface ErrorReport {
  error: Error;
  errorInfo: ErrorInfo;
  timestamp: Date;
  userAgent?: string;
  retryCount: number;
  deviceInfo?: DeviceInfo;
  networkStatus?: boolean;
  stackTrace?: string;
  environment?: string;
}

interface ErrorHistoryItem {
  error: Error;
  timestamp: Date;
  recovered: boolean;
  retryCount: number;
}

interface DeviceInfo {
  platform: string;
  version: string;
  model?: string;
}

interface ErrorMetrics {
  totalErrors: number;
  recoveredErrors: number;
  failedRecoveries: number;
  averageRecoveryTime: number;
  errorPatterns: Map<string, number>;
}

interface ErrorContextValue {
  hasError: boolean;
  error: Error | null;
  retry: () => void;
  clearError: () => void;
  reportError: () => void;
}

interface ErrorRecoveryStrategy {
  type: "immediate" | "exponential" | "linear";
  maxDelay?: number;
  baseDelay?: number;
  maxRetries?: number;
}

const ErrorContext = createContext<ErrorContextValue | null>(null);

export const useErrorBoundary = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error("useErrorBoundary must be used within ErrorBoundary");
  }

  return useMemo(
    () => ({
      hasError: context.hasError,
      error: context.error,
      retry: context.retry,
      clearError: context.clearError,
      reportError: context.reportError,
    }),
    [
      context.hasError,
      context.error,
      context.retry,
      context.clearError,
      context.reportError,
    ]
  );
};

export class ErrorBoundary extends Component<Props, State> {
  static displayName = "ErrorBoundary";
  private fadeAnim: Animated.Value;
  private shakeAnim: Animated.Value;
  private readonly maxRetries: number;
  private autoRetryTimer?: ReturnType<typeof setTimeout>;
  private networkUnsubscribe?: () => void;
  private errorMetrics: ErrorMetrics;
  private lastErrorTime: number = 0;
  private errorFrequencyThreshold = 5000; // 5 seconds
  private recoveryStrategy: ErrorRecoveryStrategy = {
    type: "exponential",
    baseDelay: 1000,
    maxDelay: 30000,
  };

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isOnline: true,
      isAutoRetrying: false,
      errorHistory: [],
    };
    this.fadeAnim = new Animated.Value(0);
    this.shakeAnim = new Animated.Value(0);
    this.maxRetries = props.maxRetries ?? 3;
    this.errorMetrics = {
      totalErrors: 0,
      recoveredErrors: 0,
      failedRecoveries: 0,
      averageRecoveryTime: 0,
      errorPatterns: new Map(),
    };
  }

  componentDidMount() {
    // Monitor network status
    this.networkUnsubscribe = NetInfo.addEventListener((state) => {
      const wasOffline = !this.state.isOnline;
      const isNowOnline = state.isConnected ?? false;

      this.setState({ isOnline: isNowOnline });

      // Auto-retry when coming back online
      if (wasOffline && isNowOnline && this.state.hasError) {
        this.handleAutoRecovery();
      }
    });

    // Announce to screen readers
    if (this.state.hasError) {
      AccessibilityInfo.announceForAccessibility(
        "An error has occurred. Error recovery options are available."
      );
    }
  }

  componentWillUnmount() {
    this.networkUnsubscribe?.();
    if (this.autoRetryTimer) {
      clearTimeout(this.autoRetryTimer);
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorTimestamp: new Date(),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    // Update metrics
    this.updateErrorMetrics(error);

    // Check for error patterns
    const isFrequentError = this.detectErrorPattern(error);

    // Vibrate on error if enabled
    if (this.props.enableVibration && Platform.OS !== "web") {
      Vibration.vibrate(500);
    }

    // Report to error tracking service
    this.reportError(error, errorInfo);

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Update error history
    const errorHistory = [
      ...this.state.errorHistory,
      {
        error,
        timestamp: new Date(),
        recovered: false,
        retryCount: this.state.retryCount,
      },
    ].slice(-10); // Keep last 10 errors

    this.setState({
      error,
      errorInfo,
      errorHistory,
    });

    // Animate error screen entrance
    Animated.parallel([
      Animated.timing(this.fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(this.shakeAnim, {
          toValue: 10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(this.shakeAnim, {
          toValue: -10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(this.shakeAnim, {
          toValue: 10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(this.shakeAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Attempt auto-recovery for transient errors
    if (
      this.props.enableAutoRecovery &&
      this.isTransientError(error) &&
      !isFrequentError
    ) {
      this.scheduleAutoRetry();
    }
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    const errorReport: ErrorReport = {
      error,
      errorInfo,
      timestamp: new Date(),
      retryCount: this.state.retryCount,
      deviceInfo: {
        platform: Platform.OS,
        version: Platform.Version.toString(),
      },
      networkStatus: this.state.isOnline,
    };

    // Log to console in development
    if (__DEV__) {
      console.group("🚨 Error Report");
      console.error("Error:", error);
      console.error("Error Info:", errorInfo);
      console.error("Retry Count:", this.state.retryCount);
      console.error(
        "Network Status:",
        this.state.isOnline ? "Online" : "Offline"
      );
      console.error("Device:", errorReport.deviceInfo);
      console.error("Timestamp:", errorReport.timestamp);
      if (this.props.enableMetrics) {
        console.error("Metrics:", this.errorMetrics);
      }
      console.groupEnd();
    }

    // Integration points for error tracking services
    this.sendToErrorTrackingService(errorReport);
  };

  private sendToErrorTrackingService = (errorReport: ErrorReport) => {
    // Sentry Integration
    if (typeof window !== "undefined" && (window as any).Sentry) {
      (window as any).Sentry.captureException(errorReport.error, {
        contexts: {
          react: {
            componentStack: errorReport.errorInfo.componentStack,
          },
          device: errorReport.deviceInfo,
          network: { status: errorReport.networkStatus },
        },
        extra: errorReport,
        tags: {
          errorType: this.getErrorType(errorReport.error),
          retryCount: errorReport.retryCount.toString(),
        },
      });
    }

    // Bugsnag Integration
    if (typeof window !== "undefined" && (window as any).Bugsnag) {
      (window as any).Bugsnag.notify(errorReport.error, {
        metadata: {
          react: errorReport.errorInfo,
          device: errorReport.deviceInfo,
          network: { status: errorReport.networkStatus },
          retry: { count: errorReport.retryCount },
        },
      });
    }

    // Custom Analytics Integration
    if (typeof window !== "undefined" && (window as any).analytics) {
      (window as any).analytics.track("Error Boundary Triggered", {
        errorName: errorReport.error.name,
        errorMessage: errorReport.error.message,
        errorType: this.getErrorType(errorReport.error),
        retryCount: errorReport.retryCount,
        networkStatus: errorReport.networkStatus,
        timestamp: errorReport.timestamp.toISOString(),
      });
    }
  };

  private updateErrorMetrics = (error: Error) => {
    this.errorMetrics.totalErrors++;

    // Track error patterns
    const errorKey = `${error.name}:${error.message.substring(0, 50)}`;
    const currentCount = this.errorMetrics.errorPatterns.get(errorKey) || 0;
    this.errorMetrics.errorPatterns.set(errorKey, currentCount + 1);

    // Log metrics periodically
    if (this.props.enableMetrics && this.errorMetrics.totalErrors % 5 === 0) {
      logger.debug("Error Metrics Update:", this.errorMetrics);
    }
  };

  private detectErrorPattern = (error: Error): boolean => {
    const now = Date.now();
    const timeSinceLastError = now - this.lastErrorTime;
    this.lastErrorTime = now;

    // Check if errors are happening too frequently
    if (timeSinceLastError < this.errorFrequencyThreshold) {
      logger.warn("Frequent errors detected. Disabling auto-recovery.");
      return true;
    }

    // Check if same error is repeating
    const errorKey = `${error.name}:${error.message.substring(0, 50)}`;
    const errorCount = this.errorMetrics.errorPatterns.get(errorKey) || 0;
    if (errorCount > 3) {
      logger.warn(`Repeated error pattern detected: ${errorKey}`);
    }

    return false;
  };

  private isTransientError = (error: Error): boolean => {
    const transientPatterns = [
      /network/i,
      /timeout/i,
      /fetch/i,
      /ChunkLoadError/i,
      /Loading chunk/i,
      /ECONNREFUSED/i,
      /ETIMEDOUT/i,
    ];

    return transientPatterns.some(
      (pattern) => pattern.test(error.name) || pattern.test(error.message)
    );
  };

  private scheduleAutoRetry = () => {
    const delay = this.calculateRetryDelay();

    this.setState({ isAutoRetrying: true });

    this.autoRetryTimer = setTimeout(() => {
      if (this.state.hasError && this.state.retryCount < this.maxRetries) {
        logger.info(`Attempting automatic error recovery after ${delay}ms...`);
        this.handleReset();
      }
      this.setState({ isAutoRetrying: false });
    }, delay);
  };

  private calculateRetryDelay = (): number => {
    const { type, baseDelay = 1000, maxDelay = 30000 } = this.recoveryStrategy;
    const { retryCount } = this.state;

    let delay: number;
    switch (type) {
      case "exponential":
        delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
        break;
      case "linear":
        delay = Math.min(baseDelay * (retryCount + 1), maxDelay);
        break;
      case "immediate":
      default:
        delay = this.props.autoRetryDelay ?? baseDelay;
        break;
    }

    return delay;
  };

  private handleAutoRecovery = () => {
    if (this.state.retryCount < this.maxRetries) {
      logger.info("Network restored. Attempting recovery...");
      setTimeout(() => this.handleReset(), 1000);
    }
  };

  private getErrorType = (error: Error): string => {
    const errorTypeMap: Record<string, string> = {
      ChunkLoadError: "chunk_load",
      NetworkError: "network",
      TypeError: "type",
      ReferenceError: "reference",
      SyntaxError: "syntax",
    };

    if (errorTypeMap[error.name]) {
      return errorTypeMap[error.name];
    }

    if (error.message.includes("Loading chunk")) {
      return "chunk_load";
    }
    if (error.message.includes("fetch") || error.message.includes("network")) {
      return "network";
    }

    return "generic";
  };

  private getRecoveryMessage = (): string => {
    const errorType = this.getErrorType(this.state.error!);

    switch (errorType) {
      case "chunk_load":
        return "This might be a temporary loading issue. Please refresh the page.";
      case "network":
        return "Please check your internet connection and try again.";
      case "type":
        return "An unexpected error occurred. Our team has been notified.";
      default:
        return "We apologize for the inconvenience. An unexpected error occurred while loading this screen.";
    }
  };

  handleReset = () => {
    const { retryCount, errorHistory } = this.state;

    if (retryCount >= this.maxRetries) {
      console.warn(`Maximum retry attempts (${this.maxRetries}) reached`);
      this.errorMetrics.failedRecoveries++;
      AccessibilityInfo.announceForAccessibility(
        "Maximum retry attempts reached. Please report this issue."
      );
      return;
    }

    // Clear auto-retry timer if exists
    if (this.autoRetryTimer) {
      clearTimeout(this.autoRetryTimer);
    }

    // Mark last error as recovered
    if (errorHistory.length > 0) {
      errorHistory[errorHistory.length - 1].recovered = true;
      this.errorMetrics.recoveredErrors++;
    }

    this.fadeAnim.setValue(0);
    this.shakeAnim.setValue(0);
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: retryCount + 1,
      isAutoRetrying: false,
    });

    AccessibilityInfo.announceForAccessibility("Retrying...");
  };

  private clearError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    });
  };

  handleReportIssue = async () => {
    const errorReport = {
      error: this.state.error?.toString(),
      errorStack: this.state.error?.stack,
      timestamp: this.state.errorTimestamp,
      retryCount: this.state.retryCount,
      platform: Platform.OS,
      platformVersion: Platform.Version,
      networkStatus: this.state.isOnline,
      errorType: this.getErrorType(this.state.error!),
      errorHistory: this.state.errorHistory.map((e) => ({
        error: e.error.toString(),
        timestamp: e.timestamp,
        recovered: e.recovered,
        retryCount: e.retryCount,
      })),
      componentStack: this.state.errorInfo?.componentStack,
      metrics: this.props.enableMetrics ? this.errorMetrics : undefined,
    };

    const errorDetails = JSON.stringify(errorReport, null, 2);

    try {
      await Clipboard.setStringAsync(errorDetails);
      logger.info("Error details copied to clipboard");
      AccessibilityInfo.announceForAccessibility(
        "Error details copied to clipboard"
      );

      // Send to error tracking service
      this.sendToErrorTrackingService({
        error: this.state.error!,
        errorInfo: this.state.errorInfo!,
        timestamp: new Date(),
        retryCount: this.state.retryCount,
        deviceInfo: {
          platform: Platform.OS,
          version: Platform.Version.toString(),
        },
        networkStatus: this.state.isOnline,
        stackTrace: this.state.error?.stack,
        environment: __DEV__ ? "development" : "production",
      });
    } catch (clipboardError) {
      logger.error("Failed to copy error details:", clipboardError);
    }

    if (__DEV__) {
      logger.debug("Error report generated:", errorDetails);
    }
  };

  private getErrorContext = (): ErrorContextValue => ({
    hasError: this.state.hasError,
    error: this.state.error,
    retry: this.handleReset,
    clearError: this.clearError,
    reportError: this.handleReportIssue,
  });

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return (
          <ErrorContext.Provider value={this.getErrorContext()}>
            {this.props.fallback}
          </ErrorContext.Provider>
        );
      }

      const isMaxRetriesReached = this.state.retryCount >= this.maxRetries;
      const errorType = this.getErrorType(this.state.error!);
      const { isOnline, isAutoRetrying } = this.state;

      return (
        <ErrorContext.Provider value={this.getErrorContext()}>
          <SafeAreaView className="flex-1 bg-background">
            <Animated.View
              style={{
                opacity: this.fadeAnim,
                flex: 1,
                transform: [{ translateX: this.shakeAnim }],
              }}
            >
              {!isOnline && (
                <View className="bg-orange-500 px-4 py-2">
                  <Text className="text-white text-center text-sm">
                    You are currently offline
                  </Text>
                </View>
              )}

              <ScrollView
                contentContainerStyle={{ flexGrow: 1 }}
                className="px-6"
                accessible={true}
                accessibilityRole="alert"
                accessibilityLabel="Error screen"
              >
                <View className="flex-1 justify-center items-center py-12">
                  <View className="bg-red-100 rounded-full p-6 mb-6">
                    <Ionicons
                      name={
                        errorType === "network"
                          ? "wifi-outline"
                          : "warning-outline"
                      }
                      size={48}
                      color="#EF4444"
                    />
                  </View>

                  <Text className="text-2xl font-bold text-text text-center mb-3">
                    {errorType === "network"
                      ? "Connection Problem"
                      : "Oops! Something went wrong"}
                  </Text>

                  <Text className="text-base text-text opacity-70 text-center mb-8 leading-6">
                    {this.getRecoveryMessage()}
                  </Text>

                  {!isMaxRetriesReached && (
                    <TouchableOpacity
                      onPress={this.handleReset}
                      disabled={isAutoRetrying || !isOnline}
                      className={`rounded-xl px-6 py-3 mb-3 ${
                        isAutoRetrying || !isOnline
                          ? "bg-gray-400"
                          : "bg-primary"
                      }`}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel="Retry button"
                      accessibilityHint="Tap to retry loading the screen"
                    >
                      {isAutoRetrying ? (
                        <View className="flex-row items-center justify-center">
                          <ActivityIndicator size="small" color="white" />
                          <Text className="text-white font-semibold text-base ml-2">
                            Auto-retrying...
                          </Text>
                        </View>
                      ) : (
                        <Text className="text-white font-semibold text-base">
                          {!isOnline
                            ? "Waiting for connection..."
                            : `Try Again ${
                                this.state.retryCount > 0
                                  ? `(${this.state.retryCount}/${this.maxRetries})`
                                  : ""
                              }`}
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}

                  {isMaxRetriesReached && (
                    <View className="items-center">
                      <Text className="text-sm text-red-600 mb-4">
                        Maximum retry attempts reached
                      </Text>
                      <TouchableOpacity
                        onPress={this.handleReportIssue}
                        className="border border-primary rounded-xl px-6 py-3"
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel="Report issue button"
                      >
                        <Text className="text-primary font-semibold text-base">
                          Report Issue
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {__DEV__ && this.state.error && (
                    <View className="bg-gray-100 rounded-xl p-4 w-full mt-6">
                      <View className="flex-row items-center mb-2">
                        <Text className="text-xs font-semibold text-gray-600 mr-2">
                          ERROR TYPE:
                        </Text>
                        <Text className="text-xs font-mono text-red-600">
                          {errorType.toUpperCase()}
                        </Text>
                      </View>

                      <View className="flex-row items-center mb-2">
                        <Text className="text-xs font-semibold text-gray-600 mr-2">
                          NETWORK:
                        </Text>
                        <Text className="text-xs font-mono text-gray-600">
                          {isOnline ? "✅ Online" : "❌ Offline"}
                        </Text>
                      </View>

                      <Text className="text-sm font-mono text-red-600 mb-2">
                        {this.state.error.toString()}
                      </Text>

                      {this.state.errorTimestamp && (
                        <Text className="text-xs text-gray-500 mb-2">
                          Occurred at:{" "}
                          {this.state.errorTimestamp.toLocaleTimeString()}
                        </Text>
                      )}

                      {this.state.errorHistory.length > 1 && (
                        <View className="mb-2">
                          <Text className="text-xs font-semibold text-gray-600 mb-1">
                            ERROR HISTORY ({this.state.errorHistory.length}):
                          </Text>
                          {this.state.errorHistory
                            .slice(-3)
                            .map((item, index) => (
                              <Text
                                key={index}
                                className="text-xs text-gray-500"
                              >
                                • {item.error.name} at{" "}
                                {item.timestamp.toLocaleTimeString()}
                                {item.recovered ? " ✅" : " ❌"}
                              </Text>
                            ))}
                        </View>
                      )}

                      {this.props.enableMetrics && (
                        <View className="mb-2">
                          <Text className="text-xs font-semibold text-gray-600 mb-1">
                            METRICS:
                          </Text>
                          <Text className="text-xs text-gray-500">
                            Total: {this.errorMetrics.totalErrors} | Recovered:{" "}
                            {this.errorMetrics.recoveredErrors} | Failed:{" "}
                            {this.errorMetrics.failedRecoveries}
                          </Text>
                        </View>
                      )}

                      {this.state.errorInfo && (
                        <ScrollView className="max-h-32" nestedScrollEnabled>
                          <Text className="text-xs font-mono text-gray-600">
                            {this.state.errorInfo.componentStack}
                          </Text>
                        </ScrollView>
                      )}
                    </View>
                  )}
                </View>
              </ScrollView>
            </Animated.View>
          </SafeAreaView>
        </ErrorContext.Provider>
      );
    }

    return (
      <ErrorContext.Provider value={this.getErrorContext()}>
        {this.props.children}
      </ErrorContext.Provider>
    );
  }
}
