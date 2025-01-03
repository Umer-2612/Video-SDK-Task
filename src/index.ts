import App from './server/app';
import { config } from './config';

process.on('uncaughtException', (error: Error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason: any) => {
    console.error('Unhandled Rejection:', reason);
    process.exit(1);
});

const app = new App();
app.start(config.port);
