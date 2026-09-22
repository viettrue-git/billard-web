import { describe, it, expect, beforeEach } from 'vitest';
import { useManagerPinStore } from './managerPinStore';

describe('managerPinStore', () => {
  beforeEach(() => {
    useManagerPinStore.getState().clearPin();
  });

  it('bắt đầu ở trạng thái chưa có PIN', () => {
    expect(useManagerPinStore.getState().pin).toBeNull();
  });

  it('lưu được PIN sau khi xác thực thành công', () => {
    useManagerPinStore.getState().setPin('246810');

    expect(useManagerPinStore.getState().pin).toBe('246810');
  });

  it('xóa sạch PIN khi rời màn hình', () => {
    useManagerPinStore.getState().setPin('246810');

    useManagerPinStore.getState().clearPin();

    expect(useManagerPinStore.getState().pin).toBeNull();
  });

  // PIN không được phép sống qua một phiên làm việc. Zustand chỉ gắn API `persist`
  // vào store khi có middleware persist, nên thiếu nó nghĩa là không ghi xuống đĩa.
  it('không gắn middleware persist', () => {
    expect((useManagerPinStore as unknown as { persist?: unknown }).persist).toBeUndefined();
  });
});
