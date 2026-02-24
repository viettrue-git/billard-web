import { useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, InputNumber, Tag, Space, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProducts, getCategories, createProduct, updateProduct, deleteProduct } from '../api/products';
import { Product } from '../types';
import { formatCurrency } from '../utils/format';

export default function ProductsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Product | null>(null);
  const [form] = Form.useForm();
  const qc = useQueryClient();

  const { data: products = [], isLoading } = useQuery({ queryKey: ['products'], queryFn: () => getProducts() });
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: getCategories });

  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); setModalOpen(false); form.resetFields(); message.success('Đã thêm sản phẩm'); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateProduct(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); setModalOpen(false); setEditTarget(null); message.success('Đã cập nhật'); },
  });
  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); message.success('Đã xóa'); },
  });

  const openEdit = (p: Product) => {
    setEditTarget(p);
    form.setFieldsValue(p);
    setModalOpen(true);
  };

  const onFinish = (v: any) => {
    if (editTarget) updateMutation.mutate({ id: editTarget.id, data: v });
    else createMutation.mutate(v);
  };

  const columns = [
    { title: 'Tên sản phẩm', dataIndex: 'name', key: 'name' },
    { title: 'Danh mục', dataIndex: 'categoryName', key: 'cat' },
    { title: 'Giá', dataIndex: 'price', key: 'price', render: (v: number) => formatCurrency(v) },
    { title: 'Đơn vị', dataIndex: 'unit', key: 'unit' },
    { title: 'Tồn kho', dataIndex: 'stock', key: 'stock' },
    {
      title: '', key: 'actions', render: (_: any, p: Product) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(p)} />
          <Popconfirm title="Xác nhận xóa?" onConfirm={() => deleteMutation.mutate(p.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditTarget(null); form.resetFields(); setModalOpen(true); }}>
          Thêm sản phẩm
        </Button>
      </div>
      <Table dataSource={products} columns={columns} rowKey="id" loading={isLoading} />
      <Modal title={editTarget ? 'Sửa sản phẩm' : 'Thêm sản phẩm'} open={modalOpen} onCancel={() => { setModalOpen(false); setEditTarget(null); }} footer={null}>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item label="Danh mục" name="categoryId" rules={[{ required: true }]}>
            <Select options={categories.map(c => ({ value: c.id, label: c.name }))} />
          </Form.Item>
          <Form.Item label="Tên sản phẩm" name="name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="Giá (VND)" name="price" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={0} step={1000} /></Form.Item>
          <Form.Item label="Đơn vị" name="unit" rules={[{ required: true }]}><Input placeholder="lon, chai, gói..." /></Form.Item>
          <Form.Item label="Tồn kho" name="stock" initialValue={0}><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
          <Button type="primary" htmlType="submit" block loading={createMutation.isPending || updateMutation.isPending}>
            {editTarget ? 'Cập nhật' : 'Thêm'}
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
