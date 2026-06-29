import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '../components/AuthContext';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  ShoppingBag, Package, Loader2, ChevronDown, ChevronUp, Clock,
  CheckCircle2, Truck, XCircle, RefreshCw, Calendar, CalendarCheck, CalendarX,
  Download, FileText
} from 'lucide-react';
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

interface Booking {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
  notes: string | null;
  created_at: string;
  buyer_id: string;
  seller_id: string;
  products: { name: string; price: number; product_images: { url: string }[] };
  buyer: { full_name: string };
  seller: { full_name: string };
}

const ORDER_STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending:   { label: 'Pendiente',   color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  paid:      { label: 'Pagado',      color: 'bg-blue-100 text-blue-700',     icon: CheckCircle2 },
  confirmed: { label: 'Confirmado',  color: 'bg-indigo-100 text-indigo-700', icon: CheckCircle2 },
  shipped:   { label: 'Enviado',     color: 'bg-purple-100 text-purple-700', icon: Truck },
  delivered: { label: 'Entregado',   color: 'bg-green-100 text-green-700',   icon: CheckCircle2 },
  cancelled: { label: 'Cancelado',   color: 'bg-red-100 text-red-700',       icon: XCircle },
  refunded:  { label: 'Reembolsado', color: 'bg-gray-100 text-gray-700',     icon: RefreshCw },
};

const PYTHON_API_URL = 'http://localhost:8000';

const BOOKING_STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending:   { label: 'Por confirmar', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  confirmed: { label: 'Confirmada',    color: 'bg-green-100 text-green-700',   icon: CalendarCheck },
  completed: { label: 'Completada',    color: 'bg-blue-100 text-blue-700',     icon: CheckCircle2 },
  cancelled: { label: 'Cancelada',     color: 'bg-red-100 text-red-700',       icon: CalendarX },
  no_show:   { label: 'No se presentó',color: 'bg-gray-100 text-gray-700',     icon: XCircle },
};

export function OrdersPage() {
  const { user, profile } = useAuth();
  const [mainTab, setMainTab] = useState<'orders' | 'bookings'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusTab, setStatusTab] = useState<'all' | 'pending' | 'completed'>('all');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const isSeller = profile?.user_type === 'seller';

  useEffect(() => {
    fetchOrders();
    fetchBookings();
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;
    const query = supabase
      .from('orders')
      .select(`
        *,
        order_items(id, quantity, unit_price, products(name, product_images(url, sort_order))),
        buyer:profiles!orders_buyer_id_fkey(full_name),
        seller:profiles!orders_seller_id_fkey(full_name)
      `)
      .order('created_at', { ascending: false });

    if (isSeller) query.eq('seller_id', user.id);
    else query.eq('buyer_id', user.id);

    const { data, error } = await query;
    if (error) toast.error('Error al cargar pedidos');
    else setOrders(data || []);
    setLoading(false);
  };

  const fetchBookings = async () => {
    if (!user) return;
    const query = supabase
      .from('bookings')
      .select(`
        *,
        products(name, price, product_images(url, sort_order)),
        buyer:profiles!bookings_buyer_id_fkey(full_name),
        seller:profiles!bookings_seller_id_fkey(full_name)
      `)
      .order('booking_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (isSeller) query.eq('seller_id', user.id);
    else query.eq('buyer_id', user.id);

    const { data, error } = await query;
    if (error) console.error(error);
    else setBookings(data || []);
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    if (error) { toast.error('Error al actualizar estado'); return; }
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    toast.success('Estado actualizado');
  };

  const handleDownloadInvoice = async (orderId: string) => {
    setDownloadingId(orderId);
    try {
      const res = await fetch(`${PYTHON_API_URL}/api/orders/${orderId}/invoice`);
      if (!res.ok) throw new Error('No se pudo generar la factura');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `factura-${orderId.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Factura descargada');
    } catch (err) {
      toast.error('No se pudo descargar la factura. Verifica que el servicio esté disponible.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, newStatus: string) => {
    const { error } = await supabase.from('bookings').update({ status: newStatus }).eq('id', bookingId);
    if (error) { toast.error('Error al actualizar la cita'); return; }
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: newStatus } : b));
    toast.success(
      newStatus === 'confirmed' ? '¡Cita confirmada! El cliente será notificado' :
      newStatus === 'completed' ? 'Cita marcada como completada' :
      newStatus === 'cancelled' ? 'Cita cancelada' : 'Estado actualizado'
    );
  };

  const filteredOrders = orders.filter(o => {
    if (statusTab === 'pending') return ['pending', 'paid', 'confirmed', 'shipped'].includes(o.status);
    if (statusTab === 'completed') return ['delivered', 'cancelled', 'refunded'].includes(o.status);
    return true;
  });

  const filteredBookings = bookings.filter(b => {
    if (statusTab === 'pending') return ['pending', 'confirmed'].includes(b.status);
    if (statusTab === 'completed') return ['completed', 'cancelled', 'no_show'].includes(b.status);
    return true;
  });

  const getImage = (item: OrderItem) =>
    item.products?.product_images?.[0]?.url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100';

  const getBookingImage = (b: Booking) =>
    b.products?.product_images?.[0]?.url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100';

  const formatDate = (date: string) =>
    new Date(date + 'T00:00:00').toLocaleDateString('es', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });

  const formatOrderDate = (date: string) =>
    new Date(date).toLocaleDateString('es', { year: 'numeric', month: 'short', day: 'numeric' });

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  );

  const pendingBookingsCount = bookings.filter(b => b.status === 'pending').length;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {isSeller ? 'Pedidos y Citas' : 'Mis Pedidos y Citas'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {isSeller ? 'Gestiona tus ventas y reservas de clientes' : 'Revisa tus compras y citas reservadas'}
          </p>
        </div>

        {/* Tabs principales: Pedidos / Citas */}
        <div className="flex gap-2 mb-4 bg-white rounded-xl p-1.5 border w-fit">
          <button
            onClick={() => { setMainTab('orders'); setStatusTab('all'); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              mainTab === 'orders' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <ShoppingBag className="h-4 w-4" /> Pedidos ({orders.length})
          </button>
          <button
            onClick={() => { setMainTab('bookings'); setStatusTab('all'); }}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              mainTab === 'bookings' ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Calendar className="h-4 w-4" /> Citas ({bookings.length})
            {isSeller && pendingBookingsCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                {pendingBookingsCount}
              </span>
            )}
          </button>
        </div>

        {/* Tabs de estado */}
        <div className="flex gap-2 mb-4">
          {[
            { key: 'all', label: 'Todos' },
            { key: 'pending', label: 'En proceso' },
            { key: 'completed', label: 'Completados' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setStatusTab(t.key as any)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                statusTab === t.key ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ===== PEDIDOS ===== */}
        {mainTab === 'orders' && (
          filteredOrders.length === 0 ? (
            <Card className="p-12 text-center border-0 shadow-sm">
              <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="font-medium text-gray-500">No hay pedidos aquí</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map(order => {
                const status = ORDER_STATUS_CONFIG[order.status] || ORDER_STATUS_CONFIG['pending'];
                const StatusIcon = status.icon;
                const isExpanded = expandedId === order.id;

                return (
                  <Card key={order.id} className="border-0 shadow-sm overflow-hidden">
                    <div className="p-4 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setExpandedId(isExpanded ? null : order.id)}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                            <ShoppingBag className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-sm text-gray-900">Pedido #{order.id.slice(0, 8).toUpperCase()}</p>
                            <p className="text-xs text-gray-400">
                              {formatOrderDate(order.created_at)} • {isSeller ? `Comprador: ${order.buyer?.full_name}` : `Vendedor: ${order.seller?.full_name}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-bold text-blue-600 text-right">${order.total_amount}</p>
                            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${status.color}`}>
                              <StatusIcon className="h-3 w-3" />{status.label}
                            </span>
                          </div>
                          {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t px-4 pb-4 pt-3 bg-gray-50">
                        <div className="space-y-2 mb-4">
                          {order.order_items?.map(item => (
                            <div key={item.id} className="flex items-center gap-3 bg-white rounded-xl p-3">
                              <img src={getImage(item)} alt={item.products?.name} className="w-12 h-12 object-cover rounded-lg" />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-800">{item.products?.name}</p>
                                <p className="text-xs text-gray-500">Cantidad: {item.quantity}</p>
                              </div>
                              <p className="font-semibold text-blue-600">${item.unit_price}</p>
                            </div>
                          ))}
                        </div>
                        {order.delivery_address && (
                          <p className="text-xs text-gray-500 mb-3">📍 {order.delivery_address}, {order.delivery_city}</p>
                        )}

                        {/* Botón de descarga de factura — visible una vez pagada */}
                        {['paid', 'confirmed', 'shipped', 'delivered'].includes(order.status) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadInvoice(order.id)}
                            disabled={downloadingId === order.id}
                            className="text-xs mb-2 gap-1.5"
                          >
                            {downloadingId === order.id
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : <FileText className="h-3.5 w-3.5" />
                            }
                            Descargar Factura
                          </Button>
                        )}

                        {isSeller && (
                          <div className="flex gap-2 flex-wrap">
                            {order.status === 'paid' && (
                              <Button size="sm" onClick={() => handleUpdateOrderStatus(order.id, 'confirmed')} className="text-xs">Confirmar pedido</Button>
                            )}
                            {order.status === 'confirmed' && (
                              <Button size="sm" onClick={() => handleUpdateOrderStatus(order.id, 'shipped')} className="text-xs">Marcar como enviado</Button>
                            )}
                            {order.status === 'shipped' && (
                              <Button size="sm" onClick={() => handleUpdateOrderStatus(order.id, 'delivered')} className="text-xs bg-green-600 hover:bg-green-700">Marcar como entregado</Button>
                            )}
                            {['pending', 'paid'].includes(order.status) && (
                              <Button size="sm" variant="outline" onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')} className="text-xs text-red-600 border-red-200 hover:bg-red-50">Cancelar</Button>
                            )}
                          </div>
                        )}
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
          )
        )}

        {/* ===== CITAS ===== */}
        {mainTab === 'bookings' && (
          filteredBookings.length === 0 ? (
            <Card className="p-12 text-center border-0 shadow-sm">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="font-medium text-gray-500">No hay citas aquí</p>
              <p className="text-sm text-gray-400 mt-1">
                {isSeller ? 'Las reservas de tus clientes aparecerán aquí' : 'Tus citas reservadas aparecerán aquí'}
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredBookings.map(booking => {
                const status = BOOKING_STATUS_CONFIG[booking.status] || BOOKING_STATUS_CONFIG['pending'];
                const StatusIcon = status.icon;
                const isExpanded = expandedId === booking.id;

                return (
                  <Card key={booking.id} className="border-0 shadow-sm overflow-hidden">
                    <div className="p-4 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setExpandedId(isExpanded ? null : booking.id)}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img src={getBookingImage(booking)} alt="" className="w-10 h-10 object-cover rounded-xl" />
                          <div>
                            <p className="font-medium text-sm text-gray-900">{booking.products?.name}</p>
                            <p className="text-xs text-gray-400">
                              {formatDate(booking.booking_date)} a las {booking.start_time.slice(0,5)} •{' '}
                              {isSeller ? `Cliente: ${booking.buyer?.full_name}` : `Con: ${booking.seller?.full_name}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-bold text-blue-600 text-right">${booking.products?.price}</p>
                            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${status.color}`}>
                              <StatusIcon className="h-3 w-3" />{status.label}
                            </span>
                          </div>
                          {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t px-4 pb-4 pt-3 bg-gray-50">
                        <div className="bg-white rounded-xl p-3 mb-3 space-y-1.5">
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Calendar className="h-4 w-4 text-purple-500" />
                            {formatDate(booking.booking_date)}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Clock className="h-4 w-4 text-purple-500" />
                            {booking.start_time.slice(0,5)} - {booking.end_time.slice(0,5)}
                          </div>
                          {booking.notes && (
                            <p className="text-sm text-gray-500 pt-1 border-t mt-2">📝 {booking.notes}</p>
                          )}
                        </div>

                        {/* Acciones del vendedor — el botón de confirmación que pediste */}
                        {isSeller && (
                          <div className="flex gap-2 flex-wrap">
                            {booking.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdateBookingStatus(booking.id, 'confirmed')}
                                  className="text-xs bg-green-600 hover:bg-green-700"
                                >
                                  <CalendarCheck className="h-3.5 w-3.5 mr-1" /> Confirmar Cita
                                </Button>
                                <Button
                                  size="sm" variant="outline"
                                  onClick={() => handleUpdateBookingStatus(booking.id, 'cancelled')}
                                  className="text-xs text-red-600 border-red-200 hover:bg-red-50"
                                >
                                  Rechazar
                                </Button>
                              </>
                            )}
                            {booking.status === 'confirmed' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdateBookingStatus(booking.id, 'completed')}
                                  className="text-xs bg-blue-600 hover:bg-blue-700"
                                >
                                  Marcar como completada
                                </Button>
                                <Button
                                  size="sm" variant="outline"
                                  onClick={() => handleUpdateBookingStatus(booking.id, 'no_show')}
                                  className="text-xs text-gray-600"
                                >
                                  No se presentó
                                </Button>
                              </>
                            )}
                          </div>
                        )}

                        {/* Estado para el comprador */}
                        {!isSeller && booking.status === 'pending' && (
                          <div className="flex items-center gap-2 bg-yellow-50 rounded-xl p-3">
                            <Clock className="h-4 w-4 text-yellow-600" />
                            <p className="text-sm text-yellow-700 font-medium">Esperando confirmación del vendedor</p>
                          </div>
                        )}
                        {!isSeller && booking.status === 'confirmed' && (
                          <div className="flex items-center gap-2 bg-green-50 rounded-xl p-3">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <p className="text-sm text-green-700 font-medium">¡Tu cita está confirmada!</p>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}