import { Router } from "express";
import { BaseRoute } from "./route.base";
import { LogsController } from "../controllers/logs.controller";

export class LogsRoutes extends BaseRoute {
  public path = "/logs";
  public router = Router();
  private readonly controller = LogsController.getInstance();

  constructor() {
    super();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Get logs for a specific date (defaults to today)
    this.router.get("/daily", this.controller.getDailyLogs);

    // Get list of available log dates
    this.router.get("/dates", this.controller.getAvailableDates);
  }
}
