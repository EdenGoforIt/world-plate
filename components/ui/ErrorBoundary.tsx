import { Ionicons } from '@expo/vector-icons';
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/Colors';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <SafeAreaView className="flex-1 bg-background">
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            className="px-6"
          >
            <View className="flex-1 justify-center items-center py-12">
              <View className="bg-red-100 rounded-full p-6 mb-6">
                <Ionicons name="warning-outline" size={48} color="#EF4444" />
              </View>
              
              <Text className="text-2xl font-bold text-text text-center mb-3">
                Oops! Something went wrong
              </Text>
              
              <Text className="text-base text-text opacity-70 text-center mb-8 leading-6">
                We apologize for the inconvenience. An unexpected error occurred while loading this screen.
              </Text>

              <TouchableOpacity
                onPress={this.handleReset}
                className="bg-primary rounded-xl px-6 py-3 mb-6"
              >
                <Text className="text-white font-semibold text-base">Try Again</Text>
              </TouchableOpacity>

              {__DEV__ && this.state.error && (
                <View className="bg-gray-100 rounded-xl p-4 w-full">
                  <Text className="text-sm font-mono text-red-600 mb-2">
                    {this.state.error.toString()}
                  </Text>
                  {this.state.errorInfo && (
                    <Text className="text-xs font-mono text-gray-600">
                      {this.state.errorInfo.componentStack}
                    </Text>
                  )}
                </View>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}