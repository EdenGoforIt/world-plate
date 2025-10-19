import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  ActivityIndicator 
} from 'react-native';
import { Recipe } from '../types/Recipe';
import { FavoriteRecipeCard } from './FavoriteRecipeCard';
import { getRecipesByCountry } from '../utils/recipeUtils';
import { Colors } from '../constants/Colors';

interface CountryRecipesListProps {
  countryName: string;
  onRecipePress?: (recipe: Recipe) => void;
}

export const CountryRecipesList: React.FC<CountryRecipesListProps> = ({
  countryName,
  onRecipePress = () => {},
}) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecipes();
  }, [countryName]);

  const loadRecipes = async () => {
    try {
      setLoading(true);
      const countryRecipes = await getRecipesByCountry(countryName);
      setRecipes(countryRecipes);
    } catch (error) {
      // Error loading recipes
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text className="mt-2.5 text-base text-text">Loading {countryName} recipes...</Text>
      </View>
    );
  }

  if (recipes.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-background p-10">
        <Text className="text-base text-text text-center">No recipes found for {countryName}</Text>
      </View>
    );
  }

  const renderRecipe = ({ item }: { item: Recipe }) => (
    <FavoriteRecipeCard
      recipe={item}
      countryName={countryName}
      onPress={() => onRecipePress(item)}
      size="large"
    />
  );

  return (
    <View className="flex-1 bg-background p-4">
      <Text className="text-2xl font-bold text-text mb-4">Recipes from {countryName}</Text>
      <FlatList
        data={recipes}
        renderItem={renderRecipe}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};