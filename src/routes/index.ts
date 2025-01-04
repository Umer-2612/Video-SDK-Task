import { Router } from "express";
import { HomeRoutes } from "./home.routes";
import { LogsRoutes } from "./logs.routes";
import { NotificationRoutes } from "./notification.routes";
import { UserRoutes } from "./user.routes";
import { BaseRoute } from "./route.base";

export class Routes {
  private static instance: Routes;
  private router: Router;
  private routes: BaseRoute[];

  private constructor() {
    this.router = Router();
    this.routes = [
      new HomeRoutes(),
      new LogsRoutes(),
      new NotificationRoutes(),
      new UserRoutes(),
    ];
    this.initializeRoutes();
  }

  public static getInstance(): Routes {
    if (!Routes.instance) {
      Routes.instance = new Routes();
    }
    return Routes.instance;
  }

  public getRouter(): Router {
    return this.router;
  }

  private initializeRoutes(): void {
    this.routes.forEach((route) => {
      this.router.use(route.path, route.router);
    });
  }
}

export const routes = Routes.getInstance().getRouter();
