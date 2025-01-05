import { Request, Response } from "express";
import { NotificationPreferenceModel } from "../models/notification-preference.model";
import { UserModel } from "../models/user.model";
import { logger } from "../utils/logger";
import { NotificationType } from "../interfaces/notification.interface";

export class NotificationPreferenceController {
  private static instance: NotificationPreferenceController;

  private constructor() {}

  public static getInstance(): NotificationPreferenceController {
    if (!NotificationPreferenceController.instance) {
      NotificationPreferenceController.instance =
        new NotificationPreferenceController();
    }
    return NotificationPreferenceController.instance;
  }

  public createOrUpdatePreferences = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { userId } = req.params;
      const preferenceData = req.body;

      // Check if user exists
      const user = await UserModel.findOne({ userId });
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      // Validate channel preferences
      if (preferenceData.channels) {
        for (const channel of Object.keys(preferenceData.channels)) {
          if (
            !Object.values(NotificationType).includes(
              channel as NotificationType
            )
          ) {
            res.status(400).json({
              message: `Invalid channel type: ${channel}`,
            });
            return;
          }
        }
      }

      // Create or update preferences
      const preferences = await NotificationPreferenceModel.findOneAndUpdate(
        { userId },
        {
          $set: {
            ...preferenceData,
            userId,
          },
        },
        {
          new: true,
          upsert: true,
        }
      );

      logger.info("Notification preferences updated", {
        userId,
        preferences,
      });

      res.status(200).json({
        status: "success",
        data: preferences,
      });
    } catch (error) {
      logger.error("Error updating notification preferences:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  public getPreferences = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { userId } = req.params;

      const preferences = await NotificationPreferenceModel.findOne({ userId });
      if (!preferences) {
        res.status(404).json({ message: "Preferences not found" });
        return;
      }

      res.status(200).json({
        status: "success",
        data: preferences,
      });
    } catch (error) {
      logger.error("Error fetching notification preferences:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  public updateChannelPreferences = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { userId, channel } = req.params;
      const channelData = req.body;

      // Validate channel type
      if (
        !Object.values(NotificationType).includes(channel as NotificationType)
      ) {
        res.status(400).json({
          message: `Invalid channel type: ${channel}`,
        });
        return;
      }

      const preferences = await NotificationPreferenceModel.findOneAndUpdate(
        { userId },
        {
          $set: {
            [`channels.${channel}`]: channelData,
          },
        },
        {
          new: true,
          upsert: true,
        }
      );

      logger.info(`Channel preferences updated for ${channel}`, {
        userId,
        channel,
        preferences,
      });

      res.status(200).json({
        status: "success",
        data: preferences,
      });
    } catch (error) {
      logger.error("Error updating channel preferences:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  public updateQuietHours = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { userId } = req.params;
      const { enabled, start, end } = req.body;

      // Validate time format
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (start && !timeRegex.test(start)) {
        res
          .status(400)
          .json({ message: "Invalid start time format. Use HH:mm" });
        return;
      }
      if (end && !timeRegex.test(end)) {
        res.status(400).json({ message: "Invalid end time format. Use HH:mm" });
        return;
      }

      const preferences = await NotificationPreferenceModel.findOneAndUpdate(
        { userId },
        {
          $set: {
            globalQuietHours: { enabled, start, end },
          },
        },
        {
          new: true,
          upsert: true,
        }
      );

      logger.info("Quiet hours updated", {
        userId,
        quietHours: preferences.globalQuietHours,
      });

      res.status(200).json({
        status: "success",
        data: preferences,
      });
    } catch (error) {
      logger.error("Error updating quiet hours:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
}
