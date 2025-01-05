# Distributed Notification and Alert System

## Project Structure

```
/src
  /services
    /notification-ingestion      # Requirement 1
      /src
        /api
          notification.controller.ts   # /notify endpoint
          routes.ts
        /validation
          notification.validator.ts    # Request validation
        /kafka
          producer.service.ts         # Kafka publishing
        /types
          notification.types.ts       # Type definitions
        index.ts                     # Service entry point

    /notification-engine         # Requirement 2, 3, 4
      /src
        /processors
          realtime.processor.ts      # Real-time processing
          scheduled.processor.ts     # Scheduled notifications
          batch.processor.ts        # Batch processing
        /queues
          delivery.queue.ts         # Delivery queue management
        /rules
          throttling.ts            # Query 1: Throttling
          quiet-hours.ts          # Query 2: Quiet hours
          deduplication.ts       # Query 3: Deduplication
          aggregation.ts        # Query 4: Batch aggregation
          urgent.ts            # Query 5: Urgent alerts
        /kafka
          consumer.service.ts    # Kafka consumer
        /storage
          notification.repository.ts  # MongoDB operations
          search.repository.ts      # Elasticsearch operations
        /scheduler
          scheduler.service.ts      # Notification scheduling
        index.ts                   # Service entry point

    /notification-delivery       # Requirement 5
      /src
        /channels
          email.service.ts         # Email delivery
          sms.service.ts          # SMS delivery
          push.service.ts        # Push notifications
        /retry
          retry.service.ts       # Retry mechanism
        /logging
          delivery.logger.ts    # Delivery status logging
        /queue
          consumer.service.ts   # Queue consumer
        index.ts               # Service entry point

  /shared                      # Shared code
    /config
      kafka.config.ts         # Kafka configuration
      mongo.config.ts        # MongoDB configuration
      elastic.config.ts     # Elasticsearch configuration
    /models
      notification.model.ts  # Notification schema
      user.model.ts        # User preferences schema
    /types
      common.types.ts      # Shared type definitions
    /utils
      logger.ts           # Logging utility
      error-handler.ts   # Error handling

/docker                  # Requirement 6
  /notification-ingestion
    Dockerfile
  /notification-engine
    Dockerfile
  /notification-delivery
    Dockerfile
  docker-compose.yml    # Service orchestration

/tests
  /integration         # Integration tests
  /unit               # Unit tests
  /e2e                # End-to-end tests

# Configuration files
.env.example         # Environment variables template
package.json        # Dependencies
tsconfig.json      # TypeScript configuration
```

## Key Components

### 1. Notification Ingestion Service
- REST API endpoint `/notify`
- Request validation
- Kafka message publishing

### 2. Notification Engine Service
- Real-time and scheduled processing
- User preferences management
- Query implementations:
  - Throttling
  - Quiet hours
  - Deduplication
  - Batch aggregation
  - Urgent alerts

### 3. Notification Delivery Service
- Multi-channel delivery (Email, SMS, Push)
- Retry mechanism
- Delivery status logging

### Infrastructure
- MongoDB: User preferences and notifications
- Elasticsearch: Content storage and search
- Kafka: Message queue
- Docker: Containerization

## Configuration
Environment variables for:
- Service ports and hosts
- Database connections
- Kafka configuration
- External service credentials
- Logging settings
