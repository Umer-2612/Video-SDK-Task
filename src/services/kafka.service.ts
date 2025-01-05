import { Kafka, Producer, Consumer, EachMessagePayload } from "kafkajs";
import { logger } from "../utils/logger";

export const NOTIFICATION_TOPIC = "notifications";

export enum KafkaTopics {
  NOTIFICATIONS = "notifications",
  SCHEDULED = "scheduled-notifications",
  AGGREGATED = "aggregated-notifications"
}

export enum ConsumerGroups {
  PROCESSOR = "notification-processor",
  SCHEDULER = "notification-scheduler",
  AGGREGATOR = "notification-aggregator"
}

class KafkaService {
  private static instance: KafkaService;
  private producer: Producer;
  private consumers: Map<string, Consumer> = new Map();
  private connected: boolean = false;

  private constructor() {
    const kafka = new Kafka({
      clientId: process.env.KAFKA_CLIENT_ID || "notification-service",
      brokers: (process.env.KAFKA_BROKERS || "localhost:9092").split(",")
    });

    this.producer = kafka.producer();
  }

  public static getInstance(): KafkaService {
    if (!KafkaService.instance) {
      KafkaService.instance = new KafkaService();
    }
    return KafkaService.instance;
  }

  public async connect(): Promise<void> {
    try {
      await this.producer.connect();
      this.connected = true;
      logger.info("Connected to Kafka");
    } catch (error) {
      logger.error("Failed to connect to Kafka:", error);
      throw error;
    }
  }

  public async publish(message: any): Promise<void> {
    try {
      if (!this.connected) {
        await this.connect();
      }

      await this.producer.send({
        topic: NOTIFICATION_TOPIC,
        messages: [{
          value: JSON.stringify(message)
        }]
      });
    } catch (error) {
      logger.error("Failed to publish message to Kafka:", error);
      throw error;
    }
  }

  public async subscribe(
    groupId: string,
    topics: string[],
    messageHandler: (message: EachMessagePayload) => Promise<void>
  ): Promise<void> {
    try {
      const kafka = new Kafka({
        clientId: process.env.KAFKA_CLIENT_ID || "notification-service",
        brokers: (process.env.KAFKA_BROKERS || "localhost:9092").split(",")
      });

      const consumer = kafka.consumer({ groupId });
      this.consumers.set(groupId, consumer);

      await consumer.connect();
      await Promise.all(topics.map(topic => consumer.subscribe({ topic })));

      await consumer.run({
        eachMessage: messageHandler
      });

      logger.info(`Subscribed to topics ${topics.join(", ")} with group ${groupId}`);
    } catch (error) {
      logger.error(`Failed to subscribe to topics ${topics.join(", ")}:`, error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.producer.disconnect();
      await Promise.all(
        Array.from(this.consumers.values()).map(consumer => consumer.disconnect())
      );
      this.connected = false;
      logger.info("Disconnected from Kafka");
    } catch (error) {
      logger.error("Failed to disconnect from Kafka:", error);
      throw error;
    }
  }
}

export default KafkaService.getInstance();
