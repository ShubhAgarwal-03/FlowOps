import { Router } from 'express';
import { loginHandler } from './auth.controller';
import { validate } from '../../middleware/validate';
import { loginSchema } from './auth.validator';

export const authRouter = Router();
authRouter.post('/login', validate(loginSchema), loginHandler);