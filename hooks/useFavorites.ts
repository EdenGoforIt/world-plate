import { useState, useEffect, useCallback } from 'react';
import { Recipe } from '../types/Recipe';
import { 
  getCountryFavorites, 
  addToCountryFavorites, 
  removeFromCountryFavorites, 
  isRecipeCountryFavorite,
  getAllFavoriteRecipes,
  CountryFavorites
} from '../utils/storageUtils';
import { getRecipeByIdFromCountry } from '../utils/recipeUtils';

export const useFavorites = () => {
  const [favoritesByCountry, setFavoritesByCountry] = useState<CountryFavorites>({});
  const [allFavorites, setAllFavorites] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFavorites = useCallback(async () => {
    try {
      setLoading(true);
      const countryFavorites = await getCountryFavorites();
      setFavoritesByCountry(countryFavorites);
      
      // Load all favorite recipes
      const allFavoriteIds = await getAllFavoriteRecipes();
      const favoriteRecipes: Recipe[] = [];
      
      for (const recipeId of allFavoriteIds) {
        const result = getRecipeByIdFromCountry(recipeId);
        if (result) {
          favoriteRecipes.push(result.recipe);
        }
      }
      
      setAllFavorites(favoriteRecipes);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const toggleFavorite = useCallback(async (recipeId: string, countryName: string) => {
    try {
      const isFavorite = await isRecipeCountryFavorite(countryName, recipeId);
      
      if (isFavorite) {
        await removeFromCountryFavorites(countryName, recipeId);
        setFavoritesByCountry(prev => {
          const updated = { ...prev };
          if (updated[countryName]) {
            updated[countryName] = updated[countryName].filter(id => id !== recipeId);
            if (updated[countryName].length === 0) {
              delete updated[countryName];
            }
          }
          return updated;
        });
        setAllFavorites(prev => prev.filter(recipe => recipe.id !== recipeId));
      } else {
        await addToCountryFavorites(countryName, recipeId);
        const result = getRecipeByIdFromCountry(recipeId);
        if (result) {
          setFavoritesByCountry(prev => ({
            ...prev,
            [countryName]: [...(prev[countryName] || []), recipeId]
          }));
          setAllFavorites(prev => {
            if (!prev.find(r => r.id === recipeId)) {
              return [...prev, result.recipe];
            }
            return prev;
          });
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  }, []);

  const isFavorite = useCallback((recipeId: string, countryName: string) => {
    return favoritesByCountry[countryName]?.includes(recipeId) || false;
  }, [favoritesByCountry]);

  const getFavoritesByCountry = useCallback((countryName: string): Recipe[] => {
    const countryFavoriteIds = favoritesByCountry[countryName] || [];
    return allFavorites.filter(recipe => countryFavoriteIds.includes(recipe.id));
  }, [favoritesByCountry, allFavorites]);

  return {
    favoritesByCountry,
    allFavorites,
    loading,
    toggleFavorite,
    isFavorite,
    getFavoritesByCountry,
    refreshFavorites: loadFavorites,
  };
};