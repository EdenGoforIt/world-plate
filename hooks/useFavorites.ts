import { useState, useEffect, useCallback } from 'react';
import { Recipe } from '../types/Recipe';
import { getFavorites, addToFavorites, removeFromFavorites, isRecipeFavorite } from '../utils/storageUtils';
import { getRecipeById } from '../utils/recipeUtils';

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<Recipe[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFavorites = useCallback(async () => {
    try {
      setLoading(true);
      const favoriteRecipeIds = await getFavorites();
      setFavoriteIds(favoriteRecipeIds);
      
      const favoriteRecipes = favoriteRecipeIds
        .map(id => getRecipeById(id))
        .filter(recipe => recipe !== null) as Recipe[];
      
      setFavorites(favoriteRecipes);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const toggleFavorite = useCallback(async (recipeId: string) => {
    try {
      const isFavorite = favoriteIds.includes(recipeId);
      
      if (isFavorite) {
        await removeFromFavorites(recipeId);
        setFavoriteIds(prev => prev.filter(id => id !== recipeId));
        setFavorites(prev => prev.filter(recipe => recipe.id !== recipeId));
      } else {
        await addToFavorites(recipeId);
        const recipe = getRecipeById(recipeId);
        if (recipe) {
          setFavoriteIds(prev => [...prev, recipeId]);
          setFavorites(prev => [...prev, recipe]);
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  }, [favoriteIds]);

  const isFavorite = useCallback((recipeId: string) => {
    return favoriteIds.includes(recipeId);
  }, [favoriteIds]);

  return {
    favorites,
    loading,
    toggleFavorite,
    isFavorite,
    refreshFavorites: loadFavorites,
  };
};