import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import * as movementService from './movement.service';

export const listMovementsHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json(await movementService.listMovements(req.query as any));
});

export const stockInHandler = asyncHandler(async (req: Request, res: Response) => {
  const { productId, quantity, reason } = req.body;
  const result = await movementService.stockIn(productId, quantity, reason, req.user!.id);
  res.status(201).json(result);
});