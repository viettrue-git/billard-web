import api from './axiosInstance';
import { withManagerPin } from './managerPin';
import type { ApiResponse, DailyReport } from '../types';

export const getDailyReport = async (pin: string, date?: string) => {
  const res = await api.get<ApiResponse<DailyReport>>('/reports/daily', {
    params: { date },
    ...withManagerPin(pin),
  });
  return res.data.data;
};

export const getMonthlyReport = async (pin: string, year?: number, month?: number) => {
  const res = await api.get<ApiResponse<DailyReport[]>>('/reports/monthly', {
    params: { year, month },
    ...withManagerPin(pin),
  });
  return res.data.data;
};
