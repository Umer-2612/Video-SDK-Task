import winston, { Logger, format } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { config } from '../config';
import { Request, Response, NextFunction } from 'express';

export class LoggerService {
    private static instance: LoggerService;
    private logger: Logger;
    private readonly logsDir: string;

    private constructor() {
        this.logsDir = path.join(__dirname, '../../logs');
        this.logger = this.createLogger();
    }

    public static getInstance(): LoggerService {
        if (!LoggerService.instance) {
            LoggerService.instance = new LoggerService();
        }
        return LoggerService.instance;
    }

    private createLogFormat() {
        return format.combine(
            format.timestamp(),
            format.errors({ stack: true }),
            format.json()
        );
    }

    private createDailyRotateTransport(): DailyRotateFile {
        return new DailyRotateFile({
            filename: path.join(this.logsDir, '%DATE%-app.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d',
            format: this.createLogFormat(),
        });
    }

    private createLogger(): Logger {
        return winston.createLogger({
            level: config.logs.level,
            format: this.createLogFormat(),
            transports: [
                new winston.transports.File({
                    filename: path.join(this.logsDir, 'error.log'),
                    level: 'error',
                }),
                new winston.transports.Console({
                    format: format.combine(
                        format.colorize(),
                        format.simple()
                    ),
                }),
                this.createDailyRotateTransport(),
            ],
        });
    }

    public info(message: string, meta?: any): void {
        this.logger.info(message, meta);
    }

    public error(message: string, meta?: any): void {
        this.logger.error(message, meta);
    }

    public warn(message: string, meta?: any): void {
        this.logger.warn(message, meta);
    }

    public debug(message: string, meta?: any): void {
        this.logger.debug(message, meta);
    }

    public getStream() {
        return {
            write: (message: string) => {
                this.info(message.trim());
            },
        };
    }

    public createRequestLogger() {
        return (req: Request, res: Response, next: NextFunction): void => {
            const start = Date.now();
            res.on('finish', () => {
                const duration = Date.now() - start;
                this.info('Request completed', {
                    method: req.method,
                    url: req.url,
                    status: res.statusCode,
                    duration: `${duration}ms`,
                    userAgent: req.get('user-agent') || '',
                    ip: req.ip,
                });
            });
            next();
        };
    }
}

export const logger = LoggerService.getInstance();
