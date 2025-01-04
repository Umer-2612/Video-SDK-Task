import swaggerJsdoc from "swagger-jsdoc";
import { config } from "../config";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Video SDK API Documentation",
      version: "1.0.0",
      description: "API documentation for Video SDK project",
      contact: {
        name: "API Support",
        email: "support@example.com",
      },
    },
    servers: [
      {
        url: `${process.env.NODE_ENV === "production" 
          ? "https://api.yourproduction.com" 
          : "http://localhost:3000"}${config.api.prefix}`,
        description: process.env.NODE_ENV === "production" ? "Production Server" : "Development Server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [{
      bearerAuth: [],
    }],
  },
  apis: ["./src/routes/*.ts", "./src/models/*.ts"], // Path to the API routes and models
};

export const swaggerSpec = swaggerJsdoc(options);
