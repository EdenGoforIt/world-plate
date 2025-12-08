import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    FlatList,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RecipeCard } from '@/components/RecipeCard';
import { FilterOptions, SearchFilters } from '@/components/SearchFilters';
import Loader from '@/components/ui/Loader';
import { Colors } from '@/constants/Colors';
import { useFavorites } from '@/hooks/useFavorites';
import { Recipe } from '@/types/Recipe';
import { getAllRecipesFromCache, getCategoriesFromCache, preloadRecipeCache } from '@/utils/recipeCache';
import { getRecipeByIdFromCountrySync } from '@/utils/recipeUtils';

export default function ExploreScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterOptions | null>(null);
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
      } catch {
        // Error loading recipes
        setLoading(false);
      }
    };
    
    loadAllRecipes();
  }, []);

  // Generate categories from cached data
  const getUniqueCategories = () => {
    return getCategoriesFromCache();
  };

  const applyFiltersAndSearch = (recipesToFilter: Recipe[], query: string, filters: FilterOptions | null) => {
    let filtered = [...recipesToFilter];
    
    // Apply search query
    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(recipe => 
        recipe.name.toLowerCase().includes(lowerQuery) ||
        recipe.cuisine.toLowerCase().includes(lowerQuery) ||
        recipe.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
    }
    
    // Apply filters
    if (filters) {
      if (filters.difficulty.length > 0) {
        filtered = filtered.filter(recipe => 
          filters.difficulty.includes(recipe.difficulty)
        );
      }
      
      if (filters.mealType.length > 0) {
        filtered = filtered.filter(recipe => 
          recipe.mealType.some(type => filters.mealType.includes(type))
        );
      }
      
      if (filters.prepTime) {
        filtered = filtered.filter(recipe => {
          const totalTime = recipe.prepTime + recipe.cookTime;
          return totalTime >= filters.prepTime!.min && totalTime <= filters.prepTime!.max;
        });
      }
      
      if (filters.cuisines.length > 0) {
        filtered = filtered.filter(recipe => 
          filters.cuisines.includes(recipe.cuisine)
        );
      }
      
      if (filters.dietary.length > 0) {
        filtered = filtered.filter(recipe => 
          filters.dietary.some(diet => recipe.tags.includes(diet))
        );
      }
    }
    
    return filtered;
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const results = applyFiltersAndSearch(allRecipes, query, activeFilters);
    setRecipes(results);
    setSelectedCategory(null);
  };

  const handleCategoryPress = (categoryName: string) => {
    if (selectedCategory === categoryName) {
      setSelectedCategory(null);
      const results = applyFiltersAndSearch(allRecipes, searchQuery, activeFilters);
      setRecipes(results);
    } else {
      setSelectedCategory(categoryName);
      const categoryRecipes = allRecipes.filter(recipe => 
        recipe.cuisine.toLowerCase() === categoryName.toLowerCase()
      );
      const results = applyFiltersAndSearch(categoryRecipes, searchQuery, activeFilters);
      setRecipes(results);
    }
  };

  const handleApplyFilters = (filters: FilterOptions) => {
    setActiveFilters(filters);
    const baseRecipes = selectedCategory 
      ? allRecipes.filter(recipe => recipe.cuisine.toLowerCase() === selectedCategory.toLowerCase())
      : allRecipes;
    const results = applyFiltersAndSearch(baseRecipes, searchQuery, filters);
    setRecipes(results);
  };

  const getAvailableCuisines = () => {
    const cuisineSet = new Set<string>();
    allRecipes.forEach(recipe => cuisineSet.add(recipe.cuisine));
    return Array.from(cuisineSet).sort();
  };

  const getActiveFilterCount = () => {
    if (!activeFilters) return 0;
    return activeFilters.difficulty.length +
           activeFilters.mealType.length +
           (activeFilters.prepTime ? 1 : 0) +
           activeFilters.cuisines.length +
           activeFilters.dietary.length;
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
            <TouchableOpacity onPress={() => handleSearch('')} className="mr-2">
              <Ionicons name="close" size={20} color={Colors.text} />
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity 
            onPress={() => setShowFilters(true)}
            className="flex-row items-center"
          >
            <Ionicons name="filter" size={20} color={Colors.primary} />
            {getActiveFilterCount() > 0 && (
              <View className="bg-primary rounded-full w-5 h-5 items-center justify-center ml-1">
                <Text className="text-white text-xs font-bold">{getActiveFilterCount()}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        {getActiveFilterCount() > 0 && (
          <TouchableOpacity 
            className="mt-3 bg-primary/10 px-3 py-2 rounded-lg flex-row items-center self-start"
            onPress={() => {
              setActiveFilters(null);
              const results = applyFiltersAndSearch(allRecipes, searchQuery, null);
              setRecipes(results);
            }}
          >
            <Text className="text-primary text-sm font-semibold mr-2">
              {getActiveFilterCount()} filter{getActiveFilterCount() !== 1 ? 's' : ''} applied
            </Text>
            <Ionicons name="close-circle" size={16} color={Colors.primary} />
          </TouchableOpacity>
        )}
        <View className="flex-row gap-3 mt-2">
          <TouchableOpacity onPress={() => router.push('/pantry')} className="bg-primary px-3 py-2 rounded-lg">
            <Text className="text-white">Pantry Matcher</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/shopping-list')} className="bg-secondary px-3 py-2 rounded-lg">
            <Text className="text-white">Shopping List</Text>
          </TouchableOpacity>
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
      
      <SearchFilters
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={handleApplyFilters}
        availableCuisines={getAvailableCuisines()}
      />
    </SafeAreaView>
  );
}