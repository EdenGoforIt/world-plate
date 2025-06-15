import { render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { MealRecommendation } from '../../components/MealRecommendation';
import { Recipe } from '../../types/Recipe';

// Mock hooks and storage utils
jest.mock('../../hooks/useFavorites', () => ({
  useFavorites: jest.fn(),
}));

jest.mock('../../utils/storageUtils', () => ({
  getPantryItems: jest.fn(),
}));

const { useFavorites } = require('../../hooks/useFavorites');
const { getPantryItems } = require('../../utils/storageUtils');

describe('MealRecommendation', () => {
  const baseRecipe: Recipe = {
    id: 'r1',
    name: 'Tomato Pasta',
    cuisine: 'Italian',
    image: 'https://example.com/img.jpg',
    rating: 4.5,
    prepTime: 10,
    cookTime: 20,
    difficulty: 'easy',
    tags: ['vegetarian'],
    description: 'Yummy pasta',
    ingredients: [{ name: 'Tomato', quantity: '2' } as any],
    instructions: [],
    nutrition: undefined,
    servings: 2,
    reviews: 0,
    mealType: ['lunch'],
  };

  const mockOnPress = jest.fn();
  const mockOnRefresh = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('shows Recommended when recipe is favorited', () => {
    useFavorites.mockReturnValue({
      allFavorites: [],
      isFavorite: jest.fn().mockReturnValue(true),
      toggleFavorite: jest.fn(),
      loading: false,
    });

    const { getByText } = render(
      <MealRecommendation
        mealType="lunch"
        recipe={baseRecipe}
        onPress={mockOnPress}
        onRefresh={mockOnRefresh}
        countryName="Italy"
      />
    );

    expect(getByText('Recommended')).toBeTruthy();
  });

  it('shows Recommended when pantry has an ingredient match', async () => {
    useFavorites.mockReturnValue({
      allFavorites: [],
      isFavorite: jest.fn().mockReturnValue(false),
      toggleFavorite: jest.fn(),
      loading: false,
    });
    getPantryItems.mockResolvedValue(['tomato']);

    const { getByText } = render(
      <MealRecommendation
        mealType="lunch"
        recipe={baseRecipe}
        onPress={mockOnPress}
        onRefresh={mockOnRefresh}
        countryName="Italy"
      />
    );

    await waitFor(() => expect(getByText('Recommended')).toBeTruthy());
  });

  it('shows Recommended when user favorites include same cuisine and rating is high', () => {
    const favoriteRecipe = { ...baseRecipe, id: 'fav1' };
    useFavorites.mockReturnValue({
      allFavorites: [favoriteRecipe],
      isFavorite: jest.fn().mockReturnValue(false),
      toggleFavorite: jest.fn(),
      loading: false,
    });

    const recipeWithFiveStars = { ...baseRecipe, rating: 5 };

    const { getByText } = render(
      <MealRecommendation
        mealType="lunch"
        recipe={recipeWithFiveStars}
        onPress={mockOnPress}
        onRefresh={mockOnRefresh}
        countryName="Italy"
      />
    );

    expect(getByText('Recommended')).toBeTruthy();
  });

  it('does not show Recommended when there is no signal', async () => {
    useFavorites.mockReturnValue({
      allFavorites: [{ ...baseRecipe, cuisine: 'Mexican' }],
      isFavorite: jest.fn().mockReturnValue(false),
      toggleFavorite: jest.fn(),
      loading: false,
    });
    getPantryItems.mockResolvedValue([]);

    const lowRatingRecipe = { ...baseRecipe, rating: 1 };

    const { queryByText } = render(
      <MealRecommendation
        mealType="lunch"
        recipe={lowRatingRecipe}
        onPress={mockOnPress}
        onRefresh={mockOnRefresh}
        countryName="Italy"
      />
    );

    await waitFor(() => expect(queryByText('Recommended')).toBeNull());
  });
});
