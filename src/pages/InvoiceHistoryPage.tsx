import { Table } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { getInvoices } from '../api/invoices';
import { formatCurrency, formatTime, formatDateTime } from '../utils/format';
import type { Invoice, OrderItem, PaymentMethod } from '../types';

const paymentMethodLabels: Record<PaymentMethod, string> = {
  Cash: 'Tiền mặt',
  Card: 'Thẻ',
  Transfer: 'Chuyển khoản',
};

const columns = [
  { title: 'Bàn', dataIndex: 'tableNumber', key: 'tableNumber' },
  {
    title: 'Giờ chơi',
    dataIndex: 'totalMinutes',
    key: 'totalMinutes',
    render: (minutes?: number) => formatTime(minutes ?? 0),
  },
  {
    title: 'Tiền bàn',
    dataIndex: 'sessionAmount',
    key: 'sessionAmount',
    render: formatCurrency,
  },
  {
    title: 'Giảm giá',
    dataIndex: 'discountAmount',
    key: 'discountAmount',
    render: formatCurrency,
  },
  {
    title: 'Tổng thanh toán',
    dataIndex: 'finalAmount',
    key: 'finalAmount',
    render: (amount: number) => <strong>{formatCurrency(amount)}</strong>,
  },
  {
    title: 'Phương thức',
    dataIndex: 'paymentMethod',
    key: 'paymentMethod',
    render: (method: PaymentMethod) => paymentMethodLabels[method] ?? method,
  },
  {
    title: 'Thời gian thanh toán',
    dataIndex: 'paidAt',
    key: 'paidAt',
    render: formatDateTime,
  },
  { title: 'Thu ngân', dataIndex: 'cashierName', key: 'cashierName' },
];

const orderItemColumns = [
  { title: 'Sản phẩm', dataIndex: 'productName', key: 'productName' },
  { title: 'SL', dataIndex: 'quantity', key: 'quantity' },
  { title: 'Đơn giá', dataIndex: 'unitPrice', key: 'unitPrice', render: formatCurrency },
  { title: 'Thành tiền', dataIndex: 'total', key: 'total', render: formatCurrency },
];

function OrderItemsPanel({ orderItems }: { orderItems: OrderItem[] }) {
  if (orderItems.length === 0) return <span>Không có</span>;
  return <Table dataSource={orderItems} columns={orderItemColumns} rowKey="id" pagination={false} size="small" />;
}

export default function InvoiceHistoryPage() {
  const { data: invoices = [], isLoading } = useQuery({ queryKey: ['invoices'], queryFn: getInvoices });

  return (
    <Table
      dataSource={invoices}
      columns={columns}
      rowKey="id"
      loading={isLoading}
      expandable={{
        expandedRowRender: (invoice: Invoice) => <OrderItemsPanel orderItems={invoice.orderItems} />,
      }}
    />
  );
}
