import { Kafka, Producer, Consumer, Admin, ITopicConfig } from "kafkajs";
import { logger } from "../utils/logger";

const DEAD_LETTER_TOPIC = "notifications.dlq";
const MAX_RETRIES = 3;

class KafkaService {
  private static instance: KafkaService;
  private kafka: Kafka;
  private producer: Producer;
  private admin: Admin;
  private consumers: Map<string, Consumer> = new Map();
  private connected: boolean = false;
  private connectionRetries: number = 0;

  private constructor() {
    this.kafka = new Kafka({
      clientId: "notification-service",
      brokers: (process.env.KAFKA_BROKERS || "kafka:29092").split(","),
      retry: {
        initialRetryTime: 100,
        retries: 8,
      },
    });
    this.producer = this.kafka.producer({
      retry: { retries: MAX_RETRIES },
    });
    this.admin = this.kafka.admin();
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
      await this.admin.connect();
      this.connected = true;
      this.connectionRetries = 0;
      logger.info("Successfully connected to Kafka");
    } catch (error) {
      this.connectionRetries++;
      logger.error("Failed to connect to Kafka:", error);

      if (this.connectionRetries < MAX_RETRIES) {
        const retryDelay = Math.pow(2, this.connectionRetries) * 1000;
        logger.info(`Retrying connection in ${retryDelay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        await this.connect();
      } else {
        throw new Error("Max connection retries reached");
      }
    }
  }

  public async createTopic(topic: string): Promise<void> {
    try {
      const topics: ITopicConfig[] = [
        {
          topic,
          numPartitions: 3,
          replicationFactor: 1,
        },
      ];

      await this.admin.createTopics({
        topics,
        waitForLeaders: true,
      });

      // Also create DLQ topic if it doesn't exist
      await this.admin.createTopics({
        topics: [
          {
            topic: DEAD_LETTER_TOPIC,
            numPartitions: 1,
            replicationFactor: 1,
          },
        ],
        waitForLeaders: true,
      });
    } catch (error: any) {
      if (!(error.message || "").includes("already exists")) {
        throw error;
      }
    }
  }

  public async produce(topic: string, message: any): Promise<void> {
    try {
      if (!this.connected) {
        await this.connect();
      }

      await this.producer.send({
        topic,
        messages: [{ value: JSON.stringify(message) }],
      });
    } catch (error: any) {
      logger.error("Error producing message:", error);
      await this.handleProducerError(topic, message, error);
    }
  }

  private async handleProducerError(
    topic: string,
    message: any,
    error: Error
  ): Promise<void> {
    // Send to Dead Letter Queue
    try {
      await this.producer.send({
        topic: DEAD_LETTER_TOPIC,
        messages: [
          {
            value: JSON.stringify({
              originalTopic: topic,
              message,
              error: error.message,
              timestamp: new Date().toISOString(),
            }),
          },
        ],
      });
    } catch (dlqError) {
      logger.error("Failed to send message to DLQ:", dlqError);
      throw error; // Re-throw original error if DLQ fails
    }
  }

  public async consume(
    topic: string,
    groupId: string,
    callback: (message: any) => Promise<void>
  ): Promise<void> {
    const consumer = this.kafka.consumer({ groupId });
    this.consumers.set(groupId, consumer);

    try {
      await consumer.connect();
      await consumer.subscribe({ topic, fromBeginning: false });

      await consumer.run({
        eachMessage: async ({ message }) => {
          try {
            const messageValue = JSON.parse(message.value?.toString() || "");
            await callback(messageValue);
          } catch (error: any) {
            logger.error("Error processing message:", error);
            await this.handleConsumerError(topic, message.value, error);
          }
        },
      });
    } catch (error: any) {
      logger.error("Consumer error:", error);
      await this.handleConsumerError(topic, null, error);
    }
  }

  private async handleConsumerError(
    topic: string,
    message: any,
    error: Error
  ): Promise<void> {
    await this.handleProducerError(topic, message, error);
  }

  public async disconnect(): Promise<void> {
    try {
      await this.producer.disconnect();
      for (const consumer of this.consumers.values()) {
        await consumer.disconnect();
      }
      await this.admin.disconnect();
      this.connected = false;
    } catch (error) {
      logger.error("Error disconnecting from Kafka:", error);
    }
  }
}

export default KafkaService.getInstance();
