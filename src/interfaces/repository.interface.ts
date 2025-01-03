export interface BaseRepository<T> {
    create(item: Partial<T>): Promise<T>;
    update(id: string, item: Partial<T>): Promise<T | null>;
    delete(id: string): Promise<boolean>;
    findById(id: string): Promise<T | null>;
    findAll(): Promise<T[]>;
}

export interface QueryOptions {
    limit?: number;
    skip?: number;
    sort?: { [key: string]: 1 | -1 };
}
