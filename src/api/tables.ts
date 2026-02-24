import api from './axiosInstance';
import { ApiResponse, BilliardTable, TableSession } from '../types';

export const getTables = async () => {
  const res = await api.get<ApiResponse<BilliardTable[]>>('/tables');
  return res.data.data;
};

export const getTableSession = async (tableId: string) => {
  const res = await api.get<ApiResponse<TableSession>>(`/tables/${tableId}/session`);
  return res.data.data;
};

export const openTable = async (tableId: string, notes?: string) => {
  const res = await api.post<ApiResponse<TableSession>>(`/tables/${tableId}/open`, { tableId, notes });
  return res.data.data;
};

export const closeTable = async (tableId: string, discountAmount: number, paymentMethod: string) => {
  const res = await api.post<ApiResponse<TableSession>>(`/tables/${tableId}/close`, {
    discountAmount,
    paymentMethod,
  });
  return res.data.data;
};

export const addOrder = async (sessionId: string, productId: string, quantity: number, note?: string) => {
  const res = await api.post<ApiResponse<TableSession>>(`/sessions/${sessionId}/orders`, {
    productId,
    quantity,
    note,
  });
  return res.data.data;
};
