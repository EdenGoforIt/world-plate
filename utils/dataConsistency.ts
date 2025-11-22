import { Recipe } from "../types/Recipe";

export interface DataConsistencyReport {
  ingredientIssues: {
    inconsistentNames: { variations: string[]; suggested: string }[];
    missingCategories: { ingredient: string; recipes: string[] }[];
    unusualCategories: {
      ingredient: string;
      category: string;
      recipes: string[];
    }[];
  };
  nutritionIssues: {
    missingNutrition: string[];
    suspiciousValues: {
      recipe: string;
      field: string;
      value: number;
      reason: string;
    }[];
  };
  imageIssues: {
    invalidUrls: string[];
    missingImages: string[];
  };
  generalIssues: {
    duplicateIds: string[];
    missingFields: { recipe: string; fields: string[] }[];
    inconsistentCuisines: { variations: string[]; suggested: string }[];
  };
}

export interface DataNormalizationSuggestions {
  ingredientMapping: Record<string, string>;
  cuisineMapping: Record<string, string>;
  categoryMapping: Record<string, string>;
  imageUrlFixes: Record<string, string>;
}

/**
 * Analyze data consistency across all recipes
 */
export function analyzeDataConsistency(
  recipes: Recipe[]
): DataConsistencyReport {
  return {
    ingredientIssues: analyzeIngredientConsistency(recipes),
    nutritionIssues: analyzeNutritionData(recipes),
    imageIssues: analyzeImageData(recipes),
    generalIssues: analyzeGeneralConsistency(recipes),
  };
}

/**
 * Generate suggestions for normalizing data
 */
export function generateNormalizationSuggestions(
  recipes: Recipe[]
): DataNormalizationSuggestions {
  return {
    ingredientMapping: generateIngredientMapping(recipes),
    cuisineMapping: generateCuisineMapping(recipes),
    categoryMapping: generateCategoryMapping(recipes),
    imageUrlFixes: generateImageUrlFixes(recipes),
  };
}

/**
 * Apply normalization to recipes
 */
export function normalizeRecipeData(
  recipes: Recipe[],
  suggestions: DataNormalizationSuggestions
): Recipe[] {
  return recipes.map((recipe) => {
    const normalizedRecipe = { ...recipe };

    // Normalize cuisine
    if (suggestions.cuisineMapping[recipe.cuisine]) {
      normalizedRecipe.cuisine = suggestions.cuisineMapping[recipe.cuisine];
    }

    // Normalize ingredients
    normalizedRecipe.ingredients = recipe.ingredients.map((ingredient) => {
      const normalizedName =
        suggestions.ingredientMapping[ingredient.name] || ingredient.name;
      const normalizedCategory =
        suggestions.categoryMapping[ingredient.category] || ingredient.category;

      return {
        ...ingredient,
        name: normalizedName,
        category: normalizedCategory as
          | "protein"
          | "vegetable"
          | "grain"
          | "dairy"
          | "spice"
          | "other",
      };
    });

    // Fix image URLs
    if (suggestions.imageUrlFixes[recipe.image]) {
      normalizedRecipe.image = suggestions.imageUrlFixes[recipe.image];
    }

    return normalizedRecipe;
  });
}

/**
 * Validate individual recipe data
 */
export function validateRecipe(recipe: Recipe): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!recipe.id) errors.push("Missing recipe ID");
  if (!recipe.name) errors.push("Missing recipe name");
  if (!recipe.cuisine) errors.push("Missing cuisine");
  if (!recipe.ingredients || recipe.ingredients.length === 0) {
    errors.push("Missing ingredients");
  }
  if (!recipe.instructions || recipe.instructions.length === 0) {
    errors.push("Missing instructions");
  }

  // Data validation
  if (recipe.prepTime < 0) errors.push("Prep time cannot be negative");
  if (recipe.cookTime < 0) errors.push("Cook time cannot be negative");
  if (recipe.servings <= 0) errors.push("Servings must be positive");
  if (recipe.rating < 0 || recipe.rating > 5)
    errors.push("Rating must be between 0 and 5");

  // Nutrition validation
  if (recipe.nutrition) {
    if (recipe.nutrition.calories < 0)
      errors.push("Calories cannot be negative");
    if (recipe.nutrition.protein < 0) errors.push("Protein cannot be negative");
    if (recipe.nutrition.carbs < 0) errors.push("Carbs cannot be negative");
    if (recipe.nutrition.fat < 0) errors.push("Fat cannot be negative");

    // Warnings for suspicious values
    if (recipe.nutrition.calories > 2000) {
      warnings.push("Very high calorie count - please verify");
    }
    if (recipe.nutrition.protein > 100) {
      warnings.push("Very high protein content - please verify");
    }
    if (recipe.nutrition.sodium > 2000) {
      warnings.push("Very high sodium content - please verify");
    }
  }

  // Image validation
  if (recipe.image && !isValidImageUrl(recipe.image)) {
    warnings.push("Invalid or suspicious image URL");
  }

  // Ingredient validation
  recipe.ingredients.forEach((ingredient, index) => {
    if (!ingredient.name) {
      errors.push(`Ingredient ${index + 1} missing name`);
    }
    if (!ingredient.amount) {
      errors.push(`Ingredient ${index + 1} missing amount`);
    }
    if (!ingredient.category) {
      warnings.push(`Ingredient ${index + 1} missing category`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// Helper functions for analysis
function analyzeIngredientConsistency(recipes: Recipe[]) {
  const ingredientVariations = new Map<string, Set<string>>();
  const categoryMismatches = new Map<string, Set<string>>();

  recipes.forEach((recipe) => {
    recipe.ingredients.forEach((ingredient) => {
      const normalizedName = normalizeIngredientName(ingredient.name);

      if (!ingredientVariations.has(normalizedName)) {
        ingredientVariations.set(normalizedName, new Set());
      }
      ingredientVariations.get(normalizedName)!.add(ingredient.name);

      if (!categoryMismatches.has(ingredient.name)) {
        categoryMismatches.set(ingredient.name, new Set());
      }
      categoryMismatches.get(ingredient.name)!.add(ingredient.category);
    });
  });

  const inconsistentNames = Array.from(ingredientVariations.entries())
    .filter(([_, variations]) => variations.size > 1)
    .map(([base, variations]) => ({
      variations: Array.from(variations),
      suggested: getMostCommonVariation(Array.from(variations)),
    }));

  const missingCategories: { ingredient: string; recipes: string[] }[] = [];
  const unusualCategories: {
    ingredient: string;
    category: string;
    recipes: string[];
  }[] = [];

  return {
    inconsistentNames,
    missingCategories,
    unusualCategories,
  };
}

function analyzeNutritionData(recipes: Recipe[]) {
  const missingNutrition = recipes
    .filter((recipe) => !recipe.nutrition)
    .map((recipe) => recipe.name);

  const suspiciousValues: {
    recipe: string;
    field: string;
    value: number;
    reason: string;
  }[] = [];

  recipes.forEach((recipe) => {
    if (recipe.nutrition) {
      const nutrition = recipe.nutrition;

      // Check for unrealistic values
      if (nutrition.calories > 2000) {
        suspiciousValues.push({
          recipe: recipe.name,
          field: "calories",
          value: nutrition.calories,
          reason: "Unusually high calorie count",
        });
      }

      if (nutrition.protein > 100) {
        suspiciousValues.push({
          recipe: recipe.name,
          field: "protein",
          value: nutrition.protein,
          reason: "Unusually high protein content",
        });
      }

      if (nutrition.sodium > 3000) {
        suspiciousValues.push({
          recipe: recipe.name,
          field: "sodium",
          value: nutrition.sodium,
          reason: "Unusually high sodium content",
        });
      }

      // Check for impossible combinations
      const totalCaloricValue =
        nutrition.protein * 4 + nutrition.carbs * 4 + nutrition.fat * 9;
      if (
        Math.abs(totalCaloricValue - nutrition.calories) >
        nutrition.calories * 0.3
      ) {
        suspiciousValues.push({
          recipe: recipe.name,
          field: "calories",
          value: nutrition.calories,
          reason: "Macronutrient breakdown doesn't match calorie count",
        });
      }
    }
  });

  return {
    missingNutrition,
    suspiciousValues,
  };
}

function analyzeImageData(recipes: Recipe[]) {
  const invalidUrls = recipes
    .filter((recipe) => recipe.image && !isValidImageUrl(recipe.image))
    .map((recipe) => recipe.name);

  const missingImages = recipes
    .filter((recipe) => !recipe.image)
    .map((recipe) => recipe.name);

  return {
    invalidUrls,
    missingImages,
  };
}

function analyzeGeneralConsistency(recipes: Recipe[]) {
  const idCounts = new Map<string, number>();
  recipes.forEach((recipe) => {
    idCounts.set(recipe.id, (idCounts.get(recipe.id) || 0) + 1);
  });

  const duplicateIds = Array.from(idCounts.entries())
    .filter(([_, count]) => count > 1)
    .map(([id]) => id);

  const missingFields = recipes
    .map((recipe) => ({
      recipe: recipe.name,
      fields: getMissingFields(recipe),
    }))
    .filter((item) => item.fields.length > 0);

  const cuisineVariations = groupSimilarStrings(recipes.map((r) => r.cuisine));
  const inconsistentCuisines = cuisineVariations
    .filter((group) => group.variations.length > 1)
    .map((group) => ({
      variations: group.variations,
      suggested: getMostCommonVariation(group.variations),
    }));

  return {
    duplicateIds,
    missingFields,
    inconsistentCuisines,
  };
}

function generateIngredientMapping(recipes: Recipe[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  const ingredientGroups = new Map<string, string[]>();

  recipes.forEach((recipe) => {
    recipe.ingredients.forEach((ingredient) => {
      const normalized = normalizeIngredientName(ingredient.name);
      if (!ingredientGroups.has(normalized)) {
        ingredientGroups.set(normalized, []);
      }
      ingredientGroups.get(normalized)!.push(ingredient.name);
    });
  });

  ingredientGroups.forEach((variations, base) => {
    if (variations.length > 1) {
      const canonical = getMostCommonVariation(variations);
      variations.forEach((variation) => {
        if (variation !== canonical) {
          mapping[variation] = canonical;
        }
      });
    }
  });

  return mapping;
}

function generateCuisineMapping(recipes: Recipe[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  const cuisineGroups = groupSimilarStrings(recipes.map((r) => r.cuisine));

  cuisineGroups.forEach((group) => {
    if (group.variations.length > 1) {
      const canonical = getMostCommonVariation(group.variations);
      group.variations.forEach((variation) => {
        if (variation !== canonical) {
          mapping[variation] = canonical;
        }
      });
    }
  });

  return mapping;
}

function generateCategoryMapping(recipes: Recipe[]): Record<string, string> {
  const mapping: Record<string, string> = {};

  // Define standard category mappings
  const standardCategories = {
    proteins: "protein",
    vegetables: "vegetable",
    grains: "grain",
    "dairy products": "dairy",
    spices: "spice",
    herbs: "spice",
    seasonings: "spice",
    condiments: "other",
    oils: "other",
  };

  Object.entries(standardCategories).forEach(([variant, standard]) => {
    mapping[variant] = standard;
  });

  return mapping;
}

function generateImageUrlFixes(recipes: Recipe[]): Record<string, string> {
  const fixes: Record<string, string> = {};

  recipes.forEach((recipe) => {
    if (recipe.image) {
      // Fix common URL issues
      let fixedUrl = recipe.image;

      // Ensure HTTPS
      if (fixedUrl.startsWith("http://")) {
        fixedUrl = fixedUrl.replace("http://", "https://");
      }

      // Add default Unsplash parameters if missing
      if (
        fixedUrl.includes("unsplash.com") &&
        !fixedUrl.includes("w=") &&
        !fixedUrl.includes("h=")
      ) {
        fixedUrl += fixedUrl.includes("?")
          ? "&w=400&h=300&fit=crop"
          : "?w=400&h=300&fit=crop";
      }

      if (fixedUrl !== recipe.image) {
        fixes[recipe.image] = fixedUrl;
      }
    }
  });

  return fixes;
}

// Utility functions
function normalizeIngredientName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isValidImageUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return (
      parsedUrl.protocol === "https:" &&
      (parsedUrl.hostname.includes("unsplash.com") ||
        parsedUrl.hostname.includes("images.") ||
        url.match(/\.(jpg|jpeg|png|webp)(\?|$)/i) !== null)
    );
  } catch {
    return false;
  }
}

function getMostCommonVariation(variations: string[]): string {
  const counts = variations.reduce((acc, variation) => {
    acc[variation] = (acc[variation] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(counts).sort(([, a], [, b]) => b - a)[0][0];
}

function groupSimilarStrings(strings: string[]): { variations: string[] }[] {
  const groups: Map<string, string[]> = new Map();

  strings.forEach((str) => {
    const normalized = str.toLowerCase().trim();
    if (!groups.has(normalized)) {
      groups.set(normalized, []);
    }
    groups.get(normalized)!.push(str);
  });

  return Array.from(groups.values()).map((variations) => ({
    variations: [...new Set(variations)],
  }));
}

function getMissingFields(recipe: Recipe): string[] {
  const missing: string[] = [];

  if (!recipe.description) missing.push("description");
  if (!recipe.image) missing.push("image");
  if (recipe.tags.length === 0) missing.push("tags");
  if (!recipe.nutrition) missing.push("nutrition");
  if (recipe.instructions.length === 0) missing.push("instructions");

  return missing;
}
