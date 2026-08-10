import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';

export const getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [
      totalCustomers,
      totalProducts,
      products,
      confirmedChallansAggregate,
      pendingDraftCount,
      recentChallans,
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.product.count(),
      prisma.product.findMany({
        select: {
          id: true,
          name: true,
          sku: true,
          category: true,
          currentStock: true,
          minStockAlert: true,
          location: true,
        },
      }),
      prisma.salesChallan.aggregate({
        where: { status: 'CONFIRMED' as any },
        _sum: { totalAmount: true },
        _count: { id: true },
      }),
      prisma.salesChallan.count({
        where: { status: 'DRAFT' as any },
      }),
      prisma.salesChallan.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: { name: true, businessName: true },
          },
        },
      }),
    ]);

    const lowStockProducts = products.filter((p) => p.currentStock <= p.minStockAlert);

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalCustomers,
          totalProducts,
          lowStockCount: lowStockProducts.length,
          confirmedChallansCount: confirmedChallansAggregate._count.id || 0,
          confirmedChallanAmount: confirmedChallansAggregate._sum.totalAmount || 0,
          pendingDraftChallansCount: pendingDraftCount,
        },
        lowStockProducts,
        recentChallans,
      },
    });
  } catch (error) {
    next(error);
  }
};
