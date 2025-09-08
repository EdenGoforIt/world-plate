import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';

export default function ForgotPasswordScreen() {
  const { resetPassword, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [validationError, setValidationError] = useState('');

  const validateEmail = () => {
    if (!email) {
      setValidationError('Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setValidationError('Invalid email address');
      return false;
    }
    setValidationError('');
    return true;
  };

  const handleResetPassword = async () => {
    if (!validateEmail()) return;
    
    try {
      await resetPassword(email);
      setEmailSent(true);
    } catch (err) {
      Alert.alert('Error', 'Failed to send reset email. Please try again.');
    }
  };

  if (emailSent) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 px-6">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mt-4 mb-8"
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>

          <View className="flex-1 justify-center items-center">
            <View className="bg-green-100 rounded-full p-6 mb-6">
              <Ionicons name="mail-open-outline" size={64} color={Colors.success} />
            </View>
            
            <Text className="text-2xl font-bold text-text mb-4 text-center">
              Check Your Email
            </Text>
            
            <Text className="text-base text-text opacity-70 text-center mb-8 px-4">
              We've sent password reset instructions to{'\n'}
              <Text className="font-semibold">{email}</Text>
            </Text>

            <TouchableOpacity
              onPress={() => router.replace('/auth/login')}
              className="bg-primary rounded-xl py-4 px-8"
            >
              <Text className="text-white font-semibold text-lg">Back to Login</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setEmailSent(false)}
              className="mt-6"
            >
              <Text className="text-primary font-medium">Didn't receive email? Try again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="px-6 pt-4">
            <TouchableOpacity
              onPress={() => router.back()}
              className="mb-8"
            >
              <Ionicons name="arrow-back" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <LinearGradient
            colors={[Colors.primary, Colors.secondary]}
            className="mx-6 h-48 rounded-3xl justify-center items-center mb-8"
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View className="bg-white/20 rounded-full p-4">
              <Ionicons name="lock-closed-outline" size={48} color="white" />
            </View>
          </LinearGradient>

          <View className="flex-1 px-6">
            <Text className="text-2xl font-bold text-text mb-2">Forgot Password?</Text>
            <Text className="text-base text-text opacity-70 mb-8">
              No worries! Enter your email address and we'll send you instructions to reset your password.
            </Text>

            <View className="mb-4">
              <View className="flex-row items-center bg-white border border-border rounded-xl px-4 py-3">
                <Ionicons name="mail-outline" size={20} color={Colors.text} style={{ opacity: 0.5 }} />
                <TextInput
                  className="flex-1 ml-3 text-base text-text"
                  placeholder="Email address"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!isLoading}
                />
              </View>
              {validationError && (
                <Text className="text-red-500 text-sm mt-1 ml-1">{validationError}</Text>
              )}
            </View>

            <TouchableOpacity
              onPress={handleResetPassword}
              disabled={isLoading}
              className="bg-primary rounded-xl py-4 mb-6"
              style={{ opacity: isLoading ? 0.6 : 1 }}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-center font-semibold text-lg">
                  Send Reset Instructions
                </Text>
              )}
            </TouchableOpacity>

            <View className="flex-row justify-center">
              <Text className="text-text opacity-70">Remember your password? </Text>
              <TouchableOpacity onPress={() => router.back()}>
                <Text className="text-primary font-semibold">Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}