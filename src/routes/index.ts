import { Router } from 'express';
import { homeRouter } from './home.routes';

export const routes = Router();

routes.use('/', homeRouter);
