import { useState } from 'react';
import { Modal, Input, Alert, Typography } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { verifyManagerPin, PIN_NOT_CONFIGURED } from '../api/managerPin';
import { getApiErrorCode, getApiErrorMessage } from '../utils/apiError';

interface Props {
  open: boolean;
  /** Mô tả thao tác đang cần duyệt, ví dụ "Hủy phiếu nhập kho". */
  action: string;
  onSuccess: (pin: string) => void;
  onCancel: () => void;
}

/**
 * Hỏi mã PIN quản lý trước khi cho phép một thao tác nhạy cảm.
 * PIN được gửi lên server kiểm tra, không so sánh ở phía trình duyệt.
 */
export default function ManagerPinModal({ open, action, onSuccess, onCancel }: Props) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const close = () => {
    setPin('');
    setError(null);
    onCancel();
  };

  const submit = async () => {
    if (!pin) {
      setError('Vui lòng nhập mã PIN');
      return;
    }

    setChecking(true);
    setError(null);
    try {
      await verifyManagerPin(pin);
      setPin('');
      onSuccess(pin);
    } catch (err: unknown) {
      setError(
        getApiErrorCode(err) === PIN_NOT_CONFIGURED
          ? 'Hệ thống chưa thiết lập mã PIN. Quản lý cần vào menu tài khoản để đặt mã PIN trước.'
          : getApiErrorMessage(err, 'Không kiểm tra được mã PIN. Vui lòng thử lại.')
      );
    } finally {
      setChecking(false);
    }
  };

  return (
    <Modal
      open={open}
      title={
        <span>
          <LockOutlined /> Nhập mã PIN quản lý
        </span>
      }
      okText="Xác nhận"
      cancelText="Hủy"
      onOk={submit}
      onCancel={close}
      confirmLoading={checking}
      destroyOnClose
      maskClosable={false}
    >
      <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
        Thao tác <strong>{action}</strong> cần mã PIN của người có thẩm quyền.
      </Typography.Paragraph>

      <Input.Password
        autoFocus
        value={pin}
        onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
        onPressEnter={submit}
        placeholder="Mã PIN (4-8 chữ số)"
        maxLength={8}
        inputMode="numeric"
        size="large"
      />

      {error && <Alert type="error" message={error} showIcon style={{ marginTop: 12 }} />}
    </Modal>
  );
}
