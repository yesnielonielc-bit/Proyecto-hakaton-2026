import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { AuthProvider, useAuth } from './components/AuthContext';
import { Layout } from './components/Layout';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { VerifyIdentityPage } from './pages/VerifyIdentityPage';
import { SellerInventoryPage } from './pages/SellerInventoryPage';
import { MarketplacePage } from './pages/MarketplacePage';
import { MessagesPage } from './pages/MessagesPage';
import { Toaster } from './components/ui/sonner';

function ProtectedRoute({ children, type }: { children: React.ReactNode; type?: 'seller' | 'buyer' }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (type && user.type !== type) {
    return <Navigate to={user.type === 'seller' ? '/seller/inventory' : '/marketplace'} replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<LandingPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="verify-identity" element={<VerifyIdentityPage />} />
            <Route
              path="seller/inventory"
              element={
                <ProtectedRoute type="seller">
                  <SellerInventoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="marketplace"
              element={
                <ProtectedRoute type="buyer">
                  <MarketplacePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="messages"
              element={
                <ProtectedRoute>
                  <MessagesPage />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
        <Toaster />
      </AuthProvider>
    </BrowserRouter>
  );
}