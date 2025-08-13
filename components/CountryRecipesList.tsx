import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
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

  const loadRecipes = () => {
    try {
      setLoading(true);
      const countryRecipes = getRecipesByCountry(countryName);
      setRecipes(countryRecipes);
    } catch (error) {
      console.error(`Error loading recipes for ${countryName}:`, error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading {countryName} recipes...</Text>
      </View>
    );
  }

  if (recipes.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No recipes found for {countryName}</Text>
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
    <View style={styles.container}>
      <Text style={styles.title}>Recipes from {countryName}</Text>
      <FlatList
        data={recipes}
        renderItem={renderRecipe}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.text,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.text,
    textAlign: 'center',
  },
  listContainer: {
    paddingBottom: 20,
  },
});