import React, { useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  ActivityIndicator, 
  TouchableOpacity,
  SectionList,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useFavorites } from '../../hooks/useFavorites';
import { Recipe } from '../../types/Recipe';
import { formatCookTime, getDifficultyColor, getCountries } from '../../utils/recipeUtils';

interface FavoriteSection {
  title: string;
  flag: string;
  data: Recipe[];
}

export default function FavoritesScreen() {
  const { favoritesByCountry, allFavorites, loading, getFavoritesByCountry, refreshFavorites } = useFavorites();

  // Refresh favorites data every time screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refreshFavorites();
    }, [refreshFavorites])
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#FEFEFE]">
        <ActivityIndicator size="large" color="#E74C3C" />
        <Text className="mt-2.5 text-base text-[#2C3E50]">Loading favorites...</Text>
      </SafeAreaView>
    );
  }

  if (allFavorites.length === 0) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#FEFEFE] p-10">
        <Text className="text-2xl font-bold text-[#2C3E50] mb-2.5">No Favorites Yet</Text>
        <Text className="text-base text-[#7F8C8D] text-center leading-6">
          Start exploring recipes and add some to your favorites!
        </Text>
      </SafeAreaView>
    );
  }

  // Create sections for SectionList
  const sections: FavoriteSection[] = Object.keys(favoritesByCountry).map(countryName => {
    const recipes = getFavoritesByCountry(countryName);
    // Get country flag (you might need to map country names to flags)
    const countryData = getCountryFlag(countryName);
    return {
      title: countryName,
      flag: countryData.flag,
      data: recipes
    };
  }).filter(section => section.data.length > 0);

  const renderRecipeItem = ({ item: recipe }: { item: Recipe }) => (
    <TouchableOpacity className="flex-row bg-white mx-3.5 my-2 rounded-xl p-3 shadow-sm" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }} onPress={() => router.push(`/recipe/${recipe.id}`)}>
      <Image source={{ uri: recipe.image }} className="w-20 h-20 rounded-lg mr-3" />
      <View className="flex-1 justify-between">
        <Text className="text-base font-semibold text-[#2C3E50] leading-5 mb-1" numberOfLines={2}>{recipe.name}</Text>
        <Text className="text-sm text-[#7F8C8D] mb-2">{recipe.cuisine}</Text>
        
        <View className="flex-row items-center mb-2">
          <View className="mr-2.5">
            <Text className="text-xs text-[#7F8C8D]">
              {formatCookTime(recipe.prepTime + recipe.cookTime)}
            </Text>
          </View>
          
          <View className="px-2 py-0.5 rounded-2xl" style={{ backgroundColor: getDifficultyColor(recipe.difficulty) }}>
            <Text className="text-xs text-white font-semibold">{recipe.difficulty}</Text>
          </View>
        </View>

        <View className="flex-row items-center">
          <Text className="text-xs text-[#2C3E50] mr-1.5">⭐ {recipe.rating}</Text>
          <Text className="text-xs text-[#7F8C8D]">({recipe.reviews} reviews)</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderSectionHeader = ({ section }: { section: FavoriteSection }) => (
    <View className="flex-row items-center bg-[#F8F9FA] p-3.5 mt-2.5 border-t border-[#E9ECEF]">
      <Text className="text-2xl mr-3">{section.flag}</Text>
      <Text className="text-lg font-semibold text-[#2C3E50] flex-1">{section.title}</Text>
      <Text className="text-sm text-[#7F8C8D]">({section.data.length} recipe{section.data.length !== 1 ? 's' : ''})</Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#FEFEFE]">
      <View className="p-5 pb-2.5 bg-[#FEFEFE]">
        <Text className="text-[28px] font-bold text-[#2C3E50] mb-1">My Favorites</Text>
        <Text className="text-sm text-[#7F8C8D]">
          {allFavorites.length} recipe{allFavorites.length !== 1 ? 's' : ''} from {sections.length} countr{sections.length !== 1 ? 'ies' : 'y'}
        </Text>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderRecipeItem}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={true}
      />
    </SafeAreaView>
  );
}

// Helper function to get country flag
const getCountryFlag = (countryName: string) => {
  const countries = getCountries();
  const country = countries.find(c => c.name === countryName);
  return { flag: country?.flag || '🌍' };
};

