import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/Colors';
import { getRecipeByIdFromCountry, formatCookTime, getDifficultyColor } from '@/utils/recipeUtils';
import { useFavorites } from '@/hooks/useFavorites';
import { Recipe } from '@/types/Recipe';

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { toggleFavorite, isFavorite } = useFavorites();
  const [recipeData, setRecipeData] = useState<{ recipe: Recipe; country: string } | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchRecipe = async () => {
      setLoading(true);
      const data = await getRecipeByIdFromCountry(id!);
      setRecipeData(data);
      setLoading(false);
    };
    
    fetchRecipe();
  }, [id]);
  
  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#FEFEFE]">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text className="mt-4 text-base" style={{ color: Colors.text }}>Loading recipe...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  if (!recipeData) {
    return (
      <SafeAreaView className="flex-1 bg-[#FEFEFE]">
        <View className="flex-1 items-center justify-center p-5">
          <Text className="text-lg mb-5" style={{ color: Colors.text }}>Recipe not found</Text>
          <TouchableOpacity onPress={() => router.back()} className="px-5 py-2.5 rounded-lg" style={{ backgroundColor: Colors.primary }}>
            <Text className="text-white text-base font-semibold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { recipe, country } = recipeData;
  const isRecipeFavorite = isFavorite(recipe.id, country);

  const handleFavoritePress = () => {
    toggleFavorite(recipe.id, country);
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: Colors.background }}>
      <StatusBar barStyle="light-content" />
      
      {/* Header Image */}
      <View className="h-[300px] relative">
        <Image source={{ uri: recipe.image }} className="w-full h-full" style={{ resizeMode: 'cover' }} />
        
        {/* Header Controls */}
        <View className="absolute top-12 left-0 right-0 flex-row justify-between px-5">
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={handleFavoritePress} className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
            <Ionicons 
              name={isRecipeFavorite ? "heart" : "heart-outline"} 
              size={24} 
              color={isRecipeFavorite ? "#FF6B6B" : "#fff"} 
            />
          </TouchableOpacity>
        </View>
        
        {/* Gradient Overlay */}
        <View className="absolute bottom-0 left-0 right-0 h-[100px]" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }} />
      </View>

      <ScrollView className="flex-1" style={{ backgroundColor: Colors.background }} showsVerticalScrollIndicator={false}>
        {/* Recipe Info */}
        <View className="p-5 bg-white mb-4">
          <Text className="text-[28px] font-bold mb-2" style={{ color: Colors.text }}>{recipe.name}</Text>
          
          <View className="flex-row items-center mb-4">
            <Text className="text-base font-semibold" style={{ color: Colors.primary }}>{recipe.cuisine}</Text>
            <Text className="text-base ml-1" style={{ color: Colors.text }}>• {country}</Text>
          </View>
          
          {/* Stats */}
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center flex-1">
              <Ionicons name="time-outline" size={20} color={Colors.primary} />
              <Text className="text-sm ml-1.5" style={{ color: Colors.text }}>{formatCookTime(recipe.cookTime)}</Text>
            </View>
            
            <View className="flex-row items-center flex-1">
              <Ionicons name="restaurant-outline" size={20} color={Colors.primary} />
              <Text className="text-sm ml-1.5" style={{ color: Colors.text }}>{recipe.servings} servings</Text>
            </View>
            
            <View className="flex-row items-center flex-1">
              <View className="px-3 py-1 rounded-xl" style={{ backgroundColor: getDifficultyColor(recipe.difficulty) }}>
                <Text className="text-xs font-semibold text-white capitalize">{recipe.difficulty}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Description */}
        {recipe.description && (
          <View className="bg-white p-5 mb-4">
            <Text className="text-xl font-semibold mb-4" style={{ color: Colors.text }}>Description</Text>
            <Text className="text-base leading-6" style={{ color: Colors.text }}>{recipe.description}</Text>
          </View>
        )}

        {/* Ingredients */}
        <View className="bg-white p-5 mb-4">
          <Text className="text-xl font-semibold mb-4" style={{ color: Colors.text }}>Ingredients</Text>
          {recipe.ingredients.map((ingredient, index) => (
            <View key={index} className="flex-row items-start mb-3">
              <View className="w-1.5 h-1.5 rounded-full mt-2 mr-3" style={{ backgroundColor: Colors.primary }} />
              <Text className="text-base flex-1 leading-5" style={{ color: Colors.text }}>
                {ingredient.amount} {ingredient.name}
              </Text>
            </View>
          ))}
        </View>

        {/* Instructions */}
        <View className="bg-white p-5 mb-4">
          <Text className="text-xl font-semibold mb-4" style={{ color: Colors.text }}>Instructions</Text>
          {recipe.instructions.map((instruction, index) => (
            <View key={index} className="flex-row mb-4">
              <View className="w-7 h-7 rounded-full items-center justify-center mr-3 mt-0.5" style={{ backgroundColor: Colors.primary }}>
                <Text className="text-sm font-semibold text-white">{index + 1}</Text>
              </View>
              <Text className="text-base flex-1 leading-6" style={{ color: Colors.text }}>{instruction}</Text>
            </View>
          ))}
        </View>

        {/* Tags */}
        {recipe.tags && recipe.tags.length > 0 && (
          <View className="bg-white p-5 mb-4">
            <Text className="text-xl font-semibold mb-4" style={{ color: Colors.text }}>Tags</Text>
            <View className="flex-row flex-wrap -mt-2">
              {recipe.tags.map((tag, index) => (
                <View key={index} className="px-3 py-1.5 rounded-2xl mr-2 mt-2" style={{ backgroundColor: Colors.primary + '15' }}>
                  <Text className="text-sm font-medium" style={{ color: Colors.primary }}>#{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Bottom Spacing */}
        <View className="h-10" />
      </ScrollView>
    </SafeAreaView>
  );
}

