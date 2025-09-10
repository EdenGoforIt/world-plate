import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { Colors } from '@/constants/Colors';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'document-text-outline',
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <View className="flex-1 justify-center items-center px-8 py-12">
      <LinearGradient
        colors={[Colors.primary + '15', Colors.secondary + '15']}
        className="w-32 h-32 rounded-full justify-center items-center mb-6"
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons name={icon} size={48} color={Colors.primary} />
      </LinearGradient>
      
      <Text className="text-2xl font-bold text-text text-center mb-3">
        {title}
      </Text>
      
      {description && (
        <Text className="text-base text-text opacity-70 text-center mb-8 leading-6">
          {description}
        </Text>
      )}
      
      {actionLabel && onAction && (
        <TouchableOpacity
          onPress={onAction}
          className="bg-primary rounded-xl px-6 py-3"
        >
          <Text className="text-white font-semibold text-base">{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};