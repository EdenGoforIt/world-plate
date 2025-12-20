import React, { memo, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, Dimensions, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Recipe } from '../types/Recipe';
import { Colors } from '../constants/Colors';
import { formatCookTime, getDifficultyColor } from '../utils/recipeUtils';
import { LinearGradient } from 'expo-linear-gradient';
import Skeleton from './Skeleton';

interface RecipeCardProps {
  recipe: Recipe;
  onPress: () => void;
  onFavoritePress?: () => void;
  isFavorite?: boolean;
  size?: 'small' | 'medium' | 'large';
  countryName?: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CARD_SIZES = {
  small: SCREEN_WIDTH * 0.4,
  medium: SCREEN_WIDTH * 0.7,
  large: SCREEN_WIDTH * 0.9,
} as const;

const RecipeCardComponent: React.FC<RecipeCardProps> = ({
  recipe,
  onPress,
  onFavoritePress,
  isFavorite = false,
  size = 'medium',
  countryName,
}) => {
  const cardWidth = CARD_SIZES[size];
  
  const scale = useRef(new Animated.Value(1)).current;

  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const imageOpacity = useRef(new Animated.Value(0)).current;

  const onPressIn = () => Animated.spring(scale, { toValue: 0.985, useNativeDriver: true, speed: 20 }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20 }).start();

  return (
    <Animated.View style={[{ transform: [{ scale }], width: cardWidth, marginBottom: 16 }]}>
      <TouchableOpacity
        className="bg-white rounded-2xl"
        style={[styles.card]}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={`Recipe: ${recipe.name}`}
        accessibilityHint="Tap to view recipe details"
      >
      <View className="relative h-[180px] rounded-t-2xl overflow-hidden">
        {recipe.image && !imageError ? (
          <Animated.Image
            source={{ uri: recipe.image }}
            style={[{ width: '100%', height: '100%', opacity: imageOpacity }, { resizeMode: 'cover' }]}
            onLoad={() => {
              setImageLoaded(true);
              Animated.timing(imageOpacity, { toValue: 1, duration: 350, useNativeDriver: true }).start();
            }}
            onError={() => setImageError(true)}
            accessibilityRole="image"
            accessibilityLabel={`Image for ${recipe.name}`}
          />
        ) : (
          <View style={{ width: '100%', height: '100%', backgroundColor: '#f2f4f7', alignItems: 'center', justifyContent: 'center' }}>
            <Skeleton style={{ width: '100%', height: '100%', backgroundColor: '#f2f4f7' }} />
            {imageError && (
              <View style={{ position: 'absolute', alignItems: 'center' }}>
                <Ionicons name="image" size={48} color="#9aa1ab" />
                <Text style={{ color: '#9aa1ab', marginTop: 8 }}>Image not available</Text>
              </View>
            )}
          </View>
        )}
        <LinearGradient
          colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.6)"]}
          style={StyleSheet.absoluteFill}
          start={[0.5, 0.0]}
          end={[0.5, 1.0]}
        />
        {onFavoritePress && (
          <TouchableOpacity
            className="absolute top-3 right-3 p-2 rounded-full"
            style={styles.favoriteButton}
            onPress={onFavoritePress}
            accessibilityRole="button"
            accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={24}
            color={isFavorite ? '#FF6B6B' : '#fff'}
          />
          </TouchableOpacity>
        )}

        {/* Cuisine badge */}
        <View style={styles.cuisineBadge} className="absolute top-3 left-3">
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>{recipe.cuisine}</Text>
        </View>
        <View className="absolute bottom-0 left-0 right-0 p-3 flex-row justify-between items-end" style={styles.ratingContainer}>
          <View className="flex-row items-center px-2 py-1 rounded-xl" style={styles.ratingBadge}>
            <Ionicons name="star" size={16} color={Colors.accent} />
            <Text className="ml-1 text-sm font-semibold" style={{ color: Colors.text }}>{recipe.rating}</Text>
          </View>
        </View>
      </View>
      
      <View className="p-4">
        <Text className="text-lg font-bold mb-1" style={{ color: Colors.text }} numberOfLines={2}>
          {recipe.name}
        </Text>
        <Text className="text-sm mb-3 capitalize" style={{ color: Colors.secondary }}>
          {countryName || recipe.cuisine}
        </Text>
        
        <View className="flex-row justify-between items-center mb-3">
          <View className="flex-row items-center">
            <Ionicons name="time-outline" size={16} color={Colors.text} />
            <Text className="ml-1 text-sm" style={{ color: Colors.text }}>
              {formatCookTime(recipe.prepTime + recipe.cookTime)}
            </Text>
          </View>
          
          <View className="px-2 py-1 rounded-xl" style={{ backgroundColor: getDifficultyColor(recipe.difficulty) }}>
            <Text className="text-xs font-semibold text-white capitalize">{recipe.difficulty}</Text>
          </View>
        </View>
        
        <View className="flex-row flex-wrap">
          {recipe.tags.slice(0, 2).map((tag, index) => (
            <View key={index} className="px-2 py-1 rounded-lg mr-2 mb-1 border" style={{ backgroundColor: Colors.background, borderColor: Colors.primary }}>
              <Text className="text-xs font-medium" style={{ color: Colors.primary }}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  favoriteButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  ratingContainer: {
    backgroundColor: 'transparent',
  },
  cuisineBadge: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  }
  ratingBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    minWidth: 46,
    alignItems: 'center',
    flexDirection: 'row',
  },
});

export const RecipeCard = memo(RecipeCardComponent);

