import { Router, Request, Response } from "express";
import { BaseRoute } from "./route.base";

/**
 * @swagger
 * tags:
 *   name: System
 *   description: System health and information endpoints
 */

/**
 * @swagger
 * /:
 *   get:
 *     summary: Get system status
 *     tags: [System]
 *     description: Returns basic system information and health status
 *     responses:
 *       200:
 *         description: System is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "healthy"
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *                 uptime:
 *                   type: number
 *                   description: System uptime in seconds
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       500:
 *         description: System is unhealthy or error occurred
 */
export class HomeRoutes extends BaseRoute {
  public path = "/";
  public router = Router();

  constructor() {
    super();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(this.path, this.getHome);
  }

  private getHome = (_req: Request, res: Response): void => {
    res.json({
      message: "Hello from TypeScript Server!",
      timestamp: new Date().toISOString(),
    });
  };
}
