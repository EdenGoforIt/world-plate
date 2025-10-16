import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Pressable,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useMealPlan } from '@/hooks/useMealPlan';
import { Recipe } from '@/types/Recipe';

interface MealPlanModalProps {
  visible: boolean;
  onClose: () => void;
  recipe: Recipe;
}

export const MealPlanModal: React.FC<MealPlanModalProps> = ({
  visible,
  onClose,
  recipe
}) => {
  const { addMealToDate, getCurrentWeekStart, getWeekMealPlan } = useMealPlan();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | ''>('');

  const weekStart = getCurrentWeekStart();
  const weekMealPlan = getWeekMealPlan(weekStart);
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const handleAddToMealPlan = async () => {
    if (!selectedDate || !selectedMealType) {
      Alert.alert('Error', 'Please select a date and meal type');
      return;
    }

    try {
      await addMealToDate(selectedDate, selectedMealType, recipe);
      Alert.alert('Success', `Added ${recipe.name} to your meal plan`);
      onClose();
      setSelectedDate('');
      setSelectedMealType('');
    } catch (error) {
      Alert.alert('Error', 'Failed to add to meal plan');
    }
  };

  const getNextWeekDates = () => {
    const nextWeekStart = new Date(weekStart);
    nextWeekStart.setDate(nextWeekStart.getDate() + 7);
    return getWeekMealPlan(nextWeekStart.toISOString().split('T')[0]);
  };

  const renderWeek = (weekData: any[], weekLabel: string, weekStartDate: string) => {
    return (
      <View className="mb-6">
        <Text className="text-base font-semibold text-text mb-3">{weekLabel}</Text>
        {weekData.map((dayPlan, index) => {
          const date = new Date(dayPlan.date);
          const isToday = dayPlan.date === new Date().toISOString().split('T')[0];
          
          return (
            <View key={dayPlan.date} className="mb-3">
              <View className="flex-row items-center mb-2">
                <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                  isToday ? 'bg-primary' : 'bg-gray-100'
                }`}>
                  <Text className={`text-xs font-semibold ${
                    isToday ? 'text-white' : 'text-text'
                  }`}>
                    {weekDays[index]}
                  </Text>
                  <Text className={`text-xs ${
                    isToday ? 'text-white' : 'text-text opacity-60'
                  }`}>
                    {date.getDate()}
                  </Text>
                </View>
                <Text className="text-sm font-medium text-text">
                  {date.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                  })}
                </Text>
              </View>
              
              <View className="flex-row gap-2 ml-13">
                {(['breakfast', 'lunch', 'dinner'] as const).map(mealType => {
                  const isSelected = selectedDate === dayPlan.date && selectedMealType === mealType;
                  const existingMeal = dayPlan[mealType];
                  
                  return (
                    <TouchableOpacity
                      key={mealType}
                      className={`flex-1 p-3 rounded-lg border ${
                        isSelected 
                          ? 'bg-primary border-primary' 
                          : existingMeal
                            ? 'bg-orange-50 border-orange-200'
                            : 'bg-gray-50 border-gray-200'
                      }`}
                      onPress={() => {
                        if (isSelected) {
                          setSelectedDate('');
                          setSelectedMealType('');
                        } else {
                          setSelectedDate(dayPlan.date);
                          setSelectedMealType(mealType);
                        }
                      }}
                    >
                      <Text className={`text-xs font-medium text-center capitalize ${
                        isSelected 
                          ? 'text-white' 
                          : existingMeal 
                            ? 'text-orange-600' 
                            : 'text-text'
                      }`}>
                        {mealType}
                      </Text>
                      {existingMeal && (
                        <View className="mt-1">
                          <Ionicons 
                            name="checkmark-circle" 
                            size={16} 
                            color={isSelected ? 'white' : '#ea580c'} 
                            style={{ alignSelf: 'center' }}
                          />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50">
        <Pressable className="flex-1" onPress={onClose} />
        
        <View className="bg-white rounded-t-3xl max-h-[80%]">
          <View className="flex-row justify-between items-center p-5 border-b border-gray-200">
            <Text className="text-xl font-bold text-text">Add to Meal Plan</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView className="p-5" showsVerticalScrollIndicator={false}>
            <View className="flex-row items-center bg-gray-50 rounded-xl p-3 mb-6">
              <View className="bg-primary/10 p-2 rounded-lg mr-3">
                <Ionicons name="restaurant" size={20} color={Colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-text">{recipe.name}</Text>
                <Text className="text-sm text-text opacity-60">
                  {recipe.cuisine} • {recipe.prepTime + recipe.cookTime} min
                </Text>
              </View>
            </View>

            <Text className="text-lg font-bold text-text mb-4">Select Date & Meal</Text>
            <Text className="text-sm text-text opacity-60 mb-4">
              Choose when you&apos;d like to cook this recipe. Items with a checkmark already have a meal planned.
            </Text>

            {renderWeek(weekMealPlan, 'This Week', weekStart)}
            {renderWeek(getNextWeekDates(), 'Next Week', '')}

            <TouchableOpacity
              className={`rounded-xl py-4 mb-4 ${
                selectedDate && selectedMealType 
                  ? 'bg-primary' 
                  : 'bg-gray-200'
              }`}
              onPress={handleAddToMealPlan}
              disabled={!selectedDate || !selectedMealType}
            >
              <Text className={`text-center font-semibold ${
                selectedDate && selectedMealType 
                  ? 'text-white' 
                  : 'text-gray-400'
              }`}>
                Add to Meal Plan
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};