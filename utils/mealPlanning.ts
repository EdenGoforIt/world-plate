import { Recipe } from "../types/Recipe";

export interface MealPlan {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  meals: DayMeal[];
  shoppingList: ShoppingListItem[];
  totalNutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
}

export interface DayMeal {
  date: string;
  breakfast?: Recipe;
  lunch?: Recipe;
  dinner?: Recipe;
  snacks?: Recipe[];
}

export interface ShoppingListItem {
  ingredient: string;
  totalAmount: string;
  category: string;
  recipes: string[]; // Recipe names that use this ingredient
}

export interface RecipeCollection {
  id: string;
  name: string;
  description?: string;
  theme: string;
  recipes: Recipe[];
  tags: string[];
  createdDate: string;
}

/**
 * Generate a weekly meal plan
 */
export function generateWeeklyMealPlan(
  recipes: Recipe[],
  preferences: {
    cuisines?: string[];
    maxPrepTime?: number;
    difficulty?: "easy" | "medium" | "hard";
    dietaryRestrictions?: string[];
    servingsNeeded?: number;
  },
  startDate: string
): MealPlan {
  const filteredRecipes = filterRecipesForMealPlan(recipes, preferences);
  const days = 7;
  const meals: DayMeal[] = [];
  const usedRecipes = new Set<string>();

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateString = date.toISOString().split("T")[0];

    const dayMeal: DayMeal = {
      date: dateString,
    };

    // Select breakfast
    const breakfastOptions = filteredRecipes.filter(
      (r) => r.mealType.includes("breakfast") && !usedRecipes.has(r.id)
    );
    if (breakfastOptions.length > 0) {
      const breakfast = selectRandomRecipe(breakfastOptions);
      dayMeal.breakfast = breakfast;
      usedRecipes.add(breakfast.id);
    }

    // Select lunch
    const lunchOptions = filteredRecipes.filter(
      (r) => r.mealType.includes("lunch") && !usedRecipes.has(r.id)
    );
    if (lunchOptions.length > 0) {
      const lunch = selectRandomRecipe(lunchOptions);
      dayMeal.lunch = lunch;
      usedRecipes.add(lunch.id);
    }

    // Select dinner
    const dinnerOptions = filteredRecipes.filter(
      (r) => r.mealType.includes("dinner") && !usedRecipes.has(r.id)
    );
    if (dinnerOptions.length > 0) {
      const dinner = selectRandomRecipe(dinnerOptions);
      dayMeal.dinner = dinner;
      usedRecipes.add(dinner.id);
    }

    meals.push(dayMeal);
  }

  const allMealRecipes = meals
    .flatMap((meal) => [
      meal.breakfast,
      meal.lunch,
      meal.dinner,
      ...(meal.snacks || []),
    ])
    .filter(Boolean) as Recipe[];

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + days - 1);

  return {
    id: generateId(),
    name: `Weekly Meal Plan - ${new Date(startDate).toLocaleDateString()}`,
    startDate,
    endDate: endDate.toISOString().split("T")[0],
    meals,
    shoppingList: generateShoppingList(allMealRecipes),
    totalNutrition: calculateTotalNutrition(allMealRecipes),
  };
}

/**
 * Generate shopping list from recipes
 */
export function generateShoppingList(recipes: Recipe[]): ShoppingListItem[] {
  const ingredientMap = new Map<
    string,
    {
      amounts: string[];
      category: string;
      recipes: Set<string>;
    }
  >();

  recipes.forEach((recipe) => {
    recipe.ingredients.forEach((ingredient) => {
      const key = ingredient.name.toLowerCase();
      const existing = ingredientMap.get(key) || {
        amounts: [],
        category: ingredient.category,
        recipes: new Set(),
      };

      existing.amounts.push(ingredient.amount);
      existing.recipes.add(recipe.name);
      ingredientMap.set(key, existing);
    });
  });

  return Array.from(ingredientMap.entries())
    .map(([ingredient, data]) => ({
      ingredient: ingredient.charAt(0).toUpperCase() + ingredient.slice(1),
      totalAmount: consolidateAmounts(data.amounts),
      category: data.category,
      recipes: Array.from(data.recipes),
    }))
    .sort(
      (a, b) =>
        a.category.localeCompare(b.category) ||
        a.ingredient.localeCompare(b.ingredient)
    );
}

/**
 * Create a recipe collection
 */
export function createRecipeCollection(
  name: string,
  recipes: Recipe[],
  theme: string,
  description?: string,
  tags: string[] = []
): RecipeCollection {
  return {
    id: generateId(),
    name,
    description,
    theme,
    recipes,
    tags,
    createdDate: new Date().toISOString().split("T")[0],
  };
}

/**
 * Get pre-defined recipe collections
 */
export function getThematicCollections(recipes: Recipe[]): RecipeCollection[] {
  return [
    createRecipeCollection(
      "Quick & Easy",
      recipes.filter(
        (r) => r.prepTime + r.cookTime <= 30 && r.difficulty === "easy"
      ),
      "convenience",
      "Fast recipes for busy weeknights",
      ["quick", "easy", "weeknight"]
    ),
    createRecipeCollection(
      "Comfort Food",
      recipes.filter((r) =>
        r.tags.some((tag) =>
          ["comfort", "hearty", "warming", "traditional"].includes(
            tag.toLowerCase()
          )
        )
      ),
      "comfort",
      "Soul-warming dishes for cozy nights",
      ["comfort", "hearty", "traditional"]
    ),
    createRecipeCollection(
      "Healthy Options",
      recipes.filter(
        (r) => r.nutrition.calories < 400 && r.nutrition.fiber > 3
      ),
      "health",
      "Nutritious and balanced meals",
      ["healthy", "nutritious", "balanced"]
    ),
    createRecipeCollection(
      "Weekend Projects",
      recipes.filter(
        (r) => r.difficulty === "hard" || r.prepTime + r.cookTime > 120
      ),
      "challenge",
      "Ambitious recipes for when you have time",
      ["challenge", "weekend", "advanced"]
    ),
    createRecipeCollection(
      "Vegetarian Favorites",
      recipes.filter((r) => isVegetarianFriendly(r)),
      "vegetarian",
      "Delicious plant-based options",
      ["vegetarian", "plant-based"]
    ),
    createRecipeCollection(
      "International Flavors",
      getInternationalSelection(recipes),
      "international",
      "A world tour of cuisines",
      ["international", "diverse", "cultural"]
    ),
  ].filter((collection) => collection.recipes.length > 0);
}

/**
 * Generate meal prep suggestions
 */
export function generateMealPrepSuggestions(recipes: Recipe[]): {
  batchCooking: Recipe[];
  freezerFriendly: Recipe[];
  makeAhead: Recipe[];
  lunchBoxes: Recipe[];
} {
  return {
    batchCooking: recipes
      .filter(
        (r) =>
          r.servings >= 6 &&
          ["soup", "stew", "curry", "casserole"].some(
            (type) =>
              r.name.toLowerCase().includes(type) || r.tags.includes(type)
          )
      )
      .slice(0, 10),
    freezerFriendly: recipes
      .filter((r) =>
        ["soup", "sauce", "bread", "muffin"].some(
          (type) => r.name.toLowerCase().includes(type) || r.tags.includes(type)
        )
      )
      .slice(0, 10),
    makeAhead: recipes
      .filter(
        (r) =>
          r.tags.includes("make-ahead") ||
          ["marinate", "overnight", "slow", "crock"].some((keyword) =>
            r.instructions.some((instruction) =>
              instruction.toLowerCase().includes(keyword)
            )
          )
      )
      .slice(0, 10),
    lunchBoxes: recipes
      .filter(
        (r) =>
          r.mealType.includes("lunch") &&
          r.prepTime + r.cookTime <= 30 &&
          !r.instructions.some((inst) =>
            inst.toLowerCase().includes("serve hot")
          )
      )
      .slice(0, 10),
  };
}

/**
 * Calculate nutritional balance for a meal plan
 */
export function analyzeMealPlanBalance(mealPlan: MealPlan): {
  dailyAverages: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  recommendations: string[];
  balance: "excellent" | "good" | "needs-improvement";
} {
  const dailyTotals = mealPlan.meals.map((day) => {
    const dayRecipes = [
      day.breakfast,
      day.lunch,
      day.dinner,
      ...(day.snacks || []),
    ].filter(Boolean) as Recipe[];

    return calculateTotalNutrition(dayRecipes);
  });

  const avgCalories = average(dailyTotals.map((d) => d.calories));
  const avgProtein = average(dailyTotals.map((d) => d.protein));
  const avgCarbs = average(dailyTotals.map((d) => d.carbs));
  const avgFat = average(dailyTotals.map((d) => d.fat));
  const avgFiber = average(dailyTotals.map((d) => d.fiber));

  const recommendations: string[] = [];
  let balance: "excellent" | "good" | "needs-improvement" = "excellent";

  // Analyze balance and provide recommendations
  if (avgCalories < 1800) {
    recommendations.push(
      "Consider adding more calories through healthy snacks or larger portions"
    );
    balance = "needs-improvement";
  } else if (avgCalories > 2500) {
    recommendations.push(
      "Consider reducing portion sizes or choosing lower-calorie options"
    );
    balance = "needs-improvement";
  }

  if (avgProtein < 50) {
    recommendations.push(
      "Add more protein sources like lean meats, legumes, or dairy"
    );
    balance = balance === "excellent" ? "good" : "needs-improvement";
  }

  if (avgFiber < 25) {
    recommendations.push(
      "Include more fiber-rich foods like vegetables, fruits, and whole grains"
    );
    balance = balance === "excellent" ? "good" : "needs-improvement";
  }

  const proteinPercentage = ((avgProtein * 4) / avgCalories) * 100;
  const carbPercentage = ((avgCarbs * 4) / avgCalories) * 100;
  const fatPercentage = ((avgFat * 9) / avgCalories) * 100;

  if (proteinPercentage < 15 || proteinPercentage > 35) {
    recommendations.push("Adjust protein intake to 15-35% of total calories");
    balance = balance === "excellent" ? "good" : "needs-improvement";
  }

  if (carbPercentage < 45 || carbPercentage > 65) {
    recommendations.push(
      "Adjust carbohydrate intake to 45-65% of total calories"
    );
    balance = balance === "excellent" ? "good" : "needs-improvement";
  }

  if (fatPercentage < 20 || fatPercentage > 35) {
    recommendations.push("Adjust fat intake to 20-35% of total calories");
    balance = balance === "excellent" ? "good" : "needs-improvement";
  }

  if (recommendations.length === 0) {
    recommendations.push(
      "Great balance! Your meal plan looks nutritionally well-rounded."
    );
  }

  return {
    dailyAverages: {
      calories: avgCalories,
      protein: avgProtein,
      carbs: avgCarbs,
      fat: avgFat,
      fiber: avgFiber,
    },
    recommendations,
    balance,
  };
}

// Helper functions
function filterRecipesForMealPlan(
  recipes: Recipe[],
  preferences: any
): Recipe[] {
  let filtered = recipes;

  if (preferences.cuisines && preferences.cuisines.length > 0) {
    filtered = filtered.filter((r) => preferences.cuisines.includes(r.cuisine));
  }

  if (preferences.maxPrepTime) {
    filtered = filtered.filter((r) => r.prepTime <= preferences.maxPrepTime);
  }

  if (preferences.difficulty) {
    filtered = filtered.filter((r) => r.difficulty === preferences.difficulty);
  }

  return filtered;
}

function selectRandomRecipe(recipes: Recipe[]): Recipe {
  const randomIndex = Math.floor(Math.random() * recipes.length);
  return recipes[randomIndex];
}

function consolidateAmounts(amounts: string[]): string {
  // Simple consolidation - in a real app, you'd parse and sum quantities
  if (amounts.length === 1) return amounts[0];

  // Try to detect if all amounts are similar
  const uniqueAmounts = [...new Set(amounts)];
  if (uniqueAmounts.length === 1) {
    return `${amounts.length}x ${uniqueAmounts[0]}`;
  }

  return amounts.join(" + ");
}

function calculateTotalNutrition(recipes: Recipe[]) {
  return recipes.reduce(
    (total, recipe) => ({
      calories: total.calories + recipe.nutrition.calories,
      protein: total.protein + recipe.nutrition.protein,
      carbs: total.carbs + recipe.nutrition.carbs,
      fat: total.fat + recipe.nutrition.fat,
      fiber: total.fiber + recipe.nutrition.fiber,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );
}

function isVegetarianFriendly(recipe: Recipe): boolean {
  const meatKeywords = [
    "chicken",
    "beef",
    "pork",
    "fish",
    "seafood",
    "meat",
    "bacon",
  ];
  return !recipe.ingredients.some((ing) =>
    meatKeywords.some((keyword) => ing.name.toLowerCase().includes(keyword))
  );
}

function getInternationalSelection(recipes: Recipe[]): Recipe[] {
  const cuisines = [...new Set(recipes.map((r) => r.cuisine))];
  return cuisines.flatMap((cuisine) => {
    const cuisineRecipes = recipes.filter((r) => r.cuisine === cuisine);
    return cuisineRecipes.slice(0, 2); // Take 2 recipes from each cuisine
  });
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function average(numbers: number[]): number {
  return numbers.length === 0
    ? 0
    : numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}
