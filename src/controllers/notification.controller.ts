import { Request, Response } from "express";
import { NotificationModel } from "../models/notification.model";
import {
  NotificationStatus,
  INotificationCreate,
} from "../interfaces/notification.interface";
import { logger } from "../utils/logger";

export class NotificationController {
  private static instance: NotificationController;

  private constructor() {}

  public static getInstance(): NotificationController {
    if (!NotificationController.instance) {
      NotificationController.instance = new NotificationController();
    }
    return NotificationController.instance;
  }

  public createNotification = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      console.log("helllo");
      const notificationData: INotificationCreate = req.body;

      const notification = new NotificationModel({
        ...notificationData,
        status: NotificationStatus.PENDING,
      });

      console.log({ notification });

      await notification.save();

      logger.info("Notification created successfully", {
        notificationId: notification._id,
      });

      res.status(201).json({
        status: "success",
        data: {
          notification: {
            id: notification._id,
            userId: notification.userId,
            type: notification.type,
            status: notification.status,
            createdAt: notification.createdAt,
          },
        },
      });
    } catch (error) {
      console.log({ error });
      logger.error("Error creating notification", { error });
      res.status(500).json({
        status: "error",
        message: "Failed to create notification",
      });
    }
  };

  public getNotifications = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { userId, status, type } = req.query;
      const filter: Record<string, any> = {};

      if (userId) filter.userId = userId;
      if (status) filter.status = status;
      if (type) filter.type = type;

      const notifications = await NotificationModel.find(filter)
        .sort({ createdAt: -1 })
        .limit(100);

      res.status(200).json({
        status: "success",
        data: {
          notifications,
        },
      });
    } catch (error) {
      logger.error("Error fetching notifications", { error });
      res.status(500).json({
        status: "error",
        message: "Failed to fetch notifications",
      });
    }
  };
}
