import { Link, Outlet, useNavigate } from 'react-router';
import { useAuth } from './AuthContext';
import { Button } from './ui/button';
import { ShoppingBag, Package, LogOut, User, MessageCircle } from 'lucide-react';

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link to="/" className="flex items-center space-x-2">
              <ShoppingBag className="h-8 w-8 text-blue-600" />
              <span className="font-bold text-xl">MarketSecure</span>
            </Link>

            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <span className="text-sm text-gray-600">
                    <User className="inline h-4 w-4 mr-1" />
                    {user.name}
                  </span>
                  {user.type === 'seller' ? (
                    <Link to="/seller/inventory">
                      <Button variant="outline" size="sm">
                        <Package className="h-4 w-4 mr-2" />
                        Mi Inventario
                      </Button>
                    </Link>
                  ) : (
                    <Link to="/marketplace">
                      <Button variant="outline" size="sm">
                        <ShoppingBag className="h-4 w-4 mr-2" />
                        Marketplace
                      </Button>
                    </Link>
                  )}
                  <Link to="/messages">
                    <Button variant="ghost" size="sm">
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={handleLogout}>
                    <LogOut className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Link to="/login">
                  <Button size="sm">Iniciar Sesión</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main>
        <Outlet />
      </main>
    </div>
  );
}
