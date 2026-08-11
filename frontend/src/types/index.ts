export type Role = 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  businessName?: string;
  gstNumber?: string;
  customerType: 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR';
  address?: string;
  status: 'LEAD' | 'ACTIVE' | 'INACTIVE';
  followUpDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  followups?: Followup[];
}

export interface Followup {
  id: string;
  note: string;
  followUpDate?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category?: string;
  unitPrice: string;
  currentStock: number;
  minStock: number;
  warehouse?: string;
  createdAt: string;
  updatedAt: string;
  movements?: StockMovement[];
}

export interface StockMovement {
  id: string;
  productId: string;
  product?: { name: string; sku: string };
  quantityChanged: number;
  movementType: 'IN' | 'OUT';
  reason?: string;
  referenceId?: string;
  createdAt: string;
}

export interface ChallanItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  unitPrice: string;
  quantity: number;
}

export interface Challan {
  id: string;
  challanNumber: string;
  customerId: string;
  customer?: { name: string; gstNumber?: string; address?: string };
  status: 'DRAFT' | 'CONFIRMED' | 'CANCELLED';
  totalQuantity: number;
  createdBy: string;
  createdAt: string;
  confirmedAt?: string;
  items: ChallanItem[];
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiErrorShape {
  error: string;
  details?: Record<string, unknown>;
}