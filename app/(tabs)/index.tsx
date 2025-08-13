import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MealRecommendation } from "@/components/MealRecommendation";
import { Colors } from "@/constants/Colors";
import { useDailyRecommendations } from "@/hooks/useRecipes";
import { getRecipeByIdFromCountry } from "@/utils/recipeUtils";

export default function HomeScreen() {
  const { recommendations, loading, refreshRecommendations } =
    useDailyRecommendations();

  const handleRecipePress = (recipeId: string) => {
    router.push(`/recipe/${recipeId}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={[Colors.primary, Colors.secondary]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Good Morning!</Text>
            <Text style={styles.subtitle}>
              What would you like to cook today?
            </Text>
          </View>
          <Ionicons name="restaurant" size={32} color="#fff" />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refreshRecommendations}
            tintColor={Colors.primary}
          />
        }
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Recommendations</Text>
          <Text style={styles.sectionSubtitle}>
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
              ? getRecipeByIdFromCountry(recommendations.breakfast.id)?.country
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
              ? getRecipeByIdFromCountry(recommendations.lunch.id)?.country
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
              ? getRecipeByIdFromCountry(recommendations.dinner.id)?.country
              : undefined
          }
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#fff",
    opacity: 0.9,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: Colors.text,
    opacity: 0.7,
  },
});
