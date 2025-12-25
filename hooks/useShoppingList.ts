import { Recipe } from '@/types/Recipe';
import { ShoppingList, ShoppingListItem } from '@/types/ShoppingList';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

const SHOPPING_LIST_KEY = 'shopping_lists';

export const useShoppingList = () => {
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);

  // Load shopping lists from storage
  useEffect(() => {
    loadShoppingLists();
  }, []);

  const loadShoppingLists = async () => {
    try {
      const stored = await AsyncStorage.getItem(SHOPPING_LIST_KEY);
      if (stored) {
        const lists = JSON.parse(stored).map((list: any) => ({
          ...list,
          createdAt: new Date(list.createdAt),
          updatedAt: new Date(list.updatedAt),
          items: list.items.map((item: any) => ({
            ...item,
            addedAt: new Date(item.addedAt)
          }))
        }));
        setShoppingLists(lists);
      }
    } catch (error) {
      // Error loading shopping lists
    } finally {
      setLoading(false);
    }
  };

  const saveShoppingLists = async (lists: ShoppingList[]) => {
    try {
      await AsyncStorage.setItem(SHOPPING_LIST_KEY, JSON.stringify(lists));
      setShoppingLists(lists);
    } catch (error) {
      // Error saving shopping lists
    }
  };

  const createShoppingList = async (name: string): Promise<ShoppingList> => {
    const newList: ShoppingList = {
      id: Date.now().toString(),
      name,
      items: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const updatedLists = [...shoppingLists, newList];
    await saveShoppingLists(updatedLists);
    return newList;
  };

  const deleteShoppingList = async (listId: string) => {
    const updatedLists = shoppingLists.filter(list => list.id !== listId);
    await saveShoppingLists(updatedLists);
  };

  const addRecipeToShoppingList = async (listId: string, recipe: Recipe) => {
    const targetList = shoppingLists.find(list => list.id === listId);
    if (!targetList) return;

    // Merge incoming ingredients with existing items by name (case-insensitive)
    const itemsByName: Record<string, ShoppingListItem> = {};

    // seed with existing items
    for (const item of targetList.items) {
      itemsByName[item.name.toLowerCase()] = { ...item };
    }

    for (const ingredient of recipe.ingredients) {
      const key = ingredient.name.toLowerCase();
      const existing = itemsByName[key];

      if (existing) {
        // Try to add amounts if parseable
        try {
          // Lazy import to avoid circulars
          const { addAmounts } = await import('../utils/ingredientUtils');
          const merged = addAmounts(existing.amount || '', ingredient.amount || '');
          if (merged) {
            existing.amount = merged;
          } else if (!existing.amount && ingredient.amount) {
            existing.amount = ingredient.amount;
          } else if (!ingredient.amount && existing.amount) {
            // keep existing
          } else {
            // If we can't merge numerically, append recipe names to description
            existing.amount = existing.amount ? `${existing.amount}, ${ingredient.amount}` : ingredient.amount;
          }
          // Keep recipe references simple: mark as multi
          existing.recipeName = existing.recipeName === recipe.name ? existing.recipeName : 'Multiple';
        } catch (e) {
          // Fallback: add as separate item
          const newItem: ShoppingListItem = {
            id: `${recipe.id}_${ingredient.name}_${Date.now()}`,
            name: ingredient.name,
            amount: ingredient.amount,
            category: ingredient.category,
            recipeId: recipe.id,
            recipeName: recipe.name,
            checked: false,
            addedAt: new Date()
          };
          itemsByName[key + '_' + Date.now()] = newItem;
        }
      } else {
        // Add new
        itemsByName[key] = {
          id: `${recipe.id}_${ingredient.name}_${Date.now()}`,
          name: ingredient.name,
          amount: ingredient.amount,
          category: ingredient.category,
          recipeId: recipe.id,
          recipeName: recipe.name,
          checked: false,
          addedAt: new Date()
        };
      }
    }

    const mergedItems = Object.values(itemsByName);

    const updatedLists = shoppingLists.map(list =>
      list.id === listId
        ? {
            ...list,
            items: mergedItems,
            updatedAt: new Date()
          }
        : list
    );

    await saveShoppingLists(updatedLists);
  };

  const addCustomItemsToShoppingList = async (listId: string, customItems: { name: string; amount?: string; category?: string; }[]) => {
    const targetList = shoppingLists.find(list => list.id === listId);
    if (!targetList) return;

    const newItems: ShoppingListItem[] = customItems.map(ci => ({
      id: `${listId}_${ci.name}_${Date.now()}`,
      name: ci.name,
      amount: ci.amount || '',
      category: (ci.category as any) || 'other',
      recipeId: 'manual',
      recipeName: 'Manual',
      checked: false,
      addedAt: new Date()
    }));

    const updatedLists = shoppingLists.map(list =>
      list.id === listId
        ? { ...list, items: [...list.items, ...newItems], updatedAt: new Date() }
        : list
    );

    await saveShoppingLists(updatedLists);
  };

  const toggleItemChecked = async (listId: string, itemId: string) => {
    const updatedLists = shoppingLists.map(list =>
      list.id === listId
        ? {
            ...list,
            items: list.items.map(item =>
              item.id === itemId
                ? { ...item, checked: !item.checked }
                : item
            ),
            updatedAt: new Date()
          }
        : list
    );

    await saveShoppingLists(updatedLists);
  };

  const removeItem = async (listId: string, itemId: string) => {
    const updatedLists = shoppingLists.map(list =>
      list.id === listId
        ? {
            ...list,
            items: list.items.filter(item => item.id !== itemId),
            updatedAt: new Date()
          }
        : list
    );

    await saveShoppingLists(updatedLists);
  };

  const clearCheckedItems = async (listId: string) => {
    const updatedLists = shoppingLists.map(list =>
      list.id === listId
        ? {
            ...list,
            items: list.items.filter(item => !item.checked),
            updatedAt: new Date()
          }
        : list
    );

    await saveShoppingLists(updatedLists);
  };

  const getShoppingListById = (listId: string): ShoppingList | undefined => {
    return shoppingLists.find(list => list.id === listId);
  };

  return {
    shoppingLists,
    loading,
    createShoppingList,
    deleteShoppingList,
    addRecipeToShoppingList,
    addCustomItemsToShoppingList,
    toggleItemChecked,
    removeItem,
    clearCheckedItems,
    getShoppingListById,
    refreshShoppingLists: loadShoppingLists
  };
};