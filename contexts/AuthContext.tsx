import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import * as Keychain from 'react-native-keychain';

import { AuthState, LoginCredentials, SignupCredentials, User } from '@/types/Auth';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_TOKEN_KEY = 'auth_token';
const USER_DATA_KEY = 'user_data';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const credentials = await Keychain.getInternetCredentials('worldplate');
      const userDataString = await AsyncStorage.getItem(USER_DATA_KEY);
      
      if (credentials && userDataString) {
        const userData = JSON.parse(userDataString);
        setState({
          user: userData,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } else {
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  };

  const login = async (credentials: LoginCredentials) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Simulate API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes, create a mock user
      const mockUser: User = {
        id: '1',
        email: credentials.email,
        name: credentials.email.split('@')[0],
        avatar: `https://ui-avatars.com/api/?name=${credentials.email.split('@')[0]}&background=FF6B35&color=fff`,
        joinDate: new Date(),
        preferences: {
          dietaryRestrictions: [],
          allergies: [],
          favoriteCuisines: [],
          skillLevel: 'intermediate',
          mealPlanReminders: true,
          pushNotifications: true,
          emailNotifications: true,
          language: 'en',
          measurementUnit: 'metric',
        },
        stats: {
          recipesCooked: 0,
          favoriteRecipes: 0,
          reviewsWritten: 0,
          averageRating: 0,
          streak: 0,
        },
      };

      // Store credentials securely
      await Keychain.setInternetCredentials(
        'worldplate',
        credentials.email,
        credentials.password
      );
      
      // Store user data
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(mockUser));
      
      setState({
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Invalid email or password',
      });
      throw error;
    }
  };

  const signup = async (credentials: SignupCredentials) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newUser: User = {
        id: Date.now().toString(),
        email: credentials.email,
        name: credentials.name,
        avatar: `https://ui-avatars.com/api/?name=${credentials.name}&background=FF6B35&color=fff`,
        joinDate: new Date(),
        preferences: {
          dietaryRestrictions: [],
          allergies: [],
          favoriteCuisines: [],
          skillLevel: 'beginner',
          mealPlanReminders: true,
          pushNotifications: true,
          emailNotifications: true,
          language: 'en',
          measurementUnit: 'metric',
        },
        stats: {
          recipesCooked: 0,
          favoriteRecipes: 0,
          reviewsWritten: 0,
          averageRating: 0,
          streak: 0,
        },
      };

      await Keychain.setInternetCredentials(
        'worldplate',
        credentials.email,
        credentials.password
      );
      
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(newUser));
      
      setState({
        user: newUser,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Signup failed. Please try again.',
      });
      throw error;
    }
  };

  const logout = async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      await Keychain.resetInternetCredentials('worldplate');
      await AsyncStorage.removeItem(USER_DATA_KEY);
      
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Logout failed:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const resetPassword = async (email: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to send reset email',
      }));
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!state.user) return;
    
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const updatedUser = { ...state.user, ...updates };
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(updatedUser));
      
      setState(prev => ({
        ...prev,
        user: updatedUser,
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to update profile',
      }));
      throw error;
    }
  };

  const refreshUser = async () => {
    if (!state.isAuthenticated) return;
    
    try {
      const userDataString = await AsyncStorage.getItem(USER_DATA_KEY);
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        setState(prev => ({ ...prev, user: userData }));
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        signup,
        logout,
        resetPassword,
        updateProfile,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};