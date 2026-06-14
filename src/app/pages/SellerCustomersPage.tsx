import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router';
import { Card } from '../components/ui/card';
import { supabase } from '@/lib/supabase';
import { useAuth } from '../components/AuthContext';
import {
  Users, Star, ShoppingBag, MessageCircle, Search,
  LayoutDashboard, Package, TrendingUp, BarChart2,
  Settings, Bell, ChevronDown, LogOut, ShoppingCart, Menu, Loader2, Eye
} from 'lucide-react';
import { toast } from 'sonner';

interface Customer {
  id: string;
  full_name: string;
  email: string;
  city: string;
  total_orders: number;
  total_spent: number;
  last_order: string;
}

const navItems = [
  { to: '/seller/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/seller/inventory', icon: Package, label: 'Inventario' },
  { to: '/seller/orders', icon: ShoppingBag, label: 'Pedidos' },
  { to: '/seller/sales', icon: TrendingUp, label: 'Ventas' },
  { to: '/seller/customers', icon: Users, label: 'Clientes' },
  { to: '/messages', icon: MessageCircle, label: 'Mensajes' },
  { to: '/seller/reports', icon: BarChart2, label: 'Reportes' },
  { to: '/seller/settings', icon: Settings, label: 'Configuración' },
];

export function SellerCustomersPage() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => { if (user) fetchCustomers(); }, [user]);

  const fetchCustomers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select(`
        buyer_id, total_amount, status, created_at,
        buyer:profiles!orders_buyer_id_fkey(id, full_name, email, city)
      `)
      .eq('seller_id', user!.id)
      .neq('status', 'cancelled');

    if (error) { toast.error('Error al cargar clientes'); setLoading(false); return; }

    // Agrupar por comprador
    const customerMap = new Map<string, Customer>();
    (data || []).forEach((order: any) => {
      const buyer = order.buyer;
      if (!buyer) return;
      const existing = customerMap.get(buyer.id);
      if (existing) {
        existing.total_orders += 1;
        existing.total_spent += order.total_amount;
        if (order.created_at > existing.last_order) existing.last_order = order.created_at;
      } else {
        customerMap.set(buyer.id, {
          id: buyer.id,
          full_name: buyer.full_name,
          email: buyer.email,
          city: buyer.city || '—',
          total_orders: 1,
          total_spent: order.total_amount,
          last_order: order.created_at,
        });
      }
    });

    setCustomers(Array.from(customerMap.values()).sort((a, b) => b.total_spent - a.total_spent));
    setLoading(false);
  };

  const handleLogout = async () => { await logout(); navigate('/login'); };

  const filtered = customers.filter(c =>
    c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className={`flex flex-col bg-white border-r border-gray-100 shadow-sm transition-all duration-300 flex-shrink-0 ${sidebarCollapsed ? 'w-16' : 'w-60'}`}>
        <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <ShoppingCart className="h-5 w-5 text-white" />
          </div>
          {!sidebarCollapsed && <span className="font-bold text-blue-600 text-lg tracking-tight">MarketSecure</span>}
        </div>
        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={label} to={to}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!sidebarCollapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-gray-100 p-3">
          <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-3 w-full px-2 py-2 rounded-xl hover:bg-gray-50 transition-colors">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 font-semibold text-sm">{profile?.full_name?.charAt(0).toUpperCase() || 'V'}</span>
            </div>
            {!sidebarCollapsed && (
              <>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{profile?.full_name || 'Vendedor'}</p>
                  <p className="text-xs text-gray-400">Ver perfil</p>
                </div>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
              </>
            )}
          </button>
          {profileOpen && !sidebarCollapsed && (
            <button onClick={handleLogout} className="flex items-center gap-2 w-full px-3 py-2 mt-1 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors">
              <LogOut className="h-4 w-4" /> Cerrar sesión
            </button>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between flex-shrink-0">
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <Menu className="h-5 w-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Bell className="h-5 w-5 text-gray-600" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full" />
            </button>
            <NavLink to="/marketplace" className="text-sm text-blue-600 font-medium px-4 py-2 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
              Ver Marketplace
            </NavLink>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Mis Clientes</h1>
                  <p className="text-gray-500 text-sm mt-0.5">Compradores que han adquirido tus productos</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <Card className="p-5 border-0 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Total Clientes</p>
                      <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                      <Users className="h-6 w-6 text-blue-500" />
                    </div>
                  </div>
                </Card>
                <Card className="p-5 border-0 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Total Órdenes</p>
                      <p className="text-2xl font-bold text-gray-900">{customers.reduce((s, c) => s + c.total_orders, 0)}</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center">
                      <ShoppingBag className="h-6 w-6 text-purple-500" />
                    </div>
                  </div>
                </Card>
                <Card className="p-5 border-0 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Ingresos Totales</p>
                      <p className="text-2xl font-bold text-gray-900">${customers.reduce((s, c) => s + c.total_spent, 0).toFixed(0)}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-green-500" />
                    </div>
                  </div>
                </Card>
              </div>

              {/* Buscador */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar cliente..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Tabla */}
              <Card className="border-0 shadow-sm">
                <div className="p-6">
                  {filtered.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                      <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                      <p className="font-medium text-gray-500">No hay clientes aún</p>
                      <p className="text-sm mt-1">Aparecerán aquí cuando alguien te compre</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-100">
                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Cliente</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Ciudad</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Órdenes</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Gastado</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Última Compra</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {filtered.map(customer => (
                            <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-blue-600 font-semibold text-sm">{customer.full_name?.charAt(0).toUpperCase()}</span>
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm text-gray-800">{customer.full_name}</p>
                                    <p className="text-xs text-gray-400">{customer.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-600">{customer.city}</td>
                              <td className="py-3 px-4">
                                <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
                                  <ShoppingBag className="h-3 w-3" /> {customer.total_orders}
                                </span>
                              </td>
                              <td className="py-3 px-4 font-semibold text-sm text-green-600">${customer.total_spent.toFixed(2)}</td>
                              <td className="py-3 px-4 text-sm text-gray-500">
                                {new Date(customer.last_order).toLocaleDateString('es', { year: 'numeric', month: 'short', day: 'numeric' })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </Card>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
