import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { Bell, CalendarCheck, CalendarX, ShoppingBag, Package, X } from 'lucide-react';
import { toast } from 'sonner';

interface Notification {
  id: string;
  type: 'booking_confirmed' | 'booking_cancelled' | 'booking_pending' | 'order_update';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

const STORAGE_KEY = 'ms_notifications';

export function NotificationBell() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  // Identificador único por instancia del componente — evita colisión si se monta más de una vez a la vez
  const instanceId = useRef(Math.random().toString(36).slice(2)).current;

  // Cargar notificaciones guardadas localmente al iniciar
  useEffect(() => {
    if (!user) return;
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_${user.id}`);
      if (saved) setNotifications(JSON.parse(saved));
    } catch {}
  }, [user]);

  // Guardar cada vez que cambian
  useEffect(() => {
    if (!user) return;
    localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(notifications.slice(0, 30)));
  }, [notifications, user]);

  const addNotification = (n: Omit<Notification, 'id' | 'read' | 'created_at'>) => {
    const notification: Notification = {
      ...n,
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      read: false,
      created_at: new Date().toISOString(),
    };
    setNotifications(prev => [notification, ...prev]);
  };

  useEffect(() => {
    if (!user || !profile) return;

    // Escuchar cambios en bookings donde el usuario es comprador o vendedor
    // Nombre único por usuario para evitar colisión si el componente se monta más de una vez
    const channel = supabase
      .channel(`booking-notifications-${user.id}-${instanceId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'bookings',
      }, async (payload) => {
        const booking = payload.new as any;
        const oldBooking = payload.old as any;

        // Solo notificar si el cambio nos involucra y el estado realmente cambió
        const involvesMe = booking.buyer_id === user.id || booking.seller_id === user.id;
        if (!involvesMe || booking.status === oldBooking.status) return;

        // Traer el nombre del servicio para el mensaje
        const { data: product } = await supabase
          .from('products')
          .select('name')
          .eq('id', booking.product_id)
          .single();

        const serviceName = product?.name || 'tu cita';
        const isBuyer = booking.buyer_id === user.id;

        if (booking.status === 'confirmed' && isBuyer) {
          toast.success(`¡Tu cita para "${serviceName}" fue confirmada!`);
          addNotification({
            type: 'booking_confirmed',
            title: 'Cita confirmada',
            message: `Tu cita para "${serviceName}" el ${booking.booking_date} ha sido confirmada.`,
          });
        } else if (booking.status === 'cancelled' && isBuyer) {
          toast.error(`Tu cita para "${serviceName}" fue rechazada`);
          addNotification({
            type: 'booking_cancelled',
            title: 'Cita rechazada',
            message: `Tu cita para "${serviceName}" fue rechazada por el vendedor.`,
          });
        } else if (booking.status === 'completed' && isBuyer) {
          addNotification({
            type: 'booking_confirmed',
            title: 'Cita completada',
            message: `Tu cita para "${serviceName}" ha sido marcada como completada.`,
          });
        }
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'bookings',
      }, async (payload) => {
        const booking = payload.new as any;
        // Notificar al vendedor cuando recibe una nueva reserva
        if (booking.seller_id === user.id) {
          const { data: product } = await supabase
            .from('products')
            .select('name')
            .eq('id', booking.product_id)
            .single();

          toast.info(`Nueva reserva para "${product?.name || 'tu servicio'}"`);
          addNotification({
            type: 'booking_pending',
            title: 'Nueva reserva',
            message: `Tienes una nueva cita pendiente de confirmar para "${product?.name || 'tu servicio'}".`,
          });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, profile]);

  // Cerrar panel al hacer clic afuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleOpen = () => {
    setOpen(!open);
    if (!open) {
      setTimeout(() => setNotifications(prev => prev.map(n => ({ ...n, read: true }))), 800);
    }
  };

  const handleClear = () => setNotifications([]);

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'booking_confirmed': return <CalendarCheck className="h-4 w-4 text-green-600" />;
      case 'booking_cancelled': return <CalendarX className="h-4 w-4 text-red-600" />;
      case 'booking_pending': return <Bell className="h-4 w-4 text-purple-600" />;
      default: return <ShoppingBag className="h-4 w-4 text-blue-600" />;
    }
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Ahora';
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Bell className="h-5 w-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border z-50 max-h-96 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <p className="font-semibold text-sm text-gray-800">Notificaciones</p>
            {notifications.length > 0 && (
              <button onClick={handleClear} className="text-xs text-gray-400 hover:text-gray-600">
                Limpiar todo
              </button>
            )}
          </div>
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No tienes notificaciones</p>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => navigate('/orders')}
                  className={`flex items-start gap-3 px-4 py-3 border-b last:border-0 cursor-pointer hover:bg-gray-50 transition-colors ${
                    !n.read ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center flex-shrink-0">
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{n.title}</p>
                    <p className="text-xs text-gray-500 line-clamp-2">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{timeAgo(n.created_at)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
