import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

export interface FilterOptions {
  difficulty: string[];
  mealType: string[];
  prepTime: { min: number; max: number } | null;
  cuisines: string[];
  dietary: string[];
}

interface SearchFiltersProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterOptions) => void;
  availableCuisines: string[];
}

const difficultyOptions = ['easy', 'medium', 'hard'];
const mealTypeOptions = ['breakfast', 'lunch', 'dinner'];
const dietaryOptions = ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'low-carb', 'keto'];
const prepTimeRanges = [
  { label: 'Under 15 min', min: 0, max: 15 },
  { label: '15-30 min', min: 15, max: 30 },
  { label: '30-60 min', min: 30, max: 60 },
  { label: 'Over 60 min', min: 60, max: 999 },
];

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  visible,
  onClose,
  onApply,
  availableCuisines,
}) => {
  const [selectedDifficulty, setSelectedDifficulty] = useState<string[]>([]);
  const [selectedMealTypes, setSelectedMealTypes] = useState<string[]>([]);
  const [selectedPrepTime, setSelectedPrepTime] = useState<{ min: number; max: number } | null>(null);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);

  const toggleSelection = (item: string, selected: string[], setSelected: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (selected.includes(item)) {
      setSelected(selected.filter(i => i !== item));
    } else {
      setSelected([...selected, item]);
    }
  };

  const handleApply = () => {
    onApply({
      difficulty: selectedDifficulty,
      mealType: selectedMealTypes,
      prepTime: selectedPrepTime,
      cuisines: selectedCuisines,
      dietary: selectedDietary,
    });
    onClose();
  };

  const handleReset = () => {
    setSelectedDifficulty([]);
    setSelectedMealTypes([]);
    setSelectedPrepTime(null);
    setSelectedCuisines([]);
    setSelectedDietary([]);
  };

  const hasActiveFilters = 
    selectedDifficulty.length > 0 ||
    selectedMealTypes.length > 0 ||
    selectedPrepTime !== null ||
    selectedCuisines.length > 0 ||
    selectedDietary.length > 0;

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
            <Text className="text-xl font-bold text-text">Filters</Text>
            <View className="flex-row gap-4">
              {hasActiveFilters && (
                <TouchableOpacity onPress={handleReset}>
                  <Text className="text-primary font-semibold">Reset</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView className="p-5" showsVerticalScrollIndicator={false}>
            {/* Difficulty Filter */}
            <View className="mb-6">
              <Text className="text-base font-semibold text-text mb-3">Difficulty</Text>
              <View className="flex-row flex-wrap gap-2">
                {difficultyOptions.map(option => (
                  <TouchableOpacity
                    key={option}
                    className={`px-4 py-2 rounded-full border ${
                      selectedDifficulty.includes(option)
                        ? 'bg-primary border-primary'
                        : 'bg-white border-gray-300'
                    }`}
                    onPress={() => toggleSelection(option, selectedDifficulty, setSelectedDifficulty)}
                  >
                    <Text
                      className={`capitalize ${
                        selectedDifficulty.includes(option) ? 'text-white' : 'text-text'
                      }`}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Meal Type Filter */}
            <View className="mb-6">
              <Text className="text-base font-semibold text-text mb-3">Meal Type</Text>
              <View className="flex-row flex-wrap gap-2">
                {mealTypeOptions.map(option => (
                  <TouchableOpacity
                    key={option}
                    className={`px-4 py-2 rounded-full border ${
                      selectedMealTypes.includes(option)
                        ? 'bg-primary border-primary'
                        : 'bg-white border-gray-300'
                    }`}
                    onPress={() => toggleSelection(option, selectedMealTypes, setSelectedMealTypes)}
                  >
                    <Text
                      className={`capitalize ${
                        selectedMealTypes.includes(option) ? 'text-white' : 'text-text'
                      }`}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Prep Time Filter */}
            <View className="mb-6">
              <Text className="text-base font-semibold text-text mb-3">Prep Time</Text>
              <View className="flex-row flex-wrap gap-2">
                {prepTimeRanges.map(range => (
                  <TouchableOpacity
                    key={range.label}
                    className={`px-4 py-2 rounded-full border ${
                      selectedPrepTime?.min === range.min && selectedPrepTime?.max === range.max
                        ? 'bg-primary border-primary'
                        : 'bg-white border-gray-300'
                    }`}
                    onPress={() => setSelectedPrepTime(
                      selectedPrepTime?.min === range.min && selectedPrepTime?.max === range.max
                        ? null
                        : { min: range.min, max: range.max }
                    )}
                  >
                    <Text
                      className={
                        selectedPrepTime?.min === range.min && selectedPrepTime?.max === range.max
                          ? 'text-white'
                          : 'text-text'
                      }
                    >
                      {range.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Dietary Preferences */}
            <View className="mb-6">
              <Text className="text-base font-semibold text-text mb-3">Dietary</Text>
              <View className="flex-row flex-wrap gap-2">
                {dietaryOptions.map(option => (
                  <TouchableOpacity
                    key={option}
                    className={`px-4 py-2 rounded-full border ${
                      selectedDietary.includes(option)
                        ? 'bg-primary border-primary'
                        : 'bg-white border-gray-300'
                    }`}
                    onPress={() => toggleSelection(option, selectedDietary, setSelectedDietary)}
                  >
                    <Text
                      className={`capitalize ${
                        selectedDietary.includes(option) ? 'text-white' : 'text-text'
                      }`}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Cuisines Filter */}
            {availableCuisines.length > 0 && (
              <View className="mb-6">
                <Text className="text-base font-semibold text-text mb-3">Cuisines</Text>
                <View className="flex-row flex-wrap gap-2">
                  {availableCuisines.slice(0, 10).map(cuisine => (
                    <TouchableOpacity
                      key={cuisine}
                      className={`px-4 py-2 rounded-full border ${
                        selectedCuisines.includes(cuisine)
                          ? 'bg-primary border-primary'
                          : 'bg-white border-gray-300'
                      }`}
                      onPress={() => toggleSelection(cuisine, selectedCuisines, setSelectedCuisines)}
                    >
                      <Text
                        className={
                          selectedCuisines.includes(cuisine) ? 'text-white' : 'text-text'
                        }
                      >
                        {cuisine}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Apply Button */}
            <TouchableOpacity
              className="bg-primary rounded-xl py-4 mb-4"
              onPress={handleApply}
            >
              <Text className="text-white text-center font-semibold text-base">
                Apply Filters {hasActiveFilters && `(${
                  selectedDifficulty.length +
                  selectedMealTypes.length +
                  (selectedPrepTime ? 1 : 0) +
                  selectedCuisines.length +
                  selectedDietary.length
                })`}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};