import { Router, Request, Response } from "express";
import { BaseRoute } from "./route.base";

/**
 * @swagger
 * tags:
 *   name: Home
 *   description: Home endpoint
 */

/**
 * @swagger
 * /:
 *   get:
 *     summary: Get home page information
 *     tags: [Home]
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Hello from TypeScript Server!
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: 2024-01-04T11:25:30.123Z
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
