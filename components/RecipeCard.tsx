import React from 'react';
import { View, Text, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Recipe } from '../types/Recipe';
import { Colors } from '../constants/Colors';
import { formatCookTime, getDifficultyColor } from '../utils/recipeUtils';

interface RecipeCardProps {
  recipe: Recipe;
  onPress: () => void;
  onFavoritePress: () => void;
  isFavorite: boolean;
  size?: 'small' | 'medium' | 'large';
}

const { width } = Dimensions.get('window');

export const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  onPress,
  onFavoritePress,
  isFavorite,
  size = 'medium',
}) => {
  const cardWidth = size === 'small' ? width * 0.4 : size === 'large' ? width * 0.9 : width * 0.7;
  
  return (
    <TouchableOpacity className="bg-white rounded-2xl mb-4" style={{ width: cardWidth, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 }} onPress={onPress}>
      <View className="relative h-[180px] rounded-t-2xl overflow-hidden">
        <Image source={{ uri: recipe.image }} className="w-full h-full" style={{ resizeMode: 'cover' }} />
        <TouchableOpacity className="absolute top-3 right-3 p-2 rounded-full" style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }} onPress={onFavoritePress}>
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={24}
            color={isFavorite ? '#FF6B6B' : '#fff'}
          />
        </TouchableOpacity>
        <View className="absolute bottom-0 left-0 right-0 p-3 flex-row justify-between items-end" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.6))' }}>
          <View className="flex-row items-center px-2 py-1 rounded-xl" style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
            <Ionicons name="star" size={16} color={Colors.accent} />
            <Text className="ml-1 text-sm font-semibold" style={{ color: Colors.text }}>{recipe.rating}</Text>
          </View>
        </View>
      </View>
      
      <View className="p-4">
        <Text className="text-lg font-bold mb-1" style={{ color: Colors.text }} numberOfLines={2}>
          {recipe.name}
        </Text>
        <Text className="text-sm mb-3 capitalize" style={{ color: Colors.secondary }}>{recipe.cuisine}</Text>
        
        <View className="flex-row justify-between items-center mb-3">
          <View className="flex-row items-center">
            <Ionicons name="time-outline" size={16} color={Colors.text} />
            <Text className="ml-1 text-sm" style={{ color: Colors.text }}>
              {formatCookTime(recipe.prepTime + recipe.cookTime)}
            </Text>
          </View>
          
          <View className="px-2 py-1 rounded-xl" style={{ backgroundColor: getDifficultyColor(recipe.difficulty) }}>
            <Text className="text-xs font-semibold text-white capitalize">{recipe.difficulty}</Text>
          </View>
        </View>
        
        <View className="flex-row flex-wrap">
          {recipe.tags.slice(0, 2).map((tag, index) => (
            <View key={index} className="px-2 py-1 rounded-lg mr-2 mb-1 border" style={{ backgroundColor: Colors.background, borderColor: Colors.primary }}>
              <Text className="text-xs font-medium" style={{ color: Colors.primary }}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
};

