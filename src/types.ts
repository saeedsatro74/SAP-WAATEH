export type MovementType = 'IN' | 'OUT';
export type UnitType = 'count' | 'kg' | 'meter' | 'box' | 'liters';

export interface Product {
  sku: string;
  name: string;
  quantity: number;
  unit: UnitType;
  location: string; // e.g. "R1-S2-L3"
  lastUpdated: string;
  notes?: string;
  minStock: number; // threshold for low stock warning
  deleted?: boolean;
  deleted_at?: string;
  deleted_by?: string;
}

export interface Movement {
  id: string;
  personName: string;
  productSku: string;
  productName: string;
  type: MovementType;
  quantity: number;
  date: string; // auto timestamp
  location: string;
  notes?: string;
}

export interface WarehouseConfig {
  racksCount: number; // R1 to R(N)
  shelvesCount: number; // S1 to S(N)
  positionsCount: number; // L1 to L(N)
}

export interface UserSession {
  isLoggedIn: boolean;
  email: string;
  name: string;
  picture?: string;
  role: 'admin' | 'operator';
  phone?: string;
  bio?: string;
  department?: string;
  id?: string;
}

export type ActiveTab = 'dashboard' | 'inventory' | 'movements' | 'add-product' | 'add-movement' | 'settings' | 'profile';

export type Language = 'en' | 'fa';

export type AuditActionType = 
  | 'Create' 
  | 'Stock In' 
  | 'Stock Out' 
  | 'Admin Correction' 
  | 'Reset' 
  | 'Restore' 
  | 'Delete' 
  | 'Restore Deleted';

export interface InventoryAudit {
  id: string;
  productSku: string;
  productName: string;
  previousQuantity: number;
  newQuantity: number;
  difference: number;
  actionType: AuditActionType;
  reason: string;
  notes?: string;
  adminEmail: string;
  adminUserId?: string;
  createdAt: string;
}

export interface InventoryCorrection {
  id: string;
  userEmail: string;
  userName: string;
  productSku: string;
  productName: string;
  previousQuantity: number;
  newQuantity: number;
  reason: string;
  createdAt: string;
}

