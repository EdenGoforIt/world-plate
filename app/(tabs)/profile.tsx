import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useFavorites } from '@/hooks/useFavorites';

export default function ProfileScreen() {
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const { allFavorites } = useFavorites();

  const handleNotificationToggle = async (value: boolean) => {
    setNotificationsEnabled(value);
    await AsyncStorage.setItem('notifications_enabled', JSON.stringify(value));
  };

  const handleDarkModeToggle = async (value: boolean) => {
    setDarkModeEnabled(value);
    await AsyncStorage.setItem('dark_mode_enabled', JSON.stringify(value));
    // Note: You would need to implement actual dark mode theming
  };

  const handleAutoRefreshToggle = async (value: boolean) => {
    setAutoRefreshEnabled(value);
    await AsyncStorage.setItem('auto_refresh_enabled', JSON.stringify(value));
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached recipe data. The app will reload data when needed.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove([
                'recipe_cache',
                'daily_recommendations',
                'last_cache_update'
              ]);
              Alert.alert('Success', 'Cache cleared successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear cache');
            }
          }
        }
      ]
    );
  };

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    value, 
    onToggle, 
    showToggle = true,
    onPress
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    value?: boolean;
    onToggle?: (value: boolean) => void;
    showToggle?: boolean;
    onPress?: () => void;
  }) => (
    <TouchableOpacity 
      className="flex-row items-center justify-between bg-white rounded-xl p-4 mb-3 shadow-sm"
      onPress={onPress}
      disabled={showToggle}
    >
      <View className="flex-row items-center flex-1">
        <View className="bg-primary/10 p-2 rounded-lg mr-3">
          <Ionicons name={icon as any} size={20} color={Colors.primary} />
        </View>
        <View className="flex-1">
          <Text className="text-base font-semibold text-text">{title}</Text>
          {subtitle && <Text className="text-sm text-text opacity-60 mt-1">{subtitle}</Text>}
        </View>
      </View>
      {showToggle ? (
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ false: '#E5E5EA', true: Colors.primary + '40' }}
          thumbColor={value ? Colors.primary : '#F4F3F4'}
        />
      ) : (
        <Ionicons name="chevron-forward" size={20} color={Colors.text + '60'} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar barStyle="light-content" />
      
      {/* Header with user info */}
      <LinearGradient
        colors={[Colors.primary, Colors.secondary]}
        className="px-5 py-6 rounded-b-3xl"
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View className="items-center">
          <View className="bg-white/20 rounded-full p-1 mb-4">
            <View className="bg-white rounded-full w-20 h-20 items-center justify-center">
              <Ionicons name="person" size={32} color={Colors.primary} />
            </View>
          </View>
          <Text className="text-xl font-bold text-white mb-1">Food Explorer</Text>
          <Text className="text-white opacity-90">{allFavorites.length} favorite recipes</Text>
        </View>
      </LinearGradient>

      <ScrollView className="flex-1 p-5" showsVerticalScrollIndicator={false}>
        {/* Stats Card */}
        <View className="bg-white rounded-xl p-4 mb-6 shadow-sm">
          <Text className="text-lg font-bold text-text mb-3">Your Activity</Text>
          <View className="flex-row justify-between">
            <View className="items-center flex-1">
              <Text className="text-2xl font-bold text-primary">{allFavorites.length}</Text>
              <Text className="text-sm text-text opacity-60">Favorites</Text>
            </View>
            <View className="items-center flex-1">
              <Text className="text-2xl font-bold text-primary">0</Text>
              <Text className="text-sm text-text opacity-60">Reviews</Text>
            </View>
            <View className="items-center flex-1">
              <Text className="text-2xl font-bold text-primary">0</Text>
              <Text className="text-sm text-text opacity-60">Cooked</Text>
            </View>
          </View>
        </View>

        {/* Preferences Section */}
        <Text className="text-xl font-bold text-text mb-4">Preferences</Text>
        
        <SettingItem
          icon="notifications"
          title="Push Notifications"
          subtitle="Get notified about new recipe recommendations"
          value={notificationsEnabled}
          onToggle={handleNotificationToggle}
        />

        <SettingItem
          icon="moon"
          title="Dark Mode"
          subtitle="Switch between light and dark themes"
          value={darkModeEnabled}
          onToggle={handleDarkModeToggle}
        />

        <SettingItem
          icon="refresh"
          title="Auto Refresh"
          subtitle="Automatically refresh recommendations daily"
          value={autoRefreshEnabled}
          onToggle={handleAutoRefreshToggle}
        />

        {/* App Section */}
        <Text className="text-xl font-bold text-text mb-4 mt-6">App</Text>

        <SettingItem
          icon="calendar"
          title="Meal Plan"
          subtitle="Plan your weekly meals"
          showToggle={false}
          onPress={() => router.push('/meal-plan')}
        />

        <SettingItem
          icon="basket"
          title="Shopping Lists"
          subtitle="Manage your grocery lists"
          showToggle={false}
          onPress={() => router.push('/shopping-list')}
        />

        <SettingItem
          icon="trash"
          title="Clear Cache"
          subtitle="Free up storage space"
          showToggle={false}
          onPress={handleClearCache}
        />

        <SettingItem
          icon="star"
          title="Rate App"
          subtitle="Help us improve World Plate"
          showToggle={false}
          onPress={() => Alert.alert('Rate App', 'Feature coming soon!')}
        />

        <SettingItem
          icon="mail"
          title="Send Feedback"
          subtitle="Share your thoughts and suggestions"
          showToggle={false}
          onPress={() => Alert.alert('Feedback', 'Feature coming soon!')}
        />

        {/* About Section */}
        <Text className="text-xl font-bold text-text mb-4 mt-6">About</Text>

        <SettingItem
          icon="information-circle"
          title="About World Plate"
          subtitle="Version 1.0.0"
          showToggle={false}
          onPress={() => Alert.alert('About', 'World Plate - Discover recipes from around the world!')}
        />

        <SettingItem
          icon="document-text"
          title="Privacy Policy"
          showToggle={false}
          onPress={() => Alert.alert('Privacy Policy', 'Feature coming soon!')}
        />

        <SettingItem
          icon="shield-checkmark"
          title="Terms of Service"
          showToggle={false}
          onPress={() => Alert.alert('Terms of Service', 'Feature coming soon!')}
        />

        <View className="mb-10" />
      </ScrollView>
    </SafeAreaView>
  );
}