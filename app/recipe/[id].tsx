import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import * as Notifications from 'expo-notifications';
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    Image,
    ScrollView,
    Share,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Modal from "react-native-modal";
import { SafeAreaView } from "react-native-safe-area-context";
import { TabBar, TabView } from "react-native-tab-view";
import Toast from "react-native-toast-message";

import { MealPlanModal } from "@/components/MealPlanModal";
import { ShoppingListModal } from "@/components/ShoppingListModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Colors } from "@/constants/Colors";
import { useFavorites } from "@/hooks/useFavorites";
import { useReviews } from "@/hooks/useReviews";
import { Recipe } from "@/types/Recipe";
import { Review } from "@/types/Review";
import {
    formatCookTime,
    getDifficultyColor,
    getRecipeByIdFromCountry,
} from "@/utils/recipeUtils";
import { findAllergensInIngredients, getSubstitutionsForIngredient, COMMON_ALLERGENS } from '@/utils/ingredientSubstitutions';
import { getUserAllergens, saveUserAllergens } from '@/utils/storageUtils';

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

const mockNutrition: NutritionInfo = {
  calories: 450,
  protein: 25,
  carbs: 45,
  fat: 18,
  fiber: 8,
};

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  // Mock user data since we removed authentication
  const user = {
    id: "1",
    name: "Guest User",
    avatar:
      "https://ui-avatars.com/api/?name=Guest+User&background=FF6B35&color=fff",
  };
import { useShoppingList } from '@/hooks/useShoppingList';
  const { toggleFavorite, isFavorite } = useFavorites();
  const { shoppingLists, createShoppingList, addCustomItemsToShoppingList, refreshShoppingLists } = useShoppingList();
  const { reviews, addReview } = useReviews(id!);
  const [recipeData, setRecipeData] = useState<{
    recipe: Recipe;
    country: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showShoppingListModal, setShowShoppingListModal] = useState(false);
  const [showMealPlanModal, setShowMealPlanModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");

  // Allergens & substitutions
  const [showAllergenPanel, setShowAllergenPanel] = useState(false);
  const [userAllergens, setUserAllergens] = useState<string[]>([]);
  const [detectedAllergens, setDetectedAllergens] = useState<string[]>([]);

  const loadUserAllergens = async () => {
    const a = await getUserAllergens();
    setUserAllergens(a || []);
  };

  useEffect(() => { loadUserAllergens(); }, []);


  // Guided cooking mode
  const [guidedMode, setGuidedMode] = useState(false);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [stepDuration, setStepDuration] = useState<number>(60); // seconds per step (default)
  const [timeLeft, setTimeLeft] = useState<number>(stepDuration);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // TTS & notification options for guided mode
  const [ttsEnabled, setTtsEnabled] = useState<boolean>(false);
  const [notifEnabled, setNotifEnabled] = useState<boolean>(false);
  const ttsRef = useRef(ttsEnabled);
  const notifRef = useRef(notifEnabled);

  useEffect(() => { ttsRef.current = ttsEnabled; }, [ttsEnabled]);
  useEffect(() => { notifRef.current = notifEnabled; }, [notifEnabled]);

  const requestNotificationPermission = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    } catch (e) {
      return false;
    }
  };

  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchRecipe = async () => {
      setLoading(true);
      const data = await getRecipeByIdFromCountry(id!);
      setRecipeData(data);
      setLoading(false);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    };

    fetchRecipe();
  }, [id, fadeAnim]);

  // Reset guided mode when recipe changes
  useEffect(() => {
    setGuidedMode(false);
    setCurrentStepIdx(0);
    setTimeLeft(stepDuration);
    setTimerRunning(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [recipe?.id, stepDuration]);

  // Timer effect for guided mode
  useEffect(() => {
    if (!timerRunning) return;

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // step finished
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

          if (!recipe) return 0;

          // Announce via TTS or notification if enabled
          const finishedIndex = currentStepIdx; // current step finishing

          const speakAndNotify = async () => {
            const nextIdx = finishedIndex < recipe.instructions.length - 1 ? finishedIndex + 1 : null;
            const nextText = nextIdx !== null ? recipe.instructions[nextIdx] : null;

            if (ttsRef.current) {
              const text = nextText ? `Step ${finishedIndex + 1} complete. Next: ${nextText}` : `Step ${finishedIndex + 1} complete. Recipe finished.`;
              try { Speech.speak(text); } catch (e) { /* ignore */ }
            }

            if (notifRef.current) {
              try {
                const title = nextText ? `Step ${finishedIndex + 1} complete` : `Recipe complete`;
                const body = nextText ? `Next: ${nextText}` : `All steps finished.`;
                await Notifications.scheduleNotificationAsync({ content: { title, body }, trigger: { seconds: 1 } });
              } catch (e) { /* ignore */ }
            }
          };

          // Run announcements but don't block timer
          void speakAndNotify();

          if (currentStepIdx < recipe.instructions.length - 1) {
            setCurrentStepIdx((i) => i + 1);
            return stepDuration;
          } else {
            // finished all steps
            setTimerRunning(false);
            setGuidedMode(false);
            return 0;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [timerRunning, currentStepIdx, stepDuration, recipe]);

  // When we switch steps, reset the timer
  useEffect(() => {
    setTimeLeft(stepDuration);
  }, [currentStepIdx, stepDuration]);

  const handleShare = async () => {
    if (!recipeData) return;

    try {
      await Share.share({
        message: `Check out this amazing ${recipeData.recipe.name} recipe from ${recipeData.country}! 🍽️`,
        title: recipeData.recipe.name,
      });
    } catch {
      // Error sharing recipe
    }
  };

  const handleAddReview = () => {
    if (rating === 0 || !reviewText.trim()) {
      Toast.show({
        type: "error",
        text1: "Please add rating and review",
        position: "bottom",
      });
      return;
    }

    const now = new Date();
    const newReview: Review = {
      id: Date.now().toString(),
      recipeId: id!,
      recipeName: recipeData?.recipe.name || "Unknown Recipe",
      userId: user?.id || "1",
      userName: user?.name || "Anonymous",
      userAvatar: user?.avatar,
      rating,
      comment: reviewText,
      date: now,
      createdAt: now,
      updatedAt: now,
      helpful: 0,
    };

    addReview(newReview);
    setShowReviewModal(false);
    setRating(0);
    setReviewText("");

    Toast.show({
      type: "success",
      text1: "Review added successfully!",
      position: "bottom",
    });
  };

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const imageScale = scrollY.interpolate({
    inputRange: [-100, 0],
    outputRange: [1.5, 1],
    extrapolate: "clamp",
  });

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text className="mt-4 text-base text-text">Loading recipe...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!recipeData) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <EmptyState
          icon="restaurant-outline"
          title="Recipe Not Found"
          description="We couldn't find this recipe. It may have been removed or doesn't exist."
          actionLabel="Go Back"
          onAction={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  const { recipe, country } = recipeData;
  const isRecipeFavorite = isFavorite(recipe.id, country);
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  // Servings scaling state & helpers
  const [servings, setServings] = useState<number>(recipe.servings || 1);

  const parseLeadingAmount = (amount: string): { value: number; rest: string } | null => {
    if (!amount || typeof amount !== 'string') return null;
    const trimmed = amount.trim();
    // match '1 1/2', '1/2', '2.5', '2'
    const match = trimmed.match(/^([0-9]+\s+[0-9]+\/[0-9]+|[0-9]+\/[0-9]+|[0-9]+(?:\.[0-9]+)?)(.*)$/);
    if (!match) return null;
    const numStr = match[1].trim();
    const rest = match[2] ? match[2].trim() : '';

    let value = 0;
    if (numStr.includes(' ')) {
      const parts = numStr.split(' ');
      const whole = parseInt(parts[0], 10);
      const frac = parts[1].split('/');
      value = whole + parseInt(frac[0], 10) / parseInt(frac[1], 10);
    } else if (numStr.includes('/')) {
      const frac = numStr.split('/');
      value = parseInt(frac[0], 10) / parseInt(frac[1], 10);
    } else {
      value = parseFloat(numStr);
    }

    if (Number.isNaN(value)) return null;
    return { value, rest };
  };

  const formatAmount = (value: number, rest: string) => {
    // Try to present as mixed fraction up to denominator 8
    const denom = 8;
    const sign = value < 0 ? -1 : 1;
    value = Math.abs(value);
    const whole = Math.floor(value);
    let frac = value - whole;
    const rounded = Math.round(frac * denom) / denom;
    if (rounded === 1) {
      return `${sign * (whole + 1)}${rest ? ' ' + rest : ''}`;
    }
    const fracNumer = Math.round(rounded * denom);
    if (fracNumer === 0) {
      return `${sign * whole}${rest ? ' ' + rest : ''}`;
    }
    // simplify fraction
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const g = gcd(fracNumer, denom);
    const num = fracNumer / g;
    const den = denom / g;
    if (whole === 0) {
      return `${sign * 1 === -1 ? '-' : ''}${num}/${den}${rest ? ' ' + rest : ''}`;
    }
    return `${sign * whole} ${num}/${den}${rest ? ' ' + rest : ''}`;
  };

  const scaleIngredientAmount = (amount: string, factor: number) => {
    const parsed = parseLeadingAmount(amount);
    if (!parsed) return amount; // fallback
    const scaled = parsed.value * factor;
    return formatAmount(scaled, parsed.rest);
  };

  const handleToggleAllergen = async (allergen: string) => {
    const next = userAllergens.includes(allergen)
      ? userAllergens.filter(a => a !== allergen)
      : [...userAllergens, allergen];
    setUserAllergens(next);
    await saveUserAllergens(next);
  };

  const renderIngredients = () => (
    <ScrollView className="px-5 py-4" showsVerticalScrollIndicator={false}>
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-base font-semibold text-text">Ingredients</Text>
        <TouchableOpacity onPress={() => {
          // detect allergens & toggle panel
          const found = findAllergensInIngredients(recipe.ingredients, COMMON_ALLERGENS);
          setDetectedAllergens(found);
          setShowAllergenPanel(v => !v);
        }} className="px-3 py-1 rounded-xl border" style={{ backgroundColor: showAllergenPanel ? Colors.primary : Colors.background }}>
          <Text style={{ color: showAllergenPanel ? 'white' : Colors.text }} className="font-medium">Allergens & Substitutions</Text>
        </TouchableOpacity>
      </View>

      {recipe.ingredients.map((ingredient, index) => {
        const scaledAmount = scaleIngredientAmount(
          ingredient.amount,
          servings / (recipe.servings || 1)
        );

        const subs = getSubstitutionsForIngredient(ingredient.name);

        return (
          <Animated.View
            key={index}
            className="flex-row items-center bg-white rounded-xl p-4 mb-3"
            style={{
              opacity: fadeAnim,
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            }}
          >
            <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center mr-3">
              <Text className="text-primary font-bold">{index + 1}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-base text-text">{scaledAmount}</Text>
              {subs && subs.length > 0 && (
                <Text className="text-xs text-primary opacity-80">Sub: {subs[0]}</Text>
              )}
            </View>
            <Text className="flex-2 text-base font-medium text-text">
              {ingredient.name}
            </Text>
          </Animated.View>
        );
      })}

      {showAllergenPanel && (
        <View className="bg-white rounded-xl p-4 mt-3">
          <Text className="text-sm text-text mb-2">Detected allergens in this recipe: {detectedAllergens.length > 0 ? detectedAllergens.join(', ') : 'None'}</Text>

          <Text className="text-sm text-text mb-2">Your allergens (toggle to avoid):</Text>
          <View className="flex-row flex-wrap">
            {COMMON_ALLERGENS.map((a) => (
              <TouchableOpacity key={a} onPress={() => handleToggleAllergen(a)} className={`px-3 py-2 rounded-lg mr-2 mb-2`} style={{ backgroundColor: userAllergens.includes(a) ? '#FEEBC8' : Colors.background }}>
                <Text className="text-sm" style={{ color: userAllergens.includes(a) ? '#B45309' : Colors.text }}>{a}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {userAllergens.length > 0 && detectedAllergens.some(d => userAllergens.includes(d)) && (
            <View className="mt-3 p-3 rounded-lg bg-red-50">
              <Text className="text-sm text-red-700">This recipe contains ingredients you marked to avoid.</Text>
              <Text className="text-sm text-red-700">Consider substituting: </Text>
              <View className="mt-2">
                {recipe.ingredients.map((ing, idx) => {
                  const subs = getSubstitutionsForIngredient(ing.name);
                  const matches = subs && subs.length > 0 && userAllergens.some(u => ing.name.toLowerCase().includes(u));
                  if (!matches) return null;
                  return (
                    <Text key={idx} className="text-sm text-text">• {ing.name} → {subs[0]}</Text>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60)
      .toString()
      .padStart(2, '0');
    const secs = Math.floor(s % 60)
      .toString()
      .padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const startTimer = () => {
    if (!guidedMode) setGuidedMode(true);
    setTimerRunning(true);
  };
  const pauseTimer = () => setTimerRunning(false);
  const resetTimer = () => {
    setTimerRunning(false);
    setTimeLeft(stepDuration);
    setCurrentStepIdx(0);
  };

  const renderInstructions = () => (
    <ScrollView className="px-5 py-4" showsVerticalScrollIndicator={false}>
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-base font-semibold text-text">Instructions</Text>
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => {
              setGuidedMode((v) => !v);
              setCurrentStepIdx(0);
              setTimeLeft(stepDuration);
              setTimerRunning(false);
              // Switch to instructions tab for user
              setTabIndex(1);
            }}
            className="px-3 py-1 rounded-xl border"
            style={{ backgroundColor: guidedMode ? Colors.primary : Colors.background }}
          >
            <Text style={{ color: guidedMode ? 'white' : Colors.text }} className="font-medium">{guidedMode ? 'Guided On' : 'Start Guided'}</Text>
          </TouchableOpacity>

          <View className="ml-3 flex-row items-center">
            <TouchableOpacity onPress={() => setStepDuration((d) => Math.max(10, d - 15))} className="px-2 py-1 rounded-lg" style={{ backgroundColor: Colors.background }}>
              <Text className="text-sm">-15s</Text>
            </TouchableOpacity>
            <Text className="mx-2 text-sm text-text">{stepDuration}s</Text>
            <TouchableOpacity onPress={() => setStepDuration((d) => d + 15)} className="px-2 py-1 rounded-lg" style={{ backgroundColor: Colors.background }}>
              <Text className="text-sm">+15s</Text>
            </TouchableOpacity>

            <View className="ml-3 flex-row items-center">
              <TouchableOpacity
                onPress={() => setTtsEnabled((v) => !v)}
                className="px-3 py-1 rounded-xl border mr-2"
                style={{ backgroundColor: ttsEnabled ? Colors.primary : Colors.background }}
              >
                <Text className="font-medium" style={{ color: ttsEnabled ? 'white' : Colors.text }}>Voice cue</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={async () => {
                  if (!notifEnabled) {
                    const ok = await requestNotificationPermission();
                    if (!ok) {
                      Alert.alert('Permission required', 'Notifications permission was not granted');
                      return;
                    }
                  }
                  setNotifEnabled((v) => !v);
                }}
                className="px-3 py-1 rounded-xl border"
                style={{ backgroundColor: notifEnabled ? Colors.primary : Colors.background }}
              >
                <Text className="font-medium" style={{ color: notifEnabled ? 'white' : Colors.text }}>Notifications</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {recipe.instructions.map((instruction, index) => (
        <Animated.View
          key={index}
          className={`bg-white rounded-xl p-4 mb-4 ${guidedMode && currentStepIdx === index ? 'border-2 border-primary' : ''}`}
          style={{
            opacity: fadeAnim,
            transform: [
              {
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          }}
        >
          <View className="flex-row items-start">
            <LinearGradient
              colors={[Colors.primary, Colors.secondary]}
              className="w-8 h-8 rounded-full items-center justify-center mr-3"
            >
              <Text className="text-white font-bold">{index + 1}</Text>
            </LinearGradient>
            <Text className="flex-1 text-base text-text leading-6">
              {instruction}
            </Text>
          </View>
        </Animated.View>
      ))}

      {guidedMode && (
        <View className="bg-white rounded-xl p-4 mb-8 fixed-bottom" style={{ position: 'absolute', left: 16, right: 16, bottom: 24 }}>
          <Text className="text-sm text-gray-500 mb-2">Step {currentStepIdx + 1} / {recipe.instructions.length}</Text>
          <Text className="text-base text-text mb-3">{recipe.instructions[currentStepIdx]}</Text>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <TouchableOpacity onPress={() => setCurrentStepIdx((i) => Math.max(0, i - 1))} className="px-3 py-2 rounded-lg mr-2" style={{ backgroundColor: Colors.background }}>
                <Ionicons name="chevron-back" size={20} color={Colors.text} />
              </TouchableOpacity>
              {timerRunning ? (
                <TouchableOpacity onPress={pauseTimer} className="px-4 py-2 rounded-lg" style={{ backgroundColor: Colors.primary }}>
                  <Text className="text-white font-semibold">Pause</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={startTimer} className="px-4 py-2 rounded-lg" style={{ backgroundColor: Colors.primary }}>
                  <Text className="text-white font-semibold">Start</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => setCurrentStepIdx((i) => Math.min(recipe.instructions.length - 1, i + 1))} className="px-3 py-2 rounded-lg ml-2" style={{ backgroundColor: Colors.background }}>
                <Ionicons name="chevron-forward" size={20} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <View className="items-end">
              <Text className="text-sm text-gray-500">Time left</Text>
              <Text className="text-lg font-semibold text-text">{formatTime(timeLeft)}</Text>
            </View>
          </View>

          <View className="flex-row items-center justify-between mt-3">
            <TouchableOpacity onPress={resetTimer} className="px-3 py-2 rounded-lg" style={{ backgroundColor: Colors.background }}>
              <Text className="text-sm">Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setGuidedMode(false); setTimerRunning(false); }} className="px-3 py-2 rounded-lg" style={{ backgroundColor: Colors.background }}>
              <Text className="text-sm">Stop</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );

  const renderNutrition = () => (
    <ScrollView className="px-5 py-4" showsVerticalScrollIndicator={false}>
      <View className="bg-white rounded-xl p-5">
        <Text className="text-lg font-bold text-text mb-4">
          Nutritional Information
        </Text>
        <Text className="text-sm text-text opacity-60 mb-4">Per serving</Text>

        <View className="flex-row justify-around mb-6">
          <View className="items-center">
            <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center mb-2">
              <Text className="text-2xl font-bold text-primary">
                {mockNutrition.calories}
              </Text>
            </View>
            <Text className="text-xs text-text">Calories</Text>
          </View>
        </View>

        <View className="space-y-3">
          {[
            {
              label: "Protein",
              value: mockNutrition.protein,
              unit: "g",
              color: "#10B981",
            },
            {
              label: "Carbs",
              value: mockNutrition.carbs,
              unit: "g",
              color: "#F59E0B",
            },
            {
              label: "Fat",
              value: mockNutrition.fat,
              unit: "g",
              color: "#EF4444",
            },
            {
              label: "Fiber",
              value: mockNutrition.fiber,
              unit: "g",
              color: "#8B5CF6",
            },
          ].map((item) => (
            <View key={item.label} className="flex-row items-center">
              <View
                className="w-1 h-8 rounded-full mr-3"
                style={{ backgroundColor: item.color }}
              />
              <Text className="flex-1 text-base text-text">{item.label}</Text>
              <Text className="text-base font-semibold text-text">
                {item.value}
                {item.unit}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  const renderReviews = () => (
    <ScrollView className="px-5 py-4" showsVerticalScrollIndicator={false}>
      <TouchableOpacity
        onPress={() => setShowReviewModal(true)}
        className="bg-primary rounded-xl p-4 mb-4"
      >
        <Text className="text-white text-center font-semibold">
          Write a Review
        </Text>
      </TouchableOpacity>

      {reviews.length === 0 ? (
        <EmptyState
          icon="chatbubbles-outline"
          title="No Reviews Yet"
          description="Be the first to share your experience with this recipe!"
        />
      ) : (
        reviews.map((review) => (
          <View key={review.id} className="bg-white rounded-xl p-4 mb-3">
            <View className="flex-row items-center mb-2">
              <Image
                source={{
                  uri:
                    review.userAvatar ||
                    `https://ui-avatars.com/api/?name=${review.userName}`,
                }}
                className="w-10 h-10 rounded-full mr-3"
              />
              <View className="flex-1">
                <Text className="font-semibold text-text">
                  {review.userName}
                </Text>
                <View className="flex-row items-center">
                  {[...Array(5)].map((_, i) => (
                    <Ionicons
                      key={i}
                      name={i < review.rating ? "star" : "star-outline"}
                      size={12}
                      color={Colors.accent}
                    />
                  ))}
                  <Text className="text-xs text-gray-500 ml-2">
                    {review.date ? new Date(review.date).toLocaleDateString() : new Date(review.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </View>
            <Text className="text-text">{review.comment}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );

  const handleCheckPantry = async () => {
    const pantry = await getPantryItems();
    if (!pantry || pantry.length === 0) {
      Alert.alert('No pantry saved', 'Your pantry is empty. Save a pantry in the Pantry Matcher or add items.');
      router.push('/pantry');
      return;
    }

    const match = matchRecipesByPantry([recipe], pantry)[0];
    if (!match) {
      Alert.alert('No match info', 'Could not compute pantry match for this recipe.');
      return;
    }

    const missing = match.missingIngredients.slice(0, 10).join(', ');
    Alert.alert(
      `${match.matchPercent}% match`,
      `Missing: ${missing || 'None'}`,
      [
        { text: 'Cancel', style: 'cancel' },
              {
                text: 'Add missing to shopping list',
                onPress: async () => {
                  if (match.missingIngredients.length === 0) {
                    Alert.alert('Nothing to add');
                    return;
                  }

                  // If there are no named shopping lists, create one and add to it
                  if (!shoppingLists || shoppingLists.length === 0) {
                    const listName = `Missing - ${recipe.name}`;
                    const newList = await createShoppingList(listName);
                    await addCustomItemsToShoppingList(newList.id, match.missingIngredients.map((ing) => ({ name: ing, amount: '', category: 'other' })));
                    await refreshShoppingLists();
                    Alert.alert('Added', `Created ${listName} and added ${match.missingIngredients.length} items.`);
                    return;
                  }

                  // Otherwise, ask to add to first list or create a new one
                  Alert.alert('Add missing items', `Add missing ingredients to your shopping lists?`, [
                    {
                      text: `Add to ${shoppingLists[0].name}`,
                      onPress: async () => {
                        await addCustomItemsToShoppingList(shoppingLists[0].id, match.missingIngredients.map((ing) => ({ name: ing, amount: '', category: 'other' })));
                        await refreshShoppingLists();
                        Alert.alert('Added', `Added ${match.missingIngredients.length} items to ${shoppingLists[0].name}`);
                      }
                    },
                    {
                      text: 'Create new list',
                      onPress: async () => {
                        const listName = `Missing - ${recipe.name}`;
                        const newList = await createShoppingList(listName);
                        await addCustomItemsToShoppingList(newList.id, match.missingIngredients.map((ing) => ({ name: ing, amount: '', category: 'other' })));
                        await refreshShoppingLists();
                        Alert.alert('Added', `Created ${listName} and added ${match.missingIngredients.length} items.`);
                      }
                    },
                    { text: 'Cancel', style: 'cancel' }
                  ]);
                }
              }
      ]
    );
  };

  const routes = [
    { key: "ingredients", title: "Ingredients" },
    { key: "instructions", title: "Instructions" },
    { key: "nutrition", title: "Nutrition" },
    { key: "reviews", title: "Reviews" },
  ];

  return (
    <View className="flex-1 bg-background">
      <StatusBar barStyle="light-content" />

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        <Animated.View style={{ transform: [{ scale: imageScale }] }}>
          <Image source={{ uri: recipe.image }} className="w-full h-80" />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.7)"]}
            className="absolute bottom-0 left-0 right-0 h-32"
          />
        </Animated.View>

        <View className="bg-white rounded-t-3xl -mt-8 pt-6 px-5">
          <Text className="text-3xl font-bold text-text mb-2">
            {recipe.name}
          </Text>

          <View className="flex-row items-center mb-4">
            <View className="flex-row items-center bg-primary/10 rounded-full px-3 py-1 mr-2">
              <Ionicons name="location" size={14} color={Colors.primary} />
              <Text className="text-sm font-medium text-primary ml-1">
                {country}
              </Text>
            </View>
            <View className="flex-row items-center bg-accent/10 rounded-full px-3 py-1">
              {[...Array(5)].map((_, i) => (
                <Ionicons
                  key={i}
                  name={i < Math.round(averageRating) ? "star" : "star-outline"}
                  size={14}
                  color={Colors.accent}
                />
              ))}
              <Text className="text-sm font-medium text-text ml-1">
                {averageRating.toFixed(1)} ({reviews.length})
              </Text>
            </View>
          </View>

          <View className="flex-row justify-between mb-6">
            <View className="items-center flex-1">
              <View className="w-12 h-12 rounded-full bg-blue-100 items-center justify-center mb-1">
                <Ionicons name="time-outline" size={20} color="#3B82F6" />
              </View>
              <Text className="text-xs text-gray-500">Cook Time</Text>
              <Text className="text-sm font-semibold text-text">
                {formatCookTime(recipe.cookTime)}
              </Text>
            </View>

            <View className="items-center flex-1">
              <View className="w-12 h-12 rounded-full bg-green-100 items-center justify-center mb-1">
                <Ionicons name="people-outline" size={20} color="#10B981" />
              </View>
              <Text className="text-xs text-gray-500">Servings</Text>
              <View className="flex-row items-center mt-1">
                <TouchableOpacity
                  onPress={() => setServings((s) => Math.max(1, s - 1))}
                  className="w-8 h-8 rounded-full items-center justify-center"
                  style={{ backgroundColor: Colors.background }}
                >
                  <Text className="text-lg text-text">-</Text>
                </TouchableOpacity>
                <Text className="text-sm font-semibold text-text mx-3">
                  {servings}
                </Text>
                <TouchableOpacity
                  onPress={() => setServings((s) => s + 1)}
                  className="w-8 h-8 rounded-full items-center justify-center"
                  style={{ backgroundColor: Colors.background }}
                >
                  <Text className="text-lg text-text">+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View className="items-center flex-1">
              <View
                className="w-12 h-12 rounded-full items-center justify-center mb-1"
                style={{
                  backgroundColor: getDifficultyColor(recipe.difficulty) + "20",
                }}
              >
                <Ionicons
                  name="speedometer-outline"
                  size={20}
                  color={getDifficultyColor(recipe.difficulty)}
                />
              </View>
              <Text className="text-xs text-gray-500">Difficulty</Text>
              <Text className="text-sm font-semibold text-text capitalize">
                {recipe.difficulty}
              </Text>
            </View>
          </View>

          {recipe.description && (
            <Text className="text-base text-text opacity-80 mb-6 leading-6">
              {recipe.description}
            </Text>
          )}

          {servings !== recipe.servings && (
            <View className="mb-6 px-3 py-2 bg-yellow-50 rounded-xl">
              <Text className="text-sm text-yellow-800">
                Ingredient quantities updated for {servings} serving{servings > 1 ? 's' : ''}.
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: SCREEN_HEIGHT * 0.6 }}>
          <TabView
            navigationState={{ index: tabIndex, routes }}
            renderScene={({ route }) => {
              switch (route.key) {
                case "ingredients":
                  return renderIngredients();
                case "instructions":
                  return renderInstructions();
                case "nutrition":
                  return renderNutrition();
                case "reviews":
                  return renderReviews();
                default:
                  return null;
              }
            }}
            onIndexChange={setTabIndex}
            renderTabBar={(props) => (
              <TabBar
                {...props}
                scrollEnabled
                style={{ backgroundColor: "white" }}
                tabStyle={{ width: "auto" }}
                indicatorStyle={{ backgroundColor: Colors.primary }}
                activeColor={Colors.primary}
                inactiveColor={Colors.text}
              />
            )}
          />
        </View>
      </Animated.ScrollView>

      <Animated.View
        className="absolute top-0 left-0 right-0"
        style={{ opacity: headerOpacity }}
      >
        <BlurView intensity={90} tint="light" className="pt-12 pb-4 px-5">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text className="text-lg font-semibold text-text" numberOfLines={1}>
              {recipe.name}
            </Text>
            <View className="w-6" />
          </View>
        </BlurView>
      </Animated.View>

      <View className="absolute top-12 left-0 right-0 flex-row justify-between px-5">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: "rgba(255,255,255,0.9)" }}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>

        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={handleShare}
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: "rgba(255,255,255,0.9)" }}
          >
            <Ionicons
              name="share-social-outline"
              size={20}
              color={Colors.text}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => toggleFavorite(recipe.id, country)}
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: "rgba(255,255,255,0.9)" }}
          >
            <Ionicons
              name={isRecipeFavorite ? "heart" : "heart-outline"}
              size={20}
              color={isRecipeFavorite ? "#FF6B6B" : Colors.text}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleCheckPantry}
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: "rgba(255,255,255,0.9)" }}
          >
            <Ionicons name="checkmark-done-circle-outline" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <View className="absolute bottom-6 left-5 right-5 flex-row gap-3">
        <TouchableOpacity
          onPress={() => setShowMealPlanModal(true)}
          className="flex-1 bg-secondary rounded-xl py-4 flex-row items-center justify-center"
        >
          <Ionicons name="calendar" size={20} color="white" />
          <Text className="text-white font-semibold ml-2">Add to Plan</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setShowShoppingListModal(true)}
          className="flex-1 bg-primary rounded-xl py-4 flex-row items-center justify-center"
        >
          <Ionicons name="cart" size={20} color="white" />
          <Text className="text-white font-semibold ml-2">
            Shop Ingredients
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        isVisible={showReviewModal}
        onBackdropPress={() => setShowReviewModal(false)}
        className="m-0 justify-end"
      >
        <View className="bg-white rounded-t-3xl p-5">
          <Text className="text-xl font-bold text-text mb-4">
            Write a Review
          </Text>

          <View className="flex-row justify-center mb-4">
            {[...Array(5)].map((_, i) => (
              <TouchableOpacity key={i} onPress={() => setRating(i + 1)}>
                <Ionicons
                  name={i < rating ? "star" : "star-outline"}
                  size={32}
                  color={Colors.accent}
                  style={{ marginHorizontal: 4 }}
                />
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            className="bg-gray-100 rounded-xl p-4 h-32 text-base text-text"
            placeholder="Share your experience..."
            multiline
            value={reviewText}
            onChangeText={setReviewText}
            textAlignVertical="top"
          />

          <TouchableOpacity
            onPress={handleAddReview}
            className="bg-primary rounded-xl py-4 mt-4"
          >
            <Text className="text-white text-center font-semibold">
              Submit Review
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {recipeData && (
        <>
          <ShoppingListModal
            visible={showShoppingListModal}
            onClose={() => setShowShoppingListModal(false)}
            recipe={recipeData.recipe}
          />
          <MealPlanModal
            visible={showMealPlanModal}
            onClose={() => setShowMealPlanModal(false)}
            recipe={recipeData.recipe}
          />
        </>
      )}
    </View>
  );
}
