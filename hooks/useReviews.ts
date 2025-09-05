import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Review, RecipeRating } from '@/types/Review';

const REVIEWS_KEY = 'user_reviews';

export const useReviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      const stored = await AsyncStorage.getItem(REVIEWS_KEY);
      if (stored) {
        const reviewsData = JSON.parse(stored).map((review: any) => ({
          ...review,
          createdAt: new Date(review.createdAt),
          updatedAt: new Date(review.updatedAt)
        }));
        setReviews(reviewsData);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveReviews = async (reviewsData: Review[]) => {
    try {
      await AsyncStorage.setItem(REVIEWS_KEY, JSON.stringify(reviewsData));
      setReviews(reviewsData);
    } catch (error) {
      console.error('Error saving reviews:', error);
    }
  };

  const addReview = async (
    recipeId: string,
    recipeName: string,
    rating: number,
    comment: string,
    images?: string[]
  ): Promise<Review> => {
    const newReview: Review = {
      id: Date.now().toString(),
      recipeId,
      recipeName,
      userName: 'You', // In a real app, this would come from user profile
      rating,
      comment,
      images: images || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      helpful: 0
    };

    const updatedReviews = [...reviews, newReview];
    await saveReviews(updatedReviews);
    return newReview;
  };

  const updateReview = async (
    reviewId: string,
    rating: number,
    comment: string,
    images?: string[]
  ): Promise<Review | null> => {
    const reviewIndex = reviews.findIndex(r => r.id === reviewId);
    if (reviewIndex === -1) return null;

    const updatedReview = {
      ...reviews[reviewIndex],
      rating,
      comment,
      images: images || [],
      updatedAt: new Date()
    };

    const updatedReviews = [...reviews];
    updatedReviews[reviewIndex] = updatedReview;
    await saveReviews(updatedReviews);
    return updatedReview;
  };

  const deleteReview = async (reviewId: string) => {
    const updatedReviews = reviews.filter(r => r.id !== reviewId);
    await saveReviews(updatedReviews);
  };

  const getReviewsForRecipe = (recipeId: string): Review[] => {
    return reviews.filter(r => r.recipeId === recipeId);
  };

  const getUserReviewForRecipe = (recipeId: string): Review | undefined => {
    return reviews.find(r => r.recipeId === recipeId);
  };

  const getRecipeRating = (recipeId: string): RecipeRating => {
    const recipeReviews = getReviewsForRecipe(recipeId);
    
    if (recipeReviews.length === 0) {
      return {
        recipeId,
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      };
    }

    const totalRating = recipeReviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / recipeReviews.length;

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    recipeReviews.forEach(review => {
      distribution[review.rating as keyof typeof distribution]++;
    });

    return {
      recipeId,
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      totalReviews: recipeReviews.length,
      ratingDistribution: distribution
    };
  };

  const getAllUserReviews = (): Review[] => {
    return reviews.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  };

  return {
    reviews,
    loading,
    addReview,
    updateReview,
    deleteReview,
    getReviewsForRecipe,
    getUserReviewForRecipe,
    getRecipeRating,
    getAllUserReviews,
    refreshReviews: loadReviews
  };
};