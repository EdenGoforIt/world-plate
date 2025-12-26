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

// Shopping list persistence (migrated to named lists)
const SHOPPING_LIST_KEY = '@shopping_list'; // legacy single list key
const SHOPPING_LISTS_KEY = '@shopping_lists'; // new key: { [listName]: ShoppingListItemPersist[] }
const ACTIVE_LIST_KEY = '@active_shopping_list';

export interface ShoppingListItemPersist {
  ingredient: string;
  totalAmount?: string;
  category?: string;
  recipes?: string[];
  checked?: boolean;
}

export const getShoppingList = async (): Promise<ShoppingListItemPersist[]> => {
  try {
    // Try to load named lists first (new format)
    const listsRaw = await AsyncStorage.getItem(SHOPPING_LISTS_KEY);
    if (listsRaw) {
      const lists = JSON.parse(listsRaw) as Record<string, ShoppingListItemPersist[]>;
      const activeName = (await AsyncStorage.getItem(ACTIVE_LIST_KEY)) || 'Default';
      return lists[activeName] || [];
    }

    // Fall back to legacy single list
    const raw = await AsyncStorage.getItem(SHOPPING_LIST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error('Error getting shopping list:', error);
    return [];
  }
};

export const saveShoppingList = async (items: ShoppingListItemPersist[]): Promise<void> => {
  try {
    // Save into current active named list (if lists exist) or legacy key
    const listsRaw = await AsyncStorage.getItem(SHOPPING_LISTS_KEY);
    if (listsRaw) {
      const lists = JSON.parse(listsRaw) as Record<string, ShoppingListItemPersist[]>;
      const activeName = (await AsyncStorage.getItem(ACTIVE_LIST_KEY)) || 'Default';
      lists[activeName] = items;
      await AsyncStorage.setItem(SHOPPING_LISTS_KEY, JSON.stringify(lists));
      return;
    }

    // fallback
    await AsyncStorage.setItem(SHOPPING_LIST_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Error saving shopping list:', error);
  }
};

export const addItemsToShoppingList = async (itemsToAdd: ShoppingListItemPersist[]): Promise<void> => {
  try {
    const current = await getShoppingList();
    // Merge by ingredient name (case-insensitive)
    const map = new Map<string, ShoppingListItemPersist>();
    current.forEach((it) => map.set(it.ingredient.toLowerCase(), it));
    itemsToAdd.forEach((it) => {
      const key = it.ingredient.toLowerCase();
      const existing = map.get(key);
      if (existing) {
        // merge recipes and prefer existing totalAmount if present
        existing.recipes = Array.from(new Set([...(existing.recipes || []), ...(it.recipes || [])]));
        if (!existing.totalAmount && it.totalAmount) existing.totalAmount = it.totalAmount;
        if (!existing.category && it.category) existing.category = it.category;
      } else {
        map.set(key, it);
      }
    });

    const merged = Array.from(map.values());
    await saveShoppingList(merged);
  } catch (error) {
    console.error('Error adding items to shopping list:', error);
  }
};

export const toggleShoppingListItemChecked = async (ingredient: string, checked: boolean): Promise<void> => {
  try {
    const current = await getShoppingList();
    const map = new Map(current.map((it) => [it.ingredient.toLowerCase(), it]));
    const key = ingredient.toLowerCase();
    const existing = map.get(key);
    if (existing) {
      existing.checked = checked;
      await saveShoppingList(Array.from(map.values()));
    }
  } catch (error) {
    console.error('Error toggling shopping list item checked state:', error);
  }
};

export const removeCheckedItemsFromShoppingList = async (): Promise<void> => {
  try {
    const current = await getShoppingList();
    const filtered = current.filter((it) => !it.checked);
    await saveShoppingList(filtered);
  } catch (error) {
    console.error('Error removing checked items from shopping list:', error);
  }
};

export const clearShoppingList = async (): Promise<void> => {
  try {
    await saveShoppingList([]);
  } catch (error) {
    console.error('Error clearing shopping list:', error);
  }
};

// --- Named shopping lists helpers ---
export const getAllShoppingLists = async (): Promise<Record<string, ShoppingListItemPersist[]>> => {
  try {
    const raw = await AsyncStorage.getItem(SHOPPING_LISTS_KEY);
    if (raw) return JSON.parse(raw);

    // If no named lists exist but legacy list exists, migrate to default
    const legacy = await AsyncStorage.getItem(SHOPPING_LIST_KEY);
    if (legacy) {
      const defaultList = JSON.parse(legacy) as ShoppingListItemPersist[];
      const lists = { Default: defaultList } as Record<string, ShoppingListItemPersist[]>;
      await AsyncStorage.setItem(SHOPPING_LISTS_KEY, JSON.stringify(lists));
      return lists;
    }

    return { Default: [] };
  } catch (error) {
    console.error('Error getting all shopping lists:', error);
    return { Default: [] };
  }
};

export const getShoppingListByName = async (name = 'Default'): Promise<ShoppingListItemPersist[]> => {
  try {
    const lists = await getAllShoppingLists();
    return lists[name] || [];
  } catch (error) {
    console.error(`Error getting shopping list for ${name}:`, error);
    return [];
  }
};

export const saveShoppingListByName = async (name: string, items: ShoppingListItemPersist[]): Promise<void> => {
  try {
    const lists = await getAllShoppingLists();
    lists[name] = items;
    await AsyncStorage.setItem(SHOPPING_LISTS_KEY, JSON.stringify(lists));
  } catch (error) {
    console.error(`Error saving shopping list for ${name}:`, error);
  }
};

export const addItemsToNamedShoppingList = async (name: string, itemsToAdd: ShoppingListItemPersist[]): Promise<void> => {
  try {
    const current = await getShoppingListByName(name);
    const map = new Map<string, ShoppingListItemPersist>();
    current.forEach((it) => map.set(it.ingredient.toLowerCase(), it));
    itemsToAdd.forEach((it) => {
      const key = it.ingredient.toLowerCase();
      const existing = map.get(key);
      if (existing) {
        existing.recipes = Array.from(new Set([...(existing.recipes || []), ...(it.recipes || [])]));
        if (!existing.totalAmount && it.totalAmount) existing.totalAmount = it.totalAmount;
        if (!existing.category && it.category) existing.category = it.category;
      } else {
        map.set(key, it);
      }
    });
    const merged = Array.from(map.values());
    await saveShoppingListByName(name, merged);
  } catch (error) {
    console.error(`Error adding items to shopping list ${name}:`, error);
  }
};

export const createShoppingList = async (name: string): Promise<void> => {
  try {
    const lists = await getAllShoppingLists();
    if (lists[name]) throw new Error('List already exists');
    lists[name] = [];
    await AsyncStorage.setItem(SHOPPING_LISTS_KEY, JSON.stringify(lists));
  } catch (error) {
    console.error(`Error creating shopping list ${name}:`, error);
  }
};

export const deleteShoppingList = async (name: string): Promise<void> => {
  try {
    const lists = await getAllShoppingLists();
    delete lists[name];
    await AsyncStorage.setItem(SHOPPING_LISTS_KEY, JSON.stringify(lists));
    // If active list was deleted, set Default active
    const active = (await AsyncStorage.getItem(ACTIVE_LIST_KEY)) || 'Default';
    if (active === name) {
      await AsyncStorage.setItem(ACTIVE_LIST_KEY, 'Default');
    }
  } catch (error) {
    console.error(`Error deleting shopping list ${name}:`, error);
  }
};

export const renameShoppingList = async (oldName: string, newName: string): Promise<void> => {
  try {
    const lists = await getAllShoppingLists();
    if (!lists[oldName]) throw new Error('List does not exist');
    if (lists[newName]) throw new Error('New name already exists');
    lists[newName] = lists[oldName];
    delete lists[oldName];
    await AsyncStorage.setItem(SHOPPING_LISTS_KEY, JSON.stringify(lists));
    const active = (await AsyncStorage.getItem(ACTIVE_LIST_KEY)) || 'Default';
    if (active === oldName) {
      await AsyncStorage.setItem(ACTIVE_LIST_KEY, newName);
    }
  } catch (error) {
    console.error(`Error renaming shopping list ${oldName} -> ${newName}:`, error);
  }
};

export const getActiveShoppingListName = async (): Promise<string> => {
  try {
    const name = await AsyncStorage.getItem(ACTIVE_LIST_KEY);
    return name || 'Default';
  } catch (error) {
    console.error('Error getting active shopping list name:', error);
    return 'Default';
  }
};

export const setActiveShoppingListName = async (name: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(ACTIVE_LIST_KEY, name);
  } catch (error) {
    console.error('Error setting active shopping list name:', error);
  }
};

// Pantry persistence
const PANTRY_KEY = '@pantry_items';

export const getPantryItems = async (): Promise<string[]> => {
  try {
    const raw = await AsyncStorage.getItem(PANTRY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error('Error getting pantry items:', error);
    return [];
  }
};

export const savePantryItems = async (items: string[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(PANTRY_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Error saving pantry items:', error);
  }
};

// User allergy preferences
const USER_ALLERGENS_KEY = '@user_allergens';

export const getUserAllergens = async (): Promise<string[]> => {
  try {
    const raw = await AsyncStorage.getItem(USER_ALLERGENS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error('Error getting user allergens:', error);
    return [];
  }
};

export const saveUserAllergens = async (allergens: string[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(USER_ALLERGENS_KEY, JSON.stringify(allergens));
  } catch (error) {
    console.error('Error saving user allergens:', error);
  }
};