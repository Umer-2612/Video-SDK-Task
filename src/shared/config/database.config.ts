export const databaseConfig = {
    mongodb: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
        dbName: process.env.MONGODB_DB_NAME || 'notifications',
        options: {
            useNewUrlParser: true,
            useUnifiedTopology: true
        }
    },
    elasticsearch: {
        node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
        auth: {
            username: process.env.ELASTICSEARCH_USERNAME,
            password: process.env.ELASTICSEARCH_PASSWORD
        }
    },
    kafka: {
        clientId: 'notification-service',
        brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
        groupId: 'notification-group'
    }
};
