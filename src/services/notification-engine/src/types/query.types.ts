export interface INotificationQuery {
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    type?: string;
    priority?: string;
    status?: string;
    searchText?: string;
    limit?: number;
    offset?: number;
}

export interface IThrottleConfig {
    hourlyLimit: number;
    dailyLimit: number;
}

export interface IQuietHoursConfig {
    start: string;
    end: string;
    timezone: string;
}

export interface IAggregationConfig {
    batchSize: number;
    timeWindow: number; // in minutes
    priorityThreshold: string;
}
