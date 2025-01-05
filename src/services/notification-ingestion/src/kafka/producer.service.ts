import { Producer } from 'kafkajs';
import { IValidatedNotification } from '../types/notification.types';
import { KafkaConnection } from '../../../../shared/database/kafka.connection';

export class NotificationProducer {
    private producer: Producer;
    private static instance: NotificationProducer;

    private constructor() {
        this.producer = KafkaConnection.getInstance().getProducer();
    }

    public static getInstance(): NotificationProducer {
        if (!NotificationProducer.instance) {
            NotificationProducer.instance = new NotificationProducer();
        }
        return NotificationProducer.instance;
    }

    public async publishNotification(notification: IValidatedNotification): Promise<void> {
        try {
            await this.producer.send({
                topic: 'notifications',
                messages: [
                    {
                        key: notification.id,
                        value: JSON.stringify(notification),
                        headers: {
                            priority: notification.priority,
                            type: notification.type
                        }
                    }
                ]
            });

            console.log(`✅ Published notification: ${notification.id}`);
        } catch (error) {
            console.error('❌ Error publishing notification:', error);
            throw new Error('Failed to publish notification to Kafka');
        }
    }
}
