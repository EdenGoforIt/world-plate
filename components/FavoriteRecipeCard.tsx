import React from 'react';
import { Recipe } from '../types/Recipe';
import { RecipeCard } from './RecipeCard';
import { useFavorites } from '../hooks/useFavorites';

interface FavoriteRecipeCardProps {
  recipe: Recipe;
  countryName: string;
  onPress: () => void;
  size?: 'small' | 'medium' | 'large';
}

export const FavoriteRecipeCard: React.FC<FavoriteRecipeCardProps> = ({
  recipe,
  countryName,
  onPress,
  size = 'medium',
}) => {
  const { toggleFavorite, isFavorite } = useFavorites();
  
  const handleFavoritePress = async () => {
    await toggleFavorite(recipe.id, countryName);
  };
  
  return (
    <RecipeCard
      recipe={recipe}
      onPress={onPress}
      onFavoritePress={handleFavoritePress}
      isFavorite={isFavorite(recipe.id, countryName)}
      size={size}
    />
  );
};