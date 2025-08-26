import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MealRecommendation } from "@/components/MealRecommendation";
import { Colors } from "@/constants/Colors";
import { useDailyRecommendations } from "@/hooks/useRecipes";
import { getRecipeByIdFromCountrySync } from "@/utils/recipeUtils";

export default function HomeScreen() {
  const { recommendations, loading, refreshRecommendations } =
    useDailyRecommendations();

  const handleRecipePress = (recipeId: string) => {
    router.push(`/recipe/${recipeId}`);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={[Colors.primary, Colors.secondary]}
        className="px-5 py-6 rounded-b-3xl"
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-[28px] font-bold text-white mb-1">Good Morning!</Text>
            <Text className="text-base text-white opacity-90">
              What would you like to cook today?
            </Text>
          </View>
          <Ionicons name="restaurant" size={32} color="#fff" />
        </View>
      </LinearGradient>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refreshRecommendations}
            tintColor={Colors.primary}
          />
        }
      >
        <View className="mb-6">
          <Text className="text-[22px] font-bold text-text mb-1">Today's Recommendations</Text>
          <Text className="text-base text-text opacity-70">
            Handpicked recipes for your meals
          </Text>
        </View>

        <MealRecommendation
          mealType="breakfast"
          recipe={recommendations.breakfast}
          onPress={() =>
            recommendations.breakfast &&
            handleRecipePress(recommendations.breakfast.id)
          }
          onRefresh={() => {
            refreshRecommendations();
          }}
          countryName={
            recommendations.breakfast
              ? getRecipeByIdFromCountrySync(recommendations.breakfast.id)?.country
              : undefined
          }
        />

        <MealRecommendation
          mealType="lunch"
          recipe={recommendations.lunch}
          onPress={() =>
            recommendations.lunch && handleRecipePress(recommendations.lunch.id)
          }
          onRefresh={() => {
            refreshRecommendations();
          }}
          countryName={
            recommendations.lunch
              ? getRecipeByIdFromCountrySync(recommendations.lunch.id)?.country
              : undefined
          }
        />

        <MealRecommendation
          mealType="dinner"
          recipe={recommendations.dinner}
          onPress={() =>
            recommendations.dinner &&
            handleRecipePress(recommendations.dinner.id)
          }
          onRefresh={() => {
            refreshRecommendations();
          }}
          countryName={
            recommendations.dinner
              ? getRecipeByIdFromCountrySync(recommendations.dinner.id)?.country
              : undefined
          }
        />
      </ScrollView>
    </SafeAreaView>
  );
}
