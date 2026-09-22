import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, App as AntApp } from 'antd';
import viVN from 'antd/locale/vi_VN';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import ManagerPinGate from './components/ManagerPinGate';
import LoginPage from './pages/LoginPage';
import TablesPage from './pages/TablesPage';
import ReservationsPage from './pages/ReservationsPage';
import ProductsPage from './pages/ProductsPage';
import EmployeesPage from './pages/EmployeesPage';
import ReportsPage from './pages/ReportsPage';
import InvoiceHistoryPage from './pages/InvoiceHistoryPage';
import StockImportsPage from './pages/StockImportsPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider locale={viVN} theme={{ token: { colorPrimary: '#1890ff', borderRadius: 8 } }}>
        <AntApp>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<TablesPage />} />
                <Route path="reservations" element={<ReservationsPage />} />
                <Route path="products" element={<ProductsPage />} />
                <Route
                  path="stock-imports"
                  element={
                    <ManagerPinGate action="Quản lý nhập hàng">
                      <StockImportsPage />
                    </ManagerPinGate>
                  }
                />
                <Route path="employees" element={<EmployeesPage />} />
                <Route
                  path="reports"
                  element={
                    <ManagerPinGate action="Xem báo cáo doanh thu">
                      <ReportsPage />
                    </ManagerPinGate>
                  }
                />
                <Route
                  path="invoices"
                  element={
                    <ManagerPinGate action="Xem lịch sử thanh toán">
                      <InvoiceHistoryPage />
                    </ManagerPinGate>
                  }
                />
              </Route>
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </BrowserRouter>
        </AntApp>
      </ConfigProvider>
    </QueryClientProvider>
  );
}
