export interface MealPlanEntry {
  id: string;
  date: string; // YYYY-MM-DD format
  mealType: 'breakfast' | 'lunch' | 'dinner';
  recipeId: string;
  recipeName: string;
  recipeImage: string;
  cuisine: string;
  cookTime: number;
  servings: number;
  addedAt: Date;
}

export interface DayMealPlan {
  date: string;
  breakfast?: MealPlanEntry;
  lunch?: MealPlanEntry;
  dinner?: MealPlanEntry;
}

export interface WeeklyMealPlan {
  weekStart: string; // YYYY-MM-DD format (Monday)
  days: DayMealPlan[];
}