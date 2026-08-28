import { useState } from 'react';
import { Row, Col, Card, Statistic, DatePicker, Spin } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { getMonthlyReport, getDailyReport } from '../api/reports';
import { formatCurrency } from '../utils/format';
import dayjs, { Dayjs } from 'dayjs';

export default function ReportsPage() {
  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(dayjs());

  const { data: monthly = [], isLoading } = useQuery({
    queryKey: ['reports-monthly', selectedMonth.year(), selectedMonth.month() + 1],
    queryFn: () => getMonthlyReport(selectedMonth.year(), selectedMonth.month() + 1),
  });

  const { data: today } = useQuery({
    queryKey: ['reports-daily', dayjs().format('YYYY-MM-DD')],
    queryFn: () => getDailyReport(dayjs().format('YYYY-MM-DD')),
  });

  const totalRevenue = monthly.reduce((s, d) => s + d.totalRevenue, 0);
  const totalSessions = monthly.reduce((s, d) => s + d.totalSessions, 0);
  const totalPurchase = monthly.reduce((s, d) => s + d.purchaseAmount, 0);

  const chartData = monthly.map((d) => ({
    date: d.date.slice(-2),
    'Doanh thu': d.tableRevenue + d.foodRevenue,
    'Tiền nhập hàng': d.purchaseAmount,
  }));

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={12}><Card><Statistic title="DT hôm nay" value={formatCurrency(today?.totalRevenue ?? 0)} /></Card></Col>
        <Col span={12}><Card><Statistic title="Sessions hôm nay" value={today?.totalSessions ?? 0} /></Card></Col>
      </Row>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}><Card><Statistic title="DT tháng này" value={formatCurrency(totalRevenue)} /></Card></Col>
        <Col span={8}><Card><Statistic title="Sessions tháng này" value={totalSessions} /></Card></Col>
        <Col span={8}><Card><Statistic title="Tiền nhập hàng tháng này" value={formatCurrency(totalPurchase)} /></Card></Col>
      </Row>

      <Card title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Doanh thu theo ngày</span>
          <DatePicker picker="month" value={selectedMonth} onChange={(v) => v && setSelectedMonth(v)} />
        </div>
      }>
        {isLoading ? <Spin /> : (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip formatter={(v?: number) => formatCurrency(v ?? 0)} />
              <Legend />
              <Bar dataKey="Doanh thu" fill="#1890ff" />
              <Bar dataKey="Tiền nhập hàng" fill="#fa8c16" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  );
}
