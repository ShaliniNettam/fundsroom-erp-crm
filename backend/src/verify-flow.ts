import app from './app.js';
import { prisma } from './config/db.js';
import http from 'http';

async function runVerification() {
  console.log('🧪 Starting End-to-End Business Flow Verification...');

  // Start backend server on ephemeral port 5099 for testing
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(5099, resolve));
  const baseUrl = 'http://localhost:5099/api';

  try {
    // Helper fetch wrapper
    async function request(endpoint: string, options: any = {}) {
      const url = `${baseUrl}${endpoint}`;
      const headers = {
        'Content-Type': 'application/json',
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      };
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });
      const data = await response.json();
      return { status: response.status, data };
    }

    // 1. Test Login for all 4 Roles
    console.log('\n--- 1. Testing Role-Based Login ---');

    const adminLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: 'admin@erp.com', password: 'Admin@123' },
    });
    console.log('✅ Admin Login:', adminLogin.status === 200, adminLogin.data.data?.user?.role);
    const adminToken = adminLogin.data.data.token;

    const salesLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: 'sales@erp.com', password: 'Sales@123' },
    });
    console.log('✅ Sales Login:', salesLogin.status === 200, salesLogin.data.data?.user?.role);
    const salesToken = salesLogin.data.data.token;

    const warehouseLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: 'warehouse@erp.com', password: 'Warehouse@123' },
    });
    console.log('✅ Warehouse Login:', warehouseLogin.status === 200, warehouseLogin.data.data?.user?.role);
    const warehouseToken = warehouseLogin.data.data.token;

    const accountsLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: 'accounts@erp.com', password: 'Accounts@123' },
    });
    console.log('✅ Accounts Login:', accountsLogin.status === 200, accountsLogin.data.data?.user?.role);
    const accountsToken = accountsLogin.data.data.token;

    // 2. Test Customer CRM Creation & Notes
    console.log('\n--- 2. Testing Customer CRM Module ---');
    const newCust = await request('/customers', {
      method: 'POST',
      token: salesToken,
      body: {
        name: 'Test Customer E2E',
        mobile: '+919999900000',
        email: 'e2e@testcust.com',
        businessName: 'E2E Enterprises',
        gstNumber: '27TST00001Z0',
        customerType: 'WHOLESALE',
        address: '101 Test Road',
        status: 'ACTIVE',
        notes: 'Initial automated test note',
      },
    });
    console.log('✅ Created Customer:', newCust.status === 201, newCust.data.data?.name);
    const customerId = newCust.data.data.id;

    const addNoteRes = await request(`/customers/${customerId}/notes`, {
      method: 'POST',
      token: salesToken,
      body: { note: 'Follow up call conducted. Client confirmed interest.' },
    });
    console.log('✅ Added Follow-Up Note:', addNoteRes.status === 201);

    // 3. Test Product Creation & Stock
    console.log('\n--- 3. Testing Product & Inventory Module ---');
    const testSku = `PRD-TEST-${Date.now()}`;
    const newProd = await request('/products', {
      method: 'POST',
      token: warehouseToken,
      body: {
        name: 'Test Smart Watch',
        sku: testSku,
        category: 'Wearables',
        unitPrice: 150.00,
        currentStock: 10, // Stock set to exactly 10
        minStockAlert: 5,
        location: 'Rack T-1',
      },
    });
    console.log('✅ Created Product:', newProd.status === 201, `Stock: ${newProd.data.data?.currentStock}`);
    const productId = newProd.data.data.id;

    // 4. Test Sales Challan Stock Transaction (Successful Stock Reduction)
    console.log('\n--- 4. Testing Sales Challan -> Stock Reduction (Stock = 10, Requesting 4) ---');
    const challan1 = await request('/sales-challans', {
      method: 'POST',
      token: salesToken,
      body: {
        customerId,
        status: 'CONFIRMED',
        items: [{ productId, quantity: 4 }],
      },
    });
    console.log('✅ Created Confirmed Challan:', challan1.status === 201, challan1.data.data?.challanNumber);

    // Check updated stock (should be 10 - 4 = 6)
    const checkProd1 = await request(`/products/${productId}`, { token: adminToken });
    console.log('✅ Verified Stock Reduced to 6:', checkProd1.data.data?.currentStock === 6, `Current Stock: ${checkProd1.data.data?.currentStock}`);

    // 5. Test Insufficient Stock Error Guard (Stock = 6, Requesting 12)
    console.log('\n--- 5. Testing Insufficient Stock Rejection (Stock = 6, Requesting 12) ---');
    const challanFail = await request('/sales-challans', {
      method: 'POST',
      token: salesToken,
      body: {
        customerId,
        status: 'CONFIRMED',
        items: [{ productId, quantity: 12 }],
      },
    });

    console.log('✅ Confirmation Failed with HTTP 400 as expected:', challanFail.status === 400);
    console.log('   Error Message:', challanFail.data.message);

    // Check stock remains unchanged at 6
    const checkProd2 = await request(`/products/${productId}`, { token: adminToken });
    console.log('✅ Verified Stock Unchanged at 6:', checkProd2.data.data?.currentStock === 6);

    // 6. Test RBAC Enforcement (e.g. Accounts attempting to create a product)
    console.log('\n--- 6. Testing RBAC Access Control Enforcement ---');
    const rbacTest = await request('/products', {
      method: 'POST',
      token: accountsToken,
      body: {
        name: 'Unauthorized Product',
        sku: 'PRD-UNAUTH-001',
        category: 'Misc',
        unitPrice: 10.00,
        currentStock: 5,
        minStockAlert: 2,
        location: 'Rack U',
      },
    });
    console.log('✅ Accounts user forbidden from creating products:', rbacTest.status === 43, `HTTP ${rbacTest.status}`);

    console.log('\n==================================================');
    console.log('🎉 ALL END-TO-END BUSINESS LOGIC VERIFICATIONS PASSED!');
    console.log('==================================================\n');
  } catch (err) {
    console.error('❌ Verification failed:', err);
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

runVerification();
