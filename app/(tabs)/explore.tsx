import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
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
import { getCountries, getCountryData, getRecipeByIdFromCountry } from '@/utils/recipeUtils';
import { Recipe } from '@/types/Recipe';
import { useFavorites } from '@/hooks/useFavorites';

export default function ExploreScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { toggleFavorite, isFavorite } = useFavorites();
  
  // Load all recipes from all countries on component mount
  useEffect(() => {
    const loadAllRecipes = () => {
      const countries = getCountries();
      const allCountryRecipes: Recipe[] = [];
      
      countries.forEach(countryInfo => {
        const countryData = getCountryData(countryInfo.file);
        if (countryData && countryData.recipes) {
          allCountryRecipes.push(...countryData.recipes);
        }
      });
      
      setAllRecipes(allCountryRecipes);
      setRecipes(allCountryRecipes);
    };
    
    loadAllRecipes();
  }, []);

  // Generate categories from all loaded recipes
  const getUniqueCategories = () => {
    const cuisineMap = new Map();
    
    allRecipes.forEach(recipe => {
      const cuisine = recipe.cuisine;
      if (cuisineMap.has(cuisine)) {
        cuisineMap.set(cuisine, cuisineMap.get(cuisine) + 1);
      } else {
        cuisineMap.set(cuisine, 1);
      }
    });

    return Array.from(cuisineMap.entries()).map(([cuisine, count], index) => ({
      id: `cuisine-${index}`,
      name: cuisine,
      recipeCount: count,
      icon: getCuisineIcon(cuisine)
    }));
  };

  // Get icon for cuisine type
  const getCuisineIcon = (cuisine: string): string => {
    const iconMap: { [key: string]: string } = {
      'Italian': 'pizza-outline',
      'Chinese': 'restaurant-outline',
      'Mexican': 'fast-food-outline',
      'Indian': 'flame-outline',
      'French': 'wine-outline',
      'Japanese': 'fish-outline',
      'Thai': 'leaf-outline',
      'Greek': 'sunny-outline',
      'American': 'fast-food-outline',
      'Korean': 'bowl-outline',
    };
    return iconMap[cuisine] || 'restaurant-outline';
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
      style={[
        styles.categoryItem,
        selectedCategory === item.name && styles.categoryItemSelected
      ]}
      onPress={() => handleCategoryPress(item.name)}
    >
      <Ionicons 
        name={item.icon as any} 
        size={24} 
        color={selectedCategory === item.name ? '#fff' : Colors.primary} 
      />
      <Text 
        style={[
          styles.categoryText,
          selectedCategory === item.name && styles.categoryTextSelected
        ]}
      >
        {item.name}
      </Text>
      <Text 
        style={[
          styles.categoryCount,
          selectedCategory === item.name && styles.categoryCountSelected
        ]}
      >
        {item.recipeCount}
      </Text>
    </TouchableOpacity>
  );

  const renderRecipeItem = ({ item }: { item: Recipe }) => {
    const recipeData = getRecipeByIdFromCountry(item.id);
    const countryName = recipeData?.country || '';
    
    return (
      <View style={styles.recipeItem}>
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Explore Recipes</Text>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={Colors.text} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <FlatList
            data={getUniqueCategories()}
            renderItem={renderCategoryItem}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
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
            contentContainerStyle={styles.recipesContainer}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
  },
  categoryItem: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginRight: 12,
    minWidth: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryItemSelected: {
    backgroundColor: Colors.primary,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 8,
    textAlign: 'center',
  },
  categoryTextSelected: {
    color: '#fff',
  },
  categoryCount: {
    fontSize: 12,
    color: Colors.text,
    opacity: 0.6,
    marginTop: 2,
  },
  categoryCountSelected: {
    color: '#fff',
    opacity: 0.8,
  },
  recipesContainer: {
    paddingHorizontal: 20,
  },
  recipeItem: {
    marginBottom: 16,
  },
});