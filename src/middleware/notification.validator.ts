import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import { NotificationType } from "../interfaces/notification.interface";

const notificationSchema = Joi.object({
  userId: Joi.string().required(),
  type: Joi.string()
    .valid(...Object.values(NotificationType))
    .required(),
  title: Joi.string().required().min(1).max(200),
  content: Joi.string().required().min(1).max(1000),
  metadata: Joi.object().optional(),
});

export const validateNotification = (
  req: Request,
  res: Response,
  next: NextFunction
): Response | void => {
  const { error } = notificationSchema.validate(req.body, {
    abortEarly: false,
  });

  console.log({ error });

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
