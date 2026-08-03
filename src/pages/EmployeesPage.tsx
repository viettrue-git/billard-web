import { useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, DatePicker, Space, Popconfirm, message } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEmployees, createEmployee, deleteEmployee } from '../api/employees';
import type { Employee } from '../types';

export default function EmployeesPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const qc = useQueryClient();

  const { data: employees = [], isLoading } = useQuery({ queryKey: ['employees'], queryFn: getEmployees });

  const createMutation = useMutation({
    mutationFn: createEmployee,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employees'] }); setModalOpen(false); form.resetFields(); message.success('Tạo nhân viên thành công'); },
    onError: () => message.error('Lỗi tạo nhân viên'),
  });
  const deleteMutation = useMutation({
    mutationFn: deleteEmployee,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employees'] }); message.success('Đã xóa nhân viên'); },
  });

  const columns = [
    { title: 'Họ tên', dataIndex: 'fullName', key: 'name' },
    { title: 'Tên đăng nhập', dataIndex: 'username', key: 'user' },
    { title: 'SĐT', dataIndex: 'phone', key: 'phone' },
    { title: 'Địa chỉ', dataIndex: 'address', key: 'address' },
    { title: 'Ngày vào', dataIndex: 'hireDate', key: 'hire' },
    {
      title: '', key: 'actions', render: (_: any, e: Employee) => (
        <Popconfirm title="Xác nhận xóa?" onConfirm={() => deleteMutation.mutate(e.id)}>
          <Button size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>Thêm nhân viên</Button>
      </div>
      <Table dataSource={employees} columns={columns} rowKey="id" loading={isLoading} />
      <Modal title="Thêm nhân viên" open={modalOpen} onCancel={() => setModalOpen(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={(v) => createMutation.mutate({ ...v, hireDate: v.hireDate.format('YYYY-MM-DD') })}>
          <Form.Item label="Họ tên" name="fullName" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="Tên đăng nhập" name="username" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="Mật khẩu" name="password" rules={[{ required: true }]}><Input.Password /></Form.Item>
          <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email' }]}><Input /></Form.Item>
          <Form.Item label="Số điện thoại" name="phone" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="Địa chỉ" name="address"><Input /></Form.Item>
          <Form.Item label="Ngày vào làm" name="hireDate" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item>
          <Form.Item label="Vai trò" name="role" initialValue="Staff">
            <Select options={[{ value: 'Staff', label: 'Nhân viên' }, { value: 'Cashier', label: 'Thu ngân' }, { value: 'Admin', label: 'Quản lý' }]} />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={createMutation.isPending}>Thêm nhân viên</Button>
        </Form>
      </Modal>
    </div>
  );
}
