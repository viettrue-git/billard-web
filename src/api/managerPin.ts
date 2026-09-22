import api from './axiosInstance';
import type { ApiResponse, ManagerPinStatus } from '../types';

/** Header mà backend đọc mã PIN quản lý ra để kiểm tra. */
export const MANAGER_PIN_HEADER = 'X-Manager-Pin';

/** Mã lỗi backend trả về khi hệ thống chưa từng thiết lập PIN. */
export const PIN_NOT_CONFIGURED = 'PIN_NOT_CONFIGURED';

/** Cấu hình axios kèm mã PIN, dùng cho mọi request tới chức năng nhạy cảm. */
export const withManagerPin = (pin: string) => ({ headers: { [MANAGER_PIN_HEADER]: pin } });

export const getManagerPinStatus = async () => {
  const res = await api.get<ApiResponse<ManagerPinStatus>>('/auth/pin/status');
  return res.data.data;
};

export const verifyManagerPin = async (pin: string) => {
  const res = await api.post<ApiResponse<string>>('/auth/pin/verify', { pin });
  return res.data.data;
};

export const setManagerPin = async (newPin: string, currentPin?: string) => {
  const res = await api.put<ApiResponse<string>>('/auth/pin', { newPin, currentPin });
  return res.data.data;
};
