import api from './axiosInstance';
import { ApiResponse, DailyReport } from '../types';

export const getDailyReport = async (date?: string) => {
  const res = await api.get<ApiResponse<DailyReport>>('/reports/daily', { params: { date } });
  return res.data.data;
};

export const getMonthlyReport = async (year?: number, month?: number) => {
  const res = await api.get<ApiResponse<DailyReport[]>>('/reports/monthly', { params: { year, month } });
  return res.data.data;
};
