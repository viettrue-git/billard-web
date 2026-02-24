import api from './axiosInstance';
import { ApiResponse, Reservation } from '../types';

export const getReservations = async (status?: string) => {
  const res = await api.get<ApiResponse<Reservation[]>>('/reservations', { params: { status } });
  return res.data.data;
};

export const createReservation = async (data: {
  customerName: string;
  customerPhone: string;
  tableId: string;
  reservedDate: string;
  startTime: string;
  endTime: string;
  depositAmount: number;
  notes?: string;
}) => {
  const res = await api.post<ApiResponse<Reservation>>('/reservations', data);
  return res.data.data;
};

export const updateReservationStatus = async (id: string, status: string) => {
  const res = await api.put<ApiResponse<Reservation>>(`/reservations/${id}/status`, { status });
  return res.data.data;
};
