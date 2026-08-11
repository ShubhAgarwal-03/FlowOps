import { Router } from 'express';
import { verifyJWT } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate';
import * as p from './product.controller';
import {
  createProductSchema,
  updateProductSchema,
  getProductSchema,
  listProductsSchema,
} from './product.validator';

export const productRouter = Router();
productRouter.use(verifyJWT);

// everyone with a login can view products; only ADMIN/WAREHOUSE can create/edit
productRouter.get('/', validate(listProductsSchema), p.listProductsHandler);
productRouter.get('/:id', validate(getProductSchema), p.getProductHandler);
productRouter.post(
  '/',
  requireRole('ADMIN', 'WAREHOUSE'),
  validate(createProductSchema),
  p.createProductHandler
);
productRouter.put(
  '/:id',
  requireRole('ADMIN', 'WAREHOUSE'),
  validate(updateProductSchema),
  p.updateProductHandler
);