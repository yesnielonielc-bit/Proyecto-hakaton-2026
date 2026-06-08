import { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Star, Shield, ShieldCheck, Package, MessageCircle, Edit2, Save, X } from 'lucide-react';

export function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ products: 0, reviews: 0, orders: 0 });
  const [reviews, setReviews] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    address: '',
    city: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        address: profile.address || '',
        city: profile.city || '',
      });
      fetchStats();
      fetchReviews();
    }
  }, [profile]);

  const fetchStats = async () => {
    if (!user) return;

    const [productsRes, reviewsRes, ordersRes] = await Promise.all([
      supabase.from('products').select('id', { count: 'exact' }).eq('seller_id', user.id).neq('status', 'deleted'),
      supabase.from('reviews').select('id', { count: 'exact' }).eq('reviewed_id', user.id),
      supabase.from('orders').select('id', { count: 'exact' }).or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`),
    ]);

    setStats({
      products: productsRes.count || 0,
      reviews: reviewsRes.count || 0,
      orders: ordersRes.count || 0,
    });
  };

  const fetchReviews = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('reviews')
      .select('*, profiles!reviews_reviewer_id_fkey(full_name)')
      .eq('reviewed_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);
    setReviews(data || []);
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: formData.full_name,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
      })
      .eq('id', user.id);

    if (error) {
      toast.error('Error al guardar cambios');
    } else {
      toast.success('Perfil actualizado');
      await refreshProfile();
      setEditing(false);
    }
    setLoading(false);
  };

  if (!profile) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

        {/* Header del perfil */}
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold text-3xl">
                  {profile.full_name?.charAt(0).toUpperCase()}
                </span>
              </div>
              {profile.is_verified && (
                <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center border-2 border-white">
                  <ShieldCheck className="h-3.5 w-3.5 text-white" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">{profile.full_name}</h1>
                <Badge className={profile.user_type === 'seller' ? 'bg-blue-600' : 'bg-green-600'}>
                  {profile.user_type === 'seller' ? 'Vendedor' : 'Comprador'}
                </Badge>
                {profile.is_verified && (
                  <Badge variant="outline" className="text-blue-600 border-blue-200 gap-1">
                    <Shield className="h-3 w-3" /> Verificado
                  </Badge>
                )}
              </div>
              <p className="text-gray-500 text-sm mt-1">{profile.email}</p>
              {profile.city && <p className="text-gray-400 text-sm">📍 {profile.city}</p>}

              {/* Rating */}
              {profile.review_count > 0 && (
                <div className="flex items-center gap-1.5 mt-2">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className={`h-4 w-4 ${s <= Math.round(profile.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                  ))}
                  <span className="text-sm font-semibold text-gray-700">{profile.rating?.toFixed(1)}</span>
                  <span className="text-sm text-gray-400">({profile.review_count} reseñas)</span>
                </div>
              )}
            </div>

            {/* Botón editar */}
            <Button
              variant={editing ? 'outline' : 'default'}
              onClick={() => editing ? setEditing(false) : setEditing(true)}
              size="sm"
            >
              {editing ? <><X className="h-4 w-4 mr-1" />Cancelar</> : <><Edit2 className="h-4 w-4 mr-1" />Editar</>}
            </Button>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4 text-center">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.products}</p>
            <p className="text-xs text-gray-500 mt-0.5">Productos</p>
          </Card>
          <Card className="p-4 text-center">
            <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Star className="h-5 w-5 text-yellow-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.reviews}</p>
            <p className="text-xs text-gray-500 mt-0.5">Reseñas</p>
          </Card>
          <Card className="p-4 text-center">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-2">
              <MessageCircle className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.orders}</p>
            <p className="text-xs text-gray-500 mt-0.5">Órdenes</p>
          </Card>
        </div>

        {/* Editar información */}
        {editing && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Editar Información</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Nombre Completo</Label>
                <Input
                  value={formData.full_name}
                  onChange={e => setFormData(p => ({ ...p, full_name: e.target.value }))}
                />
              </div>
              <div>
                <Label>Teléfono</Label>
                <Input
                  value={formData.phone}
                  onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+505 8888 8888"
                />
              </div>
              <div>
                <Label>Ciudad</Label>
                <Input
                  value={formData.city}
                  onChange={e => setFormData(p => ({ ...p, city: e.target.value }))}
                  placeholder="Managua"
                />
              </div>
              <div>
                <Label>Dirección</Label>
                <Input
                  value={formData.address}
                  onChange={e => setFormData(p => ({ ...p, address: e.target.value }))}
                  placeholder="Calle Principal"
                />
              </div>
            </div>
            <Button onClick={handleSave} disabled={loading} className="mt-4">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Guardando...</> : <><Save className="h-4 w-4 mr-2" />Guardar Cambios</>}
            </Button>
          </Card>
        )}

        {/* Reseñas recibidas */}
        {reviews.length > 0 && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Reseñas Recibidas</h2>
            <div className="space-y-4">
              {reviews.map(review => (
                <div key={review.id} className="border-b last:border-0 pb-4 last:pb-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 text-xs font-semibold">
                          {review.profiles?.full_name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium text-sm">{review.profiles?.full_name}</span>
                    </div>
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className={`h-3.5 w-3.5 ${s <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{review.comment}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(review.created_at).toLocaleDateString('es', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}