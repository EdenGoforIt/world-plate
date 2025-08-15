import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = '@favorites';
const COUNTRY_FAVORITES_KEY = '@country_favorites';
const PREFERENCES_KEY = '@preferences';

export interface UserPreferences {
  dietaryRestrictions: string[];
  preferredCuisines: string[];
  servingSize: number;
}

export interface CountryFavorites {
  [countryName: string]: string[]; // country name to recipe IDs
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

// Country-based favorites functions
export const getCountryFavorites = async (): Promise<CountryFavorites> => {
  try {
    const favorites = await AsyncStorage.getItem(COUNTRY_FAVORITES_KEY);
    return favorites ? JSON.parse(favorites) : {};
  } catch (error) {
    console.error('Error getting country favorites:', error);
    return {};
  }
};

export const getFavoritesByCountry = async (countryName: string): Promise<string[]> => {
  try {
    const countryFavorites = await getCountryFavorites();
    return countryFavorites[countryName] || [];
  } catch (error) {
    console.error(`Error getting favorites for ${countryName}:`, error);
    return [];
  }
};

export const addToCountryFavorites = async (countryName: string, recipeId: string): Promise<void> => {
  try {
    const countryFavorites = await getCountryFavorites();
    const currentFavorites = countryFavorites[countryName] || [];
    
    if (!currentFavorites.includes(recipeId)) {
      countryFavorites[countryName] = [...currentFavorites, recipeId];
      await AsyncStorage.setItem(COUNTRY_FAVORITES_KEY, JSON.stringify(countryFavorites));
    }
  } catch (error) {
    console.error(`Error adding recipe ${recipeId} to ${countryName} favorites:`, error);
  }
};

export const removeFromCountryFavorites = async (countryName: string, recipeId: string): Promise<void> => {
  try {
    const countryFavorites = await getCountryFavorites();
    const currentFavorites = countryFavorites[countryName] || [];
    
    countryFavorites[countryName] = currentFavorites.filter(id => id !== recipeId);
    
    // Remove empty country entries
    if (countryFavorites[countryName].length === 0) {
      delete countryFavorites[countryName];
    }
    
    await AsyncStorage.setItem(COUNTRY_FAVORITES_KEY, JSON.stringify(countryFavorites));
  } catch (error) {
    console.error(`Error removing recipe ${recipeId} from ${countryName} favorites:`, error);
  }
};

export const isRecipeCountryFavorite = async (countryName: string, recipeId: string): Promise<boolean> => {
  try {
    const favorites = await getFavoritesByCountry(countryName);
    return favorites.includes(recipeId);
  } catch (error) {
    console.error(`Error checking if recipe ${recipeId} is favorite in ${countryName}:`, error);
    return false;
  }
};

export const getAllFavoriteRecipes = async (): Promise<string[]> => {
  try {
    const countryFavorites = await getCountryFavorites();
    const allFavorites = Object.values(countryFavorites).flat();
    return [...new Set(allFavorites)]; // Remove duplicates
  } catch (error) {
    console.error('Error getting all favorite recipes:', error);
    return [];
  }
};