import React, { useState, useEffect, useMemo } from 'react';
import { View, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import { useRecipes } from '../hooks/useRecipes';
import { useFavorites } from '../hooks/useFavorites';
import { calculateRecipeStats, getCuisineStats, getRecommendedRecipes } from '../utils/recipeAnalytics';
import { PieChart, BarChart, LineChart } from 'react-native-svg-charts';
import * as shape from 'd3-shape';
import { Circle, G, Line, Text as SvgText } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth } = Dimensions.get('window');

interface AnalyticsDashboardProps {
  onRecipeSelect?: (recipeId: string) => void;
}

export function AnalyticsDashboard({ onRecipeSelect }: AnalyticsDashboardProps) {
  const { recipes } = useRecipes();
  const { favorites } = useFavorites();
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'year'>('month');
  const [selectedMetric, setSelectedMetric] = useState<'cuisine' | 'difficulty' | 'mealType'>('cuisine');

  const stats = useMemo(() => {
    if (!recipes.length) return null;
    return calculateRecipeStats(recipes);
  }, [recipes]);

  const cuisineStats = useMemo(() => {
    if (!recipes.length) return [];
    return getCuisineStats(recipes);
  }, [recipes]);

  const favoriteRecipes = useMemo(() => {
    return recipes.filter(recipe => favorites.includes(recipe.id));
  }, [recipes, favorites]);

  const recommendations = useMemo(() => {
    if (!recipes.length || !favorites.length) return [];
    return getRecommendedRecipes(recipes, favorites, 5);
  }, [recipes, favorites]);

  if (!stats) {
    return (
      <ThemedView className="flex-1 justify-center items-center">
        <ThemedText className="text-lg text-gray-500">Loading analytics...</ThemedText>
      </ThemedView>
    );
  }

  const renderPieChart = (data: any[], colors: string[]) => {
    const pieData = data.map((item, index) => ({
      value: item.count,
      svg: {
        fill: colors[index % colors.length],
        onPress: () => console.log('Pressed', item),
      },
      key: `pie-${index}`,
      label: item.label,
    }));

    return (
      <View className="items-center">
        <PieChart
          style={{ height: 200, width: 200 }}
          data={pieData}
          innerRadius="40%"
          outerRadius="80%"
          labelRadius="90%"
        >
          <Labels />
        </PieChart>
        <View className="flex-row flex-wrap justify-center mt-4">
          {pieData.map((item, index) => (
            <View key={index} className="flex-row items-center mr-4 mb-2">
              <View
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: item.svg.fill }}
              />
              <ThemedText className="text-sm">{item.label}</ThemedText>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderBarChart = (data: any[], title: string) => {
    const barData = data.map(item => ({
      value: item.count,
      label: item.label,
      svg: {
        fill: '#3B82F6',
      },
    }));

    return (
      <View className="mb-6">
        <ThemedText className="text-lg font-semibold mb-4">{title}</ThemedText>
        <BarChart
          style={{ height: 200 }}
          data={barData}
          yAccessor={({ item }) => item.value}
          contentInset={{ top: 20, bottom: 20 }}
          spacing={0.2}
          gridMin={0}
        >
          <Grid />
        </BarChart>
        <View className="flex-row justify-between mt-2">
          {barData.map((item, index) => (
            <ThemedText key={index} className="text-xs text-center" style={{ width: screenWidth / barData.length }}>
              {item.label}
            </ThemedText>
          ))}
        </View>
      </View>
    );
  };

  const StatCard = ({ title, value, subtitle, color = '#3B82F6' }: {
    title: string;
    value: string | number;
    subtitle?: string;
    color?: string;
  }) => (
    <LinearGradient
      colors={[color + '20', color + '10']}
      className="p-4 rounded-xl mb-4"
      style={{ borderLeftWidth: 4, borderLeftColor: color }}
    >
      <ThemedText className="text-2xl font-bold" style={{ color }}>
        {value}
      </ThemedText>
      <ThemedText className="text-sm font-medium">{title}</ThemedText>
      {subtitle && <ThemedText className="text-xs text-gray-500 mt-1">{subtitle}</ThemedText>}
    </LinearGradient>
  );

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <ThemedView className="p-6">
        {/* Header */}
        <ThemedText className="text-3xl font-bold mb-6">Cooking Analytics</ThemedText>

        {/* Timeframe Selector */}
        <View className="flex-row mb-6 bg-white dark:bg-gray-800 rounded-lg p-1">
          {(['week', 'month', 'year'] as const).map((timeframe) => (
            <TouchableOpacity
              key={timeframe}
              onPress={() => setSelectedTimeframe(timeframe)}
              className={`flex-1 py-2 px-4 rounded-md ${
                selectedTimeframe === timeframe ? 'bg-blue-500' : ''
              }`}
            >
              <ThemedText
                className={`text-center capitalize ${
                  selectedTimeframe === timeframe ? 'text-white font-medium' : 'text-gray-600'
                }`}
              >
                {timeframe}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Key Stats */}
        <View className="mb-8">
          <ThemedText className="text-xl font-semibold mb-4">Overview</ThemedText>
          <View className="flex-row flex-wrap">
            <View className="w-1/2 pr-2">
              <StatCard
                title="Total Recipes"
                value={stats.totalRecipes}
                subtitle="In your collection"
                color="#10B981"
              />
            </View>
            <View className="w-1/2 pl-2">
              <StatCard
                title="Favorite Recipes"
                value={favorites.length}
                subtitle={`${((favorites.length / stats.totalRecipes) * 100).toFixed(1)}% of total`}
                color="#F59E0B"
              />
            </View>
            <View className="w-1/2 pr-2">
              <StatCard
                title="Avg. Cook Time"
                value={`${stats.averageCookTime}min`}
                subtitle="Per recipe"
                color="#8B5CF6"
              />
            </View>
            <View className="w-1/2 pl-2">
              <StatCard
                title="Cuisines"
                value={stats.uniqueCuisines}
                subtitle="Different cultures"
                color="#EF4444"
              />
            </View>
          </View>
        </View>

        {/* Charts Section */}
        <View className="mb-8">
          <ThemedText className="text-xl font-semibold mb-4">Insights</ThemedText>

          {/* Metric Selector */}
          <View className="flex-row mb-4 bg-white dark:bg-gray-800 rounded-lg p-1">
            {[
              { key: 'cuisine', label: 'By Cuisine' },
              { key: 'difficulty', label: 'By Difficulty' },
              { key: 'mealType', label: 'By Meal Type' },
            ].map((option) => (
              <TouchableOpacity
                key={option.key}
                onPress={() => setSelectedMetric(option.key as any)}
                className={`flex-1 py-2 px-4 rounded-md ${
                  selectedMetric === option.key ? 'bg-blue-500' : ''
                }`}
              >
                <ThemedText
                  className={`text-center text-sm ${
                    selectedMetric === option.key ? 'text-white font-medium' : 'text-gray-600'
                  }`}
                >
                  {option.label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>

          {/* Pie Chart */}
          <View className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-6">
            <ThemedText className="text-lg font-semibold mb-4 text-center">
              Recipe Distribution
            </ThemedText>
            {selectedMetric === 'cuisine' && renderPieChart(
              cuisineStats.slice(0, 8),
              ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F']
            )}
            {selectedMetric === 'difficulty' && renderPieChart(
              stats.difficultyBreakdown,
              ['#10B981', '#F59E0B', '#EF4444']
            )}
            {selectedMetric === 'mealType' && renderPieChart(
              stats.mealTypeBreakdown,
              ['#8B5CF6', '#3B82F6', '#06B6D4', '#10B981']
            )}
          </View>
        </View>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <View className="mb-8">
            <ThemedText className="text-xl font-semibold mb-4">Recommended for You</ThemedText>
            <View className="bg-white dark:bg-gray-800 rounded-xl p-4">
              {recommendations.map((recipe, index) => (
                <TouchableOpacity
                  key={recipe.id}
                  onPress={() => onRecipeSelect?.(recipe.id)}
                  className="flex-row items-center py-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                >
                  <View className="w-8 h-8 bg-blue-500 rounded-full items-center justify-center mr-3">
                    <ThemedText className="text-white font-bold text-sm">{index + 1}</ThemedText>
                  </View>
                  <View className="flex-1">
                    <ThemedText className="font-medium">{recipe.name}</ThemedText>
                    <ThemedText className="text-sm text-gray-500">{recipe.cuisine}</ThemedText>
                  </View>
                  <ThemedText className="text-sm text-blue-500">View →</ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Favorite Stats */}
        {favoriteRecipes.length > 0 && (
          <View className="mb-8">
            <ThemedText className="text-xl font-semibold mb-4">Your Favorites</ThemedText>
            <View className="bg-white dark:bg-gray-800 rounded-xl p-4">
              <View className="flex-row justify-between mb-4">
                <StatCard
                  title="Avg Rating"
                  value={favoriteRecipes.reduce((sum, r) => sum + (r.rating || 0), 0) / favoriteRecipes.length}
                  subtitle="Out of 5 stars"
                  color="#F59E0B"
                />
                <StatCard
                  title="Total Time"
                  value={`${favoriteRecipes.reduce((sum, r) => sum + r.cookTime, 0)}min`}
                  subtitle="Cooking time"
                  color="#10B981"
                />
              </View>
              <ThemedText className="text-sm text-gray-500 text-center">
                You have {favoriteRecipes.length} favorite recipes from {new Set(favoriteRecipes.map(r => r.cuisine)).size} different cuisines
              </ThemedText>
            </View>
          </View>
        )}
      </ThemedView>
    </ScrollView>
  );
}

// Custom chart components
const Labels = ({ slices }: any) => {
  return slices.map((slice: any, index: number) => {
    const { labelCentroid, pieCentroid, data } = slice;
    return (
      <G key={index}>
        <Line
          x1={labelCentroid[0]}
          y1={labelCentroid[1]}
          x2={pieCentroid[0]}
          y2={pieCentroid[1]}
          stroke={data.svg.fill}
          strokeWidth={1}
        />
        <Circle
          cx={labelCentroid[0]}
          cy={labelCentroid[1]}
          r={15}
          fill={data.svg.fill}
        />
        <SvgText
          x={labelCentroid[0]}
          y={labelCentroid[1] + 3}
          fill="white"
          textAnchor="middle"
          alignmentBaseline="middle"
          fontSize={10}
          fontWeight="bold"
        >
          {data.value}
        </SvgText>
      </G>
    );
  });
};

const Grid = ({ x, y, ticks }: any) => {
  return ticks.map((tick: any) => (
    <Line
      key={tick}
      x1="0%"
      x2="100%"
      y1={y(tick)}
      y2={y(tick)}
      stroke="#E5E7EB"
      strokeWidth={1}
    />
  ));
};