import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { NotificationValidator } from '../validation/notification.validator';
import { NotificationProducer } from '../kafka/producer.service';
import { INotificationRequest, IValidatedNotification, NotificationStatus } from '../types/notification.types';

export class NotificationController {
    private static producer = NotificationProducer.getInstance();

    public static async notify(req: Request, res: Response): Promise<void> {
        try {
            // Validate request body
            const validatedData: INotificationRequest = NotificationValidator.validate(req.body);

            // Create notification object
            const notification: IValidatedNotification = {
                ...validatedData,
                id: uuidv4(),
                createdAt: new Date(),
                status: NotificationStatus.PENDING
            };

            // Publish to Kafka
            await NotificationController.producer.publishNotification(notification);

            res.status(202).json({
                status: 'success',
                message: 'Notification accepted',
                data: {
                    notificationId: notification.id,
                    status: notification.status
                }
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Internal server error';
            res.status(400).json({
                status: 'error',
                message: errorMessage
            });
        }
    }

    public static async getStatus(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        
        // TODO: Implement status check from database
        res.status(200).json({
            status: 'success',
            message: 'Status retrieved successfully',
            data: {
                notificationId: id,
                status: NotificationStatus.PENDING
            }
        });
    }
}
