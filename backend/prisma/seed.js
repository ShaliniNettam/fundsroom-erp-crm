"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting database seeding...');
    // 1. Clean existing data
    await prisma.salesChallanItem.deleteMany();
    await prisma.salesChallan.deleteMany();
    await prisma.stockMovement.deleteMany();
    await prisma.customerNote.deleteMany();
    await prisma.product.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.user.deleteMany();
    // 2. Create Users for all 4 roles
    const passwordHash = await bcryptjs_1.default.hash('Admin@123', 10);
    const salesHash = await bcryptjs_1.default.hash('Sales@123', 10);
    const warehouseHash = await bcryptjs_1.default.hash('Warehouse@123', 10);
    const accountsHash = await bcryptjs_1.default.hash('Accounts@123', 10);
    const admin = await prisma.user.create({
        data: {
            name: 'System Admin',
            email: 'admin@erp.com',
            passwordHash,
            role: 'ADMIN',
        },
    });
    const salesUser = await prisma.user.create({
        data: {
            name: 'Sales Manager',
            email: 'sales@erp.com',
            passwordHash: salesHash,
            role: 'SALES',
        },
    });
    const warehouseUser = await prisma.user.create({
        data: {
            name: 'Warehouse Supervisor',
            email: 'warehouse@erp.com',
            passwordHash: warehouseHash,
            role: 'WAREHOUSE',
        },
    });
    const accountsUser = await prisma.user.create({
        data: {
            name: 'Accounts Officer',
            email: 'accounts@erp.com',
            passwordHash: accountsHash,
            role: 'ACCOUNTS',
        },
    });
    console.log('✅ Created 4 Role Users:');
    console.log('   - Admin: admin@erp.com / Admin@123');
    console.log('   - Sales: sales@erp.com / Sales@123');
    console.log('   - Warehouse: warehouse@erp.com / Warehouse@123');
    console.log('   - Accounts: accounts@erp.com / Accounts@123');
    // 3. Create Customers
    const customer1 = await prisma.customer.create({
        data: {
            name: 'Rajesh Kumar',
            mobile: '+919876543210',
            email: 'rajesh@acmeelectronics.com',
            businessName: 'Acme Electronics Ltd',
            gstNumber: '27AAAAA0000A1Z5',
            customerType: 'DISTRIBUTOR',
            address: '102 Tech Park, MG Road, Bengaluru, KA',
            status: 'ACTIVE',
            followUpDate: new Date(Date.now() + 86400000 * 3), // 3 days in future
            notes: 'Key distributor for South India region.',
        },
    });
    const customer2 = await prisma.customer.create({
        data: {
            name: 'Priya Sharma',
            mobile: '+919812345678',
            email: 'priya@globaltechretail.com',
            businessName: 'Global Tech Retailers',
            gstNumber: '27BBBCC1111B2Z4',
            customerType: 'RETAIL',
            address: 'Shop 45, Commercial Complex, Sector 18, Noida, UP',
            status: 'LEAD',
            followUpDate: new Date(Date.now() + 86400000 * 1),
            notes: 'Interested in bulk purchase of mechanical keyboards.',
        },
    });
    const customer3 = await prisma.customer.create({
        data: {
            name: 'Sanjay Mehta',
            mobile: '+919988776655',
            email: 'sanjay@metrotraders.com',
            businessName: 'Metro Wholesale Traders',
            gstNumber: '27CCCDD2222C3Z3',
            customerType: 'WHOLESALE',
            address: 'Plot 12, Industrial Estate, Bhiwandi, MH',
            status: 'ACTIVE',
            followUpDate: new Date(Date.now() + 86400000 * 7),
            notes: 'Monthly bulk orders for accessories.',
        },
    });
    console.log('✅ Created initial Customers');
    // 4. Create Customer Notes / Follow-ups
    await prisma.customerNote.create({
        data: {
            customerId: customer1.id,
            note: 'Initial meeting held. Agreed on distributor discount rate of 15%.',
            createdById: salesUser.id,
        },
    });
    await prisma.customerNote.create({
        data: {
            customerId: customer2.id,
            note: 'Sent product catalog and pricing sheet via email.',
            createdById: salesUser.id,
        },
    });
    // 5. Create Products
    const p1 = await prisma.product.create({
        data: {
            name: 'Wireless Ergonomic Mouse',
            sku: 'PRD-MSE-001',
            category: 'Peripherals',
            unitPrice: 25.50,
            currentStock: 50,
            minStockAlert: 10,
            location: 'Warehouse A - Rack 1',
        },
    });
    const p2 = await prisma.product.create({
        data: {
            name: 'Mechanical Gaming Keyboard',
            sku: 'PRD-KBD-002',
            category: 'Peripherals',
            unitPrice: 75.00,
            currentStock: 8, // Low stock alert! (8 <= min 10)
            minStockAlert: 10,
            location: 'Warehouse A - Rack 2',
        },
    });
    const p3 = await prisma.product.create({
        data: {
            name: '27-inch 4K UHD Monitor',
            sku: 'PRD-MON-003',
            category: 'Displays',
            unitPrice: 320.00,
            currentStock: 15,
            minStockAlert: 5,
            location: 'Warehouse B - Rack 1',
        },
    });
    const p4 = await prisma.product.create({
        data: {
            name: 'USB-C Multi-port Hub',
            sku: 'PRD-HUB-004',
            category: 'Accessories',
            unitPrice: 45.00,
            currentStock: 3, // Low stock alert! (3 <= min 5)
            minStockAlert: 5,
            location: 'Warehouse B - Rack 2',
        },
    });
    const p5 = await prisma.product.create({
        data: {
            name: 'Noise-Canceling Wireless Headset',
            sku: 'PRD-HDT-005',
            category: 'Audio',
            unitPrice: 110.00,
            currentStock: 30,
            minStockAlert: 8,
            location: 'Warehouse C - Rack 1',
        },
    });
    console.log('✅ Created Products (including low stock items for alert testing)');
    // 6. Log Initial Stock Movements (IN)
    const products = [p1, p2, p3, p4, p5];
    for (const prod of products) {
        await prisma.stockMovement.create({
            data: {
                productId: prod.id,
                quantity: prod.currentStock,
                movementType: 'IN',
                reason: 'Initial Inventory Inward',
                createdById: warehouseUser.id,
            },
        });
    }
    // 7. Create a Sample Confirmed Sales Challan
    const challan1 = await prisma.salesChallan.create({
        data: {
            challanNumber: 'SCH-202608-0001',
            customerId: customer1.id,
            totalQuantity: 5,
            totalAmount: (25.50 * 5),
            status: 'CONFIRMED',
            createdById: salesUser.id,
            items: {
                create: [
                    {
                        productId: p1.id,
                        productName: p1.name,
                        sku: p1.sku,
                        unitPrice: p1.unitPrice,
                        quantity: 5,
                        totalPrice: 25.50 * 5,
                    },
                ],
            },
        },
    });
    // Log stock movement OUT for the confirmed challan item
    await prisma.stockMovement.create({
        data: {
            productId: p1.id,
            quantity: 5,
            movementType: 'OUT',
            reason: `Sales Challan Confirmation ${challan1.challanNumber}`,
            createdById: salesUser.id,
        },
    });
    // 8. Create a Sample Draft Sales Challan
    await prisma.salesChallan.create({
        data: {
            challanNumber: 'SCH-202608-0002',
            customerId: customer3.id,
            totalQuantity: 2,
            totalAmount: (75.00 * 2),
            status: 'DRAFT',
            createdById: salesUser.id,
            items: {
                create: [
                    {
                        productId: p2.id,
                        productName: p2.name,
                        sku: p2.sku,
                        unitPrice: p2.unitPrice,
                        quantity: 2,
                        totalPrice: 75.00 * 2,
                    },
                ],
            },
        },
    });
    console.log('✅ Created sample Sales Challans (1 Confirmed, 1 Draft)');
    console.log('🎉 Seeding completed successfully!');
}
main()
    .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
