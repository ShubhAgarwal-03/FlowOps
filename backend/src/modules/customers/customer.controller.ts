import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import * as customerService from './customer.service';

export const listCustomersHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await customerService.listCustomers(req.query as any);
  res.json(result);
});

export const getCustomerHandler = asyncHandler(async (req: Request, res: Response) => {
  const customer = await customerService.getCustomer(req.params.id);
  res.json(customer);
});

export const createCustomerHandler = asyncHandler(async (req: Request, res: Response) => {
  const customer = await customerService.createCustomer(req.body, req.user!.id);
  res.status(201).json(customer);
});

export const updateCustomerHandler = asyncHandler(async (req: Request, res: Response) => {
  const customer = await customerService.updateCustomer(req.params.id, req.body);
  res.json(customer);
});

export const addFollowupHandler = asyncHandler(async (req: Request, res: Response) => {
  const followup = await customerService.addFollowup(
    req.params.id,
    req.body.note,
    req.body.followUpDate,
    req.user!.id
  );
  res.status(201).json(followup);
});