export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ManagerPinStatus {
  isConfigured: boolean;
}

export interface LoginResponse {
  token: string;
  username: string;
  role: string;
  expiresAt: string;
}

export type TableStatus = 'Available' | 'Occupied' | 'Reserved' | 'Maintenance';
export type TableType = 'Standard' | 'VIP';
export type SessionStatus = 'Active' | 'Closed';
export type ReservationStatus = 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed';
export type PaymentMethod = 'Cash' | 'Card' | 'Transfer';

export interface ActiveSession {
  sessionId: string;
  openedAt: string;
  openedByName: string;
  currentAmount: number;
  foodAmount: number;
}

export interface BilliardTable {
  id: string;
  tableNumber: string;
  tableType: TableType;
  hourlyRate: number;
  status: TableStatus;
  description?: string;
  currentSession?: ActiveSession;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  note?: string;
}

export interface TableSession {
  id: string;
  tableId: string;
  tableNumber: string;
  openedAt: string;
  closedAt?: string;
  totalMinutes?: number;
  tableAmount?: number;
  foodAmount?: number;
  totalAmount?: number;
  status: SessionStatus;
  notes?: string;
  orderItems: OrderItem[];
}

export interface Reservation {
  id: string;
  customerName: string;
  customerPhone: string;
  tableId: string;
  tableNumber: string;
  reservedDate: string;
  startTime: string;
  endTime: string;
  depositAmount: number;
  status: ReservationStatus;
  notes?: string;
}

export interface ProductCategory {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  price: number;
  unit: string;
  stock: number;
  imageUrl?: string;
  isActive: boolean;
}

export interface Employee {
  id: string;
  userId: string;
  username: string;
  fullName: string;
  phone: string;
  address?: string;
  hireDate: string;
  isActive: boolean;
}

export interface Invoice {
  id: string;
  sessionId: string;
  tableNumber: string;
  sessionAmount: number;
  foodAmount: number;
  discountAmount: number;
  finalAmount: number;
  totalMinutes?: number;
  paymentMethod: PaymentMethod;
  paidAt: string;
  cashierName: string;
  orderItems: OrderItem[];
}

export interface DailyReport {
  date: string;
  totalRevenue: number;
  tableRevenue: number;
  foodRevenue: number;
  totalSessions: number;
  totalOrders: number;
  purchaseAmount: number;
}

export interface StockImportItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineAmount: number;
}

export interface StockImport {
  id: string;
  importDate: string;
  supplierName: string;
  totalAmount: number;
  note?: string;
  createdByName: string;
  isVoided: boolean;
  items: StockImportItem[];
}

export interface CreateStockImportRequest {
  importDate?: string;
  supplierName: string;
  note?: string;
  items: { productId: string; quantity: number; unitPrice: number }[];
}
