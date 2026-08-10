import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db.js';
import { MovementType } from '../types/db.js';

const recordStockMovementSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
  movementType: z.enum(['IN', 'OUT']),
  reason: z.string().min(2, 'Reason for stock movement is required'),
});

export const getStockMovements = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 15;
    const productId = req.query.productId as string | undefined;
    const movementType = req.query.movementType as MovementType | undefined;
    const search = (req.query.search as string) || '';

    const skip = (page - 1) * limit;

    const whereCondition: any = {};

    if (productId) {
      whereCondition.productId = productId;
    }

    if (movementType) {
      whereCondition.movementType = movementType;
    }

    if (search) {
      whereCondition.OR = [
        { reason: { contains: search } },
        { product: { name: { contains: search } } },
        { product: { sku: { contains: search } } },
      ];
    }

    const [total, logs] = await Promise.all([
      prisma.stockMovement.count({ where: whereCondition }),
      prisma.stockMovement.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: { id: true, name: true, sku: true, category: true, location: true },
          },
          createdBy: {
            select: { id: true, name: true, role: true },
          },
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const recordStockMovement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = recordStockMovementSchema.parse(req.body);
    const productId = parsed.productId;
    const quantity = parsed.quantity;
    const movementType = parsed.movementType as MovementType;
    const reason = parsed.reason;

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthenticated' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        throw { statusCode: 404, message: 'Product not found' };
      }

      if (movementType === 'OUT') {
        if (product.currentStock < quantity) {
          throw {
            statusCode: 400,
            message: `Insufficient stock for product '${product.name}' (SKU: ${product.sku}). Available stock: ${product.currentStock}, Requested reduction: ${quantity}. Negative stock is not allowed.`,
          };
        }
      }

      const updatedStock =
        movementType === 'IN'
          ? product.currentStock + quantity
          : product.currentStock - quantity;

      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: { currentStock: updatedStock },
      });

      const movement = await tx.stockMovement.create({
        data: {
          productId,
          quantity,
          movementType: movementType as any,
          reason,
          createdById: req.user!.userId,
        },
        include: {
          product: { select: { id: true, name: true, sku: true } },
          createdBy: { select: { id: true, name: true } },
        },
      });

      return { product: updatedProduct, movement };
    });

    return res.status(201).json({
      success: true,
      message: `Stock ${movementType} recorded successfully. Updated stock: ${result.product.currentStock}`,
      data: result.movement,
    });
  } catch (error) {
    next(error);
  }
};
