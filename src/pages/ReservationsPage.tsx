import { useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, DatePicker, TimePicker, InputNumber, Tag, Space, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getReservations, createReservation, updateReservationStatus } from '../api/reservations';
import { getTables } from '../api/tables';
import type { Reservation } from '../types';
import { formatCurrency } from '../utils/format';
import dayjs from 'dayjs';

const statusColor: Record<string, string> = {
  Pending: 'orange', Confirmed: 'green', Cancelled: 'red', Completed: 'blue'
};
const statusLabel: Record<string, string> = {
  Pending: 'Chờ xác nhận', Confirmed: 'Đã xác nhận', Cancelled: 'Đã huỷ', Completed: 'Hoàn thành'
};

export default function ReservationsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [form] = Form.useForm();
  const qc = useQueryClient();

  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ['reservations', statusFilter],
    queryFn: () => getReservations(statusFilter),
  });

  const { data: tables = [] } = useQuery({ queryKey: ['tables'], queryFn: getTables });

  const createMutation = useMutation({
    mutationFn: createReservation,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['reservations'] }); setModalOpen(false); form.resetFields(); message.success('Tạo đặt bàn thành công!'); },
    onError: () => message.error('Lỗi tạo đặt bàn'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateReservationStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['reservations'] }); message.success('Đã cập nhật'); },
  });

  const columns = [
    { title: 'Khách hàng', dataIndex: 'customerName', key: 'name' },
    { title: 'SĐT', dataIndex: 'customerPhone', key: 'phone' },
    { title: 'Bàn', dataIndex: 'tableNumber', key: 'table' },
    { title: 'Ngày', dataIndex: 'reservedDate', key: 'date' },
    { title: 'Giờ', key: 'time', render: (_: any, r: Reservation) => `${r.startTime} - ${r.endTime}` },
    { title: 'Đặt cọc', dataIndex: 'depositAmount', key: 'deposit', render: (v: number) => formatCurrency(v) },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={statusColor[s]}>{statusLabel[s]}</Tag> },
    {
      title: 'Hành động', key: 'actions', render: (_: any, r: Reservation) => (
        <Space>
          {r.status === 'Pending' && <Button size="small" type="primary" onClick={() => statusMutation.mutate({ id: r.id, status: 'Confirmed' })}>Xác nhận</Button>}
          {r.status !== 'Cancelled' && r.status !== 'Completed' && (
            <Button size="small" danger onClick={() => statusMutation.mutate({ id: r.id, status: 'Cancelled' })}>Huỷ</Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Space>
          <Select placeholder="Lọc trạng thái" allowClear style={{ width: 160 }} onChange={setStatusFilter} options={[
            { value: 'Pending', label: 'Chờ xác nhận' },
            { value: 'Confirmed', label: 'Đã xác nhận' },
            { value: 'Cancelled', label: 'Đã huỷ' },
            { value: 'Completed', label: 'Hoàn thành' },
          ]} />
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>Tạo đặt bàn</Button>
      </div>

      <Table dataSource={reservations} columns={columns} rowKey="id" loading={isLoading} />

      <Modal title="Tạo đặt bàn" open={modalOpen} onCancel={() => setModalOpen(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={(v) => createMutation.mutate({
          customerName: v.customerName,
          customerPhone: v.customerPhone,
          tableId: v.tableId,
          reservedDate: v.reservedDate.format('YYYY-MM-DD'),
          startTime: v.startTime.format('HH:mm'),
          endTime: v.endTime.format('HH:mm'),
          depositAmount: v.depositAmount,
          notes: v.notes,
        })}>
          <Form.Item label="Tên khách hàng" name="customerName" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="Số điện thoại" name="customerPhone" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="Bàn" name="tableId" rules={[{ required: true }]}>
            <Select options={tables.filter(t => t.status === 'Available').map(t => ({ value: t.id, label: `${t.tableNumber} (${t.tableType})` }))} />
          </Form.Item>
          <Form.Item label="Ngày" name="reservedDate" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item>
          <Form.Item label="Giờ bắt đầu" name="startTime" rules={[{ required: true }]}><TimePicker format="HH:mm" style={{ width: '100%' }} /></Form.Item>
          <Form.Item label="Giờ kết thúc" name="endTime" rules={[{ required: true }]}><TimePicker format="HH:mm" style={{ width: '100%' }} /></Form.Item>
          <Form.Item label="Tiền đặt cọc" name="depositAmount" initialValue={0}><InputNumber style={{ width: '100%' }} min={0} step={50000} /></Form.Item>
          <Form.Item label="Ghi chú" name="notes"><Input.TextArea rows={2} /></Form.Item>
          <Button type="primary" htmlType="submit" block loading={createMutation.isPending}>Tạo đặt bàn</Button>
        </Form>
      </Modal>
    </div>
  );
}
