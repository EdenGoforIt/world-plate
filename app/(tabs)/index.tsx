import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MealRecommendation } from "@/components/MealRecommendation";
import { RecipeCard } from "@/components/RecipeCard";
import { LoadingScreen, RecipeCardSkeleton } from "@/components/ui/LoadingScreen";
import { Colors } from "@/constants/Colors";
import { useAuth } from "@/contexts/AuthContext";
import { useDailyRecommendations, useRecipes } from "@/hooks/useRecipes";
import { Recipe } from "@/types/Recipe";
import { getRecipeByIdFromCountrySync } from "@/utils/recipeUtils";

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const categories = [
  { id: '1', name: 'Breakfast', icon: 'sunny-outline', color: '#FFD700' },
  { id: '2', name: 'Lunch', icon: 'partly-sunny-outline', color: '#FF8C42' },
  { id: '3', name: 'Dinner', icon: 'moon-outline', color: '#6B46C1' },
  { id: '4', name: 'Desserts', icon: 'ice-cream-outline', color: '#EC4899' },
  { id: '5', name: 'Snacks', icon: 'nutrition-outline', color: '#10B981' },
  { id: '6', name: 'Drinks', icon: 'cafe-outline', color: '#8B5CF6' },
];

export default function HomeScreen() {
  const { user } = useAuth();
  const { recommendations, loading, refreshRecommendations } = useDailyRecommendations();
  const { recipes, loading: recipesLoading } = useRecipes();
  const [selectedCategory, setSelectedCategory] = useState('1');
  const [greeting, setGreeting] = useState('Good Morning');
  const scrollY = new Animated.Value(0);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  const handleRecipePress = (recipeId: string) => {
    router.push(`/recipe/${recipeId}`);
  };

  const headerScale = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.8],
    extrapolate: 'clamp',
  });

  const trendingRecipes = recipes.slice(0, 5);

  if (!user) {
    router.replace('/auth/login');
    return null;
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar barStyle="light-content" />

      <Animated.ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refreshRecommendations}
            tintColor={Colors.primary}
          />
        }
      >
        <Animated.View
          style={{
            transform: [{ scale: headerScale }],
            opacity: headerOpacity,
          }}
        >
          <LinearGradient
            colors={[Colors.primary, Colors.secondary]}
            className="px-5 py-6 rounded-b-[32px]"
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-row items-center">
                <Image
                  source={{ uri: user.avatar }}
                  className="w-12 h-12 rounded-full mr-3 border-2 border-white"
                />
                <View>
                  <Text className="text-sm text-white opacity-90">{greeting},</Text>
                  <Text className="text-xl font-bold text-white">{user.name}!</Text>
                </View>
              </View>
              <TouchableOpacity className="bg-white/20 rounded-full p-2">
                <Ionicons name="notifications-outline" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <View className="bg-white/20 rounded-2xl p-4 mt-2">
              <Text className="text-white text-sm mb-1">Today's Cooking Streak</Text>
              <View className="flex-row items-center justify-between">
                <Text className="text-3xl font-bold text-white">{user.stats.streak} Days</Text>
                <Ionicons name="flame" size={32} color="#FFD700" />
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        <View className="px-5 mt-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-bold text-text">Quick Categories</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/explore')}>
              <Text className="text-primary font-medium">See All</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={categories}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => setSelectedCategory(item.id)}
                className={`mr-4 items-center ${selectedCategory === item.id ? 'opacity-100' : 'opacity-60'}`}
              >
                <LinearGradient
                  colors={selectedCategory === item.id ? [item.color, item.color + '99'] : ['#F3F4F6', '#E5E7EB']}
                  className="w-16 h-16 rounded-2xl items-center justify-center mb-2"
                >
                  <Ionicons 
                    name={item.icon} 
                    size={28} 
                    color={selectedCategory === item.id ? '#fff' : '#6B7280'} 
                  />
                </LinearGradient>
                <Text className={`text-xs ${selectedCategory === item.id ? 'font-semibold text-text' : 'text-gray-500'}`}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>

        <View className="px-5 mt-8">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-bold text-text">Today's Picks</Text>
            <TouchableOpacity onPress={() => router.push('/meal-plan')}>
              <Text className="text-primary font-medium">Meal Plan</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <>
              <RecipeCardSkeleton />
              <RecipeCardSkeleton />
              <RecipeCardSkeleton />
            </>
          ) : (
            <>
              <MealRecommendation
                mealType="breakfast"
                recipe={recommendations.breakfast}
                onPress={() =>
                  recommendations.breakfast &&
                  handleRecipePress(recommendations.breakfast.id)
                }
                onRefresh={refreshRecommendations}
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
                onRefresh={refreshRecommendations}
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
                onRefresh={refreshRecommendations}
                countryName={
                  recommendations.dinner
                    ? getRecipeByIdFromCountrySync(recommendations.dinner.id)?.country
                    : undefined
                }
              />
            </>
          )}
        </View>

        <View className="px-5 mt-8 mb-24">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-bold text-text">Trending Now</Text>
            <TouchableOpacity>
              <Ionicons name="trending-up" size={24} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={trendingRecipes}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={{ width: SCREEN_WIDTH * 0.7, marginRight: 16 }}>
                <RecipeCard
                  recipe={item}
                  onPress={() => handleRecipePress(item.id)}
                  countryName={getRecipeByIdFromCountrySync(item.id)?.country}
                />
              </View>
            )}
          />
        </View>
      </Animated.ScrollView>

      <TouchableOpacity
        className="absolute bottom-24 right-5 bg-primary rounded-full p-4 shadow-lg"
        onPress={() => router.push('/shopping-list')}
        style={{
          shadowColor: Colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Ionicons name="cart" size={24} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}