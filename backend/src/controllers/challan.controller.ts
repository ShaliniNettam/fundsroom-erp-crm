import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db.js';
import { generateChallanNumber } from '../utils/challan-number.js';
import { ChallanStatus, MovementType } from '../types/db.js';

const challanItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().positive('Quantity must be at least 1'),
});

const createChallanSchema = z.object({
  customerId: z.string().min(1, 'Customer selection is required'),
  status: z.enum(['DRAFT', 'CONFIRMED', 'CANCELLED']).default('DRAFT'),
  items: z.array(challanItemSchema).min(1, 'At least one product item is required in the sales challan'),
});

const updateStatusSchema = z.object({
  status: z.enum(['CONFIRMED', 'CANCELLED']),
});

export const getChallans = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as ChallanStatus | undefined;
    const customerId = req.query.customerId as string | undefined;
    const search = (req.query.search as string) || '';

    const skip = (page - 1) * limit;

    const whereCondition: any = {};

    if (status) {
      whereCondition.status = status;
    }

    if (customerId) {
      whereCondition.customerId = customerId;
    }

    if (search) {
      whereCondition.OR = [
        { challanNumber: { contains: search } },
        { customer: { name: { contains: search } } },
        { customer: { businessName: { contains: search } } },
      ];
    }

    const [total, challans] = await Promise.all([
      prisma.salesChallan.count({ where: whereCondition }),
      prisma.salesChallan.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: { id: true, name: true, businessName: true, email: true, mobile: true },
          },
          createdBy: {
            select: { id: true, name: true, role: true },
          },
          _count: {
            select: { items: true },
          },
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: challans,
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

export const getChallanById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const challan = await prisma.salesChallan.findUnique({
      where: { id },
      include: {
        customer: true,
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
        items: {
          include: {
            product: {
              select: { id: true, name: true, sku: true, currentStock: true, minStockAlert: true },
            },
          },
        },
      },
    });

    if (!challan) {
      return res.status(404).json({ success: false, message: 'Sales Challan not found' });
    }

    return res.status(200).json({ success: true, data: challan });
  } catch (error) {
    next(error);
  }
};

export const createChallan = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = createChallanSchema.parse(req.body);
    const customerId = parsed.customerId;
    const status = parsed.status as ChallanStatus;
    const items = parsed.items;

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthenticated' });
    }

    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Selected customer not found' });
    }

    const productIds = items.map((i: any) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== productIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more selected products do not exist.',
      });
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    let totalQuantity = 0;
    let totalAmount = 0;

    const snapshotItems = items.map((item: any) => {
      const prod = productMap.get(item.productId)!;
      const lineTotal = prod.unitPrice * item.quantity;
      totalQuantity += item.quantity;
      totalAmount += lineTotal;

      return {
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        unitPrice: prod.unitPrice,
        quantity: item.quantity,
        totalPrice: lineTotal,
      };
    });

    const challanNumber = await generateChallanNumber();

    const challan = await prisma.$transaction(async (tx) => {
      if (status === 'CONFIRMED') {
        for (const item of items) {
          const prod = productMap.get(item.productId)!;
          const currentProd = await tx.product.findUnique({ where: { id: prod.id } });
          if (!currentProd || currentProd.currentStock < item.quantity) {
            const avail = currentProd ? currentProd.currentStock : 0;
            throw {
              statusCode: 400,
              message: `Insufficient stock for product '${prod.name}' (SKU: ${prod.sku}). Available stock: ${avail}, Requested: ${item.quantity}. Confirmation aborted. Negative stock is strictly prohibited.`,
            };
          }
        }

        for (const item of items) {
          const prod = productMap.get(item.productId)!;
          await tx.product.update({
            where: { id: prod.id },
            data: { currentStock: { decrement: item.quantity } },
          });

          await tx.stockMovement.create({
            data: {
              productId: prod.id,
              quantity: item.quantity,
              movementType: 'OUT' as any,
              reason: `Sales Challan Confirmation ${challanNumber}`,
              createdById: req.user!.userId,
            },
          });
        }
      }

      const newChallan = await tx.salesChallan.create({
        data: {
          challanNumber,
          customerId,
          totalQuantity,
          totalAmount,
          status: status as any,
          createdById: req.user!.userId,
          items: {
            create: snapshotItems,
          },
        },
        include: {
          customer: true,
          items: true,
        },
      });

      return newChallan;
    });

    return res.status(201).json({
      success: true,
      message: `Sales Challan ${challan.challanNumber} created successfully in ${challan.status} status.`,
      data: challan,
    });
  } catch (error) {
    next(error);
  }
};

export const updateChallanStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const parsed = updateStatusSchema.parse(req.body);
    const targetStatus = parsed.status as ChallanStatus;

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthenticated' });
    }

    const challan = await prisma.salesChallan.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!challan) {
      return res.status(404).json({ success: false, message: 'Sales Challan not found' });
    }

    if (challan.status === targetStatus) {
      return res.status(400).json({
        success: false,
        message: `Challan is already in '${targetStatus}' status.`,
      });
    }

    if (challan.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot change status of a cancelled challan.',
      });
    }

    const updatedChallan = await prisma.$transaction(async (tx) => {
      if (challan.status === 'DRAFT' && targetStatus === 'CONFIRMED') {
        for (const item of challan.items) {
          const product = await tx.product.findUnique({ where: { id: item.productId } });
          if (!product || product.currentStock < item.quantity) {
            const avail = product ? product.currentStock : 0;
            throw {
              statusCode: 400,
              message: `Insufficient stock for product '${item.productName}' (SKU: ${item.sku}). Available stock: ${avail}, Requested: ${item.quantity}. Confirmation aborted. Negative stock is strictly prohibited.`,
            };
          }
        }

        for (const item of challan.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: { decrement: item.quantity } },
          });

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              quantity: item.quantity,
              movementType: 'OUT' as any,
              reason: `Sales Challan Confirmation ${challan.challanNumber}`,
              createdById: req.user!.userId,
            },
          });
        }
      }

      if (challan.status === 'CONFIRMED' && targetStatus === 'CANCELLED') {
        for (const item of challan.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: { increment: item.quantity } },
          });

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              quantity: item.quantity,
              movementType: 'IN' as any,
              reason: `Cancelled Sales Challan ${challan.challanNumber}`,
              createdById: req.user!.userId,
            },
          });
        }
      }

      return await tx.salesChallan.update({
        where: { id },
        data: { status: targetStatus as any },
        include: {
          customer: true,
          items: true,
        },
      });
    });

    return res.status(200).json({
      success: true,
      message: `Sales Challan ${updatedChallan.challanNumber} status updated to ${targetStatus}.`,
      data: updatedChallan,
    });
  } catch (error) {
    next(error);
  }
};
