import { IValidatedNotification } from '../../../notification-ingestion/src/types/notification.types';
import { Client } from '@elastic/elasticsearch';
import { ElasticsearchConnection } from '../../../shared/database/elasticsearch.connection';

export class DeduplicationService {
    private static client: Client = ElasticsearchConnection.getInstance().getClient();
    private static readonly INDEX = 'notifications';

    public static async isDuplicate(notification: IValidatedNotification): Promise<boolean> {
        try {
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

            const response = await this.client.search({
                index: this.INDEX,
                body: {
                    query: {
                        bool: {
                            must: [
                                { match: { userId: notification.userId } },
                                { match: { message: notification.message } },
                                { match: { type: notification.type } },
                                {
                                    range: {
                                        createdAt: {
                                            gte: oneHourAgo.toISOString()
                                        }
                                    }
                                }
                            ]
                        }
                    }
                }
            });

            return response.hits.total.value > 0;
        } catch (error) {
            console.error('Error checking for duplicates:', error);
            return false; // Allow notification on error
        }
    }

    public static async storeNotification(notification: IValidatedNotification): Promise<void> {
        try {
            await this.client.index({
                index: this.INDEX,
                body: {
                    ...notification,
                    createdAt: new Date()
                }
            });
        } catch (error) {
            console.error('Error storing notification:', error);
        }
    }
}
