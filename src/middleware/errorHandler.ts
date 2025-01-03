import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export class HttpException extends Error {
    constructor(public status: number, public message: string) {
        super(message);
        this.status = status;
        this.message = message;
    }
}

export class ErrorHandlerMiddleware {
    private static instance: ErrorHandlerMiddleware;

    private constructor() {}

    public static getInstance(): ErrorHandlerMiddleware {
        if (!ErrorHandlerMiddleware.instance) {
            ErrorHandlerMiddleware.instance = new ErrorHandlerMiddleware();
        }
        return ErrorHandlerMiddleware.instance;
    }

    public handleError(
        error: HttpException,
        _req: Request,
        res: Response,
        _next: NextFunction
    ): void {
        const status = error.status || 500;
        const message = error.message || 'Something went wrong';

        // Log the error
        logger.error('Error occurred', {
            status,
            message,
            stack: error.stack,
        });

        res.status(status).json({
            status,
            message,
        });
    }

    public getMiddleware() {
        return this.handleError.bind(this);
    }
}

export const errorHandler = ErrorHandlerMiddleware.getInstance().getMiddleware();
