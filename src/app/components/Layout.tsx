import { Link, Outlet, useNavigate } from 'react-router';
import { useAuth } from './AuthContext';
import { Button } from './ui/button';
import { ShoppingBag, Package, LogOut, MessageCircle, Map, ShoppingCart } from 'lucide-react';
import { NotificationBell } from './NotificationBell';

export function Layout() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
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

            <div className="flex items-center space-x-2">
              {user ? (
                <>
                  {profile?.user_type === 'seller' && (
                    <Link to="/seller/inventory">
                      <Button variant="outline" size="sm">
                        <Package className="h-4 w-4 mr-2" />
                        Mi Inventario
                      </Button>
                    </Link>
                  )}

                  <Link to="/marketplace">
                    <Button variant="outline" size="sm">
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      Marketplace
                    </Button>
                  </Link>

                  <Link to="/messages">
                    <Button variant="ghost" size="sm">
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  </Link>

                  <Link to="/orders">
                    <Button variant="ghost" size="sm">
                      <ShoppingCart className="h-4 w-4" />
                    </Button>
                  </Link>

                  <Link to="/map">
                    <Button variant="ghost" size="sm">
                      <Map className="h-4 w-4" />
                    </Button>
                  </Link>

                  {/* Campanita de notificaciones en tiempo real */}
                  <NotificationBell />

                  <Link to="/profile">
                    <Button variant="ghost" size="sm" className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-xs">
                          {profile?.full_name?.charAt(0).toUpperCase() || '?'}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600 hidden sm:block">
                        {profile?.full_name?.split(' ')[0] || 'Perfil'}
                      </span>
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
