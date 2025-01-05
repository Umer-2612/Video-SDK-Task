import { Client } from '@elastic/elasticsearch';
import { logger } from '../utils/logger';

class ElasticsearchService {
  private static instance: ElasticsearchService;
  private client: Client;

  private constructor() {
    this.client = new Client({
      node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200'
    });
  }

  public static getInstance(): ElasticsearchService {
    if (!ElasticsearchService.instance) {
      ElasticsearchService.instance = new ElasticsearchService();
    }
    return ElasticsearchService.instance;
  }

  public async createIndex(indexName: string): Promise<void> {
    try {
      const exists = await this.client.indices.exists({ index: indexName });
      if (!exists) {
        await this.client.indices.create({
          index: indexName,
          body: {
            mappings: {
              properties: {
                userId: { type: 'keyword' },
                message: { type: 'text' },
                type: { type: 'keyword' },
                priority: { type: 'keyword' },
                status: { type: 'keyword' },
                scheduledFor: { type: 'date' },
                sentAt: { type: 'date' },
                createdAt: { type: 'date' }
              }
            }
          }
        });
        logger.info(`Created Elasticsearch index: ${indexName}`);
      }
    } catch (error) {
      logger.error(`Failed to create Elasticsearch index ${indexName}:`, error);
      throw error;
    }
  }

  public async indexNotification(indexName: string, notification: any): Promise<void> {
    try {
      await this.client.index({
        index: indexName,
        document: notification
      });
    } catch (error) {
      logger.error('Failed to index notification:', error);
      throw error;
    }
  }

  public async searchNotifications(indexName: string, query: any): Promise<any> {
    try {
      const result = await this.client.search({
        index: indexName,
        body: query
      });
      return result;
    } catch (error) {
      logger.error('Failed to search notifications:', error);
      throw error;
    }
  }

  public async deleteIndex(indexName: string): Promise<void> {
    try {
      await this.client.indices.delete({ index: indexName });
    } catch (error) {
      logger.error(`Failed to delete index ${indexName}:`, error);
      throw error;
    }
  }
}

export default ElasticsearchService.getInstance();
