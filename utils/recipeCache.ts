import { Recipe } from '../types/Recipe';
import { getCountries, getCountryData } from './recipeUtils';

// In-memory cache for all recipes
let recipeCache: Recipe[] | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Cache for categories
let categoriesCache: any[] | null = null;

export const getAllRecipesFromCache = (): Recipe[] => {
  const now = Date.now();
  
  // Return cached data if it exists and is still valid
  if (recipeCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
    return recipeCache;
  }
  
  // Load and cache all recipes
  const countries = getCountries();
  const allCountryRecipes: Recipe[] = [];
  
  countries.forEach(countryInfo => {
    const countryData = getCountryData(countryInfo.file);
    if (countryData && countryData.recipes) {
      allCountryRecipes.push(...countryData.recipes);
    }
  });
  
  // Update cache
  recipeCache = allCountryRecipes;
  cacheTimestamp = now;
  
  return allCountryRecipes;
};

export const getCategoriesFromCache = () => {
  // Return cached categories if available
  if (categoriesCache) {
    return categoriesCache;
  }
  
  const allRecipes = getAllRecipesFromCache();
  const cuisineMap = new Map();
  
  allRecipes.forEach(recipe => {
    const cuisine = recipe.cuisine;
    if (cuisineMap.has(cuisine)) {
      cuisineMap.set(cuisine, cuisineMap.get(cuisine) + 1);
    } else {
      cuisineMap.set(cuisine, 1);
    }
  });

  const categories = Array.from(cuisineMap.entries()).map(([cuisine, count], index) => ({
    id: `cuisine-${index}`,
    name: cuisine,
    recipeCount: count,
    icon: getCuisineIcon(cuisine)
  }));
  
  // Cache categories
  categoriesCache = categories;
  
  return categories;
};

// Get icon for cuisine type
const getCuisineIcon = (cuisine: string): string => {
  const iconMap: { [key: string]: string } = {
    'Italian': 'pizza-outline',
    'Chinese': 'restaurant-outline',
    'Mexican': 'fast-food-outline',
    'Indian': 'flame-outline',
    'French': 'wine-outline',
    'Japanese': 'fish-outline',
    'Thai': 'leaf-outline',
    'Greek': 'sunny-outline',
    'American': 'fast-food-outline',
    'Korean': 'restaurant-outline',
    'Canadian': 'leaf-outline',
    'Chilean': 'sunny-outline',
    'Colombian': 'cafe-outline',
    'Cuban': 'restaurant-outline',
    'Czech': 'beer-outline',
  };
  return iconMap[cuisine] || 'restaurant-outline';
};

export const clearRecipeCache = () => {
  recipeCache = null;
  cacheTimestamp = null;
  categoriesCache = null;
};

export const preloadRecipeCache = async (): Promise<Recipe[]> => {
  return new Promise((resolve) => {
    // Use setTimeout to make this non-blocking
    setTimeout(() => {
      const recipes = getAllRecipesFromCache();
      resolve(recipes);
    }, 0);
  });
};