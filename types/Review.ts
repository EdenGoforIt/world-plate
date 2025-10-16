export interface Review {
  id: string;
  recipeId: string;
  recipeName: string;
  userId?: string;
  userName: string;
  userAvatar?: string;
  rating: number; // 1-5 stars
  comment: string;
  images?: string[]; // Optional photos
  date?: Date;
  createdAt: Date;
  updatedAt: Date;
  helpful: number; // Number of helpful votes
}

export interface RecipeRating {
  recipeId: string;
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}