import { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Button, theme } from 'antd';
import {
  TableOutlined,
  CalendarOutlined,
  ShoppingOutlined,
  ImportOutlined,
  TeamOutlined,
  BarChartOutlined,
  HistoryOutlined,
  LogoutOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: '/', icon: <TableOutlined />, label: 'Quản lý Bàn' },
  { key: '/reservations', icon: <CalendarOutlined />, label: 'Đặt bàn' },
  { key: '/products', icon: <ShoppingOutlined />, label: 'Sản phẩm' },
  { key: '/stock-imports', icon: <ImportOutlined />, label: 'Nhập hàng' },
  { key: '/employees', icon: <TeamOutlined />, label: 'Nhân viên' },
  { key: '/reports', icon: <BarChartOutlined />, label: 'Báo cáo' },
  { key: '/invoices', icon: <HistoryOutlined />, label: 'Lịch sử thanh toán' },
];

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAdmin } = useAuthStore();
  const { token } = theme.useToken();

  const visibleItems = isAdmin()
    ? menuItems
    : menuItems.filter((i) => ['/', '/reservations'].includes(i.key));

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      onClick: () => { logout(); navigate('/login'); },
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} style={{ background: '#001529' }}>
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: '#fff', fontWeight: 'bold', fontSize: collapsed ? 14 : 16 }}>
            {collapsed ? 'BIA' : '🎱 Bi-a Manager'}
          </span>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={visibleItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{
          padding: '0 16px',
          background: token.colorBgContainer,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
          />
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar icon={<UserOutlined />} style={{ background: '#1890ff' }} />
              <span>{user?.username} ({user?.role})</span>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ margin: 16, padding: 16, background: token.colorBgContainer, borderRadius: 8, overflow: 'auto' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
