import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  TouchableOpacity,
  SectionList,
  Image
} from 'react-native';
import { router } from 'expo-router';
import { useFavorites } from '../../hooks/useFavorites';
import { Recipe } from '../../types/Recipe';
import { formatCookTime, getDifficultyColor, getCountries } from '../../utils/recipeUtils';

interface FavoriteSection {
  title: string;
  flag: string;
  data: Recipe[];
}

export default function FavoritesScreen() {
  const { favoritesByCountry, allFavorites, loading, getFavoritesByCountry } = useFavorites();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E74C3C" />
        <Text style={styles.loadingText}>Loading favorites...</Text>
      </View>
    );
  }

  if (allFavorites.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No Favorites Yet</Text>
        <Text style={styles.emptySubtitle}>
          Start exploring recipes and add some to your favorites!
        </Text>
      </View>
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
    <TouchableOpacity style={styles.recipeCard} onPress={() => router.push(`/recipe/${recipe.id}`)}>
      <Image source={{ uri: recipe.image }} style={styles.recipeImage} />
      <View style={styles.recipeInfo}>
        <Text style={styles.recipeName} numberOfLines={2}>{recipe.name}</Text>
        <Text style={styles.recipeCuisine}>{recipe.cuisine}</Text>
        
        <View style={styles.recipeDetails}>
          <View style={styles.timeContainer}>
            <Text style={styles.recipeTime}>
              {formatCookTime(recipe.prepTime + recipe.cookTime)}
            </Text>
          </View>
          
          <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(recipe.difficulty) }]}>
            <Text style={styles.difficultyText}>{recipe.difficulty}</Text>
          </View>
        </View>

        <View style={styles.ratingContainer}>
          <Text style={styles.rating}>⭐ {recipe.rating}</Text>
          <Text style={styles.reviews}>({recipe.reviews} reviews)</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderSectionHeader = ({ section }: { section: FavoriteSection }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.countryFlag}>{section.flag}</Text>
      <Text style={styles.countryName}>{section.title}</Text>
      <Text style={styles.countryCount}>({section.data.length} recipe{section.data.length !== 1 ? 's' : ''})</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Favorites</Text>
        <Text style={styles.totalCount}>
          {allFavorites.length} recipe{allFavorites.length !== 1 ? 's' : ''} from {sections.length} countr{sections.length !== 1 ? 'ies' : 'y'}
        </Text>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderRecipeItem}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={true}
      />
    </View>
  );
}

// Helper function to get country flag
const getCountryFlag = (countryName: string) => {
  const countries = getCountries();
  const country = countries.find(c => c.name === countryName);
  return { flag: country?.flag || '🌍' };
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEFEFE',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
    backgroundColor: '#FEFEFE',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  totalCount: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEFEFE',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#2C3E50',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEFEFE',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 24,
  },
  listContainer: {
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 15,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  countryFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  countryName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    flex: 1,
  },
  countryCount: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  recipeCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 15,
    marginVertical: 8,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recipeImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  recipeInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  recipeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    lineHeight: 20,
    marginBottom: 4,
  },
  recipeCuisine: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 8,
  },
  recipeDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeContainer: {
    marginRight: 10,
  },
  recipeTime: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  difficultyText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 12,
    color: '#2C3E50',
    marginRight: 6,
  },
  reviews: {
    fontSize: 12,
    color: '#7F8C8D',
  },
});