import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router';
import { Card } from '../components/ui/card';
import { supabase } from '@/lib/supabase';
import { useAuth } from '../components/AuthContext';
import {
  BarChart2, TrendingUp, DollarSign, Package, ShoppingBag,
  Users, MessageCircle, Settings, Bell, ChevronDown,
  LogOut, ShoppingCart, Menu, Loader2, Eye, Star, LayoutDashboard
} from 'lucide-react';

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

interface ReportData {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalViews: number;
  totalCustomers: number;
  avgRating: number;
  reviewCount: number;
  topCategories: { category: string; count: number; revenue: number }[];
  topProducts: { name: string; views: number; price: number; image: string }[];
  ordersByStatus: { status: string; count: number }[];
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente', paid: 'Pagado', confirmed: 'Confirmado',
  shipped: 'Enviado', delivered: 'Entregado', cancelled: 'Cancelado',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-400', paid: 'bg-blue-400', confirmed: 'bg-indigo-400',
  shipped: 'bg-purple-400', delivered: 'bg-green-400', cancelled: 'bg-red-400',
};

export function SellerReportsPage() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => { if (user) fetchReport(); }, [user]);

  const fetchReport = async () => {
    setLoading(true);
    const [productsRes, ordersRes, reviewsRes] = await Promise.all([
      supabase.from('products').select('*, product_images(url)').eq('seller_id', user!.id).neq('status', 'deleted'),
      supabase.from('orders').select('*, order_items(*, products(name, category))').eq('seller_id', user!.id),
      supabase.from('reviews').select('rating').eq('reviewed_id', user!.id),
    ]);

    const products = productsRes.data || [];
    const orders = ordersRes.data || [];
    const reviews = reviewsRes.data || [];

    const paidOrders = orders.filter(o => ['paid','confirmed','shipped','delivered'].includes(o.status));
    const totalRevenue = paidOrders.reduce((s, o) => s + o.total_amount, 0);

    // Categorías
    const catMap = new Map<string, { count: number; revenue: number }>();
    orders.forEach(o => {
      o.order_items?.forEach((item: any) => {
        const cat = item.products?.category || 'Sin categoría';
        const existing = catMap.get(cat) || { count: 0, revenue: 0 };
        catMap.set(cat, { count: existing.count + 1, revenue: existing.revenue + item.unit_price });
      });
    });

    const topCategories = Array.from(catMap.entries())
      .map(([category, d]) => ({ category, ...d }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Top productos por vistas
    const topProducts = products
      .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
      .slice(0, 5)
      .map(p => ({
        name: p.name,
        views: p.view_count || 0,
        price: p.price,
        image: p.product_images?.[0]?.url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100',
      }));

    // Órdenes por estado
    const statusMap = new Map<string, number>();
    orders.forEach(o => statusMap.set(o.status, (statusMap.get(o.status) || 0) + 1));
    const ordersByStatus = Array.from(statusMap.entries()).map(([status, count]) => ({ status, count }));

    // Clientes únicos
    const uniqueCustomers = new Set(orders.map(o => o.buyer_id)).size;

    setData({
      totalRevenue,
      totalOrders: orders.length,
      totalProducts: products.length,
      totalViews: products.reduce((s, p) => s + (p.view_count || 0), 0),
      totalCustomers: uniqueCustomers,
      avgRating: reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0,
      reviewCount: reviews.length,
      topCategories,
      topProducts,
      ordersByStatus,
    });
    setLoading(false);
  };

  const handleLogout = async () => { await logout(); navigate('/login'); };

  const maxCatRevenue = data?.topCategories[0]?.revenue || 1;
  const totalOrdersForBar = data?.ordersByStatus.reduce((s, o) => s + o.count, 0) || 1;

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
          {loading || !data ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
                <p className="text-gray-500 text-sm mt-0.5">Resumen completo de tu rendimiento</p>
              </div>

              {/* Stats principales */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {[
                  { label: 'Ingresos Totales', value: `$${data.totalRevenue.toFixed(2)}`, icon: DollarSign, color: 'bg-green-50', ic: 'text-green-500' },
                  { label: 'Total Órdenes', value: data.totalOrders, icon: ShoppingBag, color: 'bg-blue-50', ic: 'text-blue-500' },
                  { label: 'Clientes', value: data.totalCustomers, icon: Users, color: 'bg-purple-50', ic: 'text-purple-500' },
                  { label: 'Productos', value: data.totalProducts, icon: Package, color: 'bg-orange-50', ic: 'text-orange-500' },
                  { label: 'Vistas', value: data.totalViews, icon: Eye, color: 'bg-pink-50', ic: 'text-pink-500' },
                  { label: 'Calificación', value: data.avgRating.toFixed(1), icon: Star, color: 'bg-yellow-50', ic: 'text-yellow-500' },
                ].map(s => (
                  <Card key={s.label} className="p-5 border-0 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                        <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                      </div>
                      <div className={`w-12 h-12 ${s.color} rounded-2xl flex items-center justify-center`}>
                        <s.icon className={`h-6 w-6 ${s.ic}`} />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="grid lg:grid-cols-2 gap-6 mb-6">
                {/* Categorías más vendidas */}
                <Card className="border-0 shadow-sm p-5">
                  <h2 className="font-semibold text-gray-900 mb-4">Ingresos por Categoría</h2>
                  {data.topCategories.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-8">Sin datos aún</p>
                  ) : (
                    <div className="space-y-3">
                      {data.topCategories.map(cat => (
                        <div key={cat.category}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-700 font-medium">{cat.category}</span>
                            <span className="text-green-600 font-semibold">${cat.revenue.toFixed(2)}</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all"
                              style={{ width: `${(cat.revenue / maxCatRevenue) * 100}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">{cat.count} ventas</p>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                {/* Órdenes por estado */}
                <Card className="border-0 shadow-sm p-5">
                  <h2 className="font-semibold text-gray-900 mb-4">Órdenes por Estado</h2>
                  {data.ordersByStatus.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-8">Sin órdenes aún</p>
                  ) : (
                    <div className="space-y-3">
                      {data.ordersByStatus.map(item => (
                        <div key={item.status}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-700 font-medium">{STATUS_LABELS[item.status] || item.status}</span>
                            <span className="text-gray-600">{item.count} órdenes</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div
                              className={`${STATUS_COLORS[item.status] || 'bg-gray-400'} h-2 rounded-full`}
                              style={{ width: `${(item.count / totalOrdersForBar) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>

              {/* Top productos */}
              <Card className="border-0 shadow-sm p-5">
                <h2 className="font-semibold text-gray-900 mb-4">Productos Más Vistos</h2>
                {data.topProducts.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">Sin productos aún</p>
                ) : (
                  <div className="space-y-3">
                    {data.topProducts.map((p, i) => (
                      <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                        <span className="text-xs font-bold text-gray-400 w-4">{i + 1}</span>
                        <img src={p.image} alt={p.name} className="w-10 h-10 object-cover rounded-lg" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                          <p className="text-xs text-gray-400">${p.price}</p>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
                          <Eye className="h-3.5 w-3.5" />
                          {p.views} vistas
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
