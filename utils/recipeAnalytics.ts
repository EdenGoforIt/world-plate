import { Recipe } from "../types/Recipe";

export interface CuisineStats {
  cuisine: string;
  recipeCount: number;
  avgPrepTime: number;
  avgCookTime: number;
  avgRating: number;
  avgCalories: number;
  popularIngredients: { ingredient: string; count: number }[];
  popularTags: { tag: string; count: number }[];
}

export interface IngredientStats {
  ingredient: string;
  count: number;
  cuisines: string[];
  categories: string[];
  avgCaloriesInRecipes: number;
}

export interface NutritionSummary {
  avgCalories: number;
  avgProtein: number;
  avgCarbs: number;
  avgFat: number;
  avgFiber: number;
  avgSugar: number;
  avgSodium: number;
  calorieRange: { min: number; max: number };
  proteinRange: { min: number; max: number };
}

export interface TimingStats {
  avgPrepTime: number;
  avgCookTime: number;
  avgTotalTime: number;
  prepTimeRange: { min: number; max: number };
  cookTimeRange: { min: number; max: number };
  quickRecipes: Recipe[]; // Under 30 min total time
  longRecipes: Recipe[]; // Over 2 hours total time
}

export interface DifficultyStats {
  easy: { count: number; percentage: number };
  medium: { count: number; percentage: number };
  hard: { count: number; percentage: number };
}

/**
 * Calculate comprehensive recipe statistics
 */
export function calculateRecipeStats(recipes: Recipe[]) {
  const cuisineStats = getCuisineStats(recipes);
  const timingStats = getTimingStats(recipes);
  const difficultyStats = getDifficultyStats(recipes);
  const mealTypeDistribution = getMealTypeDistribution(recipes);

  // Compatibility fields used by existing UI components (AnalyticsDashboard)
  const compatibility = {
    totalRecipes: recipes.length,
    averageCookTime: Math.round(timingStats.avgCookTime),
    averagePrepTime: Math.round(timingStats.avgPrepTime),
    uniqueCuisines: cuisineStats.length,
    // difficultyBreakdown and mealTypeBreakdown as arrays of { label, count }
    difficultyBreakdown: [
      {
        label: "Easy",
        count: (difficultyStats.easy && difficultyStats.easy.count) || 0,
      },
      {
        label: "Medium",
        count: (difficultyStats.medium && difficultyStats.medium.count) || 0,
      },
      {
        label: "Hard",
        count: (difficultyStats.hard && difficultyStats.hard.count) || 0,
      },
    ],
    mealTypeBreakdown: mealTypeDistribution.map((t) => ({
      label: t.item,
      count: t.count,
    })),
    cuisineBreakdown: cuisineStats.map((c) => ({
      label: c.cuisine,
      count: c.recipeCount,
    })),
  };

  return {
    // original detailed outputs
    total: recipes.length,
    cuisineStats,
    ingredientStats: getIngredientStats(recipes),
    nutritionSummary: getNutritionSummary(recipes),
    timingStats,
    difficultyStats,
    ratingStats: getRatingStats(recipes),
    popularTags: getPopularTags(recipes),
    mealTypeDistribution,
    // compatibility
    ...compatibility,
  };
}

/**
 * Get statistics by cuisine
 */
export function getCuisineStats(recipes: Recipe[]): CuisineStats[] {
  const cuisineGroups = groupBy(recipes, "cuisine");

  return Object.entries(cuisineGroups)
    .map(([cuisine, cuisineRecipes]) => {
      const ingredients = cuisineRecipes.flatMap((r) =>
        r.ingredients.map((i) => i.name)
      );
      const tags = cuisineRecipes.flatMap((r) => r.tags);

      return {
        cuisine,
        recipeCount: cuisineRecipes.length,
        avgPrepTime: average(cuisineRecipes.map((r) => r.prepTime)),
        avgCookTime: average(cuisineRecipes.map((r) => r.cookTime)),
        avgRating: average(cuisineRecipes.map((r) => r.rating)),
        avgCalories: average(cuisineRecipes.map((r) => r.nutrition.calories)),
        popularIngredients: getTopItems(ingredients, 10).map((item) => ({
          ingredient: item.item,
          count: item.count,
        })),
        popularTags: getTopItems(tags, 10).map((item) => ({
          tag: item.item,
          count: item.count,
        })),
      };
    })
    .sort((a, b) => b.recipeCount - a.recipeCount);
}

/**
 * Get ingredient statistics
 */
export function getIngredientStats(recipes: Recipe[]): IngredientStats[] {
  const ingredientMap = new Map<
    string,
    {
      count: number;
      cuisines: Set<string>;
      categories: Set<string>;
      totalCalories: number;
      recipeCount: number;
    }
  >();

  recipes.forEach((recipe) => {
    recipe.ingredients.forEach((ingredient) => {
      const key = ingredient.name.toLowerCase();
      const existing = ingredientMap.get(key) || {
        count: 0,
        cuisines: new Set(),
        categories: new Set(),
        totalCalories: 0,
        recipeCount: 0,
      };

      existing.count++;
      existing.cuisines.add(recipe.cuisine);
      existing.categories.add(ingredient.category);
      existing.totalCalories += recipe.nutrition.calories;
      existing.recipeCount++;

      ingredientMap.set(key, existing);
    });
  });

  return Array.from(ingredientMap.entries())
    .map(([ingredient, data]) => ({
      ingredient,
      count: data.count,
      cuisines: Array.from(data.cuisines),
      categories: Array.from(data.categories),
      avgCaloriesInRecipes: data.totalCalories / data.recipeCount,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Get nutrition summary
 */
export function getNutritionSummary(recipes: Recipe[]): NutritionSummary {
  const calories = recipes.map((r) => r.nutrition.calories);
  const protein = recipes.map((r) => r.nutrition.protein);
  const carbs = recipes.map((r) => r.nutrition.carbs);
  const fat = recipes.map((r) => r.nutrition.fat);
  const fiber = recipes.map((r) => r.nutrition.fiber);
  const sugar = recipes.map((r) => r.nutrition.sugar);
  const sodium = recipes.map((r) => r.nutrition.sodium);

  return {
    avgCalories: average(calories),
    avgProtein: average(protein),
    avgCarbs: average(carbs),
    avgFat: average(fat),
    avgFiber: average(fiber),
    avgSugar: average(sugar),
    avgSodium: average(sodium),
    calorieRange: { min: Math.min(...calories), max: Math.max(...calories) },
    proteinRange: { min: Math.min(...protein), max: Math.max(...protein) },
  };
}

/**
 * Get timing statistics
 */
export function getTimingStats(recipes: Recipe[]): TimingStats {
  const prepTimes = recipes.map((r) => r.prepTime);
  const cookTimes = recipes.map((r) => r.cookTime);
  const totalTimes = recipes.map((r) => r.prepTime + r.cookTime);

  return {
    avgPrepTime: average(prepTimes),
    avgCookTime: average(cookTimes),
    avgTotalTime: average(totalTimes),
    prepTimeRange: { min: Math.min(...prepTimes), max: Math.max(...prepTimes) },
    cookTimeRange: { min: Math.min(...cookTimes), max: Math.max(...cookTimes) },
    quickRecipes: recipes
      .filter((r) => r.prepTime + r.cookTime <= 30)
      .slice(0, 10),
    longRecipes: recipes
      .filter((r) => r.prepTime + r.cookTime >= 120)
      .slice(0, 10),
  };
}

/**
 * Get difficulty distribution
 */
export function getDifficultyStats(recipes: Recipe[]): DifficultyStats {
  const total = recipes.length;
  const counts = {
    easy: recipes.filter((r) => r.difficulty === "easy").length,
    medium: recipes.filter((r) => r.difficulty === "medium").length,
    hard: recipes.filter((r) => r.difficulty === "hard").length,
  };

  return {
    easy: { count: counts.easy, percentage: (counts.easy / total) * 100 },
    medium: { count: counts.medium, percentage: (counts.medium / total) * 100 },
    hard: { count: counts.hard, percentage: (counts.hard / total) * 100 },
  };
}

/**
 * Get rating statistics
 */
export function getRatingStats(recipes: Recipe[]) {
  const ratings = recipes.map((r) => r.rating);
  const reviews = recipes.map((r) => r.reviews);

  return {
    avgRating: average(ratings),
    ratingRange: { min: Math.min(...ratings), max: Math.max(...ratings) },
    totalReviews: reviews.reduce((sum, r) => sum + r, 0),
    avgReviewsPerRecipe: average(reviews),
    topRatedRecipes: recipes
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 10)
      .map((r) => ({
        id: r.id,
        name: r.name,
        rating: r.rating,
        reviews: r.reviews,
      })),
    mostReviewedRecipes: recipes
      .sort((a, b) => b.reviews - a.reviews)
      .slice(0, 10)
      .map((r) => ({
        id: r.id,
        name: r.name,
        rating: r.rating,
        reviews: r.reviews,
      })),
  };
}

/**
 * Get popular tags
 */
export function getPopularTags(recipes: Recipe[]) {
  const allTags = recipes.flatMap((r) => r.tags);
  return getTopItems(allTags, 20);
}

/**
 * Get meal type distribution
 */
export function getMealTypeDistribution(recipes: Recipe[]) {
  const allMealTypes = recipes.flatMap((r) => r.mealType);
  return getTopItems(allMealTypes, 10);
}

/**
 * Simple recipe recommendation based on user preferences
 */
export function getRecommendedRecipes(
  recipes: Recipe[],
  userPreferences: {
    favoriteCuisines?: string[];
    favoriteIngredients?: string[];
    maxPrepTime?: number;
    difficulty?: "easy" | "medium" | "hard";
    dietaryRestrictions?: (
      | "vegetarian"
      | "vegan"
      | "glutenFree"
      | "dairyFree"
    )[];
  },
  limit: number = 10
): Recipe[] {
  return recipes
    .map((recipe) => ({
      recipe,
      score: calculateRecommendationScore(recipe, userPreferences),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.recipe);
}

function calculateRecommendationScore(
  recipe: Recipe,
  preferences: {
    favoriteCuisines?: string[];
    favoriteIngredients?: string[];
    maxPrepTime?: number;
    difficulty?: "easy" | "medium" | "hard";
    dietaryRestrictions?: (
      | "vegetarian"
      | "vegan"
      | "glutenFree"
      | "dairyFree"
    )[];
  }
): number {
  let score = recipe.rating; // Base score is the recipe rating

  // Cuisine preference bonus
  if (preferences.favoriteCuisines?.includes(recipe.cuisine)) {
    score += 2;
  }

  // Ingredient preference bonus
  if (preferences.favoriteIngredients) {
    const matchingIngredients = recipe.ingredients.filter((ing) =>
      preferences.favoriteIngredients!.some((fav) =>
        ing.name.toLowerCase().includes(fav.toLowerCase())
      )
    ).length;
    score += matchingIngredients * 0.5;
  }

  // Prep time penalty
  if (preferences.maxPrepTime && recipe.prepTime > preferences.maxPrepTime) {
    return 0; // Eliminate recipes that are too time-consuming
  }

  // Difficulty preference
  if (preferences.difficulty && recipe.difficulty !== preferences.difficulty) {
    score -= 1;
  }

  // Dietary restrictions (eliminate incompatible recipes)
  if (preferences.dietaryRestrictions) {
    // This would need the dietary restriction functions from recipeFilters
    // For now, just a placeholder
  }

  return score;
}

// Helper functions
function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const value = String(item[key]);
    (groups[value] = groups[value] || []).push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

function average(numbers: number[]): number {
  return numbers.length === 0
    ? 0
    : numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}

function getTopItems(
  items: string[],
  limit: number
): { item: string; count: number }[] {
  const counts = items.reduce((acc, item) => {
    acc[item] = (acc[item] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(counts)
    .map(([item, count]) => ({ item, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
