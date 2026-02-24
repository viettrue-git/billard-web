import { useState, useEffect, useCallback } from 'react';
import {
  Row, Col, Card, Badge, Button, Modal, Form, Input, Select, InputNumber,
  message, Spin, Tag, Space, Statistic, Divider, List, Typography, Radio
} from 'antd';
import {
  ClockCircleOutlined, DollarOutlined, PlusOutlined, CloseCircleOutlined, ShoppingCartOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTables, openTable, closeTable, getTableSession, addOrder } from '../api/tables';
import { getProducts } from '../api/products';
import { BilliardTable, TableSession } from '../types';
import { formatCurrency, calcCurrentAmount } from '../utils/format';
import { useSignalR } from '../hooks/useSignalR';

const { Text, Title } = Typography;

const statusConfig: Record<string, { color: string; label: string }> = {
  Available: { color: 'green', label: 'Trống' },
  Occupied: { color: 'red', label: 'Đang dùng' },
  Reserved: { color: 'orange', label: 'Đã đặt' },
  Maintenance: { color: 'gray', label: 'Bảo trì' },
};

export default function TablesPage() {
  const [selectedTable, setSelectedTable] = useState<BilliardTable | null>(null);
  const [sessionModal, setSessionModal] = useState(false);
  const [closeModal, setCloseModal] = useState(false);
  const [orderModal, setOrderModal] = useState(false);
  const [currentSession, setCurrentSession] = useState<TableSession | null>(null);
  const [timer, setTimer] = useState<Record<string, number>>({});
  const [openForm] = Form.useForm();
  const [closeForm] = Form.useForm();
  const qc = useQueryClient();

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

  // Live timer for occupied tables
  useEffect(() => {
    const interval = setInterval(() => {
      const newTimer: Record<string, number> = {};
      tables.forEach((t) => {
        if (t.status === 'Occupied' && t.currentSession) {
          newTimer[t.id] = calcCurrentAmount(t.currentSession.openedAt, t.hourlyRate);
        }
      });
      setTimer(newTimer);
    }, 10000);
    return () => clearInterval(interval);
  }, [tables]);

  const openMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) => openTable(id, notes),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tables'] }); message.success('Đã mở bàn!'); setSessionModal(false); openForm.resetFields(); },
    onError: (e: any) => message.error(e.response?.data?.message || 'Lỗi mở bàn'),
  });

  const closeMutation = useMutation({
    mutationFn: ({ id, discount, payment }: { id: string; discount: number; payment: string }) =>
      closeTable(id, discount, payment),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tables'] }); message.success('Thanh toán thành công!'); setCloseModal(false); setCurrentSession(null); closeForm.resetFields(); },
    onError: (e: any) => message.error(e.response?.data?.message || 'Lỗi thanh toán'),
  });

  const orderMutation = useMutation({
    mutationFn: ({ sessionId, productId, quantity }: { sessionId: string; productId: string; quantity: number }) =>
      addOrder(sessionId, productId, quantity),
    onSuccess: (session) => { setCurrentSession(session); message.success('Đã thêm sản phẩm!'); },
    onError: (e: any) => message.error(e.response?.data?.message || 'Lỗi'),
  });

  const handleTableClick = async (table: BilliardTable) => {
    setSelectedTable(table);
    if (table.status === 'Occupied') {
      const session = await getTableSession(table.id);
      setCurrentSession(session);
      setCloseModal(true);
    } else if (table.status === 'Available') {
      setSessionModal(true);
    }
  };

  const totalOccupied = tables.filter((t) => t.status === 'Occupied').length;
  const totalRevenue = Object.values(timer).reduce((a, b) => a + b, 0);

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
            const amount = timer[table.id] ?? table.currentSession?.currentAmount ?? 0;
            return (
              <Col key={table.id} xs={12} sm={8} md={6} lg={4}>
                <Card
                  hoverable
                  onClick={() => handleTableClick(table)}
                  style={{ borderTop: `4px solid ${cfg.color}`, cursor: 'pointer', textAlign: 'center' }}
                  bodyStyle={{ padding: 12 }}
                >
                  <Title level={4} style={{ margin: 0 }}>{table.tableNumber}</Title>
                  <Tag color={cfg.color}>{cfg.label}</Tag>
                  {table.tableType === 'VIP' && <Tag color="gold" style={{ marginLeft: 4 }}>VIP</Tag>}
                  <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                    {formatCurrency(table.hourlyRate)}/giờ
                  </div>
                  {table.status === 'Occupied' && (
                    <div style={{ marginTop: 4, color: '#cf1322', fontWeight: 'bold' }}>
                      {formatCurrency(amount)}
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
        <Form form={openForm} layout="vertical" onFinish={(v) => openMutation.mutate({ id: selectedTable!.id, notes: v.notes })}>
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
              <Col span={12}><Statistic title="Tiền bàn (tạm tính)" value={formatCurrency(timer[selectedTable?.id ?? ''] ?? 0)} /></Col>
            </Row>
            <Divider>Đồ uống & Thức ăn</Divider>
            <List
              size="small"
              dataSource={currentSession.orderItems}
              renderItem={(item) => (
                <List.Item extra={<Text strong>{formatCurrency(item.total)}</Text>}>
                  {item.productName} x{item.quantity}
                </List.Item>
              )}
              footer={<Text strong>Tổng F&B: {formatCurrency(currentSession.orderItems.reduce((s, i) => s + i.total, 0))}</Text>}
            />
            <Button icon={<PlusOutlined />} onClick={() => setOrderModal(true)} style={{ marginBottom: 16 }}>
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
              <Button type="primary" danger htmlType="submit" block loading={closeMutation.isPending} icon={<DollarOutlined />}>
                Thanh toán & Đóng bàn
              </Button>
            </Form>
          </>
        )}
      </Modal>

      {/* Modal Thêm đồ uống */}
      <Modal title="Thêm sản phẩm" open={orderModal} onCancel={() => setOrderModal(false)} footer={null}>
        <Form layout="vertical" onFinish={(v) => { orderMutation.mutate({ sessionId: currentSession!.id, productId: v.productId, quantity: v.quantity }); setOrderModal(false); }}>
          <Form.Item label="Sản phẩm" name="productId" rules={[{ required: true }]}>
            <Select placeholder="Chọn sản phẩm" showSearch optionFilterProp="label"
              options={products.map((p) => ({ value: p.id, label: `${p.name} - ${formatCurrency(p.price)}/${p.unit}` }))} />
          </Form.Item>
          <Form.Item label="Số lượng" name="quantity" initialValue={1} rules={[{ required: true }]}>
            <InputNumber min={1} max={100} style={{ width: '100%' }} />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>Thêm</Button>
        </Form>
      </Modal>
    </div>
  );
}
