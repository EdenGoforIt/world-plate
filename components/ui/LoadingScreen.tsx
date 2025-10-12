import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { ActivityIndicator, Text, View } from "react-native";

import { Colors } from "@/constants/Colors";

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = "Loading...",
  fullScreen = true,
}) => {
  const containerClass = fullScreen ? "flex-1" : "py-20";

  return (
    <View
      className={`${containerClass} justify-center items-center bg-background`}
    >
      <LinearGradient
        colors={[Colors.primary + "20", Colors.secondary + "20"]}
        className="w-32 h-32 rounded-full justify-center items-center mb-4"
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ActivityIndicator size="large" color={Colors.primary} />
      </LinearGradient>
      <Text className="text-lg text-text font-medium">{message}</Text>
    </View>
  );
};

interface LoadingSkeletonProps {
  height?: number;
  width?: number | string;
  borderRadius?: number;
  marginBottom?: number;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  height = 20,
  width = "100%",
  borderRadius = 8,
  marginBottom = 0,
}) => {
  return (
    <LinearGradient
      colors={["#E1E8ED", "#F7F9FA", "#E1E8ED"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={{
        height,
        width,
        borderRadius,
        marginBottom,
      }}
    />
  );
};

export const RecipeCardSkeleton: React.FC = () => {
  return (
    <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
      <LoadingSkeleton height={180} marginBottom={12} />
      <LoadingSkeleton height={24} width="70%" marginBottom={8} />
      <LoadingSkeleton height={16} marginBottom={8} />
      <LoadingSkeleton height={16} width="60%" marginBottom={12} />
      <View className="flex-row justify-between">
        <LoadingSkeleton height={32} width={80} />
        <LoadingSkeleton height={32} width={80} />
      </View>
    </View>
  );
};
