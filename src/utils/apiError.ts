import type { AxiosError } from 'axios';
import type { ApiResponse } from '../types';

type ApiErrorBody = ApiResponse<string | undefined>;

/** Thông báo lỗi do backend trả về, có phương án dự phòng khi không đọc được. */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  const body = (error as AxiosError<ApiErrorBody>)?.response?.data;
  return body?.message ?? fallback;
}

/** Mã lỗi backend đặt trong trường `data`, ví dụ PIN_NOT_CONFIGURED. */
export function getApiErrorCode(error: unknown): string | undefined {
  return (error as AxiosError<ApiErrorBody>)?.response?.data?.data;
}
