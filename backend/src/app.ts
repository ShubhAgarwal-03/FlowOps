import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { authRouter } from './modules/auth/auth.routes';
import { customerRouter } from './modules/customers/customer.routes';
import { productRouter } from './modules/products/product.routes';
import { inventoryRouter } from './modules/inventory/movement.routes';
import { challanRouter } from './modules/challans/challan.routes';
import { errorHandler } from './middleware/error-handler';
import { dashboardRouter } from './modules/dashboard/dashboard.routes';

export const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use(cors({ origin: env.frontendUrl }));

app.use('/auth', authRouter);
app.use('/dashboard', dashboardRouter);
app.use('/customers', customerRouter);
app.use('/products', productRouter);
app.use('/inventory', inventoryRouter);
app.use('/challans', challanRouter);

app.use(errorHandler);