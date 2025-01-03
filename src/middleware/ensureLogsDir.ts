import fs from 'fs';
import path from 'path';

export class EnsureLogsDirMiddleware {
    private static instance: EnsureLogsDirMiddleware;
    private readonly logsDir: string;

    private constructor() {
        this.logsDir = path.join(__dirname, '../../logs');
        this.ensureDirectory();
    }

    public static getInstance(): EnsureLogsDirMiddleware {
        if (!EnsureLogsDirMiddleware.instance) {
            EnsureLogsDirMiddleware.instance = new EnsureLogsDirMiddleware();
        }
        return EnsureLogsDirMiddleware.instance;
    }

    private ensureDirectory(): void {
        if (!fs.existsSync(this.logsDir)) {
            fs.mkdirSync(this.logsDir, { recursive: true });
        }
    }
}

// Initialize on app startup
EnsureLogsDirMiddleware.getInstance();
