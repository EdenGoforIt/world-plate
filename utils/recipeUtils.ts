import { Recipe } from '../types/Recipe';
import recipeData from '../data/recipes.json';

export const getRandomRecipes = (count: number = 3): Recipe[] => {
  const { recipes } = recipeData;
  const shuffled = [...recipes].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

export const getRecipesByMealType = (mealType: 'breakfast' | 'lunch' | 'dinner'): Recipe[] => {
  const { recipes } = recipeData;
  return recipes.filter(recipe => recipe.mealType.includes(mealType));
};

export const getRandomRecipeByMealType = (mealType: 'breakfast' | 'lunch' | 'dinner'): Recipe | null => {
  const mealRecipes = getRecipesByMealType(mealType);
  if (mealRecipes.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * mealRecipes.length);
  return mealRecipes[randomIndex];
};

export const getDailyRecommendations = () => {
  return {
    breakfast: getRandomRecipeByMealType('breakfast'),
    lunch: getRandomRecipeByMealType('lunch'),
    dinner: getRandomRecipeByMealType('dinner'),
  };
};

export const getRecipeById = (id: string): Recipe | null => {
  const { recipes } = recipeData;
  return recipes.find(recipe => recipe.id === id) || null;
};

export const searchRecipes = (query: string): Recipe[] => {
  const { recipes } = recipeData;
  const lowerQuery = query.toLowerCase();
  return recipes.filter(recipe => 
    recipe.name.toLowerCase().includes(lowerQuery) ||
    recipe.cuisine.toLowerCase().includes(lowerQuery) ||
    recipe.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
};

export const getRecipesByCuisine = (cuisine: string): Recipe[] => {
  const { recipes } = recipeData;
  return recipes.filter(recipe => recipe.cuisine.toLowerCase() === cuisine.toLowerCase());
};

export const formatCookTime = (minutes: number): string => {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
};

export const getDifficultyColor = (difficulty: string): string => {
  switch (difficulty) {
    case 'easy': return '#27AE60';
    case 'medium': return '#F39C12';
    case 'hard': return '#E74C3C';
    default: return '#95A5A6';
  }
};