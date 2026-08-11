import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import * as challanService from './challan.service';

export const listChallansHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json(await challanService.listChallans(req.query as any));
});

export const getChallanHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json(await challanService.getChallan(req.params.id));
});

export const createChallanHandler = asyncHandler(async (req: Request, res: Response) => {
  const { customerId, items } = req.body;
  res.status(201).json(await challanService.createChallan(customerId, items, req.user!.id));
});

export const updateChallanHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json(await challanService.updateChallan(req.params.id, req.body));
});

export const confirmChallanHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json(await challanService.confirmChallan(req.params.id, req.user!.id));
});