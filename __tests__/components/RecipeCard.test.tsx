import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { RecipeCard } from '../../components/RecipeCard';
import { Recipe } from '../../types/Recipe';

describe('RecipeCard', () => {
  const mockRecipe: Recipe = {
    id: '1',
    name: 'Test Recipe',
    cuisine: 'Italian',
    image: 'https://example.com/image.jpg',
    rating: 4.5,
    prepTime: 15,
    cookTime: 30,
    difficulty: 'medium',
    tags: ['vegetarian', 'healthy'],
    description: 'A test recipe',
    ingredients: [],
    instructions: [],
    nutrition: {
      calories: 300,
      protein: 20,
      carbs: 40,
      fat: 10,
      fiber: 5,
      sugar: 8,
      sodium: 200,
    },
    servings: 4,
    reviews: 10,
    mealType: ['lunch'],
  };

  const mockOnPress = jest.fn();
  const mockOnFavoritePress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with required props', () => {
    const { getByText } = render(
      <RecipeCard
        recipe={mockRecipe}
        onPress={mockOnPress}
      />
    );

    expect(getByText('Test Recipe')).toBeTruthy();
    expect(getByText('Italian')).toBeTruthy();
    expect(getByText('4.5')).toBeTruthy();
  });

  it('displays correct cooking time', () => {
    const { getByText } = render(
      <RecipeCard
        recipe={mockRecipe}
        onPress={mockOnPress}
      />
    );

    expect(getByText('45 min')).toBeTruthy();
  });

  it('handles press event', () => {
    const { getByRole } = render(
      <RecipeCard
        recipe={mockRecipe}
        onPress={mockOnPress}
      />
    );

    const card = getByRole('button', { name: /Recipe: Test Recipe/i });
    fireEvent.press(card);

    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('handles favorite press when provided', () => {
    const { getByRole } = render(
      <RecipeCard
        recipe={mockRecipe}
        onPress={mockOnPress}
        onFavoritePress={mockOnFavoritePress}
        isFavorite={false}
      />
    );

    const favoriteButton = getByRole('button', { name: /Add to favorites/i });
    fireEvent.press(favoriteButton);

    expect(mockOnFavoritePress).toHaveBeenCalledTimes(1);
  });

  it('shows correct favorite state', () => {
    const { getByRole, rerender } = render(
      <RecipeCard
        recipe={mockRecipe}
        onPress={mockOnPress}
        onFavoritePress={mockOnFavoritePress}
        isFavorite={false}
      />
    );

    expect(getByRole('button', { name: /Add to favorites/i })).toBeTruthy();

    rerender(
      <RecipeCard
        recipe={mockRecipe}
        onPress={mockOnPress}
        onFavoritePress={mockOnFavoritePress}
        isFavorite={true}
      />
    );

    expect(getByRole('button', { name: /Remove from favorites/i })).toBeTruthy();
  });

  it('displays tags correctly', () => {
    const { getByText } = render(
      <RecipeCard
        recipe={mockRecipe}
        onPress={mockOnPress}
      />
    );

    expect(getByText('vegetarian')).toBeTruthy();
    expect(getByText('healthy')).toBeTruthy();
  });

  it('displays country name when provided', () => {
    const { getByText } = render(
      <RecipeCard
        recipe={mockRecipe}
        onPress={mockOnPress}
        countryName="Italy"
      />
    );

    expect(getByText('Italy')).toBeTruthy();
  });
});