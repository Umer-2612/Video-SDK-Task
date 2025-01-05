import { Request, Response } from "express";
import { UserPreferencesModel } from "../models/user-preferences.model";
import { HttpException } from "../middleware/errorHandler";
import { IUserPreference } from "../interfaces/user-preference.interface";
import { logger } from "../utils/logger";
import { Types } from "mongoose";

export class UserPreferenceController {
  private static instance: UserPreferenceController;
  private constructor() {}

  public static getInstance(): UserPreferenceController {
    if (!UserPreferenceController.instance) {
      UserPreferenceController.instance = new UserPreferenceController();
    }
    return UserPreferenceController.instance;
  }

  /**
   * Get user preferences by userId
   */
  public getUserPreferences = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const userId = new Types.ObjectId(req.params.userId);
      logger.info(`Fetching preferences for user: ${userId}`);

      const preferences = await UserPreferencesModel.findOne({ userId });

      if (!preferences) {
        // Return default preferences if none exist
        const defaultPreferences: IUserPreference = {
          userId,
          notifications: {
            email: { enabled: true },
            sms: { enabled: false },
            push: { enabled: true },
          },
          categories: {},
          timezone: "UTC",
        };

        // Create default preferences in database
        const newPreferences = await UserPreferencesModel.create(
          defaultPreferences
        );
        res.status(200).json(newPreferences);
        return;
      }

      res.status(200).json(preferences);
    } catch (error) {
      logger.error("Error in getUserPreferences:", error);
      throw new HttpException(500, "Error fetching user preferences");
    }
  };

  /**
   * Update user preferences
   */
  public updateUserPreferences = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const userId = new Types.ObjectId(req.params.userId);
      const updateData: Partial<IUserPreference> = {
        ...req.body,
        userId: new Types.ObjectId(req.body.userId)
      };

      logger.info(`Updating preferences for user: ${userId}`);

      // Validate userId match
      if (updateData.userId && updateData.userId.toString() !== userId.toString()) {
        throw new HttpException(
          400,
          "userId in body does not match route parameter"
        );
      }

      // Ensure userId is set in update data
      const preferences = await UserPreferencesModel.findOneAndUpdate(
        { userId },
        { $set: updateData },
        {
          new: true, // Return updated document
          upsert: true, // Create if doesn't exist
          runValidators: true, // Run model validators
        }
      );

      logger.info(`Successfully updated preferences for user: ${userId}`);
      res.status(200).json(preferences);
    } catch (error) {
      logger.error("Error in updateUserPreferences:", error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(500, "Error updating user preferences");
    }
  };
}
