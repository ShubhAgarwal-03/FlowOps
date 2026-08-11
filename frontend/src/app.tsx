import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/authContext';
import { ProtectedRoute } from './routes/protectedRoutes';
import { AppLayout } from './components/layout/appLayout';
import { Login } from './pages/login';
import { Dashboard } from './pages/dashboard';
import { CustomerList } from './pages/customers/customerList';
import { CustomerDetail } from './pages/customers/customerDetail';
import { ProductList } from './pages/products/productList';
import { ProductDetail } from './pages/products/productDetail';
import { ChallanList } from './pages/challans/challanList';
import { ChallanBuilder } from './pages/challans/challanBuilder';
import { ChallanDetail } from './pages/challans/challanDetail';

function RootRedirect() {
  const { user } = useAuth();
  return <Navigate to={user ? '/dashboard' : '/login'} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RootRedirect />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />

              <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'SALES', 'ACCOUNTS']} />}>
                <Route path="/customers" element={<CustomerList />} />
                <Route path="/customers/:id" element={<CustomerDetail />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'WAREHOUSE']} />}>
                <Route path="/products" element={<ProductList />} />
                <Route path="/products/:id" element={<ProductDetail />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'SALES', 'ACCOUNTS']} />}>
                <Route path="/challans" element={<ChallanList />} />
                <Route path="/challans/new" element={<ChallanBuilder />} />
                <Route path="/challans/:id/edit" element={<ChallanBuilder />} />
                <Route path="/challans/:id" element={<ChallanDetail />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}