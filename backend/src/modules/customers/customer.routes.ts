import { Router } from 'express';
import { verifyJWT } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate';
import * as c from './customer.controller';
import {
  createCustomerSchema,
  updateCustomerSchema,
  getCustomerSchema,
  listCustomersSchema,
  addFollowupSchema,
} from './customer.validator';

export const customerRouter = Router();
customerRouter.use(verifyJWT);

// ADMIN, SALES, ACCOUNTS can view/manage customers; WAREHOUSE has no need
const canManage = requireRole('ADMIN', 'SALES', 'ACCOUNTS');

customerRouter.get('/', canManage, validate(listCustomersSchema), c.listCustomersHandler);
customerRouter.post('/', canManage, validate(createCustomerSchema), c.createCustomerHandler);
customerRouter.get('/:id', canManage, validate(getCustomerSchema), c.getCustomerHandler);
customerRouter.put('/:id', canManage, validate(updateCustomerSchema), c.updateCustomerHandler);
customerRouter.post('/:id/followups', canManage, validate(addFollowupSchema), c.addFollowupHandler);