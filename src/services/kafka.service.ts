import { Kafka, Producer, Consumer } from "kafkajs";
import { logger } from "../utils/logger";
import { kafkaConfig } from "../config/kafka.config";

class KafkaService {
  private kafka: Kafka;
  private producer: Producer;
  private consumers: Map<string, Consumer>;

  constructor() {
    this.kafka = new Kafka(kafkaConfig);
    this.producer = this.kafka.producer();
    this.consumers = new Map();
  }

  async connect(): Promise<void> {
    let retries = 5;
    let lastError;

    while (retries > 0) {
      try {
        await this.producer.connect();
        logger.info("Connected to Kafka");
        return;
      } catch (error) {
        lastError = error;
        logger.warn(`Failed to connect to Kafka. Retries left: ${retries}`);
        retries--;
        if (retries > 0) {
          await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds before retrying
        }
      }
    }

    logger.error("Failed to connect to Kafka after all retries", lastError);
    throw lastError;
  }

  async disconnect(): Promise<void> {
    try {
      await this.producer.disconnect();
      for (const consumer of this.consumers.values()) {
        await consumer.disconnect();
      }
      logger.info("Disconnected from Kafka");
    } catch (error) {
      logger.error("Failed to disconnect from Kafka", error);
      throw error;
    }
  }

  async createTopic(topic: string): Promise<void> {
    const admin = this.kafka.admin();
    try {
      await admin.connect();
      const existingTopics = await admin.listTopics();

      if (!existingTopics.includes(topic)) {
        await admin.createTopics({
          topics: [
            {
              topic,
              numPartitions: 1,
              replicationFactor: 1,
            },
          ],
        });
        logger.info(`Created Kafka topic: ${topic}`);
      } else {
        logger.info(`Kafka topic already exists: ${topic}`);
      }
    } catch (error: any) {
      logger.error("Failed to create Kafka topic", error);
      // Don't throw error if topic already exists
      if (!(error.message && error.message.includes("Topic already exists"))) {
        throw error;
      }
    } finally {
      await admin.disconnect();
    }
  }

  async produce(topic: string, message: any): Promise<void> {
    try {
      await this.producer.send({
        topic,
        messages: [
          {
            value: JSON.stringify(message),
          },
        ],
      });
      logger.info(`Message sent to topic: ${topic}`);
    } catch (error) {
      logger.error(`Failed to send message to topic: ${topic}`, error);
      throw error;
    }
  }

  async consume(
    topic: string,
    groupId: string,
    callback: (message: any) => Promise<void>
  ): Promise<void> {
    if (!this.consumers.has(groupId)) {
      const consumer = this.kafka.consumer({ groupId });
      this.consumers.set(groupId, consumer);

      try {
        await consumer.connect();
        await consumer.subscribe({ topic, fromBeginning: true });

        await consumer.run({
          eachMessage: async ({ message }) => {
            try {
              const value = message.value?.toString();
              if (value) {
                const parsedMessage = JSON.parse(value);
                await callback(parsedMessage);
              }
            } catch (error) {
              logger.error(
                `Error processing message from topic ${topic}`,
                error
              );
            }
          },
        });

        logger.info(
          `Consumer started for topic: ${topic}, groupId: ${groupId}`
        );
      } catch (error) {
        logger.error(`Failed to set up consumer for topic ${topic}`, error);
        this.consumers.delete(groupId);
        throw error;
      }
    }
  }
}

export const kafkaService = new KafkaService();
export default kafkaService;
