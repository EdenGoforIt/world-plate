import { Recipe } from "../types/Recipe";

export interface RecipeFilters {
  cuisine?: string[];
  mealType?: string[];
  difficulty?: "easy" | "medium" | "hard";
  maxPrepTime?: number;
  maxCookTime?: number;
  maxTotalTime?: number;
  maxCalories?: number;
  minProtein?: number;
  maxServings?: number;
  minServings?: number;
  ingredients?: string[];
  tags?: string[];
  minRating?: number;
  vegetarian?: boolean;
  vegan?: boolean;
  glutenFree?: boolean;
  dairyFree?: boolean;
}

export interface SearchOptions {
  query?: string;
  filters?: RecipeFilters;
  sortBy?:
    | "name"
    | "rating"
    | "prepTime"
    | "cookTime"
    | "calories"
    | "difficulty";
  sortOrder?: "asc" | "desc";
  limit?: number;
  offset?: number;
}

/**
 * Filter recipes based on multiple criteria
 */
export function filterRecipes(
  recipes: Recipe[],
  filters: RecipeFilters
): Recipe[] {
  return recipes.filter((recipe) => {
    // Cuisine filter
    if (filters.cuisine && filters.cuisine.length > 0) {
      if (!filters.cuisine.includes(recipe.cuisine)) return false;
    }

    // Meal type filter
    if (filters.mealType && filters.mealType.length > 0) {
      if (!filters.mealType.some((type) => recipe.mealType.includes(type)))
        return false;
    }

    // Difficulty filter
    if (filters.difficulty && recipe.difficulty !== filters.difficulty) {
      return false;
    }

    // Time filters
    if (filters.maxPrepTime && recipe.prepTime > filters.maxPrepTime)
      return false;
    if (filters.maxCookTime && recipe.cookTime > filters.maxCookTime)
      return false;
    if (
      filters.maxTotalTime &&
      recipe.prepTime + recipe.cookTime > filters.maxTotalTime
    )
      return false;

    // Nutrition filters
    if (filters.maxCalories && recipe.nutrition.calories > filters.maxCalories)
      return false;
    if (filters.minProtein && recipe.nutrition.protein < filters.minProtein)
      return false;

    // Serving size filters
    if (filters.maxServings && recipe.servings > filters.maxServings)
      return false;
    if (filters.minServings && recipe.servings < filters.minServings)
      return false;

    // Rating filter
    if (filters.minRating && recipe.rating < filters.minRating) return false;

    // Ingredient filter (recipe must contain ALL specified ingredients)
    if (filters.ingredients && filters.ingredients.length > 0) {
      const recipeIngredients = recipe.ingredients.map((ing) =>
        ing.name.toLowerCase()
      );
      const hasAllIngredients = filters.ingredients.every((ingredient) =>
        recipeIngredients.some((recipeIng) =>
          recipeIng.includes(ingredient.toLowerCase())
        )
      );
      if (!hasAllIngredients) return false;
    }

    // Tags filter (recipe must contain ALL specified tags)
    if (filters.tags && filters.tags.length > 0) {
      const recipeTags = recipe.tags.map((tag) => tag.toLowerCase());
      const hasAllTags = filters.tags.every((tag) =>
        recipeTags.includes(tag.toLowerCase())
      );
      if (!hasAllTags) return false;
    }

    // Dietary restriction filters
    if (filters.vegetarian && !isVegetarian(recipe)) return false;
    if (filters.vegan && !isVegan(recipe)) return false;
    if (filters.glutenFree && !isGlutenFree(recipe)) return false;
    if (filters.dairyFree && !isDairyFree(recipe)) return false;

    return true;
  });
}

/**
 * Search recipes by name, ingredients, or tags
 */
export function searchRecipes(recipes: Recipe[], query: string): Recipe[] {
  if (!query || query.trim() === "") return recipes;

  const searchTerm = query.toLowerCase().trim();

  return recipes.filter((recipe) => {
    // Search in recipe name
    if (recipe.name.toLowerCase().includes(searchTerm)) return true;

    // Search in ingredients
    if (
      recipe.ingredients.some((ing) =>
        ing.name.toLowerCase().includes(searchTerm)
      )
    )
      return true;

    // Search in tags
    if (recipe.tags.some((tag) => tag.toLowerCase().includes(searchTerm)))
      return true;

    // Search in cuisine
    if (recipe.cuisine.toLowerCase().includes(searchTerm)) return true;

    return false;
  });
}

/**
 * Sort recipes by various criteria
 */
export function sortRecipes(
  recipes: Recipe[],
  sortBy: SearchOptions["sortBy"] = "name",
  sortOrder: SearchOptions["sortOrder"] = "asc"
): Recipe[] {
  const sorted = [...recipes];

  sorted.sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortBy) {
      case "name":
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case "rating":
        aValue = a.rating;
        bValue = b.rating;
        break;
      case "prepTime":
        aValue = a.prepTime;
        bValue = b.prepTime;
        break;
      case "cookTime":
        aValue = a.cookTime;
        bValue = b.cookTime;
        break;
      case "calories":
        aValue = a.nutrition.calories;
        bValue = b.nutrition.calories;
        break;
      case "difficulty":
        const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
        aValue = difficultyOrder[a.difficulty];
        bValue = difficultyOrder[b.difficulty];
        break;
      default:
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
    }

    if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
    if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  return sorted;
}

/**
 * Combined search and filter with pagination
 */
export function searchAndFilterRecipes(
  recipes: Recipe[],
  options: SearchOptions
): {
  results: Recipe[];
  total: number;
  hasMore: boolean;
} {
  let results = recipes;

  // Apply search
  if (options.query) {
    results = searchRecipes(results, options.query);
  }

  // Apply filters
  if (options.filters) {
    results = filterRecipes(results, options.filters);
  }

  // Apply sorting
  results = sortRecipes(results, options.sortBy, options.sortOrder);

  const total = results.length;

  // Apply pagination
  const offset = options.offset || 0;
  const limit = options.limit;

  if (limit) {
    results = results.slice(offset, offset + limit);
  }

  return {
    results,
    total,
    hasMore: limit ? offset + limit < total : false,
  };
}

// Dietary restriction helpers
function isVegetarian(recipe: Recipe): boolean {
  const nonVegetarianCategories = ["protein"];
  const meatKeywords = [
    "chicken",
    "beef",
    "pork",
    "fish",
    "seafood",
    "shrimp",
    "bacon",
    "sausage",
    "meat",
  ];

  return !recipe.ingredients.some((ingredient) => {
    if (nonVegetarianCategories.includes(ingredient.category)) {
      return meatKeywords.some((keyword) =>
        ingredient.name.toLowerCase().includes(keyword)
      );
    }
    return false;
  });
}

function isVegan(recipe: Recipe): boolean {
  if (!isVegetarian(recipe)) return false;

  const nonVeganCategories = ["dairy"];
  const animalProducts = [
    "milk",
    "cheese",
    "butter",
    "cream",
    "egg",
    "honey",
    "yogurt",
  ];

  return !recipe.ingredients.some((ingredient) => {
    if (nonVeganCategories.includes(ingredient.category)) return true;
    return animalProducts.some((product) =>
      ingredient.name.toLowerCase().includes(product)
    );
  });
}

function isGlutenFree(recipe: Recipe): boolean {
  const glutenIngredients = [
    "flour",
    "wheat",
    "bread",
    "pasta",
    "soy sauce",
    "barley",
    "rye",
  ];

  return !recipe.ingredients.some((ingredient) =>
    glutenIngredients.some((gluten) =>
      ingredient.name.toLowerCase().includes(gluten)
    )
  );
}

function isDairyFree(recipe: Recipe): boolean {
  const dairyIngredients = ["milk", "cheese", "butter", "cream", "yogurt"];

  return !recipe.ingredients.some((ingredient) =>
    dairyIngredients.some((dairy) =>
      ingredient.name.toLowerCase().includes(dairy)
    )
  );
}

/**
 * Get unique values for filter dropdowns
 */
export function getFilterOptions(recipes: Recipe[]) {
  return {
    cuisines: [...new Set(recipes.map((r) => r.cuisine))].sort(),
    mealTypes: [...new Set(recipes.flatMap((r) => r.mealType))].sort(),
    difficulties: [...new Set(recipes.map((r) => r.difficulty))].sort(),
    ingredients: [
      ...new Set(recipes.flatMap((r) => r.ingredients.map((i) => i.name))),
    ].sort(),
    tags: [...new Set(recipes.flatMap((r) => r.tags))].sort(),
  };
}
