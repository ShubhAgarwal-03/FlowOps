import { Router } from 'express';
import { verifyJWT } from '../../middleware/auth.middleware';
import { salesOverviewHandler } from './dashboard.controller';

export const dashboardRouter = Router();
dashboardRouter.use(verifyJWT);
dashboardRouter.get('/sales-overview', salesOverviewHandler);