import { useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, InputNumber, DatePicker, Space, Tag, Descriptions, message, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined, EyeOutlined, EditOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { getStockImports, createStockImport, updateStockImport, voidStockImport } from '../api/stockImports';
import { getProducts } from '../api/products';
import type { StockImport } from '../types';
import { formatCurrency, formatDateTime } from '../utils/format';

export default function StockImportsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<StockImport | null>(null);
  const [viewTarget, setViewTarget] = useState<StockImport | null>(null);
  const [form] = Form.useForm();
  const qc = useQueryClient();

  const { data: stockImports = [], isLoading } = useQuery({ queryKey: ['stock-imports'], queryFn: getStockImports });
  const { data: products = [] } = useQuery({ queryKey: ['products'], queryFn: () => getProducts() });

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ['stock-imports'] });
    qc.invalidateQueries({ queryKey: ['reports-daily'] });
    qc.invalidateQueries({ queryKey: ['reports-monthly'] });
  };

  const createMutation = useMutation({
    mutationFn: createStockImport,
    onSuccess: () => {
      invalidateAll();
      setModalOpen(false);
      form.resetFields();
      message.success('Nhập hàng thành công');
    },
    onError: (err: any) => message.error(err?.response?.data?.message ?? 'Nhập hàng thất bại'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateStockImport(id, data),
    onSuccess: () => {
      invalidateAll();
      setModalOpen(false);
      setEditTarget(null);
      form.resetFields();
      message.success('Cập nhật phiếu nhập thành công');
    },
    onError: (err: any) => message.error(err?.response?.data?.message ?? 'Cập nhật thất bại'),
  });

  const voidMutation = useMutation({
    mutationFn: voidStockImport,
    onSuccess: () => {
      invalidateAll();
      message.success('Đã hủy phiếu nhập');
    },
    onError: (err: any) => message.error(err?.response?.data?.message ?? 'Hủy phiếu thất bại'),
  });

  const openCreate = () => {
    setEditTarget(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (record: StockImport) => {
    setEditTarget(record);
    form.setFieldsValue({
      supplierName: record.supplierName,
      importDate: dayjs(record.importDate),
      note: record.note,
      items: record.items.map((i) => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice })),
    });
    setModalOpen(true);
  };

  const onFinish = (values: any) => {
    const data = {
      importDate: values.importDate?.toISOString(),
      supplierName: values.supplierName,
      note: values.note,
      items: (values.items ?? []).map((i: any) => ({
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
    };
    if (editTarget) updateMutation.mutate({ id: editTarget.id, data });
    else createMutation.mutate(data);
  };

  const columns = [
    { title: 'Ngày nhập', dataIndex: 'importDate', key: 'importDate', render: (v: string) => formatDateTime(v) },
    { title: 'Nhà cung cấp', dataIndex: 'supplierName', key: 'supplierName' },
    { title: 'Số mặt hàng', key: 'itemCount', render: (_: any, r: StockImport) => r.items.length },
    { title: 'Tổng tiền', dataIndex: 'totalAmount', key: 'totalAmount', render: (v: number) => formatCurrency(v) },
    { title: 'Người tạo', dataIndex: 'createdByName', key: 'createdByName' },
    {
      title: 'Trạng thái', key: 'status', render: (_: any, r: StockImport) =>
        r.isVoided ? <Tag color="red">Đã hủy</Tag> : <Tag color="green">Hoạt động</Tag>
    },
    {
      title: '', key: 'actions', render: (_: any, r: StockImport) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => setViewTarget(r)} />
          {!r.isVoided && (
            <>
              <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
              <Popconfirm title="Xác nhận hủy phiếu nhập này?" onConfirm={() => voidMutation.mutate(r.id)}>
                <Button size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </>
          )}
        </Space>
      )
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Thêm phiếu nhập
        </Button>
      </div>
      <Table dataSource={stockImports} columns={columns} rowKey="id" loading={isLoading} />

      <Modal
        title={editTarget ? 'Sửa phiếu nhập hàng' : 'Thêm phiếu nhập hàng'}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); setEditTarget(null); }}
        footer={null}
        width={720}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ importDate: dayjs() }}>
          <Form.Item label="Nhà cung cấp" name="supplierName" rules={[{ required: true, message: 'Vui lòng nhập nhà cung cấp' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Ngày nhập" name="importDate" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Ghi chú" name="note">
            <Input.TextArea rows={2} />
          </Form.Item>

          <Form.List name="items" rules={[{ validator: async (_, items) => {
            if (!items || items.length === 0) return Promise.reject(new Error('Phải có ít nhất một sản phẩm'));
          } }]}>
            {(fields, { add, remove }, { errors }) => (
              <>
                {fields.map(({ key, name, ...rest }) => (
                  <Space key={key} align="baseline" style={{ display: 'flex', marginBottom: 8 }}>
                    <Form.Item
                      {...rest}
                      name={[name, 'productId']}
                      rules={[{ required: true, message: 'Chọn sản phẩm' }]}
                      style={{ width: 220 }}
                    >
                      <Select
                        placeholder="Sản phẩm"
                        options={products.map((p) => ({ value: p.id, label: p.name }))}
                        onChange={(productId) => {
                          const product = products.find((p) => p.id === productId);
                          if (product) {
                            const items = form.getFieldValue('items');
                            items[name].unitPrice = product.price;
                            form.setFieldValue('items', items);
                          }
                        }}
                      />
                    </Form.Item>
                    <Form.Item {...rest} name={[name, 'quantity']} rules={[{ required: true, message: 'SL' }]}>
                      <InputNumber placeholder="Số lượng" min={1} />
                    </Form.Item>
                    <Form.Item {...rest} name={[name, 'unitPrice']} rules={[{ required: true, message: 'Đơn giá' }]}>
                      <InputNumber placeholder="Đơn giá" min={0} step={1000} style={{ width: 140 }} />
                    </Form.Item>
                    <Button icon={<DeleteOutlined />} danger onClick={() => remove(name)} />
                  </Space>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add({ quantity: 1, unitPrice: 0 })} icon={<PlusOutlined />} block>
                    Thêm sản phẩm
                  </Button>
                  <Form.ErrorList errors={errors} />
                </Form.Item>
              </>
            )}
          </Form.List>

          <Button type="primary" htmlType="submit" block loading={createMutation.isPending || updateMutation.isPending}>
            {editTarget ? 'Cập nhật' : 'Lưu phiếu nhập'}
          </Button>
        </Form>
      </Modal>

      <Modal
        title="Chi tiết phiếu nhập hàng"
        open={!!viewTarget}
        onCancel={() => setViewTarget(null)}
        footer={<Button onClick={() => setViewTarget(null)}>Đóng</Button>}
        width={640}
      >
        {viewTarget && (
          <>
            <Descriptions column={1} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Ngày nhập">{formatDateTime(viewTarget.importDate)}</Descriptions.Item>
              <Descriptions.Item label="Nhà cung cấp">{viewTarget.supplierName}</Descriptions.Item>
              <Descriptions.Item label="Ghi chú">{viewTarget.note || '-'}</Descriptions.Item>
              <Descriptions.Item label="Người tạo">{viewTarget.createdByName}</Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                {viewTarget.isVoided ? <Tag color="red">Đã hủy</Tag> : <Tag color="green">Hoạt động</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="Tổng tiền">{formatCurrency(viewTarget.totalAmount)}</Descriptions.Item>
            </Descriptions>
            <Table
              dataSource={viewTarget.items}
              rowKey="productId"
              pagination={false}
              size="small"
              columns={[
                { title: 'Sản phẩm', dataIndex: 'productName', key: 'productName' },
                { title: 'Số lượng', dataIndex: 'quantity', key: 'quantity' },
                { title: 'Đơn giá', dataIndex: 'unitPrice', key: 'unitPrice', render: (v: number) => formatCurrency(v) },
                { title: 'Thành tiền', dataIndex: 'lineAmount', key: 'lineAmount', render: (v: number) => formatCurrency(v) },
              ]}
            />
          </>
        )}
      </Modal>
    </div>
  );
}
