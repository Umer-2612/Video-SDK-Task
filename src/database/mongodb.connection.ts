import mongoose from 'mongoose';
import { DatabaseConnection } from '../interfaces/database.interface';
import { config } from '../config';
import { logger } from '../utils/logger';

export class MongoDBConnection implements DatabaseConnection {
    private static instance: MongoDBConnection;
    private isInitialized: boolean = false;

    private constructor() {}

    public static getInstance(): MongoDBConnection {
        if (!MongoDBConnection.instance) {
            MongoDBConnection.instance = new MongoDBConnection();
        }
        return MongoDBConnection.instance;
    }

    public async connect(): Promise<void> {
        if (this.isInitialized) {
            logger.info('MongoDB is already connected');
            return;
        }

        try {
            const { uri, options } = config.database.mongodb;
            await mongoose.connect(uri, options);
            
            mongoose.connection.on('error', (error) => {
                logger.error('MongoDB connection error:', error);
            });

            mongoose.connection.on('disconnected', () => {
                logger.warn('MongoDB disconnected');
            });

            mongoose.connection.on('connected', () => {
                logger.info('MongoDB connected successfully');
            });

            this.isInitialized = true;
            logger.info('MongoDB connection initialized');
        } catch (error) {
            logger.error('Error connecting to MongoDB:', error);
            throw error;
        }
    }

    public async disconnect(): Promise<void> {
        if (!this.isInitialized) {
            return;
        }

        try {
            await mongoose.disconnect();
            this.isInitialized = false;
            logger.info('MongoDB disconnected successfully');
        } catch (error) {
            logger.error('Error disconnecting from MongoDB:', error);
            throw error;
        }
    }

    public isConnected(): boolean {
        return mongoose.connection.readyState === 1;
    }
}
