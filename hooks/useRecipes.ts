import { useState, useEffect } from 'react';
import { Recipe } from '../types/Recipe';
import { getDailyRecommendations, getRandomRecipes, getRecipesByMealType, preloadEssentialCountries } from '../utils/recipeUtils';

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
    const getAvoidDuplicate = async (mealType: 'breakfast' | 'lunch' | 'dinner'): Promise<Recipe | null> => {
      const mealRecipes = await getRecipesByMealType(mealType);
      if (mealRecipes.length === 0) return null;
      
      // Filter out previously used recipes
      const availableRecipes = mealRecipes.filter(recipe => !excludeIds.has(recipe.id));
      
      // If no unused recipes, reset and use any recipe
      const recipesToChooseFrom = availableRecipes.length > 0 ? availableRecipes : mealRecipes;
      
      const randomIndex = Math.floor(Math.random() * recipesToChooseFrom.length);
      return recipesToChooseFrom[randomIndex];
    };

    const [breakfast, lunch, dinner] = await Promise.all([
      getAvoidDuplicate('breakfast'),
      getAvoidDuplicate('lunch'),
      getAvoidDuplicate('dinner')
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