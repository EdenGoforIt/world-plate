import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from 'expo-router';
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

export default function LoginScreen() {
  const { login, isLoading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ email?: string; password?: string }>({});

  const validateForm = () => {
    const errors: { email?: string; password?: string } = {};
    
    if (!email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Invalid email address';
    }
    
    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    
    try {
      await login({ email, password });
      router.replace('/(tabs)');
    } catch (err) {
      Alert.alert('Login Failed', 'Please check your credentials and try again.');
    }
  };

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
          <LinearGradient
            colors={[Colors.primary, Colors.secondary]}
            className="h-64 rounded-b-[40px] justify-center items-center"
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View className="bg-white rounded-full p-4 mb-4">
              <Ionicons name="restaurant" size={48} color={Colors.primary} />
            </View>
            <Text className="text-3xl font-bold text-white">World Plate</Text>
            <Text className="text-white opacity-90 mt-2">Discover Global Flavors</Text>
          </LinearGradient>

          <View className="flex-1 px-6 pt-8">
            <Text className="text-2xl font-bold text-text mb-2">Welcome Back!</Text>
            <Text className="text-base text-text opacity-70 mb-8">
              Sign in to continue your culinary journey
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
              {validationErrors.email && (
                <Text className="text-red-500 text-sm mt-1 ml-1">{validationErrors.email}</Text>
              )}
            </View>

            <View className="mb-6">
              <View className="flex-row items-center bg-white border border-border rounded-xl px-4 py-3">
                <Ionicons name="lock-closed-outline" size={20} color={Colors.text} style={{ opacity: 0.5 }} />
                <TextInput
                  className="flex-1 ml-3 text-base text-text"
                  placeholder="Password"
                  placeholderTextColor="#999"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  editable={!isLoading}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons 
                    name={showPassword ? "eye-outline" : "eye-off-outline"} 
                    size={20} 
                    color={Colors.text} 
                    style={{ opacity: 0.5 }}
                  />
                </TouchableOpacity>
              </View>
              {validationErrors.password && (
                <Text className="text-red-500 text-sm mt-1 ml-1">{validationErrors.password}</Text>
              )}
            </View>

            <TouchableOpacity className="self-end mb-6">
              <Link href="/auth/forgot-password" asChild>
                <Text className="text-primary font-medium">Forgot Password?</Text>
              </Link>
            </TouchableOpacity>

            {error && (
              <View className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                <Text className="text-red-600 text-center">{error}</Text>
              </View>
            )}

            <TouchableOpacity
              onPress={handleLogin}
              disabled={isLoading}
              className="bg-primary rounded-xl py-4 mb-4"
              style={{ opacity: isLoading ? 0.6 : 1 }}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-center font-semibold text-lg">Sign In</Text>
              )}
            </TouchableOpacity>

            <View className="flex-row items-center mb-6">
              <View className="flex-1 h-[1px] bg-border" />
              <Text className="mx-4 text-text opacity-50">OR</Text>
              <View className="flex-1 h-[1px] bg-border" />
            </View>

            <View className="flex-row space-x-4 mb-8">
              <TouchableOpacity className="flex-1 flex-row items-center justify-center bg-white border border-border rounded-xl py-3">
                <Ionicons name="logo-google" size={20} color="#DB4437" />
                <Text className="ml-2 text-text font-medium">Google</Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-1 flex-row items-center justify-center bg-white border border-border rounded-xl py-3">
                <Ionicons name="logo-apple" size={20} color="#000" />
                <Text className="ml-2 text-text font-medium">Apple</Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row justify-center">
              <Text className="text-text opacity-70">Don't have an account? </Text>
              <Link href="/auth/signup" asChild>
                <TouchableOpacity>
                  <Text className="text-primary font-semibold">Sign Up</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}