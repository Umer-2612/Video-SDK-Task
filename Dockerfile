FROM node:18-alpine

# Add curl for healthcheck
RUN apk add --no-cache curl

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build TypeScript code
RUN npm run build

# Create directory for Kafka logs
RUN mkdir -p /tmp/kafka-logs && chmod 777 /tmp/kafka-logs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

CMD ["npm", "start"]
