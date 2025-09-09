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

export default function SignupScreen() {
  const { signup, isLoading } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    terms?: string;
  }>({});

  const validateForm = () => {
    const errors: typeof validationErrors = {};
    
    if (!name) {
      errors.name = 'Name is required';
    } else if (name.length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }
    
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
    
    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    if (!acceptTerms) {
      errors.terms = 'You must accept the terms and conditions';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;
    
    try {
      await signup({ email, password, name });
      router.replace('/auth/onboarding');
    } catch (err) {
      Alert.alert('Signup Failed', 'Please try again with different credentials.');
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
            className="h-48 rounded-b-[40px] justify-center items-center"
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View className="bg-white rounded-full p-4 mb-4">
              <Ionicons name="restaurant" size={48} color={Colors.primary} />
            </View>
            <Text className="text-3xl font-bold text-white">Join World Plate</Text>
          </LinearGradient>

          <View className="flex-1 px-6 pt-6">
            <Text className="text-2xl font-bold text-text mb-2">Create Account</Text>
            <Text className="text-base text-text opacity-70 mb-6">
              Start your culinary adventure today
            </Text>

            <View className="mb-4">
              <View className="flex-row items-center bg-white border border-border rounded-xl px-4 py-3">
                <Ionicons name="person-outline" size={20} color={Colors.text} style={{ opacity: 0.5 }} />
                <TextInput
                  className="flex-1 ml-3 text-base text-text"
                  placeholder="Full name"
                  placeholderTextColor="#999"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  editable={!isLoading}
                />
              </View>
              {validationErrors.name && (
                <Text className="text-red-500 text-sm mt-1 ml-1">{validationErrors.name}</Text>
              )}
            </View>

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

            <View className="mb-4">
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

            <View className="mb-4">
              <View className="flex-row items-center bg-white border border-border rounded-xl px-4 py-3">
                <Ionicons name="lock-closed-outline" size={20} color={Colors.text} style={{ opacity: 0.5 }} />
                <TextInput
                  className="flex-1 ml-3 text-base text-text"
                  placeholder="Confirm password"
                  placeholderTextColor="#999"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  editable={!isLoading}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Ionicons 
                    name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} 
                    size={20} 
                    color={Colors.text} 
                    style={{ opacity: 0.5 }}
                  />
                </TouchableOpacity>
              </View>
              {validationErrors.confirmPassword && (
                <Text className="text-red-500 text-sm mt-1 ml-1">{validationErrors.confirmPassword}</Text>
              )}
            </View>

            <TouchableOpacity
              className="flex-row items-center mb-2"
              onPress={() => setAcceptTerms(!acceptTerms)}
            >
              <View className={`w-5 h-5 rounded border ${acceptTerms ? 'bg-primary border-primary' : 'border-border'} mr-3 items-center justify-center`}>
                {acceptTerms && <Ionicons name="checkmark" size={14} color="white" />}
              </View>
              <Text className="text-text flex-1">
                I agree to the{' '}
                <Text className="text-primary">Terms of Service</Text> and{' '}
                <Text className="text-primary">Privacy Policy</Text>
              </Text>
            </TouchableOpacity>
            {validationErrors.terms && (
              <Text className="text-red-500 text-sm mb-4 ml-1">{validationErrors.terms}</Text>
            )}

            <TouchableOpacity
              onPress={handleSignup}
              disabled={isLoading}
              className="bg-primary rounded-xl py-4 mb-4 mt-4"
              style={{ opacity: isLoading ? 0.6 : 1 }}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-center font-semibold text-lg">Create Account</Text>
              )}
            </TouchableOpacity>

            <View className="flex-row items-center mb-4">
              <View className="flex-1 h-[1px] bg-border" />
              <Text className="mx-4 text-text opacity-50">OR</Text>
              <View className="flex-1 h-[1px] bg-border" />
            </View>

            <View className="flex-row space-x-4 mb-6">
              <TouchableOpacity className="flex-1 flex-row items-center justify-center bg-white border border-border rounded-xl py-3">
                <Ionicons name="logo-google" size={20} color="#DB4437" />
                <Text className="ml-2 text-text font-medium">Google</Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-1 flex-row items-center justify-center bg-white border border-border rounded-xl py-3">
                <Ionicons name="logo-apple" size={20} color="#000" />
                <Text className="ml-2 text-text font-medium">Apple</Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row justify-center pb-4">
              <Text className="text-text opacity-70">Already have an account? </Text>
              <Link href="/auth/login" asChild>
                <TouchableOpacity>
                  <Text className="text-primary font-semibold">Sign In</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}