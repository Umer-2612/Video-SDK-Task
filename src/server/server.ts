import { Application, Request, Response, NextFunction } from 'express';
import { config } from '../config';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

export class Server {
    constructor(private app: Application) {
        this.config();
    }

    private config(): void {
        // Security Middleware
        this.app.use(helmet());
        
        // CORS
        this.app.use(cors());
        
        // Compression
        this.app.use(compression());
        
        // Log requests in development
        if (config.env === 'development') {
            this.app.use((req: Request, _res: Response, next: NextFunction) => {
                console.log(`${req.method} ${req.url}`);
                next();
            });
        }
    }
}
