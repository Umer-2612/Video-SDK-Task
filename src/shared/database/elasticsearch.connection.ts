import { Client } from "@elastic/elasticsearch";
import { databaseConfig } from "../config/database.config";

export class ElasticsearchConnection {
  private static instance: ElasticsearchConnection;
  private client: Client;

  private constructor() {
    this.client = new Client(databaseConfig.elasticsearch);
  }

  public static getInstance(): ElasticsearchConnection {
    if (!ElasticsearchConnection.instance) {
      ElasticsearchConnection.instance = new ElasticsearchConnection();
    }
    return ElasticsearchConnection.instance;
  }

  public async connect(): Promise<void> {
    try {
      const info = await this.client.info();
      console.log("✅ Elasticsearch connected successfully");
    } catch (error) {
      console.error("❌ Elasticsearch connection error:", error);
      process.exit(1);
    }
  }

  public getClient(): Client {
    return this.client;
  }

  public async disconnect(): Promise<void> {
    try {
      await this.client.close();
      console.log("Elasticsearch disconnected");
    } catch (error) {
      console.error("Elasticsearch disconnection error:", error);
    }
  }
}
