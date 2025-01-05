import { Consumer } from "kafkajs";
import { IValidatedNotification } from "../../../notification-ingestion/src/types/notification.types";
import { NotificationProcessor } from "../processors/notification.processor";
import { KafkaConnection } from "@/shared/database/kafka.connection";

export class NotificationConsumer {
  private consumer: Consumer;
  private static instance: NotificationConsumer;

  private constructor() {
    this.consumer = KafkaConnection.getInstance().createConsumer(
      "notification-engine-group"
    );
  }

  public static getInstance(): NotificationConsumer {
    if (!NotificationConsumer.instance) {
      NotificationConsumer.instance = new NotificationConsumer();
    }
    return NotificationConsumer.instance;
  }

  public async start(): Promise<void> {
    try {
      await this.consumer.connect();
      await this.consumer.subscribe({ topic: "notifications" });

      await this.consumer.run({
        eachMessage: async ({ message }) => {
          try {
            const notification: IValidatedNotification = JSON.parse(
              message.value!.toString()
            );
            console.log(`Processing notification: ${notification.id}`);

            const processedNotification =
              await NotificationProcessor.processNotification(notification);

            // TODO: Send to delivery service
            console.log(
              `Processed notification: ${processedNotification.id}, Status: ${processedNotification.status}`
            );
          } catch (error) {
            console.error("Error processing message:", error);
          }
        },
      });

      console.log("✅ Notification consumer started");
    } catch (error) {
      console.error("❌ Error starting notification consumer:", error);
      throw error;
    }
  }

  public async stop(): Promise<void> {
    try {
      await this.consumer.disconnect();
      console.log("Notification consumer stopped");
    } catch (error) {
      console.error("Error stopping notification consumer:", error);
    }
  }
}
