import { Router } from 'express';
import { HomeRoutes } from './home.routes';
import { LogsRoutes } from './logs.routes';
import { BaseRoute } from './route.base';

export class Routes {
    private static instance: Routes;
    private router: Router;
    private routes: BaseRoute[];

    private constructor() {
        this.router = Router();
        this.routes = [
            new HomeRoutes(),
            new LogsRoutes(),
            // Add more routes here
        ];
        this.initializeRoutes();
    }

    public static getInstance(): Routes {
        if (!Routes.instance) {
            Routes.instance = new Routes();
        }
        return Routes.instance;
    }

    private initializeRoutes(): void {
        this.routes.forEach((route: BaseRoute) => {
            this.router.use(route.path, route.router);
        });
    }

    public getRouter(): Router {
        return this.router;
    }
}

export const routes = Routes.getInstance().getRouter();
