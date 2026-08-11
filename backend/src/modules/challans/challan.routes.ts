import { Router } from 'express';
import { verifyJWT } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate';
import * as ch from './challan.controller';
import {
  createChallanSchema,
  updateChallanSchema,
  getChallanSchema,
  confirmChallanSchema,
  listChallansSchema,
} from './challan.validator';

export const challanRouter = Router();
challanRouter.use(verifyJWT);

const canCreate = requireRole('ADMIN', 'SALES');

challanRouter.get('/', validate(listChallansSchema), ch.listChallansHandler);
challanRouter.get('/:id', validate(getChallanSchema), ch.getChallanHandler);
challanRouter.post('/', canCreate, validate(createChallanSchema), ch.createChallanHandler);
challanRouter.put('/:id', canCreate, validate(updateChallanSchema), ch.updateChallanHandler);
challanRouter.post('/:id/confirm', canCreate, validate(confirmChallanSchema), ch.confirmChallanHandler);