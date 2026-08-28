import api from './axiosInstance';
import type { ApiResponse, StockImport, CreateStockImportRequest } from '../types';

export const getStockImports = async () => {
  const res = await api.get<ApiResponse<StockImport[]>>('/stock-imports');
  return res.data.data;
};

export const createStockImport = async (data: CreateStockImportRequest) => {
  const res = await api.post<ApiResponse<StockImport>>('/stock-imports', data);
  return res.data.data;
};

export const updateStockImport = async (id: string, data: CreateStockImportRequest) => {
  const res = await api.put<ApiResponse<StockImport>>(`/stock-imports/${id}`, data);
  return res.data.data;
};

export const voidStockImport = async (id: string) => {
  const res = await api.post<ApiResponse<string>>(`/stock-imports/${id}/void`);
  return res.data.data;
};
