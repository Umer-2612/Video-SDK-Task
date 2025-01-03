import express, { Application } from 'express';
import { Server } from './server';
import { routes } from '../routes';
import { errorHandler } from '../middleware/errorHandler';
import { config } from '../config';

class App {
    public app: Application;

    constructor() {
        this.app = express();
        new Server(this.app);
        this.middlewares();
        this.routes();
        this.errorHandling();
    }

    private middlewares(): void {
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
    }

    private routes(): void {
        // API Routes
        this.app.use(config.api.prefix, routes);
    }

    private errorHandling(): void {
        // Error handling middleware
        this.app.use(errorHandler);
    }

    public start(port: number): void {
        this.app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
            console.log(`API is available at http://localhost:${port}${config.api.prefix}`);
        });
    }
}

export default App;
