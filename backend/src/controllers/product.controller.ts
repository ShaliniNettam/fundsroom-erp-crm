import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db.js';

const createProductSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  sku: z.string().min(2, 'SKU code is required').toUpperCase(),
  category: z.string().min(2, 'Category is required'),
  unitPrice: z.number().positive('Unit price must be greater than zero'),
  currentStock: z.number().int().min(0, 'Stock cannot be negative').default(0),
  minStockAlert: z.number().int().min(0, 'Minimum stock alert must be non-negative').default(5),
  location: z.string().min(2, 'Location/Warehouse area is required'),
});

const updateProductSchema = createProductSchema.partial();

export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    const category = req.query.category as string | undefined;
    const lowStockOnly = req.query.lowStock === 'true';

    const skip = (page - 1) * limit;

    const whereCondition: any = {};

    if (search) {
      whereCondition.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      whereCondition.category = category;
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where: whereCondition }),
      prisma.product.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Filter low stock if requested (currentStock <= minStockAlert)
    const filteredProducts = lowStockOnly
      ? products.filter((p) => p.currentStock <= p.minStockAlert)
      : products;

    return res.status(200).json({
      success: true,
      data: filteredProducts,
      pagination: {
        total: lowStockOnly ? filteredProducts.length : total,
        page,
        limit,
        totalPages: Math.ceil((lowStockOnly ? filteredProducts.length : total) / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        stockMovements: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            createdBy: {
              select: { id: true, name: true, role: true },
            },
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    return res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createProductSchema.parse(req.body);

    const existingSku = await prisma.product.findUnique({
      where: { sku: data.sku },
    });

    if (existingSku) {
      return res.status(400).json({
        success: false,
        message: `Product SKU '${data.sku}' already exists. SKU must be unique.`,
      });
    }

    // Create product and log initial stock inward movement if currentStock > 0
    const product = await prisma.$transaction(async (tx) => {
      const newProduct = await tx.product.create({
        data,
      });

      if (data.currentStock > 0 && req.user) {
        await tx.stockMovement.create({
          data: {
            productId: newProduct.id,
            quantity: data.currentStock,
            movementType: 'IN',
            reason: 'Initial Stock Inward',
            createdById: req.user.userId,
          },
        });
      }

      return newProduct;
    });

    return res.status(201).json({
      success: true,
      message: 'Product created successfully.',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = updateProductSchema.parse(req.body);

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (data.sku && data.sku !== existing.sku) {
      const existingSku = await prisma.product.findUnique({
        where: { sku: data.sku },
      });
      if (existingSku) {
        return res.status(400).json({
          success: false,
          message: `Product SKU '${data.sku}' is already taken.`,
        });
      }
    }

    const updated = await prisma.product.update({
      where: { id },
      data,
    });

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const getCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await prisma.product.findMany({
      select: { category: true },
      distinct: ['category'],
    });

    const categoryList = categories.map((c) => c.category);
    return res.status(200).json({ success: true, data: categoryList });
  } catch (error) {
    next(error);
  }
};
