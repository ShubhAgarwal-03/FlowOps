import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import * as productService from './product.service';

export const listProductsHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json(await productService.listProducts(req.query as any));
});

export const getProductHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json(await productService.getProduct(req.params.id));
});

export const createProductHandler = asyncHandler(async (req: Request, res: Response) => {
  res.status(201).json(await productService.createProduct(req.body));
});

export const updateProductHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json(await productService.updateProduct(req.params.id, req.body));
});