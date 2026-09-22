import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useManagerPinStore } from '../store/managerPinStore';
import ManagerPinModal from './ManagerPinModal';

interface Props {
  /** Tên màn hình đang được bảo vệ, hiển thị trong hộp thoại hỏi PIN. */
  action: string;
  children: React.ReactNode;
}

/**
 * Bọc một màn hình nhạy cảm: chưa nhập đúng PIN thì không render nội dung bên trong,
 * nên cũng không gọi bất kỳ API nào của màn hình đó.
 *
 * Rời khỏi màn hình là xóa PIN, lần sau quay lại phải nhập lại.
 */
export default function ManagerPinGate({ action, children }: Props) {
  const { pin, setPin, clearPin } = useManagerPinStore();
  const navigate = useNavigate();

  useEffect(() => clearPin, [clearPin]);

  if (!pin) {
    return (
      <ManagerPinModal
        open
        action={action}
        onSuccess={setPin}
        onCancel={() => navigate('/', { replace: true })}
      />
    );
  }

  return <>{children}</>;
}
