import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '../components/AuthContext';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { ShoppingBag, Package, Loader2, ChevronDown, ChevronUp, Clock, CheckCircle2, Truck, XCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  products: { name: string; product_images: { url: string }[] };
}

interface Order {
  id: string;
  status: string;
  total_amount: number;
  delivery_address: string;
  delivery_city: string;
  created_at: string;
  buyer_id: string;
  seller_id: string;
  order_items: OrderItem[];
  buyer: { full_name: string };
  seller: { full_name: string };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending:   { label: 'Pendiente',   color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  paid:      { label: 'Pagado',      color: 'bg-blue-100 text-blue-700',     icon: CheckCircle2 },
  confirmed: { label: 'Confirmado',  color: 'bg-indigo-100 text-indigo-700', icon: CheckCircle2 },
  shipped:   { label: 'Enviado',     color: 'bg-purple-100 text-purple-700', icon: Truck },
  delivered: { label: 'Entregado',   color: 'bg-green-100 text-green-700',   icon: CheckCircle2 },
  cancelled: { label: 'Cancelado',   color: 'bg-red-100 text-red-700',       icon: XCircle },
  refunded:  { label: 'Reembolsado', color: 'bg-gray-100 text-gray-700',     icon: RefreshCw },
};

export function OrdersPage() {
  const { user, profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [tab, setTab] = useState<'all' | 'pending' | 'completed'>('all');

  const isSeller = profile?.user_type === 'seller';

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;
    setLoading(true);

    const query = supabase
      .from('orders')
      .select(`
        *,
        order_items(
          id, quantity, unit_price,
          products(name, product_images(url, sort_order))
        ),
        buyer:profiles!orders_buyer_id_fkey(full_name),
        seller:profiles!orders_seller_id_fkey(full_name)
      `)
      .order('created_at', { ascending: false });

    // Vendedor ve sus ventas, comprador ve sus compras
    if (isSeller) {
      query.eq('seller_id', user.id);
    } else {
      query.eq('buyer_id', user.id);
    }

    const { data, error } = await query;
    if (error) toast.error('Error al cargar órdenes');
    else setOrders(data || []);
    setLoading(false);
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) { toast.error('Error al actualizar estado'); return; }
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    toast.success('Estado actualizado');
  };

  const filteredOrders = orders.filter(o => {
    if (tab === 'pending') return ['pending', 'paid', 'confirmed', 'shipped'].includes(o.status);
    if (tab === 'completed') return ['delivered', 'cancelled', 'refunded'].includes(o.status);
    return true;
  });

  const getImage = (item: OrderItem) =>
    item.products?.product_images?.[0]?.url ||
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100';

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('es', { year: 'numeric', month: 'short', day: 'numeric' });

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            {isSeller ? <Package className="h-6 w-6 text-blue-600" /> : <ShoppingBag className="h-6 w-6 text-blue-600" />}
            {isSeller ? 'Mis Ventas' : 'Mis Pedidos'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {isSeller ? 'Gestiona los pedidos de tus clientes' : 'Revisa el estado de tus compras'}
          </p>
        </div>

        {/* Stats rápidas */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total', count: orders.length, color: 'bg-blue-50 text-blue-600' },
            { label: 'En proceso', count: orders.filter(o => ['pending','paid','confirmed','shipped'].includes(o.status)).length, color: 'bg-yellow-50 text-yellow-600' },
            { label: 'Completados', count: orders.filter(o => o.status === 'delivered').length, color: 'bg-green-50 text-green-600' },
          ].map(stat => (
            <Card key={stat.label} className="p-4 text-center border-0 shadow-sm">
              <p className={`text-2xl font-bold ${stat.color.split(' ')[1]}`}>{stat.count}</p>
              <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {[
            { key: 'all', label: 'Todos' },
            { key: 'pending', label: 'En proceso' },
            { key: 'completed', label: 'Completados' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                tab === t.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Lista de órdenes */}
        {filteredOrders.length === 0 ? (
          <Card className="p-12 text-center border-0 shadow-sm">
            <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="font-medium text-gray-500">No hay órdenes aquí</p>
            <p className="text-sm text-gray-400 mt-1">
              {isSeller ? 'Tus ventas aparecerán aquí' : 'Tus compras aparecerán aquí'}
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map(order => {
              const status = STATUS_CONFIG[order.status] || STATUS_CONFIG['pending'];
              const StatusIcon = status.icon;
              const isExpanded = expandedOrder === order.id;

              return (
                <Card key={order.id} className="border-0 shadow-sm overflow-hidden">
                  {/* Header de la orden */}
                  <div
                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                          <ShoppingBag className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm text-gray-900">
                            Orden #{order.id.slice(0, 8).toUpperCase()}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatDate(order.created_at)} •{' '}
                            {isSeller ? `Comprador: ${order.buyer?.full_name}` : `Vendedor: ${order.seller?.full_name}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-bold text-blue-600 text-right">${order.total_amount}</p>
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${status.color}`}>
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </span>
                        </div>
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                      </div>
                    </div>
                  </div>

                  {/* Detalle expandido */}
                  {isExpanded && (
                    <div className="border-t px-4 pb-4 pt-3 bg-gray-50">
                      {/* Items */}
                      <div className="space-y-2 mb-4">
                        {order.order_items?.map(item => (
                          <div key={item.id} className="flex items-center gap-3 bg-white rounded-xl p-3">
                            <img
                              src={getImage(item)}
                              alt={item.products?.name}
                              className="w-12 h-12 object-cover rounded-lg"
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-800">{item.products?.name}</p>
                              <p className="text-xs text-gray-500">Cantidad: {item.quantity}</p>
                            </div>
                            <p className="font-semibold text-blue-600">${item.unit_price}</p>
                          </div>
                        ))}
                      </div>

                      {/* Dirección */}
                      {order.delivery_address && (
                        <p className="text-xs text-gray-500 mb-3">
                          📍 {order.delivery_address}, {order.delivery_city}
                        </p>
                      )}

                      {/* Acciones del vendedor */}
                      {isSeller && (
                        <div className="flex gap-2 flex-wrap">
                          {order.status === 'paid' && (
                            <Button size="sm" onClick={() => handleUpdateStatus(order.id, 'confirmed')} className="text-xs">
                              Confirmar pedido
                            </Button>
                          )}
                          {order.status === 'confirmed' && (
                            <Button size="sm" onClick={() => handleUpdateStatus(order.id, 'shipped')} className="text-xs">
                              Marcar como enviado
                            </Button>
                          )}
                          {order.status === 'shipped' && (
                            <Button size="sm" onClick={() => handleUpdateStatus(order.id, 'delivered')} className="text-xs bg-green-600 hover:bg-green-700">
                              Marcar como entregado
                            </Button>
                          )}
                          {['pending', 'paid'].includes(order.status) && (
                            <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(order.id, 'cancelled')} className="text-xs text-red-600 border-red-200 hover:bg-red-50">
                              Cancelar
                            </Button>
                          )}
                        </div>
                      )}

                      {/* Acciones del comprador */}
                      {!isSeller && order.status === 'delivered' && (
                        <div className="flex items-center gap-2 bg-green-50 rounded-xl p-3">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <p className="text-sm text-green-700 font-medium">Pedido entregado exitosamente</p>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}