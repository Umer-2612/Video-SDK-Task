import { MongoDBConnection } from "@/shared/database/mongodb.connection";
import { NotificationConsumer } from "./kafka/consumer.service";
import { SchedulerService } from "./scheduler/scheduler.service";
import { NotificationSearchService } from "./storage/elasticsearch.service";
import { ElasticsearchConnection } from "@/shared/database/elasticsearch.connection";
import { KafkaConnection } from "@/shared/database/kafka.connection";

async function startService() {
  try {
    // Connect to databases
    await MongoDBConnection.getInstance().connect();
    await ElasticsearchConnection.getInstance().connect();
    await KafkaConnection.getInstance().connect();

    // Initialize Elasticsearch index
    await NotificationSearchService.createIndex();

    // Start consuming notifications
    await NotificationConsumer.getInstance().start();

    // Start scheduler for pending notifications
    SchedulerService.start();

    console.log("✅ Notification engine service started");
  } catch (error) {
    console.error("Failed to start notification engine service:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM signal received. Shutting down...");
  await NotificationConsumer.getInstance().stop();
  SchedulerService.stop();
  await MongoDBConnection.getInstance().disconnect();
  await ElasticsearchConnection.getInstance().disconnect();
  process.exit(0);
});

// Start the service
startService();
