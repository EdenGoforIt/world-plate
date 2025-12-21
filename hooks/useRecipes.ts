import { useEffect, useState } from 'react';
import { Recipe } from '../types/Recipe';
import { getRandomRecipes, getRecipesByMealType, preloadEssentialCountries } from '../utils/recipeUtils';

export const useRandomRecipes = (count: number = 3) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecipes = async () => {
      setLoading(true);
      const randomRecipes = await getRandomRecipes(count);
      setRecipes(randomRecipes);
      setLoading(false);
    };

    fetchRecipes();
  }, [count]);

  const refreshRecipes = async () => {
    const randomRecipes = await getRandomRecipes(count);
    setRecipes(randomRecipes);
  };

  return { recipes, loading, refreshRecipes };
};

export const useDailyRecommendations = () => {
  const [recommendations, setRecommendations] = useState<{
    breakfast: Recipe | null;
    lunch: Recipe | null;
    dinner: Recipe | null;
  }>({
    breakfast: null,
    lunch: null,
    dinner: null,
  });
  const [loading, setLoading] = useState(true);
  const [usedRecipes, setUsedRecipes] = useState<Set<string>>(new Set());

  const getNewRecommendations = async (excludeIds: Set<string> = new Set()) => {
    // Prefer recipes that are either in user's favorites or match pantry items.
    // Scoring: favorite -> +2, pantry match -> +1. Pick randomly from highest score bucket.
    const pantryItemsRaw = await import('../utils/storageUtils').then(m => m.getPantryItems()).catch(() => [] as string[]);
    const pantryItems = pantryItemsRaw.map(p => p.toLowerCase());
    const favoriteIdsList = await import('../utils/storageUtils').then(m => m.getAllFavoriteRecipes()).catch(() => [] as string[]);
    const favoriteIds = new Set(favoriteIdsList);

    const chooseByScore = (recipes: Recipe[]): Recipe | null => {
      if (!recipes || recipes.length === 0) return null;

      const scored: Record<number, Recipe[]> = { 3: [], 2: [], 1: [], 0: [] };

      recipes.forEach((recipe) => {
        let score = 0;
        if (favoriteIds.has(recipe.id)) score += 2; // favorites are strong signals
        if (recipe.ingredients && recipe.ingredients.some(i => pantryItems.includes(i.name.toLowerCase()))) score += 1;
        // add a small bias for preferred cuisine (if preferences available) in future
        scored[score].push(recipe);
      });

      // Prefer highest non-empty score bucket, ignoring excluded ids
      for (const s of [3, 2, 1, 0]) {
        const bucket = scored[s].filter(r => !excludeIds.has(r.id));
        if (bucket.length > 0) {
          return bucket[Math.floor(Math.random() * bucket.length)];
        }
      }

      // If all are excluded, pick any recipe not excluded, otherwise fallback to random
      const notExcluded = recipes.filter(r => !excludeIds.has(r.id));
      if (notExcluded.length > 0) return notExcluded[Math.floor(Math.random() * notExcluded.length)];
      return recipes[Math.floor(Math.random() * recipes.length)];
    };

    const getForMeal = async (mealType: 'breakfast' | 'lunch' | 'dinner'): Promise<Recipe | null> => {
      const mealRecipes = await getRecipesByMealType(mealType);
      if (mealRecipes.length === 0) return null;
      return chooseByScore(mealRecipes);
    };

    const [breakfast, lunch, dinner] = await Promise.all([
      getForMeal('breakfast'),
      getForMeal('lunch'),
      getForMeal('dinner'),
    ]);

    return { breakfast, lunch, dinner };
  };

  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      
      // Preload essential countries first for better performance
      await preloadEssentialCountries();
      
      const dailyRecs = await getNewRecommendations();
      setRecommendations(dailyRecs);
      
      // Track used recipe IDs
      const newUsedIds = new Set<string>();
      if (dailyRecs.breakfast) newUsedIds.add(dailyRecs.breakfast.id);
      if (dailyRecs.lunch) newUsedIds.add(dailyRecs.lunch.id);
      if (dailyRecs.dinner) newUsedIds.add(dailyRecs.dinner.id);
      setUsedRecipes(newUsedIds);
      
      setLoading(false);
    };

    fetchRecommendations();
  }, []);

  const refreshRecommendations = async () => {
    const dailyRecs = await getNewRecommendations(usedRecipes);
    setRecommendations(dailyRecs);
    
    // Update used recipes
    setUsedRecipes(prev => {
      const newUsed = new Set(prev);
      if (dailyRecs.breakfast) newUsed.add(dailyRecs.breakfast.id);
      if (dailyRecs.lunch) newUsed.add(dailyRecs.lunch.id);
      if (dailyRecs.dinner) newUsed.add(dailyRecs.dinner.id);
      return newUsed;
    });
  };

  return { recommendations, loading, refreshRecommendations };
};

export const useRecipes = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadRecipes = async () => {
      setLoading(true);
      const allRecipes = await getRandomRecipes(20);
      setRecipes(allRecipes);
      setLoading(false);
    };
    loadRecipes();
  }, []);

  return { recipes, loading };
};