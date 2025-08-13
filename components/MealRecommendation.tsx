import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Recipe } from '../types/Recipe';
import { Colors } from '../constants/Colors';
import { formatCookTime } from '../utils/recipeUtils';
import { useFavorites } from '../hooks/useFavorites';

interface MealRecommendationProps {
  mealType: 'breakfast' | 'lunch' | 'dinner';
  recipe: Recipe | null;
  onPress: () => void;
  onRefresh: () => void;
  countryName?: string; // For favorites functionality
}

const { width } = Dimensions.get('window');

export const MealRecommendation: React.FC<MealRecommendationProps> = ({
  mealType,
  recipe,
  onPress,
  onRefresh,
  countryName,
}) => {
  const { toggleFavorite, isFavorite } = useFavorites();
  
  const handleFavoritePress = async () => {
    if (recipe && countryName) {
      await toggleFavorite(recipe.id, countryName);
    }
  };
  
  const getMealIcon = () => {
    switch (mealType) {
      case 'breakfast': return 'cafe-outline';
      case 'lunch': return 'restaurant-outline';
      case 'dinner': return 'wine-outline';
    }
  };

  const getMealTime = () => {
    switch (mealType) {
      case 'breakfast': return 'Morning';
      case 'lunch': return 'Afternoon';
      case 'dinner': return 'Evening';
    }
  };

  if (!recipe) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.mealInfo}>
            <Ionicons name={getMealIcon()} size={24} color={Colors.primary} />
            <View style={styles.mealTextContainer}>
              <Text style={styles.mealType}>{mealType.toUpperCase()}</Text>
              <Text style={styles.mealTime}>{getMealTime()}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
            <Ionicons name="refresh-outline" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.emptyContent}>
          <Text style={styles.emptyText}>No recipe found</Text>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.mealInfo}>
          <Ionicons name={getMealIcon()} size={24} color={Colors.primary} />
          <View style={styles.mealTextContainer}>
            <Text style={styles.mealType}>{mealType.toUpperCase()}</Text>
            <Text style={styles.mealTime}>{getMealTime()}</Text>
          </View>
        </View>
        <View style={styles.headerButtons}>
          {recipe && countryName && (
            <TouchableOpacity onPress={handleFavoritePress} style={styles.favoriteButton}>
              <Ionicons
                name={isFavorite(recipe.id, countryName) ? 'heart' : 'heart-outline'}
                size={20}
                color={isFavorite(recipe.id, countryName) ? Colors.primary : Colors.text}
              />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
            <Ionicons name="refresh-outline" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.recipeContent}>
        <Image source={{ uri: recipe.image }} style={styles.recipeImage} />
        <View style={styles.recipeInfo}>
          <Text style={styles.recipeName} numberOfLines={2}>
            {recipe.name}
          </Text>
          <Text style={styles.recipeCuisine}>{recipe.cuisine}</Text>
          
          <View style={styles.recipeStats}>
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={16} color={Colors.text} />
              <Text style={styles.statText}>
                {formatCookTime(recipe.prepTime + recipe.cookTime)}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="star" size={16} color={Colors.accent} />
              <Text style={styles.statText}>{recipe.rating}</Text>
            </View>
          </View>
          
          <View style={styles.nutritionPreview}>
            <Text style={styles.nutritionText}>
              {recipe.nutrition.calories} cal • {recipe.nutrition.protein}g protein
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  mealInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealTextContainer: {
    marginLeft: 12,
  },
  mealType: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  mealTime: {
    fontSize: 14,
    color: Colors.text,
    opacity: 0.7,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  favoriteButton: {
    padding: 8,
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
    marginRight: 8,
  },
  refreshButton: {
    padding: 8,
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  emptyContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.text,
    opacity: 0.6,
  },
  recipeContent: {
    flexDirection: 'row',
  },
  recipeImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  recipeInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'space-between',
  },
  recipeName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  recipeCuisine: {
    fontSize: 14,
    color: Colors.secondary,
    textTransform: 'capitalize',
    marginBottom: 8,
  },
  recipeStats: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    marginLeft: 4,
    fontSize: 14,
    color: Colors.text,
  },
  nutritionPreview: {
    backgroundColor: Colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  nutritionText: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '500',
  },
});