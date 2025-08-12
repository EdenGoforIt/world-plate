import { useState, useEffect } from 'react';
import { Recipe } from '../types/Recipe';
import { getDailyRecommendations, getRandomRecipes } from '../utils/recipeUtils';

export const useRandomRecipes = (count: number = 3) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecipes = () => {
      setLoading(true);
      const randomRecipes = getRandomRecipes(count);
      setRecipes(randomRecipes);
      setLoading(false);
    };

    fetchRecipes();
  }, [count]);

  const refreshRecipes = () => {
    const randomRecipes = getRandomRecipes(count);
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

  useEffect(() => {
    const fetchRecommendations = () => {
      setLoading(true);
      const dailyRecs = getDailyRecommendations();
      setRecommendations(dailyRecs);
      setLoading(false);
    };

    fetchRecommendations();
  }, []);

  const refreshRecommendations = () => {
    const dailyRecs = getDailyRecommendations();
    setRecommendations(dailyRecs);
  };

  return { recommendations, loading, refreshRecommendations };
};