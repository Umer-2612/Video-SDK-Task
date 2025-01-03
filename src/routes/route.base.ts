import { Router } from 'express';

export abstract class BaseRoute {
    abstract path: string;
    abstract router: Router;
}
