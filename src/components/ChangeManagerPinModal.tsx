import { Modal, Form, Input, Alert, message } from 'antd';
import { useMutation, useQuery } from '@tanstack/react-query';
import { getManagerPinStatus, setManagerPin } from '../api/managerPin';
import { getApiErrorMessage } from '../utils/apiError';

interface Props {
  open: boolean;
  onClose: () => void;
}

interface FormValues {
  currentPin?: string;
  newPin: string;
  confirmPin: string;
}

const pinRules = [
  { required: true, message: 'Vui lòng nhập mã PIN' },
  { pattern: /^\d{4,8}$/, message: 'Mã PIN phải gồm 4 đến 8 chữ số' },
];

/** Đặt mã PIN lần đầu hoặc đổi mã PIN hiện tại. Chỉ Admin dùng được. */
export default function ChangeManagerPinModal({ open, onClose }: Props) {
  const [form] = Form.useForm<FormValues>();

  const { data: status } = useQuery({
    queryKey: ['manager-pin-status'],
    queryFn: getManagerPinStatus,
    enabled: open,
  });

  const isConfigured = status?.isConfigured ?? true;

  const mutation = useMutation({
    mutationFn: (values: FormValues) => setManagerPin(values.newPin, values.currentPin),
    onSuccess: () => {
      message.success('Đã cập nhật mã PIN quản lý');
      form.resetFields();
      onClose();
    },
    onError: (err: unknown) =>
      message.error(getApiErrorMessage(err, 'Không cập nhật được mã PIN')),
  });

  return (
    <Modal
      open={open}
      title={isConfigured ? 'Đổi mã PIN quản lý' : 'Thiết lập mã PIN quản lý'}
      okText="Lưu"
      cancelText="Hủy"
      onOk={() => form.submit()}
      onCancel={() => {
        form.resetFields();
        onClose();
      }}
      confirmLoading={mutation.isPending}
      destroyOnClose
    >
      {!isConfigured && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="Hệ thống chưa có mã PIN"
          description="Các chức năng báo cáo, lịch sử hóa đơn và hủy phiếu nhập kho sẽ bị khóa cho tới khi đặt mã PIN."
        />
      )}

      <Form form={form} layout="vertical" onFinish={(values) => mutation.mutate(values)}>
        {isConfigured && (
          <Form.Item name="currentPin" label="Mã PIN hiện tại" rules={pinRules}>
            <Input.Password maxLength={8} inputMode="numeric" placeholder="Mã PIN đang dùng" />
          </Form.Item>
        )}

        <Form.Item name="newPin" label="Mã PIN mới" rules={pinRules}>
          <Input.Password maxLength={8} inputMode="numeric" placeholder="4 đến 8 chữ số" />
        </Form.Item>

        <Form.Item
          name="confirmPin"
          label="Nhập lại mã PIN mới"
          dependencies={['newPin']}
          rules={[
            { required: true, message: 'Vui lòng nhập lại mã PIN mới' },
            ({ getFieldValue }) => ({
              validator: (_, value) =>
                !value || getFieldValue('newPin') === value
                  ? Promise.resolve()
                  : Promise.reject(new Error('Hai mã PIN không khớp')),
            }),
          ]}
        >
          <Input.Password maxLength={8} inputMode="numeric" placeholder="Nhập lại để xác nhận" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
