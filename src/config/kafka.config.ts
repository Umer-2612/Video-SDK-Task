export const kafkaConfig = {
  clientId: "notification-service",
  brokers: (process.env.KAFKA_BROKERS || "kafka:29092").split(","),
  retry: {
    initialRetryTime: 100,
    retries: 8
  }
};
