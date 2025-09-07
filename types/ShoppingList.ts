export interface ShoppingListItem {
  id: string;
  name: string;
  amount: string;
  category: 'protein' | 'vegetable' | 'grain' | 'dairy' | 'spice' | 'other';
  recipeId: string;
  recipeName: string;
  checked: boolean;
  addedAt: Date;
}

export interface ShoppingList {
  id: string;
  name: string;
  items: ShoppingListItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ShoppingListSummary {
  totalItems: number;
  checkedItems: number;
  recipeCount: number;
  categories: string[];
}