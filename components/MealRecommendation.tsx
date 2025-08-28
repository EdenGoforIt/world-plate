import React from 'react';
import { View, Text, TouchableOpacity, Image, Dimensions } from 'react-native';
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
      <View className="bg-white rounded-2xl p-4 mb-4" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 }}>
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-row items-center">
            <Ionicons name={getMealIcon()} size={24} color={Colors.primary} />
            <View className="ml-3">
              <Text className="text-base font-bold tracking-wide" style={{ color: Colors.primary }}>{mealType.toUpperCase()}</Text>
              <Text className="text-sm opacity-70" style={{ color: Colors.text }}>{getMealTime()}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onRefresh} className="p-2 rounded-xl border" style={{ backgroundColor: Colors.background, borderColor: Colors.primary }}>
            <Ionicons name="refresh-outline" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>
        <View className="items-center justify-center py-8">
          <Text className="text-base opacity-60" style={{ color: Colors.text }}>No recipe found</Text>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity className="bg-white rounded-2xl p-4 mb-4" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 }} onPress={onPress}>
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row items-center">
          <Ionicons name={getMealIcon()} size={24} color={Colors.primary} />
          <View className="ml-3">
            <Text className="text-base font-bold tracking-wide" style={{ color: Colors.primary }}>{mealType.toUpperCase()}</Text>
            <Text className="text-sm opacity-70" style={{ color: Colors.text }}>{getMealTime()}</Text>
          </View>
        </View>
        <View className="flex-row items-center">
          {recipe && countryName && (
            <TouchableOpacity onPress={handleFavoritePress} className="p-2 rounded-xl border mr-2" style={{ backgroundColor: Colors.background, borderColor: Colors.primary }}>
              <Ionicons
                name={isFavorite(recipe.id, countryName) ? 'heart' : 'heart-outline'}
                size={20}
                color={isFavorite(recipe.id, countryName) ? Colors.primary : Colors.text}
              />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={onRefresh} className="p-2 rounded-xl border" style={{ backgroundColor: Colors.background, borderColor: Colors.primary }}>
            <Ionicons name="refresh-outline" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
      
      <View className="flex-row">
        <Image source={{ uri: recipe.image }} className="w-[100px] h-[100px] rounded-xl" style={{ resizeMode: 'cover' }} />
        <View className="flex-1 ml-4 justify-between">
          <Text className="text-base font-semibold mb-1" style={{ color: Colors.text }} numberOfLines={2}>
            {recipe.name}
          </Text>
          <Text className="text-sm mb-2 capitalize" style={{ color: Colors.secondary }}>{recipe.cuisine}</Text>
          
          <View className="flex-row mb-2">
            <View className="flex-row items-center mr-4">
              <Ionicons name="time-outline" size={16} color={Colors.text} />
              <Text className="ml-1 text-sm" style={{ color: Colors.text }}>
                {formatCookTime(recipe.prepTime + recipe.cookTime)}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="star" size={16} color={Colors.accent} />
              <Text className="ml-1 text-sm" style={{ color: Colors.text }}>{recipe.rating}</Text>
            </View>
          </View>
          
          <View className="px-2 py-1 rounded-lg self-start" style={{ backgroundColor: Colors.background }}>
            <Text className="text-xs font-medium" style={{ color: Colors.text }}>
              {recipe.nutrition.calories} cal • {recipe.nutrition.protein}g protein
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

