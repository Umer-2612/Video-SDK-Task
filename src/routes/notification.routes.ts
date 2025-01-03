import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { validateNotification } from '../middleware/notification.validator';
import { BaseRoute } from './route.base';

export class NotificationRoutes extends BaseRoute {
  public path = '/notifications';
  public router = Router();
  private readonly controller = NotificationController.getInstance();

  constructor() {
    super();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Create notification
    this.router.post(
      `${this.path}/notify`,
      validateNotification,
      this.controller.createNotification
    );

    // Get notifications with filters
    this.router.get(
      this.path,
      this.controller.getNotifications
    );
  }
}
