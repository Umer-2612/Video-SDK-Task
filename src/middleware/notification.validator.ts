import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import { 
  NotificationType, 
  NotificationPriority, 
  NotificationCategory 
} from "../interfaces/notification.interface";

const notificationSchema = Joi.object({
  userId: Joi.string()
    .required()
    .messages({
      "any.required": "User ID is required",
    }),
  type: Joi.string()
    .valid(...Object.values(NotificationType))
    .required()
    .messages({
      "any.required": "Notification type is required",
      "any.only": "Invalid notification type",
    }),
  category: Joi.string()
    .valid(...Object.values(NotificationCategory))
    .required()
    .messages({
      "any.required": "Notification category is required",
      "any.only": "Invalid notification category",
    }),
  priority: Joi.string()
    .valid(...Object.values(NotificationPriority))
    .default(NotificationPriority.MEDIUM)
    .messages({
      "any.only": "Invalid notification priority",
    }),
  title: Joi.string()
    .required()
    .min(1)
    .max(200)
    .messages({
      "any.required": "Title is required",
      "string.min": "Title cannot be empty",
      "string.max": "Title cannot exceed 200 characters",
    }),
  content: Joi.string()
    .required()
    .min(1)
    .max(1000)
    .messages({
      "any.required": "Content is required",
      "string.min": "Content cannot be empty",
      "string.max": "Content cannot exceed 1000 characters",
    }),
  templateId: Joi.string(),
  templateData: Joi.object(),
  metadata: Joi.object(),
  scheduledFor: Joi.date()
    .greater("now")
    .messages({
      "date.greater": "Scheduled date must be in the future",
    }),
  expiresAt: Joi.date()
    .greater(Joi.ref("scheduledFor"))
    .messages({
      "date.greater": "Expiration date must be after scheduled date",
    }),
  batchId: Joi.string(),
  groupId: Joi.string(),
});

export const validateNotification = (
  req: Request,
  res: Response,
  next: NextFunction
): Response | void => {
  const { error } = notificationSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    return res.status(400).json({
      status: "error",
      message: "Invalid notification data",
      errors: error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      })),
    });
  }

  next();
};
