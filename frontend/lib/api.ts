import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types
export interface Harvest {
  id: number;
  harvest_date: string;
  plantation: string;
  num_bunches: number;
  weight_per_bunch: number;
  ripeness: string;
  total_weight: number;
  expected_oil_yield: number;
  expected_oil_yield_liters: number;
  is_purchased: boolean;
  supplier_name: string | null;
  purchase_price: number | null;
  ffb_cost: number;
  cost_per_kg: number;
  needs_milling_alert: boolean;
  created_at: string;
}

export interface Milling {
  id: number;
  milling_date: string;
  mill_location: string;
  harvest_id: number;
  milling_cost: number;
  oil_yield: number;
  oil_yield_liters: number;
  transport_cost: number;
  cost_per_kg: number;
  cost_per_liter: number;
  total_cost: number;
  created_at: string;
}

export interface Storage {
  id: number;
  container_id: string;
  milling_id: number;
  quantity: number;
  quantity_liters: number;
  storage_date: string;
  max_shelf_life_days: number;
  plantation_source: string;
  is_sold: boolean;
  expiry_date: string;
  days_until_expiry: number;
  is_near_expiry: boolean;
  is_expired: boolean;
  created_at: string;
}

export interface Sale {
  id: number;
  sale_date: string;
  buyer_name: string;
  storage_id: number;
  quantity_sold: number;
  quantity_sold_liters: number;
  price_per_kg: number;
  payment_status: string;
  payment_date: string | null;
  total_revenue: number;
  is_payment_pending: boolean;
  created_at: string;
}

export interface DashboardSummary {
  total_ffb_harvested: number;
  total_oil_produced: number;
  total_milling_cost: number;
  total_revenue: number;
  total_profit: number;
  total_storage: number;
  pending_payments_count: number;
  total_pending_amount: number;
  average_oil_yield: number;
}

export interface ProfitTrend {
  date: string;
  cost: number;
  revenue: number;
  profit: number;
}

export interface Alert {
  type: string;
  severity: string;
  message: string;
  harvest_id?: number;
  storage_id?: number;
  sale_id?: number;
  current_stock?: number;
}

// Harvest API
export const getHarvests = () => api.get<Harvest[]>('/harvests');
export const getHarvest = (id: number) => api.get<Harvest>(`/harvests/${id}`);
export const createHarvest = (data: Partial<Harvest>) => api.post<Harvest>('/harvests', data);

// Milling API
export const getMilling = () => api.get<Milling[]>('/milling');
export const getMillingRecord = (id: number) => api.get<Milling>(`/milling/${id}`);
export const createMilling = (data: Partial<Milling>) => api.post<Milling>('/milling', data);

// Storage API
export const getStorage = () => api.get<Storage[]>('/storage');
export const getAvailableStorage = () => api.get<{ inventory: Storage[]; total_quantity: number }>('/storage/available');
export const getStorageAlerts = () => api.get<{ near_expiry: Storage[]; expired: Storage[]; total_alerts: number }>('/storage/alerts');
export const getStorageRecord = (id: number) => api.get<Storage>(`/storage/${id}`);

// Sales API
export const getSales = () => api.get<Sale[]>('/sales');
export const getSale = (id: number) => api.get<Sale>(`/sales/${id}`);
export const createSale = (data: Partial<Sale>) => api.post<Sale>('/sales', data);
export const updatePaymentStatus = (id: number, data: { payment_status: string; payment_date?: string }) =>
  api.patch<Sale>(`/sales/${id}/payment`, data);

// Dashboard API
export const getDashboardSummary = () => api.get<DashboardSummary>('/dashboard/summary');
export const getProfitTrends = () => api.get<ProfitTrend[]>('/dashboard/profit-trends');
export const getAllAlerts = () => api.get<{ alerts: Alert[]; total_count: number }>('/dashboard/alerts');

// Reports API
export const downloadExcelReport = (type: string = 'summary') => {
  return `${API_BASE_URL}/reports/excel?type=${type}`;
};

export const downloadPdfReport = (type: string = 'summary') => {
  return `${API_BASE_URL}/reports/pdf?type=${type}`;
};

export default api;
