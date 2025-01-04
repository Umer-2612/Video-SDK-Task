import { Application, Request, Response } from "express";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger.config";

export const setupSwagger = (app: Application): void => {
  // Swagger Page
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Docs in JSON format
  app.get("/docs.json", (_req: Request, res: Response) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });

  console.log(`📚 Swagger Docs available at /docs`);
};
