import { create } from 'zustand';

interface ManagerPinState {
  pin: string | null;
  setPin: (pin: string) => void;
  clearPin: () => void;
}

/**
 * Giữ mã PIN quản lý trong lúc người dùng đang thao tác.
 *
 * Cố ý KHÔNG dùng `persist`: mã PIN chỉ sống trong RAM của tab hiện tại, đóng tab hay tải lại
 * trang là mất. Nếu lưu xuống localStorage thì bất kỳ ai ngồi vào máy sau đó cũng dùng được,
 * đúng thứ mà cơ chế PIN này sinh ra để ngăn.
 */
export const useManagerPinStore = create<ManagerPinState>((set) => ({
  pin: null,
  setPin: (pin) => set({ pin }),
  clearPin: () => set({ pin: null }),
}));
