import { Client } from "@elastic/elasticsearch";
import { IValidatedNotification } from "../../../notification-ingestion/src/types/notification.types";
import { ElasticsearchConnection } from "@/shared/database/elasticsearch.connection";

export class NotificationSearchService {
  private static client: Client =
    ElasticsearchConnection.getInstance().getClient();
  private static readonly INDEX = "notifications";

  public static async createIndex(): Promise<void> {
    try {
      const exists = await this.client.indices.exists({
        index: this.INDEX,
      });

      if (!exists) {
        await this.client.indices.create({
          index: this.INDEX,
          body: {
            mappings: {
              properties: {
                id: { type: "keyword" },
                userId: { type: "keyword" },
                message: { type: "text" },
                type: { type: "keyword" },
                priority: { type: "keyword" },
                status: { type: "keyword" },
                sendTime: { type: "date" },
                createdAt: { type: "date" },
                metadata: { type: "object" },
              },
            },
          },
        });
      }
    } catch (error) {
      console.error("Error creating Elasticsearch index:", error);
      throw error;
    }
  }

  public static async storeNotification(
    notification: IValidatedNotification
  ): Promise<void> {
    try {
      await this.client.index({
        index: this.INDEX,
        id: notification.id,
        body: {
          ...notification,
          createdAt: new Date(),
        },
      });
    } catch (error) {
      console.error("Error storing notification in Elasticsearch:", error);
      throw error;
    }
  }

  public static async searchNotifications(query: {
    userId?: string;
    type?: string;
    priority?: string;
    startDate?: Date;
    endDate?: Date;
    searchText?: string;
  }): Promise<IValidatedNotification[]> {
    try {
      const must: any[] = [];

      if (query.userId) must.push({ match: { userId: query.userId } });
      if (query.type) must.push({ match: { type: query.type } });
      if (query.priority) must.push({ match: { priority: query.priority } });
      if (query.searchText) must.push({ match: { message: query.searchText } });

      if (query.startDate || query.endDate) {
        const range: any = { createdAt: {} };
        if (query.startDate) range.createdAt.gte = query.startDate;
        if (query.endDate) range.createdAt.lte = query.endDate;
        must.push({ range });
      }

      const response = await this.client.search({
        index: this.INDEX,
        body: {
          query: {
            bool: { must },
          },
          sort: [{ createdAt: "desc" }],
        },
      });

      return response.hits.hits.map(
        (hit) => hit._source as IValidatedNotification
      );
    } catch (error) {
      console.error("Error searching notifications:", error);
      throw error;
    }
  }
}
