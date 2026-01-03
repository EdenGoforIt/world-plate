import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { logger } from "../config/env";

export interface NotificationSettings {
  mealReminders: boolean;
  newRecipeAlerts: boolean;
  weeklyDigest: boolean;
  reminderTime: string; // HH:MM format
}

export interface ScheduledNotification {
  id: string;
  type: "meal_reminder" | "recipe_alert" | "weekly_digest";
  title: string;
  body: string;
  scheduledTime: Date;
  data?: any;
}

class NotificationService {
  private static instance: NotificationService;
  private settings: NotificationSettings = {
    mealReminders: true,
    newRecipeAlerts: true,
    weeklyDigest: true,
    reminderTime: "12:00",
  };

  private constructor() {
    this.initialize();
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private async initialize() {
    // Request permissions
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") {
      console.warn("Notification permissions not granted");
      return;
    }

    // Configure notification handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    // Load saved settings
    await this.loadSettings();

    // Set up notification categories for actions
    if (Platform.OS === "ios") {
      await Notifications.setNotificationCategoryAsync("meal_reminder", [
        {
          identifier: "view_recipe",
          buttonTitle: "View Recipe",
          options: {
            opensAppToForeground: true,
          },
        },
        {
          identifier: "snooze",
          buttonTitle: "Remind Later",
          options: {
            opensAppToForeground: false,
          },
        },
      ]);
    }
  }

  async loadSettings(): Promise<void> {
    try {
      const saved = await AsyncStorage.getItem("notification_settings");
      if (saved) {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error("Failed to load notification settings:", error);
    }
  }

  async saveSettings(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        "notification_settings",
        JSON.stringify(this.settings)
      );
    } catch (error) {
      console.error("Failed to save notification settings:", error);
    }
  }

  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  async updateSettings(
    newSettings: Partial<NotificationSettings>
  ): Promise<void> {
    this.settings = { ...this.settings, ...newSettings };
    await this.saveSettings();
  }

  async scheduleMealReminder(
    recipeName: string,
    mealType: string,
    scheduledTime: Date,
    recipeId: string
  ): Promise<string> {
    if (!this.settings.mealReminders) return "";

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `🍽️ Time to cook: ${recipeName}`,
        body: `Your ${mealType} is ready to prepare!`,
        data: {
          type: "meal_reminder",
          recipeId,
          mealType,
        },
        categoryIdentifier: "meal_reminder",
      },
      trigger: { date: scheduledTime },
    });

    return notificationId;
  }

  async scheduleNewRecipeAlert(
    recipeName: string,
    cuisine: string
  ): Promise<string> {
    if (!this.settings.newRecipeAlerts) return "";

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "🆕 New Recipe Available!",
        body: `Discover ${recipeName} from ${cuisine} cuisine`,
        data: {
          type: "recipe_alert",
          recipeName,
          cuisine,
        },
      },
      trigger: null, // Send immediately
    });

    return notificationId;
  }

  async scheduleWeeklyDigest(): Promise<string> {
    if (!this.settings.weeklyDigest) return "";

    // Schedule for next Sunday at reminder time
    const now = new Date();
    const nextSunday = new Date(now);
    nextSunday.setDate(now.getDate() + (7 - now.getDay()));
    const [hours, minutes] = this.settings.reminderTime.split(":");
    nextSunday.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "📊 Your Weekly Cooking Digest",
        body: "Check out your cooking stats and new recipe recommendations!",
        data: {
          type: "weekly_digest",
        },
      },
      trigger: { date: nextSunday },
    });

    return notificationId;
  }

  async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  async getScheduledNotifications(): Promise<
    Notifications.NotificationRequest[]
  > {
    return await Notifications.getAllScheduledNotificationsAsync();
  }

  // Utility methods for meal planning integration
  async scheduleMealPlanReminders(mealPlan: any): Promise<void> {
    if (!this.settings.mealReminders) return;

    // Cancel existing meal reminders
    const existing = await this.getScheduledNotifications();
    const mealReminders = existing.filter(
      (n) => n.content.data?.type === "meal_reminder"
    );
    for (const reminder of mealReminders) {
      await this.cancelNotification(reminder.identifier);
    }

    // Schedule new reminders for upcoming meals
    const now = new Date();
    for (const day of mealPlan.meals || []) {
      const mealDate = new Date(day.date);

      // Only schedule for future meals
      if (mealDate < now) continue;

      const meals = [
        { type: "breakfast", recipe: day.breakfast, hour: 8 },
        { type: "lunch", recipe: day.lunch, hour: 12 },
        { type: "dinner", recipe: day.dinner, hour: 18 },
      ];

      for (const meal of meals) {
        if (meal.recipe) {
          const reminderTime = new Date(mealDate);
          reminderTime.setHours(meal.hour, 0, 0, 0);

          // Schedule reminder 30 minutes before meal time
          reminderTime.setMinutes(reminderTime.getMinutes() - 30);

          if (reminderTime > now) {
            await this.scheduleMealReminder(
              meal.recipe.name,
              meal.type,
              reminderTime,
              meal.recipe.id
            );
          }
        }
      }
    }
  }

  // Handle notification responses (when user taps on notification)
  async handleNotificationResponse(
    response: Notifications.NotificationResponse
  ): Promise<void> {
    const { notification } = response;
    const data = notification.request.content.data;

    if (!data) return;

    // Handle different notification types
    switch (data.type) {
      case "meal_reminder":
        // Navigate to recipe
        if (data.recipeId) {
          // This would typically trigger navigation
          logger.info("Navigate to recipe:", data.recipeId);
        }
        break;

      case "recipe_alert":
        // Navigate to explore with filters
        logger.info("Navigate to explore with cuisine:", data.cuisine);
        break;

      case "weekly_digest":
        // Navigate to profile/analytics
        logger.info("Navigate to analytics");
        break;
    }
  }
}

export const notificationService = NotificationService.getInstance();
