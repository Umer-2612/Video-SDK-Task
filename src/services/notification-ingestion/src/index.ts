import { Server } from '../../server';
import { KafkaConnection } from '../../shared/database/kafka.connection';

async function startService() {
    try {
        // Connect to Kafka
        await KafkaConnection.getInstance().connect();

        // Start the server
        const server = new Server();
        server.start();
    } catch (error) {
        console.error('Failed to start notification ingestion service:', error);
        process.exit(1);
    }
}

// Start the service
startService();
