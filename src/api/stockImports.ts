import api from './axiosInstance';
import { withManagerPin } from './managerPin';
import type { ApiResponse, StockImport, CreateStockImportRequest } from '../types';

// Toàn bộ màn hình Nhập hàng nằm sau cổng mã PIN quản lý, nên mọi lời gọi đều phải kèm PIN.

export const getStockImports = async (pin: string) => {
  const res = await api.get<ApiResponse<StockImport[]>>('/stock-imports', withManagerPin(pin));
  return res.data.data;
};

export const createStockImport = async (data: CreateStockImportRequest, pin: string) => {
  const res = await api.post<ApiResponse<StockImport>>('/stock-imports', data, withManagerPin(pin));
  return res.data.data;
};

export const updateStockImport = async (id: string, data: CreateStockImportRequest, pin: string) => {
  const res = await api.put<ApiResponse<StockImport>>(`/stock-imports/${id}`, data, withManagerPin(pin));
  return res.data.data;
};

export const voidStockImport = async (id: string, pin: string) => {
  const res = await api.post<ApiResponse<string>>(`/stock-imports/${id}/void`, null, withManagerPin(pin));
  return res.data.data;
};
