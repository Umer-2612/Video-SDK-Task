import { Request, Response, NextFunction } from 'express';

export class HttpException extends Error {
    constructor(public status: number, public message: string) {
        super(message);
        this.status = status;
        this.message = message;
    }
}

export const errorHandler = (
    _error: HttpException,
    _req: Request,
    res: Response,
    _next: NextFunction
): void => {
    const status = _error.status || 500;
    const message = _error.message || 'Something went wrong';

    res.status(status).json({
        status,
        message,
    });
};
