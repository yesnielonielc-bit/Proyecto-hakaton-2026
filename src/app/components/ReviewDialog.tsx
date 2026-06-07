import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Star, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  profiles: { full_name: string };
}

interface ReviewDialogProps {
  open: boolean;
  onClose: () => void;
  sellerId: string;
  sellerName: string;
  orderId?: string; // opcional — si viene de una orden completada
}

export function ReviewDialog({ open, onClose, sellerId, sellerName, orderId }: ReviewDialogProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const fetchReviews = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('reviews')
      .select('*, profiles!reviews_reviewer_id_fkey(full_name)')
      .eq('reviewed_id', sellerId)
      .order('created_at', { ascending: false });

    setReviews(data || []);

    // Verificar si el usuario ya dejó una reseña
    if (user) {
      const already = (data || []).some((r: any) => r.reviewer_id === user.id);
      setAlreadyReviewed(already);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (open) fetchReviews();
  }, [open, sellerId]);

  const handleSubmit = async () => {
    if (!user) { toast.error('Inicia sesión para dejar una reseña'); return; }
    if (rating === 0) { toast.error('Selecciona una calificación'); return; }
    if (!comment.trim()) { toast.error('Escribe un comentario'); return; }

    setSubmitting(true);
    const { error } = await supabase.from('reviews').insert({
      reviewer_id: user.id,
      reviewed_id: sellerId,
      order_id: orderId || null,
      rating,
      comment: comment.trim(),
    });

    if (error) {
      if (error.code === '23505') {
        toast.error('Ya dejaste una reseña para esta orden');
      } else {
        toast.error('Error al enviar reseña');
      }
      setSubmitting(false);
      return;
    }

    toast.success('¡Reseña enviada!');
    setRating(0);
    setComment('');
    setShowForm(false);
    fetchReviews();
    setSubmitting(false);
  };

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Reseñas de {sellerName}</DialogTitle>
        </DialogHeader>

        {/* Resumen de calificación */}
        <div className="flex items-center gap-4 py-4 border-b">
          <div className="text-center">
            <p className="text-4xl font-bold">{avgRating.toFixed(1)}</p>
            <div className="flex gap-1 mt-1">
              {[1,2,3,4,5].map(s => (
                <Star key={s} className={`h-4 w-4 ${s <= Math.round(avgRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-1">{reviews.length} reseñas</p>
          </div>
          <div className="flex-1 space-y-1">
            {[5,4,3,2,1].map(s => {
              const count = reviews.filter(r => r.rating === s).length;
              const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
              return (
                <div key={s} className="flex items-center gap-2 text-sm">
                  <span className="w-2">{s}</span>
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-400 h-2 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-gray-500 w-4">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Botón para dejar reseña */}
        {user && !alreadyReviewed && !showForm && (
          <Button onClick={() => setShowForm(true)} variant="outline" className="w-full">
            <Star className="h-4 w-4 mr-2" /> Dejar una reseña
          </Button>
        )}

        {/* Formulario de reseña */}
        {showForm && (
          <div className="border rounded-lg p-4 space-y-3">
            <p className="font-medium text-sm">Tu calificación</p>
            <div className="flex gap-1">
              {[1,2,3,4,5].map(s => (
                <button
                  key={s}
                  onMouseEnter={() => setHoverRating(s)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(s)}
                >
                  <Star className={`h-8 w-8 transition-colors ${
                    s <= (hoverRating || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`} />
                </button>
              ))}
            </div>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Escribe tu experiencia con este vendedor..."
              className="w-full px-3 py-2 border rounded-md text-sm resize-none"
              rows={3}
            />
            <div className="flex gap-2">
              <Button onClick={handleSubmit} disabled={submitting} className="flex-1">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Publicar reseña
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            </div>
          </div>
        )}

        {/* Lista de reseñas */}
        <div className="overflow-y-auto flex-1 space-y-3 mt-2">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : reviews.length === 0 ? (
            <p className="text-center text-gray-500 py-8 text-sm">
              Aún no hay reseñas para este vendedor
            </p>
          ) : (
            reviews.map(review => (
              <div key={review.id} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-xs">
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
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
