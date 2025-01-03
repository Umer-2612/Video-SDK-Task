import { Router, Request, Response } from 'express';
import { BaseRoute } from './route.base';

export class HomeRoutes extends BaseRoute {
    public path = '/';
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
            message: 'Hello from TypeScript Server!',
            timestamp: new Date().toISOString()
        });
    }
}
