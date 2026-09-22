import { useState, useEffect } from 'react';
import {
  Row, Col, Card, Button, Modal, Form, Input, Select, InputNumber, DatePicker,
  message, Spin, Tag, Statistic, Divider, List, Typography, Radio, Popconfirm, Result, Empty
} from 'antd';
import {
  DollarOutlined, PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleFilled
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { getTables, openTable, closeTable, getTableSession, addOrder, updateOrderItem, deleteOrderItem, updateTablePrice } from '../api/tables';
import { getProducts } from '../api/products';
import type { BilliardTable, TableSession } from '../types';
import { formatCurrency, calcSessionFee, type SessionFee } from '../utils/format';
import { useSignalR } from '../hooks/useSignalR';
import { useAuthStore } from '../store/authStore';

const { Text, Title } = Typography;

const statusConfig: Record<string, { color: string; label: string }> = {
  Available: { color: 'green', label: 'Trống' },
  Occupied: { color: 'red', label: 'Đang dùng' },
  Reserved: { color: 'orange', label: 'Đã đặt' },
  Maintenance: { color: 'gray', label: 'Bảo trì' },
};

const paymentMethodLabel: Record<string, string> = {
  Cash: 'Tiền mặt',
  Card: 'Thẻ',
  Transfer: 'Chuyển khoản',
};

export default function TablesPage() {
  const [selectedTable, setSelectedTable] = useState<BilliardTable | null>(null);
  const [sessionModal, setSessionModal] = useState(false);
  const [closeModal, setCloseModal] = useState(false);
  const [orderModal, setOrderModal] = useState(false);
  const [currentSession, setCurrentSession] = useState<TableSession | null>(null);
  const [timer, setTimer] = useState<Record<string, SessionFee>>({});
  const [priceTarget, setPriceTarget] = useState<BilliardTable | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<{ tableNumber: string; finalAmount: number; paymentMethod: string } | null>(null);
  const [paymentPreview, setPaymentPreview] = useState<{ tableAmount: number; hourDiscount: number; foodAmount: number; discount: number; finalAmount: number; payment: string } | null>(null);
  const [openForm] = Form.useForm();
  const [closeForm] = Form.useForm();
  const [priceForm] = Form.useForm();
  const qc = useQueryClient();
  const isAdmin = useAuthStore((s) => s.isAdmin());

  useSignalR();

  const { data: tables = [], isLoading } = useQuery({
    queryKey: ['tables'],
    queryFn: getTables,
    refetchInterval: 30000,
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => getProducts(),
  });

  // Live timer for occupied tables (tinh ngay khi co du lieu, sau do cap nhat moi 10s)
  useEffect(() => {
    const tick = () => {
      const newTimer: Record<string, SessionFee> = {};
      tables.forEach((t) => {
        if (t.status === 'Occupied' && t.currentSession) {
          newTimer[t.id] = calcSessionFee(t.currentSession.openedAt, t.hourlyRate);
        }
      });
      setTimer(newTimer);
    };
    tick();
    const interval = setInterval(tick, 10000);
    return () => clearInterval(interval);
  }, [tables]);

  const openMutation = useMutation({
    mutationFn: ({ id, notes, openedAt }: { id: string; notes?: string; openedAt?: string }) => openTable(id, notes, openedAt),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tables'] }); message.success('Đã mở bàn!'); setSessionModal(false); openForm.resetFields(); },
    onError: (e: any) => message.error(e.response?.data?.message || 'Lỗi mở bàn'),
  });

  const closeMutation = useMutation({
    mutationFn: ({ id, discount, payment }: { id: string; discount: number; payment: string }) =>
      closeTable(id, discount, payment),
    onSuccess: (session, variables) => {
      qc.invalidateQueries({ queryKey: ['tables'] });
      setCloseModal(false);
      setCurrentSession(null);
      setPaymentPreview(null);
      closeForm.resetFields();
      setPaymentSuccess({
        tableNumber: session.tableNumber,
        finalAmount: (session.totalAmount ?? 0) - variables.discount,
        paymentMethod: variables.payment,
      });
    },
    onError: (e: any) => { setPaymentPreview(null); message.error(e.response?.data?.message || 'Lỗi thanh toán'); },
  });

  const orderMutation = useMutation({
    mutationFn: ({ sessionId, productId, quantity }: { sessionId: string; productId: string; quantity: number }) =>
      addOrder(sessionId, productId, quantity),
    onSuccess: (session) => { setCurrentSession(session); message.success('Đã thêm sản phẩm!'); },
    onError: (e: any) => message.error(e.response?.data?.message || 'Lỗi'),
  });

  const updateOrderItemMutation = useMutation({
    mutationFn: ({ orderItemId, quantity }: { orderItemId: string; quantity: number }) =>
      updateOrderItem(currentSession!.id, orderItemId, quantity),
    onSuccess: (session) => setCurrentSession(session),
    onError: (e: any) => message.error(e.response?.data?.message || 'Lỗi cập nhật sản phẩm'),
  });

  const deleteOrderItemMutation = useMutation({
    mutationFn: (orderItemId: string) => deleteOrderItem(currentSession!.id, orderItemId),
    onSuccess: (session) => { setCurrentSession(session); message.success('Đã xóa sản phẩm!'); },
    onError: (e: any) => message.error(e.response?.data?.message || 'Lỗi xóa sản phẩm'),
  });

  const priceMutation = useMutation({
    mutationFn: ({ id, hourlyRate }: { id: string; hourlyRate: number }) => updateTablePrice(id, hourlyRate),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tables'] }); message.success('Đã cập nhật giá bàn!'); setPriceTarget(null); },
    onError: (e: any) => message.error(e.response?.data?.message || 'Lỗi cập nhật giá bàn'),
  });

  const handleTableClick = async (table: BilliardTable) => {
    setSelectedTable(table);
    if (table.status === 'Occupied') {
      const session = await getTableSession(table.id);
      setCurrentSession(session);
      setCloseModal(true);
    } else if (table.status === 'Available') {
      openForm.setFieldsValue({ openedAt: dayjs() });
      setSessionModal(true);
    }
  };

  const totalOccupied = tables.filter((t) => t.status === 'Occupied').length;
  const totalRevenue = tables.reduce((sum, t) => {
    const tableAmount = timer[t.id]?.amount ?? t.currentSession?.currentAmount ?? 0;
    return sum + tableAmount + (t.currentSession?.foodAmount ?? 0);
  }, 0);

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card><Statistic title="Bàn đang dùng" value={totalOccupied} suffix={`/ ${tables.length}`} valueStyle={{ color: '#cf1322' }} /></Card>
        </Col>
        <Col span={8}>
          <Card><Statistic title="Bàn trống" value={tables.filter(t => t.status === 'Available').length} valueStyle={{ color: '#3f8600' }} /></Card>
        </Col>
        <Col span={8}>
          <Card><Statistic title="Doanh thu tạm tính" value={formatCurrency(totalRevenue)} /></Card>
        </Col>
      </Row>

      {isLoading ? <Spin size="large" style={{ display: 'block', textAlign: 'center', marginTop: 100 }} /> : (
        <Row gutter={[16, 16]}>
          {tables.map((table) => {
            const cfg = statusConfig[table.status];
            const tableAmount = timer[table.id]?.amount ?? table.currentSession?.currentAmount ?? 0;
            const hourDiscount = timer[table.id]?.discount ?? 0;
            const foodAmount = table.currentSession?.foodAmount ?? 0;
            const totalAmount = tableAmount + foodAmount;
            return (
              <Col key={table.id} xs={12} sm={8} md={6} lg={4}>
                <Card
                  hoverable
                  onClick={() => handleTableClick(table)}
                  style={{ borderTop: `4px solid ${cfg.color}`, cursor: 'pointer', textAlign: 'center', position: 'relative' }}
                  bodyStyle={{ padding: 12 }}
                >
                  {isAdmin && (
                    <Button
                      type="text"
                      size="small"
                      icon={<EditOutlined />}
                      style={{ position: 'absolute', top: 4, right: 4 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setPriceTarget(table);
                        priceForm.setFieldsValue({ hourlyRate: table.hourlyRate });
                      }}
                    />
                  )}
                  <Title level={4} style={{ margin: 0 }}>{table.tableNumber}</Title>
                  <Tag color={cfg.color}>{cfg.label}</Tag>
                  {table.tableType === 'VIP' && <Tag color="gold" style={{ marginLeft: 4 }}>VIP</Tag>}
                  <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                    {formatCurrency(table.hourlyRate)}/giờ
                  </div>
                  {table.status === 'Occupied' && (
                    <div style={{ marginTop: 4 }}>
                      <div style={{ color: '#cf1322', fontWeight: 'bold' }}>
                        {formatCurrency(totalAmount)}
                      </div>
                      <div style={{ fontSize: 11, color: '#888' }}>
                        Bàn {formatCurrency(tableAmount)}
                        {foodAmount > 0 && ` · DV ${formatCurrency(foodAmount)}`}
                      </div>
                      {hourDiscount > 0 && (
                        <div style={{ fontSize: 11, color: '#3f8600', fontWeight: 500 }}>
                          Đã giảm {formatCurrency(hourDiscount)}
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      {/* Modal Mở bàn */}
      <Modal
        title={`Mở bàn ${selectedTable?.tableNumber}`}
        open={sessionModal}
        onCancel={() => setSessionModal(false)}
        footer={null}
      >
        <Form
          form={openForm}
          layout="vertical"
          onFinish={(v) => openMutation.mutate({
            id: selectedTable!.id,
            notes: v.notes,
            openedAt: (v.openedAt as dayjs.Dayjs | undefined)?.toISOString(),
          })}
        >
          <Form.Item
            label="Giờ mở bàn"
            name="openedAt"
            rules={[{ required: true, message: 'Vui lòng chọn giờ mở bàn' }]}
            tooltip="Có thể chọn giờ trong quá khứ (tối đa 24 giờ) nếu khách đã vào chơi trước khi bấm mở bàn"
          >
            <DatePicker
              showTime
              format="DD/MM/YYYY HH:mm"
              style={{ width: '100%' }}
              disabledDate={(d) => !!d && (d.isAfter(dayjs(), 'day') || d.isBefore(dayjs().subtract(24, 'hour'), 'day'))}
            />
          </Form.Item>
          <Form.Item label="Ghi chú" name="notes">
            <Input.TextArea rows={2} placeholder="Ghi chú (tuỳ chọn)" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={openMutation.isPending}>
              Mở bàn
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Đóng bàn / Thanh toán */}
      <Modal
        title={`Bàn ${selectedTable?.tableNumber} - Thanh toán`}
        open={closeModal}
        onCancel={() => { setCloseModal(false); setCurrentSession(null); }}
        footer={null}
        width={600}
      >
        {currentSession && (
          <>
            <Row gutter={16}>
              <Col span={12}><Statistic title="Giờ mở" value={new Date(currentSession.openedAt).toLocaleTimeString('vi-VN')} /></Col>
              <Col span={12}>
                <Statistic title="Tiền bàn (tạm tính)" value={formatCurrency(timer[selectedTable?.id ?? '']?.amount ?? 0)} />
                {(timer[selectedTable?.id ?? '']?.discount ?? 0) > 0 && (
                  <Text style={{ fontSize: 12, color: '#3f8600' }}>
                    Đã giảm {formatCurrency(timer[selectedTable?.id ?? '']!.discount)} (chơi trên 3 giờ)
                  </Text>
                )}
              </Col>
            </Row>
            <Divider>Đồ uống & Thức ăn</Divider>
            <List
              size="small"
              dataSource={currentSession.orderItems}
              locale={{ emptyText: <Empty description="Chưa có đồ uống / thức ăn" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
              renderItem={(item) => (
                <List.Item key={item.id} style={{ padding: '8px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Text strong ellipsis style={{ display: 'block' }}>{item.productName}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>{formatCurrency(item.unitPrice)}/đơn vị</Text>
                    </div>
                    <InputNumber
                      size="small"
                      min={1}
                      max={999}
                      value={item.quantity}
                      disabled={updateOrderItemMutation.isPending}
                      onChange={(value) => {
                        if (value && value !== item.quantity) {
                          updateOrderItemMutation.mutate({ orderItemId: item.id, quantity: value });
                        }
                      }}
                      style={{ width: 64 }}
                      aria-label={`Số lượng ${item.productName}`}
                    />
                    <Text strong style={{ width: 110, textAlign: 'right', flexShrink: 0 }}>{formatCurrency(item.total)}</Text>
                    <Popconfirm
                      title="Xóa sản phẩm này khỏi hóa đơn?"
                      okText="Xóa"
                      cancelText="Hủy"
                      okButtonProps={{ danger: true }}
                      onConfirm={() => deleteOrderItemMutation.mutate(item.id)}
                    >
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        loading={deleteOrderItemMutation.isPending && deleteOrderItemMutation.variables === item.id}
                        aria-label={`Xóa ${item.productName}`}
                      />
                    </Popconfirm>
                  </div>
                </List.Item>
              )}
              footer={<Text strong>Tổng F&B: {formatCurrency(currentSession.orderItems.reduce((s, i) => s + i.total, 0))}</Text>}
            />
            <Button icon={<PlusOutlined />} onClick={() => setOrderModal(true)} style={{ marginBottom: 16, marginTop: 8 }}>
              Thêm đồ uống
            </Button>
            <Divider>Thanh toán</Divider>
            <Form form={closeForm} layout="vertical" onFinish={(v) => closeMutation.mutate({ id: selectedTable!.id, discount: v.discount ?? 0, payment: v.payment })}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Giảm giá (VND)" name="discount" initialValue={0}>
                    <InputNumber style={{ width: '100%' }} min={0} step={10000} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Phương thức" name="payment" initialValue="Cash">
                    <Radio.Group>
                      <Radio value="Cash">Tiền mặt</Radio>
                      <Radio value="Card">Thẻ</Radio>
                      <Radio value="Transfer">Chuyển khoản</Radio>
                    </Radio.Group>
                  </Form.Item>
                </Col>
              </Row>
              <Button
                type="primary"
                danger
                htmlType="button"
                block
                icon={<DollarOutlined />}
                onClick={() => {
                  const fee = timer[selectedTable?.id ?? ''];
                  const tableAmount = fee?.amount ?? 0;
                  const hourDiscount = fee?.discount ?? 0;
                  const foodAmount = currentSession.orderItems.reduce((s, i) => s + i.total, 0);
                  const discount = closeForm.getFieldValue('discount') ?? 0;
                  const payment = closeForm.getFieldValue('payment') ?? 'Cash';
                  const finalAmount = tableAmount + foodAmount - discount;
                  setPaymentPreview({ tableAmount, hourDiscount, foodAmount, discount, finalAmount, payment });
                }}
              >
                Thanh toán & Đóng bàn
              </Button>
            </Form>
          </>
        )}
      </Modal>

      {/* Modal xác nhận thanh toán */}
      <Modal
        open={!!paymentPreview}
        onCancel={() => setPaymentPreview(null)}
        footer={null}
        width={440}
        centered
        maskClosable={false}
        closable={!closeMutation.isPending}
        destroyOnHidden
      >
        {paymentPreview && (
          <div style={{ textAlign: 'center', padding: '8px 4px 0' }}>
            <div
              style={{
                width: 64, height: 64, borderRadius: '50%', background: '#fff1f0',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
              }}
            >
              <ExclamationCircleFilled style={{ fontSize: 32, color: '#cf1322' }} />
            </div>
            <Title level={4} style={{ marginBottom: 4 }}>Xác nhận thanh toán</Title>
            <Text type="secondary">Bàn {selectedTable?.tableNumber} · {paymentMethodLabel[paymentPreview.payment]}</Text>

            <div style={{ background: '#fafafa', borderRadius: 12, padding: '16px 20px', margin: '20px 0', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text type="secondary">Tiền bàn</Text>
                <Text>{formatCurrency(paymentPreview.tableAmount)}</Text>
              </div>
              {paymentPreview.hourDiscount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text type="secondary">Giảm giờ chơi (trên 3 giờ)</Text>
                  <Text style={{ color: '#3f8600' }}>-{formatCurrency(paymentPreview.hourDiscount)}</Text>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: paymentPreview.discount > 0 ? 8 : 0 }}>
                <Text type="secondary">Đồ uống & thức ăn</Text>
                <Text>{formatCurrency(paymentPreview.foodAmount)}</Text>
              </div>
              {paymentPreview.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">Giảm giá</Text>
                  <Text style={{ color: '#cf1322' }}>-{formatCurrency(paymentPreview.discount)}</Text>
                </div>
              )}
              <Divider style={{ margin: '12px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <Text strong style={{ fontSize: 15 }}>Khách cần trả</Text>
                <Text strong style={{ fontSize: 24, color: '#cf1322' }}>{formatCurrency(paymentPreview.finalAmount)}</Text>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <Button size="large" block disabled={closeMutation.isPending} onClick={() => setPaymentPreview(null)}>
                Hủy
              </Button>
              <Button
                type="primary"
                danger
                size="large"
                block
                icon={<DollarOutlined />}
                loading={closeMutation.isPending}
                onClick={() => closeForm.submit()}
              >
                Xác nhận
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Thêm đồ uống */}
      <Modal title="Thêm sản phẩm" open={orderModal} onCancel={() => setOrderModal(false)} footer={null} destroyOnHidden>
        <Form layout="vertical" onFinish={(v) => { orderMutation.mutate({ sessionId: currentSession!.id, productId: v.productId, quantity: v.quantity }); setOrderModal(false); }}>
          <Form.Item label="Sản phẩm" name="productId" rules={[{ required: true }]}>
            <Select placeholder="Chọn sản phẩm" showSearch optionFilterProp="label" disabled={orderMutation.isPending}
              options={products.map((p) => ({ value: p.id, label: `${p.name} - ${formatCurrency(p.price)}/${p.unit}` }))} />
          </Form.Item>
          <Form.Item label="Số lượng" name="quantity" initialValue={1} rules={[{ required: true }]}>
            <InputNumber min={1} max={100} style={{ width: '100%' }} disabled={orderMutation.isPending} />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={orderMutation.isPending} disabled={orderMutation.isPending}>Thêm</Button>
        </Form>
      </Modal>

      {/* Modal Sửa giá bàn (Admin) */}
      <Modal
        title={`Sửa giá bàn ${priceTarget?.tableNumber}`}
        open={!!priceTarget}
        onCancel={() => setPriceTarget(null)}
        footer={null}
      >
        <Form
          form={priceForm}
          layout="vertical"
          onFinish={(v) => priceMutation.mutate({ id: priceTarget!.id, hourlyRate: v.hourlyRate })}
        >
          <Form.Item
            label="Giá thuê theo giờ (VND)"
            name="hourlyRate"
            rules={[{ required: true, message: 'Vui lòng nhập giá thuê bàn' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={1}
              step={5000}
              formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={priceMutation.isPending}>
              Cập nhật giá
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Thông báo thanh toán thành công */}
      <Modal
        open={!!paymentSuccess}
        onCancel={() => setPaymentSuccess(null)}
        footer={null}
        width={420}
        centered
      >
        {paymentSuccess && (
          <Result
            status="success"
            title="Thanh toán thành công!"
            subTitle={
              <>
                Bàn {paymentSuccess.tableNumber} · {formatCurrency(paymentSuccess.finalAmount)} · {paymentMethodLabel[paymentSuccess.paymentMethod]}
              </>
            }
            extra={
              <Button type="primary" onClick={() => setPaymentSuccess(null)}>
                Đóng
              </Button>
            }
          />
        )}
      </Modal>
    </div>
  );
}
