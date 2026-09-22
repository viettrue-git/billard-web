import api from './axiosInstance';
import { withManagerPin } from './managerPin';
import type { ApiResponse, Invoice } from '../types';

export const getInvoices = async (pin: string) => {
  const res = await api.get<ApiResponse<Invoice[]>>('/invoices', withManagerPin(pin));
  return res.data.data;
};
