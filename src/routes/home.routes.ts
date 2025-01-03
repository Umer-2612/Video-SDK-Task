import { Router, Request, Response } from 'express';

export const homeRouter = Router();

homeRouter.get('/', (_req: Request, res: Response) => {
    res.json({
        message: 'Hello from TypeScript Server!',
        timestamp: new Date().toISOString()
    });
});
