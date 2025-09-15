export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  bio?: string;
  location?: string;
  joinDate: Date;
  preferences: UserPreferences;
  stats: UserStats;
}

export interface UserPreferences {
  dietaryRestrictions: string[];
  allergies: string[];
  favoriteCuisines: string[];
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'professional';
  mealPlanReminders: boolean;
  pushNotifications: boolean;
  emailNotifications: boolean;
  language: string;
  measurementUnit: 'metric' | 'imperial';
}

export interface UserStats {
  recipesCooked: number;
  favoriteRecipes: number;
  reviewsWritten: number;
  averageRating: number;
  streak: number;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  password: string;
  name: string;
}

export interface ResetPasswordCredentials {
  email: string;
}