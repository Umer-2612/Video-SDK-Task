import { Request, Response } from "express";
import { NotificationModel } from "../models/notification.model";
import { NotificationStatus } from "../interfaces/notification.interface";
import { logger } from "../utils/logger";

export class AnalyticsController {
  private static instance: AnalyticsController;

  private constructor() {}

  public static getInstance(): AnalyticsController {
    if (!AnalyticsController.instance) {
      AnalyticsController.instance = new AnalyticsController();
    }
    return AnalyticsController.instance;
  }

  public getDeliveryStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const { startDate, endDate, userId } = req.query;
      const query: any = {};

      // Add date range to query
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate as string);
        if (endDate) query.createdAt.$lte = new Date(endDate as string);
      }

      // Add user filter if specified
      if (userId) query.userId = userId;

      // Get notification counts by status
      const [
        total,
        sent,
        delivered,
        failed,
        retried,
        aggregated
      ] = await Promise.all([
        NotificationModel.countDocuments(query),
        NotificationModel.countDocuments({ ...query, status: NotificationStatus.SENT }),
        NotificationModel.countDocuments({ ...query, status: NotificationStatus.DELIVERED }),
        NotificationModel.countDocuments({ ...query, status: NotificationStatus.FAILED }),
        NotificationModel.countDocuments({
          ...query,
          'deliveryAttempts.1': { $exists: true } // At least 2 delivery attempts
        }),
        NotificationModel.countDocuments({ ...query, status: NotificationStatus.AGGREGATED })
      ]);

      // Calculate average delivery time
      const deliveredNotifications = await NotificationModel.find({
        ...query,
        status: NotificationStatus.DELIVERED,
        deliveredAt: { $exists: true },
        createdAt: { $exists: true }
      });

      let totalDeliveryTime = 0;
      let deliveryTimeCount = 0;

      deliveredNotifications.forEach(notification => {
        if (notification.deliveredAt && notification.createdAt) {
          totalDeliveryTime += notification.deliveredAt.getTime() - notification.createdAt.getTime();
          deliveryTimeCount++;
        }
      });

      const avgDeliveryTime = deliveryTimeCount > 0 
        ? totalDeliveryTime / deliveryTimeCount / 1000 // Convert to seconds
        : 0;

      // Calculate response rate (read notifications)
      const readCount = await NotificationModel.countDocuments({
        ...query,
        status: NotificationStatus.READ
      });

      const responseRate = total > 0 ? (readCount / total) * 100 : 0;

      // Get stats by notification type
      const typeStats = await NotificationModel.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            successCount: {
              $sum: {
                $cond: [
                  { $eq: ['$status', NotificationStatus.DELIVERED] },
                  1,
                  0
                ]
              }
            }
          }
        }
      ]);

      res.status(200).json({
        status: 'success',
        data: {
          overview: {
            total,
            sent,
            delivered,
            failed,
            retried,
            aggregated
          },
          performance: {
            averageDeliveryTime: avgDeliveryTime,
            responseRate: responseRate.toFixed(2) + '%',
            successRate: ((delivered / total) * 100).toFixed(2) + '%'
          },
          byType: typeStats.reduce((acc, stat) => ({
            ...acc,
            [stat._id]: {
              total: stat.count,
              successRate: ((stat.successCount / stat.count) * 100).toFixed(2) + '%'
            }
          }), {})
        }
      });
    } catch (error) {
      logger.error('Error generating analytics:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to generate analytics'
      });
    }
  };

  public getUserEngagement = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, startDate, endDate } = req.query;
      const query: any = {};

      if (userId) query.userId = userId;
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate as string);
        if (endDate) query.createdAt.$lte = new Date(endDate as string);
      }

      // Get user engagement metrics
      const [
        totalSent,
        totalRead,
        totalInteracted
      ] = await Promise.all([
        NotificationModel.countDocuments(query),
        NotificationModel.countDocuments({ ...query, status: NotificationStatus.READ }),
        NotificationModel.countDocuments({ 
          ...query, 
          status: NotificationStatus.READ,
          readAt: { $exists: true }
        })
      ]);

      // Calculate average response time
      const readNotifications = await NotificationModel.find({
        ...query,
        status: NotificationStatus.READ,
        readAt: { $exists: true },
        deliveredAt: { $exists: true }
      });

      let totalResponseTime = 0;
      let responseTimeCount = 0;

      readNotifications.forEach(notification => {
        if (notification.readAt && notification.deliveredAt) {
          totalResponseTime += notification.readAt.getTime() - notification.deliveredAt.getTime();
          responseTimeCount++;
        }
      });

      const avgResponseTime = responseTimeCount > 0 
        ? totalResponseTime / responseTimeCount / 1000 // Convert to seconds
        : 0;

      res.status(200).json({
        status: 'success',
        data: {
          engagement: {
            totalNotifications: totalSent,
            readRate: totalSent > 0 ? ((totalRead / totalSent) * 100).toFixed(2) + '%' : '0%',
            interactionRate: totalSent > 0 ? ((totalInteracted / totalSent) * 100).toFixed(2) + '%' : '0%',
            averageResponseTime: avgResponseTime
          },
          timeDistribution: await this.getTimeDistribution(query)
        }
      });
    } catch (error) {
      logger.error('Error generating user engagement metrics:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to generate user engagement metrics'
      });
    }
  };

  private async getTimeDistribution(query: any): Promise<any> {
    const notifications = await NotificationModel.find({
      ...query,
      deliveredAt: { $exists: true }
    });

    const hourlyDistribution = new Array(24).fill(0);
    notifications.forEach(notification => {
      if (notification.deliveredAt) {
        const hour = notification.deliveredAt.getHours();
        hourlyDistribution[hour]++;
      }
    });

    return {
      hourlyDistribution,
      peakHours: hourlyDistribution
        .map((count, hour) => ({ hour, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)
    };
  }
}
