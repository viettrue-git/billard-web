import api from './axiosInstance';
import { ApiResponse, Employee } from '../types';

export const getEmployees = async () => {
  const res = await api.get<ApiResponse<Employee[]>>('/employees');
  return res.data.data;
};

export const createEmployee = async (data: {
  username: string;
  password: string;
  email: string;
  fullName: string;
  phone: string;
  address?: string;
  hireDate: string;
  role: string;
}) => {
  const res = await api.post<ApiResponse<Employee>>('/employees', data);
  return res.data.data;
};

export const deleteEmployee = async (id: string) => {
  await api.delete(`/employees/${id}`);
};
