import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = '@favorites';
const PREFERENCES_KEY = '@preferences';

export interface UserPreferences {
  dietaryRestrictions: string[];
  preferredCuisines: string[];
  servingSize: number;
}

export const getFavorites = async (): Promise<string[]> => {
  try {
    const favorites = await AsyncStorage.getItem(FAVORITES_KEY);
    return favorites ? JSON.parse(favorites) : [];
  } catch (error) {
    console.error('Error getting favorites:', error);
    return [];
  }
};

export const addToFavorites = async (recipeId: string): Promise<void> => {
  try {
    const favorites = await getFavorites();
    if (!favorites.includes(recipeId)) {
      const updatedFavorites = [...favorites, recipeId];
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavorites));
    }
  } catch (error) {
    console.error('Error adding to favorites:', error);
  }
};

export const removeFromFavorites = async (recipeId: string): Promise<void> => {
  try {
    const favorites = await getFavorites();
    const updatedFavorites = favorites.filter(id => id !== recipeId);
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavorites));
  } catch (error) {
    console.error('Error removing from favorites:', error);
  }
};

export const isRecipeFavorite = async (recipeId: string): Promise<boolean> => {
  try {
    const favorites = await getFavorites();
    return favorites.includes(recipeId);
  } catch (error) {
    console.error('Error checking if recipe is favorite:', error);
    return false;
  }
};

export const getUserPreferences = async (): Promise<UserPreferences> => {
  try {
    const preferences = await AsyncStorage.getItem(PREFERENCES_KEY);
    return preferences ? JSON.parse(preferences) : {
      dietaryRestrictions: [],
      preferredCuisines: [],
      servingSize: 4
    };
  } catch (error) {
    console.error('Error getting user preferences:', error);
    return {
      dietaryRestrictions: [],
      preferredCuisines: [],
      servingSize: 4
    };
  }
};

export const saveUserPreferences = async (preferences: UserPreferences): Promise<void> => {
  try {
    await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.error('Error saving user preferences:', error);
  }
};