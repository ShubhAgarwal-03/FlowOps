import { Router } from 'express';
import { verifyJWT } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate';
import * as m from './movement.controller';
import { listMovementsSchema, stockInSchema } from './movement.validator';

export const inventoryRouter = Router();
inventoryRouter.use(verifyJWT);

inventoryRouter.get('/movements', validate(listMovementsSchema), m.listMovementsHandler);
inventoryRouter.post(
  '/stock-in',
  requireRole('ADMIN', 'WAREHOUSE'),
  validate(stockInSchema),
  m.stockInHandler
);