import { Client } from "@elastic/elasticsearch";
import { DatabaseConnection } from "../interfaces/database.interface";
import { logger } from "../utils/logger";

export class ElasticsearchConnection implements DatabaseConnection {
  private static instance: ElasticsearchConnection;
  private client: Client | null = null;
  private isInitialized: boolean = false;
  private readonly maxRetries = 5;
  private readonly retryDelay = 5000; // 5 seconds

  private constructor() {}

  public static getInstance(): ElasticsearchConnection {
    if (!ElasticsearchConnection.instance) {
      ElasticsearchConnection.instance = new ElasticsearchConnection();
    }
    return ElasticsearchConnection.instance;
  }

  private async waitForElasticsearch(): Promise<void> {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        if (!this.client) {
          this.client = new Client({
            node: process.env.ELASTICSEARCH_NODE || "http://localhost:9200",
            maxRetries: 3,
            requestTimeout: 10000,
          });
        }

        await this.client.ping();
        logger.info("Successfully connected to Elasticsearch");
        return;
      } catch (error) {
        logger.warn(
          `Elasticsearch connection attempt ${attempt} failed. Retrying in ${
            this.retryDelay / 1000
          } seconds...`
        );
        if (attempt === this.maxRetries) {
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
      }
    }
  }

  public async connect(): Promise<void> {
    if (this.isInitialized) {
      logger.info("Elasticsearch is already connected");
      return;
    }

    try {
      await this.waitForElasticsearch();
      this.isInitialized = true;

      // Create notification index if it doesn't exist
      await this.createNotificationIndex();
    } catch (error) {
      logger.error("Failed to connect to Elasticsearch:", error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.isInitialized = false;
      logger.info("Elasticsearch disconnected");
    }
  }

  public isConnected(): boolean {
    return this.isInitialized;
  }

  public getClient(): Client {
    if (!this.client) {
      throw new Error("Elasticsearch client not initialized");
    }
    return this.client;
  }

  private async createNotificationIndex(): Promise<void> {
    try {
      const indexExists = await this.client!.indices.exists({
        index: "notifications",
      });

      if (!indexExists) {
        await this.client!.indices.create({
          index: "notifications",
          body: {
            mappings: {
              properties: {
                userId: { type: "keyword" },
                type: { type: "keyword" },
                title: { type: "text" },
                content: { type: "text" },
                status: { type: "keyword" },
                metadata: { type: "object" },
                createdAt: { type: "date" },
                updatedAt: { type: "date" },
                sentAt: { type: "date" },
              },
            },
          },
        });
        logger.info("Created notifications index in Elasticsearch");
      }
    } catch (error) {
      logger.error("Error creating Elasticsearch index:", error);
      throw error;
    }
  }
}
