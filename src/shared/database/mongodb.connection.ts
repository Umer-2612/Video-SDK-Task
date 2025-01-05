import mongoose from 'mongoose';
import { databaseConfig } from '../config/database.config';

export class MongoDBConnection {
    private static instance: MongoDBConnection;

    private constructor() {}

    public static getInstance(): MongoDBConnection {
        if (!MongoDBConnection.instance) {
            MongoDBConnection.instance = new MongoDBConnection();
        }
        return MongoDBConnection.instance;
    }

    public async connect(): Promise<void> {
        try {
            const { uri, options } = databaseConfig.mongodb;
            await mongoose.connect(uri, options);
            console.log('✅ MongoDB connected successfully');
        } catch (error) {
            console.error('❌ MongoDB connection error:', error);
            process.exit(1);
        }
    }

    public async disconnect(): Promise<void> {
        try {
            await mongoose.disconnect();
            console.log('MongoDB disconnected');
        } catch (error) {
            console.error('MongoDB disconnection error:', error);
        }
    }
}
