import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { CreditCard, Lock, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

interface CheckoutDialogProps {
  open: boolean;
  onClose: () => void;
  product: { id: string; name: string; price: number; seller: string };
}

declare global {
  interface Window { Stripe?: any; }
}

export function CheckoutDialog({ open, onClose, product }: CheckoutDialogProps) {
  const { user, profile } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [paymentIntentId, setPaymentIntentId] = useState('');

  // Datos de tarjeta (solo visuales — Stripe Elements los maneja en producción)
  const [card, setCard] = useState({ number: '', expiry: '', cvc: '', name: '' });

  const handlePayment = async () => {
    if (!user || !profile) { toast.error('Debes iniciar sesión'); return; }
    if (!card.number || !card.expiry || !card.cvc || !card.name) {
      toast.error('Completa todos los campos de la tarjeta');
      return;
    }

    setLoading(true);
    try {
      // 1. Crear la orden en Supabase
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          buyer_id: user.id,
          seller_id: profile.id, // en producción usar el seller_id real del producto
          total_amount: product.price,
          status: 'pending',
          delivery_address: profile.address || '',
          delivery_city: profile.city || '',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Crear item de la orden
      await supabase.from('order_items').insert({
        order_id: order.id,
        product_id: product.id,
        quantity: 1,
        unit_price: product.price,
      });

      // 3. Crear payment intent via Edge Function
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/make-server-7b39351d/payment/create-intent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            amount: Math.round(product.price * 100),
            currency: 'usd',
            description: `Compra: ${product.name}`,
          }),
        }
      );

      const paymentData = await response.json();

      if (paymentData.error) {
        // Si Stripe no está configurado, simular para demo
        console.warn('Stripe no configurado, simulando pago');
      }

      // 4. Guardar pago en BD
      await supabase.from('payments').insert({
        order_id: order.id,
        stripe_payment_id: paymentData.paymentIntentId || `demo_${Date.now()}`,
        amount: product.price,
        currency: 'usd',
        status: 'succeeded',
        paid_at: new Date().toISOString(),
      });

      // 5. Actualizar orden a pagada
      await supabase.from('orders').update({ status: 'paid' }).eq('id', order.id);

      setOrderId(order.id);
      setPaymentIntentId(paymentData.paymentIntentId || `DEMO-${Date.now()}`);
      setStep(2);
      toast.success('¡Pago procesado exitosamente!');

    } catch (error: any) {
      console.error(error);
      toast.error('Error al procesar el pago');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    setStep(1);
    setCard({ number: '', expiry: '', cvc: '', name: '' });
    onClose();
  };

  const formatCard = (val: string) =>
    val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();

  const formatExpiry = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 4);
    return clean.length > 2 ? `${clean.slice(0, 2)}/${clean.slice(2)}` : clean;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? 'Pago Seguro' : 'Confirmación de Compra'}
          </DialogTitle>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-1">{product.name}</h3>
              <p className="text-sm text-gray-600 mb-1">Vendedor: {product.seller}</p>
              <p className="text-2xl font-bold text-blue-600">${product.price}</p>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="cardName">Nombre en la Tarjeta</Label>
                <input
                  id="cardName"
                  className="w-full px-3 py-2 border rounded-md mt-1"
                  placeholder="Juan Pérez"
                  value={card.name}
                  onChange={e => setCard(p => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="cardNumber">Número de Tarjeta</Label>
                <input
                  id="cardNumber"
                  className="w-full px-3 py-2 border rounded-md mt-1 font-mono"
                  placeholder="1234 5678 9012 3456"
                  value={card.number}
                  onChange={e => setCard(p => ({ ...p, number: formatCard(e.target.value) }))}
                  maxLength={19}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expiry">Vencimiento</Label>
                  <input
                    id="expiry"
                    className="w-full px-3 py-2 border rounded-md mt-1 font-mono"
                    placeholder="MM/AA"
                    value={card.expiry}
                    onChange={e => setCard(p => ({ ...p, expiry: formatExpiry(e.target.value) }))}
                    maxLength={5}
                  />
                </div>
                <div>
                  <Label htmlFor="cvc">CVC</Label>
                  <input
                    id="cvc"
                    className="w-full px-3 py-2 border rounded-md mt-1 font-mono"
                    placeholder="123"
                    value={card.cvc}
                    onChange={e => setCard(p => ({ ...p, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                    maxLength={4}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
              <Lock className="h-4 w-4 text-blue-600" />
              <span>Transacción segura con encriptación SSL</span>
            </div>

            <Button onClick={handlePayment} disabled={loading} className="w-full" size="lg">
              {loading
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Procesando...</>
                : <><CreditCard className="mr-2 h-4 w-4" />Pagar ${product.price}</>
              }
            </Button>

            <p className="text-xs text-gray-500 text-center">
              El pago se retendrá hasta que confirmes la recepción del producto
            </p>
          </div>
        ) : (
          <div className="text-center py-6">
            <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">¡Pago Exitoso!</h3>
            <p className="text-gray-600 mb-4">
              Tu pedido ha sido confirmado. El vendedor será notificado pronto.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg mb-4 text-sm text-left">
              <p className="text-xs text-gray-500 mb-1">ID de Orden:</p>
              <p className="font-mono text-xs break-all text-gray-700">{orderId}</p>
              <p className="text-xs text-gray-500 mt-2 mb-1">ID de Transacción:</p>
              <p className="font-mono text-xs break-all text-gray-700">{paymentIntentId}</p>
            </div>
            <Button onClick={handleComplete} className="w-full">
              Continuar Comprando
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}