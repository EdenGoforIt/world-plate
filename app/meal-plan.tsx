import Loader from "@/components/ui/Loader";
import { Colors } from "@/constants/Colors";
import { useMealPlan } from "@/hooks/useMealPlan";
import { MealPlanEntry } from "@/types/MealPlan";
import { formatCookTime } from "@/utils/recipeUtils";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MealPlanScreen() {
  const {
    loading,
    getWeekMealPlan,
    getCurrentWeekStart,
    removeMealFromDate,
    getUpcomingMeals,
  } = useMealPlan();

  const [currentWeekStart, setCurrentWeekStart] = useState(
    getCurrentWeekStart()
  );

  if (loading) {
    return <Loader />;
  }

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weekMealPlan = getWeekMealPlan(currentWeekStart);
  const upcomingMeals = getUpcomingMeals(7);

  const navigateWeek = (direction: "prev" | "next") => {
    const currentDate = new Date(currentWeekStart);
    const days = direction === "prev" ? -7 : 7;
    currentDate.setDate(currentDate.getDate() + days);
    setCurrentWeekStart(currentDate.toISOString().split("T")[0]);
  };

  const goToToday = () => {
    setCurrentWeekStart(getCurrentWeekStart());
  };

  const formatWeekRange = (weekStart: string): string => {
    const start = new Date(weekStart);
    const end = new Date(weekStart);
    end.setDate(start.getDate() + 6);

    const startStr = start.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const endStr = end.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: start.getFullYear() !== end.getFullYear() ? "numeric" : undefined,
    });

    return `${startStr} - ${endStr}`;
  };

  const handleRemoveMeal = (
    date: string,
    mealType: "breakfast" | "lunch" | "dinner",
    mealName: string
  ) => {
    Alert.alert("Remove Meal", `Remove ${mealName} from ${mealType}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => removeMealFromDate(date, mealType),
      },
    ]);
  };

  const MealSlot = ({
    meal,
    mealType,
    date,
  }: {
    meal?: MealPlanEntry;
    mealType: "breakfast" | "lunch" | "dinner";
    date: string;
  }) => {
    if (meal) {
      return (
        <TouchableOpacity
          className="bg-white rounded-lg p-3 mb-2 shadow-sm"
          onPress={() => router.push(`/recipe/${meal.recipeId}`)}
          onLongPress={() => handleRemoveMeal(date, mealType, meal.recipeName)}
        >
          <View className="flex-row">
            <Image
              source={{ uri: meal.recipeImage }}
              className="w-12 h-12 rounded-lg mr-3"
            />
            <View className="flex-1">
              <Text
                className="text-sm font-semibold text-text"
                numberOfLines={2}
              >
                {meal.recipeName}
              </Text>
              <Text className="text-xs text-text opacity-60 mt-1">
                {meal.cuisine} • {formatCookTime(meal.cookTime)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-4 mb-2 items-center justify-center"
        onPress={() =>
          router.push(`/explore?mealType=${mealType}&date=${date}`)
        }
      >
        <Ionicons name="add" size={20} color={Colors.text + "60"} />
        <Text className="text-xs text-text opacity-60 mt-1 capitalize">
          {mealType}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View className="flex-row items-center justify-between p-5 pb-3">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-text">Meal Plan</Text>
        <TouchableOpacity onPress={goToToday}>
          <Text className="text-primary font-semibold">Today</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Week Navigation */}
        <View className="flex-row items-center justify-between px-5 py-3">
          <TouchableOpacity onPress={() => navigateWeek("prev")}>
            <Ionicons name="chevron-back" size={24} color={Colors.primary} />
          </TouchableOpacity>

          <Text className="text-lg font-semibold text-text">
            {formatWeekRange(currentWeekStart)}
          </Text>

          <TouchableOpacity onPress={() => navigateWeek("next")}>
            <Ionicons name="chevron-forward" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Calendar Grid */}
        <View className="px-5">
          <View className="bg-white rounded-2xl p-4 shadow-sm mb-6">
            {weekMealPlan.map((dayPlan, index) => {
              const date = new Date(dayPlan.date);
              const isToday =
                dayPlan.date === new Date().toISOString().split("T")[0];

              return (
                <View key={dayPlan.date}>
                  {/* Day Header */}
                  <View className="flex-row items-center mb-3">
                    <View
                      className={`w-12 h-12 rounded-full items-center justify-center mr-3 ${
                        isToday ? "bg-primary" : "bg-gray-100"
                      }`}
                    >
                      <Text
                        className={`text-xs font-semibold ${
                          isToday ? "text-white" : "text-text"
                        }`}
                      >
                        {weekDays[index]}
                      </Text>
                      <Text
                        className={`text-xs ${
                          isToday ? "text-white" : "text-text opacity-60"
                        }`}
                      >
                        {date.getDate()}
                      </Text>
                    </View>

                    <View className="flex-1 flex-row gap-2">
                      <View className="flex-1">
                        <MealSlot
                          meal={dayPlan.breakfast}
                          mealType="breakfast"
                          date={dayPlan.date}
                        />
                      </View>
                      <View className="flex-1">
                        <MealSlot
                          meal={dayPlan.lunch}
                          mealType="lunch"
                          date={dayPlan.date}
                        />
                      </View>
                      <View className="flex-1">
                        <MealSlot
                          meal={dayPlan.dinner}
                          mealType="dinner"
                          date={dayPlan.date}
                        />
                      </View>
                    </View>
                  </View>

                  {index < weekMealPlan.length - 1 && (
                    <View className="border-b border-gray-100 mb-3" />
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Upcoming Meals */}
        {upcomingMeals.length > 0 && (
          <View className="px-5 mb-6">
            <Text className="text-xl font-bold text-text mb-4">
              Upcoming Meals
            </Text>
            <View className="bg-white rounded-2xl p-4 shadow-sm">
              {upcomingMeals.map((meal) => {
                const date = new Date(meal.date);
                const isToday =
                  meal.date === new Date().toISOString().split("T")[0];

                return (
                  <TouchableOpacity
                    key={meal.id}
                    className="flex-row items-center py-3"
                    onPress={() => router.push(`/recipe/${meal.recipeId}`)}
                  >
                    <Image
                      source={{ uri: meal.recipeImage }}
                      className="w-16 h-16 rounded-xl mr-4"
                    />
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-text mb-1">
                        {meal.recipeName}
                      </Text>
                      <Text className="text-sm text-text opacity-60 mb-1">
                        {meal.cuisine} • {formatCookTime(meal.cookTime)}
                      </Text>
                      <Text className="text-sm text-primary font-medium capitalize">
                        {isToday
                          ? "Today"
                          : date.toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}{" "}
                        • {meal.mealType}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={Colors.text + "40"}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        <View className="h-10" />
      </ScrollView>
    </SafeAreaView>
  );
}
