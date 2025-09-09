import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: string[];
}

const slides: OnboardingSlide[] = [
  {
    id: '1',
    title: 'Discover World Cuisines',
    description: 'Explore authentic recipes from every corner of the globe, from Italian pasta to Japanese sushi.',
    icon: 'globe-outline',
    gradient: [Colors.primary, '#FF8C42'],
  },
  {
    id: '2',
    title: 'Plan Your Meals',
    description: 'Organize your weekly meals with our smart meal planner and never wonder what to cook again.',
    icon: 'calendar-outline',
    gradient: ['#FF8C42', Colors.secondary],
  },
  {
    id: '3',
    title: 'Smart Shopping Lists',
    description: 'Generate shopping lists automatically from your meal plans and recipes. Never forget an ingredient!',
    icon: 'cart-outline',
    gradient: [Colors.secondary, '#3CB371'],
  },
  {
    id: '4',
    title: 'Cook Like a Pro',
    description: 'Follow step-by-step instructions, watch video tutorials, and master new cooking techniques.',
    icon: 'restaurant-outline',
    gradient: ['#3CB371', Colors.primary],
  },
];

export default function OnboardingScreen() {
  const { user } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleScroll = (event: any) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentSlide(slideIndex);
  };

  const goToSlide = (index: number) => {
    scrollViewRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
    setCurrentSlide(index);
  };

  const handleSkip = () => {
    router.replace('/(tabs)');
  };

  const handleNext = () => {
    if (currentSlide === slides.length - 1) {
      router.replace('/(tabs)');
    } else {
      goToSlide(currentSlide + 1);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1">
        <View className="flex-row justify-between items-center px-6 py-4">
          <Text className="text-lg font-semibold text-text">
            Welcome, {user?.name || 'Chef'}!
          </Text>
          <TouchableOpacity onPress={handleSkip}>
            <Text className="text-primary font-medium">Skip</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {slides.map((slide) => (
            <View key={slide.id} style={{ width: SCREEN_WIDTH }} className="flex-1">
              <LinearGradient
                colors={slide.gradient}
                className="mx-6 mt-8 h-64 rounded-3xl items-center justify-center"
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View className="bg-white/20 rounded-full p-6 mb-4">
                  <Ionicons name={slide.icon} size={64} color="white" />
                </View>
              </LinearGradient>

              <View className="px-8 mt-12">
                <Text className="text-3xl font-bold text-text text-center mb-4">
                  {slide.title}
                </Text>
                <Text className="text-base text-text opacity-70 text-center leading-6">
                  {slide.description}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>

        <View className="px-6 pb-8">
          <View className="flex-row justify-center mb-8">
            {slides.map((_, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => goToSlide(index)}
                className="mx-1"
              >
                <View
                  className={`h-2 rounded-full ${
                    currentSlide === index ? 'bg-primary w-8' : 'bg-gray-300 w-2'
                  }`}
                />
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            onPress={handleNext}
            className="bg-primary rounded-xl py-4"
          >
            <Text className="text-white text-center font-semibold text-lg">
              {currentSlide === slides.length - 1 ? "Let's Cook!" : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}