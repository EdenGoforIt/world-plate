import { DayMealPlan, MealPlanEntry } from '@/types/MealPlan';
import { Recipe } from '@/types/Recipe';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

const MEAL_PLAN_KEY = 'meal_plan';

export const useMealPlan = () => {
  const [mealPlan, setMealPlan] = useState<MealPlanEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMealPlan();
  }, []);

  const loadMealPlan = async () => {
    try {
      const stored = await AsyncStorage.getItem(MEAL_PLAN_KEY);
      if (stored) {
        const entries = JSON.parse(stored).map((entry: any) => ({
          ...entry,
          addedAt: new Date(entry.addedAt)
        }));
        setMealPlan(entries);
      }
    } catch (error) {
      // Error loading meal plan
    } finally {
      setLoading(false);
    }
  };

  const saveMealPlan = async (entries: MealPlanEntry[]) => {
    try {
      await AsyncStorage.setItem(MEAL_PLAN_KEY, JSON.stringify(entries));
      setMealPlan(entries);
    } catch (error) {
      // Error saving meal plan
    }
  };

  const addMealToDate = async (
    date: string,
    mealType: 'breakfast' | 'lunch' | 'dinner',
    recipe: Recipe
  ) => {
    const newEntry: MealPlanEntry = {
      id: `${date}_${mealType}_${Date.now()}`,
      date,
      mealType,
      recipeId: recipe.id,
      recipeName: recipe.name,
      recipeImage: recipe.image,
      cuisine: recipe.cuisine,
      cookTime: recipe.cookTime + recipe.prepTime,
      servings: recipe.servings,
      addedAt: new Date()
    };

    // Remove existing entry for same date/mealType if it exists
    const filteredPlan = mealPlan.filter(
      entry => !(entry.date === date && entry.mealType === mealType)
    );

    const updatedPlan = [...filteredPlan, newEntry];
    await saveMealPlan(updatedPlan);
  };

  const removeMealFromDate = async (date: string, mealType: 'breakfast' | 'lunch' | 'dinner') => {
    const updatedPlan = mealPlan.filter(
      entry => !(entry.date === date && entry.mealType === mealType)
    );
    await saveMealPlan(updatedPlan);
  };

  const moveMeal = async (
    fromDate: string,
    fromMealType: 'breakfast' | 'lunch' | 'dinner',
    toDate: string,
    toMealType: 'breakfast' | 'lunch' | 'dinner'
  ) => {
    // Swap if target exists, otherwise move
    const updatedPlan = mealPlan.map((entry) => {
      if (entry.date === fromDate && entry.mealType === fromMealType) {
        return {
          ...entry,
          date: toDate,
          mealType: toMealType,
          id: `${toDate}_${toMealType}_${Date.now()}`,
        };
      }
      if (entry.date === toDate && entry.mealType === toMealType) {
        return {
          ...entry,
          date: fromDate,
          mealType: fromMealType,
          id: `${fromDate}_${fromMealType}_${Date.now() + 1}`,
        };
      }
      return entry;
    });

    await saveMealPlan(updatedPlan);
  };

  const getMealForDate = (
    date: string,
    mealType: 'breakfast' | 'lunch' | 'dinner'
  ): MealPlanEntry | undefined => {
    return mealPlan.find(entry => entry.date === date && entry.mealType === mealType);
  };

  const getDayMealPlan = (date: string): DayMealPlan => {
    return {
      date,
      breakfast: getMealForDate(date, 'breakfast'),
      lunch: getMealForDate(date, 'lunch'),
      dinner: getMealForDate(date, 'dinner')
    };
  };

  const getWeekMealPlan = (weekStart: string): DayMealPlan[] => {
    const days: DayMealPlan[] = [];
    const startDate = new Date(weekStart);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      days.push(getDayMealPlan(dateStr));
    }
    
    return days;
  };

  const clearMealPlan = async () => {
    await saveMealPlan([]);
  };

  const getUpcomingMeals = (days: number = 7): MealPlanEntry[] => {
    const today = new Date().toISOString().split('T')[0];
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);
    const endDateStr = endDate.toISOString().split('T')[0];

    return mealPlan
      .filter(entry => entry.date >= today && entry.date <= endDateStr)
      .sort((a, b) => {
        if (a.date === b.date) {
          const mealOrder = { breakfast: 0, lunch: 1, dinner: 2 };
          return mealOrder[a.mealType] - mealOrder[b.mealType];
        }
        return a.date.localeCompare(b.date);
      });
  };

  // Get current week's Monday
  const getCurrentWeekStart = (): string => {
    const today = new Date();
    const monday = new Date(today);
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Handle Sunday (0) case
    monday.setDate(today.getDate() + daysToMonday);
    return monday.toISOString().split('T')[0];
  };

  const getWeekStartForDate = (date: string): string => {
    const inputDate = new Date(date);
    const monday = new Date(inputDate);
    const dayOfWeek = inputDate.getDay();
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    monday.setDate(inputDate.getDate() + daysToMonday);
    return monday.toISOString().split('T')[0];
  };

  return {
    mealPlan,
    loading,
    addMealToDate,
    removeMealFromDate,
    moveMeal,
    getMealForDate,
    getDayMealPlan,
    getWeekMealPlan,
    clearMealPlan,
    getUpcomingMeals,
    getCurrentWeekStart,
    getWeekStartForDate,
    refreshMealPlan: loadMealPlan
  };
};