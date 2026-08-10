import api from './axiosInstance';
import type { ApiResponse, Invoice } from '../types';

export const getInvoices = async () => {
  const res = await api.get<ApiResponse<Invoice[]>>('/invoices');
  return res.data.data;
};
