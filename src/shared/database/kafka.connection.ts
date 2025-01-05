import { Kafka, Producer, Consumer } from 'kafkajs';
import { databaseConfig } from '../config/database.config';

export class KafkaConnection {
    private static instance: KafkaConnection;
    private kafka: Kafka;
    private producer: Producer;

    private constructor() {
        this.kafka = new Kafka({
            clientId: databaseConfig.kafka.clientId,
            brokers: databaseConfig.kafka.brokers
        });
        this.producer = this.kafka.producer();
    }

    public static getInstance(): KafkaConnection {
        if (!KafkaConnection.instance) {
            KafkaConnection.instance = new KafkaConnection();
        }
        return KafkaConnection.instance;
    }

    public async connect(): Promise<void> {
        try {
            await this.producer.connect();
            console.log('✅ Kafka connected successfully');
        } catch (error) {
            console.error('❌ Kafka connection error:', error);
            process.exit(1);
        }
    }

    public getProducer(): Producer {
        return this.producer;
    }

    public createConsumer(groupId: string): Consumer {
        return this.kafka.consumer({ groupId });
    }

    public async disconnect(): Promise<void> {
        try {
            await this.producer.disconnect();
            console.log('Kafka disconnected');
        } catch (error) {
            console.error('Kafka disconnection error:', error);
        }
    }
}
