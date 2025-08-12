export interface Ingredient {
  name: string;
  amount: string;
  category: 'protein' | 'vegetable' | 'grain' | 'dairy' | 'spice' | 'other';
}

export interface Nutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
}

export interface Recipe {
  id: string;
  name: string;
  cuisine: string;
  mealType: ('breakfast' | 'lunch' | 'dinner')[];
  image: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  ingredients: Ingredient[];
  instructions: string[];
  nutrition: Nutrition;
  tags: string[];
  rating: number;
  reviews: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  recipeCount: number;
}

export interface RecipeData {
  recipes: Recipe[];
  categories: Category[];
}