import api from './axiosInstance';
import { ApiResponse, LoginResponse } from '../types';

export const login = async (username: string, password: string) => {
  const res = await api.post<ApiResponse<LoginResponse>>('/auth/login', { username, password });
  return res.data.data;
};
