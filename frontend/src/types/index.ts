export type UserRole = 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';

export type CustomerType = 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR';
export type CustomerStatus = 'LEAD' | 'ACTIVE' | 'INACTIVE';

export type MovementType = 'IN' | 'OUT';
export type ChallanStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface CustomerNote {
  id: string;
  customerId: string;
  note: string;
  createdById: string;
  createdAt: string;
  createdBy?: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email: string;
  businessName: string;
  gstNumber?: string | null;
  customerType: CustomerType;
  address: string;
  status: CustomerStatus;
  followUpDate?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    salesChallans: number;
    customerNotes: number;
  };
  customerNotes?: CustomerNote[];
  salesChallans?: SalesChallan[];
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unitPrice: number;
  currentStock: number;
  minStockAlert: number;
  location: string;
  createdAt: string;
  updatedAt: string;
  stockMovements?: StockMovement[];
}

export interface StockMovement {
  id: string;
  productId: string;
  quantity: number;
  movementType: MovementType;
  reason: string;
  createdById: string;
  createdAt: string;
  product?: {
    id: string;
    name: string;
    sku: string;
    category?: string;
    location?: string;
  };
  createdBy?: {
    id: string;
    name: string;
    role: UserRole;
  };
}

export interface SalesChallanItem {
  id: string;
  challanId: string;
  productId: string;
  productName: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  product?: {
    id: string;
    name: string;
    sku: string;
    currentStock: number;
    minStockAlert: number;
  };
}

export interface SalesChallan {
  id: string;
  challanNumber: string;
  customerId: string;
  totalQuantity: number;
  totalAmount: number;
  status: ChallanStatus;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    name: string;
    businessName: string;
    email: string;
    mobile: string;
  };
  createdBy?: {
    id: string;
    name: string;
    role: UserRole;
  };
  items?: SalesChallanItem[];
  _count?: {
    items: number;
  };
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  pagination?: Pagination;
  errors?: Array<{ field: string; message: string }>;
}

export interface DashboardStats {
  summary: {
    totalCustomers: number;
    totalProducts: number;
    lowStockCount: number;
    confirmedChallansCount: number;
    confirmedChallanAmount: number;
    pendingDraftChallansCount: number;
  };
  lowStockProducts: Product[];
  recentChallans: SalesChallan[];
}
