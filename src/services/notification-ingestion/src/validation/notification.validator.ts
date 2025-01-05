import Joi from 'joi';
import { INotificationRequest, NotificationType, NotificationPriority, NotificationChannel } from '../types/notification.types';

const notificationSchema = Joi.object({
    userId: Joi.string().required(),
    message: Joi.string().required().min(1).max(1000),
    type: Joi.string()
        .valid(...Object.values(NotificationType))
        .required(),
    priority: Joi.string()
        .valid(...Object.values(NotificationPriority))
        .required(),
    sendTime: Joi.date().iso().min('now').optional(),
    metadata: Joi.object().optional(),
    channels: Joi.array()
        .items(Joi.string().valid(...Object.values(NotificationChannel)))
        .optional()
});

export class NotificationValidator {
    public static validate(data: any): INotificationRequest {
        const { error, value } = notificationSchema.validate(data, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const errorMessage = error.details
                .map(detail => detail.message)
                .join(', ');
            throw new Error(`Invalid notification request: ${errorMessage}`);
        }

        return value;
    }
}
