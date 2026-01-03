import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { logger } from "../config/env";
import { Recipe } from "../types/Recipe";

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export interface OfflineQueueItem {
  id: string;
  type: "favorite" | "rating" | "review" | "meal_plan";
  data: any;
  timestamp: number;
}

class OfflineCacheService {
  private static instance: OfflineCacheService;
  private readonly CACHE_PREFIX = "worldplate_cache_";
  private readonly OFFLINE_QUEUE_KEY = "worldplate_offline_queue";
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private isOnline: boolean = true;

  private constructor() {
    this.initialize();
  }

  static getInstance(): OfflineCacheService {
    if (!OfflineCacheService.instance) {
      OfflineCacheService.instance = new OfflineCacheService();
    }
    return OfflineCacheService.instance;
  }

  private async initialize() {
    // Monitor network status
    NetInfo.addEventListener((state) => {
      this.isOnline = state.isConnected ?? false;
      if (this.isOnline) {
        this.syncOfflineQueue();
      }
    });

    const netInfo = await NetInfo.fetch();
    this.isOnline = netInfo.isConnected ?? false;
  }

  isConnected(): boolean {
    return this.isOnline;
  }

  // Recipe caching
  async cacheRecipes(
    recipes: Recipe[],
    key: string = "all_recipes"
  ): Promise<void> {
    const cacheEntry: CacheEntry<Recipe[]> = {
      data: recipes,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.CACHE_DURATION,
    };

    try {
      await AsyncStorage.setItem(
        this.CACHE_PREFIX + key,
        JSON.stringify(cacheEntry)
      );
    } catch (error) {
      console.error("Failed to cache recipes:", error);
    }
  }

  async getCachedRecipes(
    key: string = "all_recipes"
  ): Promise<Recipe[] | null> {
    try {
      const cached = await AsyncStorage.getItem(this.CACHE_PREFIX + key);
      if (!cached) return null;

      const cacheEntry: CacheEntry<Recipe[]> = JSON.parse(cached);

      // Check if cache is expired
      if (Date.now() > cacheEntry.expiresAt) {
        await this.removeCache(key);
        return null;
      }

      return cacheEntry.data;
    } catch (error) {
      console.error("Failed to get cached recipes:", error);
      return null;
    }
  }

  async cacheRecipe(recipe: Recipe): Promise<void> {
    await this.cacheRecipes([recipe], `recipe_${recipe.id}`);
  }

  async getCachedRecipe(recipeId: string): Promise<Recipe | null> {
    const recipes = await this.getCachedRecipes(`recipe_${recipeId}`);
    return recipes?.[0] || null;
  }

  // Favorites caching
  async cacheFavorites(favorites: string[]): Promise<void> {
    const cacheEntry: CacheEntry<string[]> = {
      data: favorites,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.CACHE_DURATION,
    };

    try {
      await AsyncStorage.setItem(
        this.CACHE_PREFIX + "favorites",
        JSON.stringify(cacheEntry)
      );
    } catch (error) {
      console.error("Failed to cache favorites:", error);
    }
  }

  async getCachedFavorites(): Promise<string[] | null> {
    try {
      const cached = await AsyncStorage.getItem(
        this.CACHE_PREFIX + "favorites"
      );
      if (!cached) return null;

      const cacheEntry: CacheEntry<string[]> = JSON.parse(cached);

      if (Date.now() > cacheEntry.expiresAt) {
        await this.removeCache("favorites");
        return null;
      }

      return cacheEntry.data;
    } catch (error) {
      console.error("Failed to get cached favorites:", error);
      return null;
    }
  }

  // Meal plans caching
  async cacheMealPlan(
    mealPlan: any,
    key: string = "current_meal_plan"
  ): Promise<void> {
    const cacheEntry: CacheEntry<any> = {
      data: mealPlan,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.CACHE_DURATION,
    };

    try {
      await AsyncStorage.setItem(
        this.CACHE_PREFIX + key,
        JSON.stringify(cacheEntry)
      );
    } catch (error) {
      console.error("Failed to cache meal plan:", error);
    }
  }

  async getCachedMealPlan(
    key: string = "current_meal_plan"
  ): Promise<any | null> {
    try {
      const cached = await AsyncStorage.getItem(this.CACHE_PREFIX + key);
      if (!cached) return null;

      const cacheEntry: CacheEntry<any> = JSON.parse(cached);

      if (Date.now() > cacheEntry.expiresAt) {
        await this.removeCache(key);
        return null;
      }

      return cacheEntry.data;
    } catch (error) {
      console.error("Failed to get cached meal plan:", error);
      return null;
    }
  }

  // Offline queue management
  async addToOfflineQueue(
    item: Omit<OfflineQueueItem, "id" | "timestamp">
  ): Promise<void> {
    try {
      const queue = await this.getOfflineQueue();
      const newItem: OfflineQueueItem = {
        ...item,
        id: Date.now().toString(),
        timestamp: Date.now(),
      };

      queue.push(newItem);
      await AsyncStorage.setItem(this.OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error("Failed to add to offline queue:", error);
    }
  }

  async getOfflineQueue(): Promise<OfflineQueueItem[]> {
    try {
      const queue = await AsyncStorage.getItem(this.OFFLINE_QUEUE_KEY);
      return queue ? JSON.parse(queue) : [];
    } catch (error) {
      console.error("Failed to get offline queue:", error);
      return [];
    }
  }

  async removeFromOfflineQueue(itemId: string): Promise<void> {
    try {
      const queue = await this.getOfflineQueue();
      const filteredQueue = queue.filter((item) => item.id !== itemId);
      await AsyncStorage.setItem(
        this.OFFLINE_QUEUE_KEY,
        JSON.stringify(filteredQueue)
      );
    } catch (error) {
      console.error("Failed to remove from offline queue:", error);
    }
  }

  async clearOfflineQueue(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.OFFLINE_QUEUE_KEY);
    } catch (error) {
      console.error("Failed to clear offline queue:", error);
    }
  }

  // Sync offline actions when back online
  async syncOfflineQueue(): Promise<void> {
    if (!this.isOnline) return;

    const queue = await this.getOfflineQueue();
    if (queue.length === 0) return;

    logger.debug(`Syncing ${queue.length} offline actions...`);

    for (const item of queue) {
      try {
        await this.processOfflineAction(item);
        await this.removeFromOfflineQueue(item.id);
      } catch (error) {
        logger.error("Failed to sync offline action:", error);
        // Keep failed items in queue for retry
      }
    }
  }

  private async processOfflineAction(item: OfflineQueueItem): Promise<void> {
    // This would integrate with your backend API
    // For now, we'll just log the action
    logger.debug("Processing offline action:", item.type, item.data);

    switch (item.type) {
      case "favorite":
        // Sync favorite to server
        break;
      case "rating":
        // Sync rating to server
        break;
      case "review":
        // Sync review to server
        break;
      case "meal_plan":
        // Sync meal plan to server
        break;
    }
  }

  // Cache management
  async removeCache(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.CACHE_PREFIX + key);
    } catch (error) {
      console.error("Failed to remove cache:", error);
    }
  }

  async clearAllCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((key) => key.startsWith(this.CACHE_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error("Failed to clear all cache:", error);
    }
  }

  async getCacheSize(): Promise<{ entries: number; size: number }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((key) => key.startsWith(this.CACHE_PREFIX));

      let totalSize = 0;
      for (const key of cacheKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += value.length;
        }
      }

      return {
        entries: cacheKeys.length,
        size: totalSize,
      };
    } catch (error) {
      console.error("Failed to get cache size:", error);
      return { entries: 0, size: 0 };
    }
  }

  // Smart caching strategy
  async getRecipesWithFallback(
    fetchFunction: () => Promise<Recipe[]>,
    cacheKey: string = "all_recipes"
  ): Promise<Recipe[]> {
    // Try cache first
    const cached = await this.getCachedRecipes(cacheKey);
    if (cached) {
      // If online, refresh in background
      if (this.isOnline) {
        fetchFunction()
          .then((freshData) => this.cacheRecipes(freshData, cacheKey))
          .catch((error) => console.error("Background refresh failed:", error));
      }
      return cached;
    }

    // If no cache, fetch if online
    if (this.isOnline) {
      try {
        const freshData = await fetchFunction();
        await this.cacheRecipes(freshData, cacheKey);
        return freshData;
      } catch (error) {
        console.error("Failed to fetch recipes:", error);
        throw error;
      }
    }

    // Offline with no cache
    throw new Error("No cached recipes available and offline");
  }
}

export const offlineCache = OfflineCacheService.getInstance();
