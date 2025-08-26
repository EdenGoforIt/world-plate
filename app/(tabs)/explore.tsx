import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  FlatList,
  StatusBar 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { RecipeCard } from '@/components/RecipeCard';
import { Colors } from '@/constants/Colors';
import { getRecipeByIdFromCountrySync } from '@/utils/recipeUtils';
import { getAllRecipesFromCache, getCategoriesFromCache, preloadRecipeCache } from '@/utils/recipeCache';
import { Recipe } from '@/types/Recipe';
import { useFavorites } from '@/hooks/useFavorites';
import Loader from '@/components/ui/Loader';

export default function ExploreScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toggleFavorite, isFavorite } = useFavorites();
  
  // Load all recipes from cache on component mount
  useEffect(() => {
    const loadAllRecipes = async () => {
      try {
        setLoading(true);
        
        // Check if data is already cached
        const cachedRecipes = getAllRecipesFromCache();
        if (cachedRecipes.length > 0) {
          setAllRecipes(cachedRecipes);
          setRecipes(cachedRecipes);
          setLoading(false);
          return;
        }
        
        // If no cache, preload data
        const allCountryRecipes = await preloadRecipeCache();
        setAllRecipes(allCountryRecipes);
        setRecipes(allCountryRecipes);
        setLoading(false);
      } catch (error) {
        console.error('Error loading recipes:', error);
        setLoading(false);
      }
    };
    
    loadAllRecipes();
  }, []);

  // Generate categories from cached data
  const getUniqueCategories = () => {
    return getCategoriesFromCache();
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      const results = allRecipes.filter(recipe => 
        recipe.name.toLowerCase().includes(lowerQuery) ||
        recipe.cuisine.toLowerCase().includes(lowerQuery) ||
        recipe.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
      setRecipes(results);
    } else {
      setRecipes(allRecipes);
    }
    setSelectedCategory(null);
  };

  const handleCategoryPress = (categoryName: string) => {
    if (selectedCategory === categoryName) {
      setSelectedCategory(null);
      setRecipes(allRecipes);
    } else {
      setSelectedCategory(categoryName);
      const categoryRecipes = allRecipes.filter(recipe => 
        recipe.cuisine.toLowerCase() === categoryName.toLowerCase()
      );
      setRecipes(categoryRecipes);
    }
    setSearchQuery('');
  };

  const handleRecipePress = (recipeId: string) => {
    router.push(`/recipe/${recipeId}`);
  };

  const renderCategoryItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      className={`items-center justify-center bg-white rounded-2xl py-4 px-5 mr-3 min-w-[100px] shadow-sm ${
        selectedCategory === item.name ? 'bg-primary' : ''
      }`}
      onPress={() => handleCategoryPress(item.name)}
    >
      <Ionicons 
        name={item.icon as any} 
        size={24} 
        color={selectedCategory === item.name ? '#fff' : Colors.primary} 
      />
      <Text 
        className={`text-sm font-semibold mt-2 text-center ${
          selectedCategory === item.name ? 'text-white' : 'text-text'
        }`}
      >
        {item.name}
      </Text>
      <Text 
        className={`text-xs mt-0.5 ${
          selectedCategory === item.name ? 'text-white opacity-80' : 'text-text opacity-60'
        }`}
      >
        {item.recipeCount}
      </Text>
    </TouchableOpacity>
  );

  const renderRecipeItem = ({ item }: { item: Recipe }) => {
    const recipeData = getRecipeByIdFromCountrySync(item.id);
    const countryName = recipeData?.country || '';
    
    return (
      <View className="mb-4">
        <RecipeCard
          recipe={item}
          onPress={() => handleRecipePress(item.id)}
          onFavoritePress={() => toggleFavorite(item.id, countryName)}
          isFavorite={isFavorite(item.id, countryName)}
          size="large"
        />
      </View>
    );
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar barStyle="dark-content" />
      
      <View className="px-5 py-4 bg-background">
        <Text className="text-[28px] font-bold text-text mb-4">Explore Recipes</Text>
        <View className="flex-row items-center bg-white rounded-2xl px-4 py-3 shadow-sm">
          <Ionicons name="search" size={20} color={Colors.text} className="mr-3" />
          <TextInput
            className="flex-1 text-base text-text"
            placeholder="Search recipes, cuisines..."
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor={Colors.text + '80'}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons name="close" size={20} color={Colors.text} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="mb-6">
          <Text className="text-xl font-semibold text-text mb-4 px-5">Categories</Text>
          <FlatList
            data={getUniqueCategories()}
            renderItem={renderCategoryItem}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20 }}
          />
        </View>

        <View className="mb-6">
          <Text className="text-xl font-semibold text-text mb-4 px-5">
            {selectedCategory 
              ? `${selectedCategory} Recipes (${recipes.length})`
              : searchQuery 
                ? `Search Results (${recipes.length})`
                : `All Recipes (${recipes.length})`
            }
          </Text>
          <FlatList
            data={recipes}
            renderItem={renderRecipeItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={{ paddingHorizontal: 20 }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}