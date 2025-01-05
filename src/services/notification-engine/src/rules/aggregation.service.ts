import { IValidatedNotification, NotificationPriority } from '../../../notification-ingestion/src/types/notification.types';
import { Client } from '@elastic/elasticsearch';
import { ElasticsearchConnection } from '../../../shared/database/elasticsearch.connection';

export class AggregationService {
    private static client: Client = ElasticsearchConnection.getInstance().getClient();
    private static readonly INDEX = 'notifications';

    public static async aggregateLowPriorityNotifications(userId: string): Promise<IValidatedNotification | null> {
        try {
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

            const response = await this.client.search({
                index: this.INDEX,
                body: {
                    query: {
                        bool: {
                            must: [
                                { match: { userId } },
                                { match: { priority: NotificationPriority.LOW } },
                                {
                                    range: {
                                        sendTime: {
                                            gte: oneHourAgo.toISOString(),
                                            lte: new Date().toISOString()
                                        }
                                    }
                                }
                            ]
                        }
                    },
                    size: 10
                }
            });

            const notifications = response.hits.hits.map(hit => hit._source as IValidatedNotification);
            
            if (notifications.length < 2) {
                return null; // Don't aggregate single notification
            }

            // Create summary notification
            return {
                id: `agg_${Date.now()}`,
                userId,
                type: notifications[0].type,
                priority: NotificationPriority.LOW,
                message: this.createSummaryMessage(notifications),
                createdAt: new Date(),
                status: notifications[0].status,
                channels: notifications[0].channels
            };
        } catch (error) {
            console.error('Error aggregating notifications:', error);
            return null;
        }
    }

    private static createSummaryMessage(notifications: IValidatedNotification[]): string {
        const summary = `You have ${notifications.length} new notifications:\n\n`;
        const details = notifications
            .map(n => `- ${n.message}`)
            .join('\n');
        
        return `${summary}${details}`;
    }
}
