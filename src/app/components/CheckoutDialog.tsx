import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { CreditCard, Lock, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

interface CheckoutDialogProps {
  open: boolean;
  onClose: () => void;
  product: {
    id: string;
    name: string;
    price: number;
    seller: string;
    sellerId: string; // ← necesario: antes faltaba y se usaba mal
  };
}

export function CheckoutDialog({ open, onClose, product }: CheckoutDialogProps) {
  const { user, profile } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [transactionId, setTransactionId] = useState('');

  // Datos de tarjeta — solo para la simulación visual del demo
  const [card, setCard] = useState({ number: '', expiry: '', cvc: '', name: '' });

  const handlePayment = async () => {
    if (!user || !profile) { toast.error('Debes iniciar sesión'); return; }
    if (!card.number || !card.expiry || !card.cvc || !card.name) {
      toast.error('Completa todos los campos de la tarjeta');
      return;
    }
    if (!product.sellerId) {
      toast.error('Error: no se identificó al vendedor del producto');
      return;
    }
    if (product.sellerId === user.id) {
      toast.error('No puedes comprar tu propio producto');
      return;
    }

    setLoading(true);
    try {
      // 1. Crear la orden — buyer es el usuario actual, seller es el vendedor real del producto
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          buyer_id: user.id,
          seller_id: product.sellerId,
          total_amount: product.price,
          status: 'pending',
          delivery_address: profile.address || '',
          delivery_city: profile.city || '',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Crear item de la orden
      const { error: itemError } = await supabase.from('order_items').insert({
        order_id: order.id,
        product_id: product.id,
        quantity: 1,
        unit_price: product.price,
      });
      if (itemError) throw itemError;

      // 3. Simular procesamiento de pago (sin pasarela real — Nicaragua aún no soportada por Stripe)
      // Simulamos una pequeña espera para que se sienta real
      await new Promise(resolve => setTimeout(resolve, 1200));
      const fakeTransactionId = `DEMO-${Date.now().toString(36).toUpperCase()}`;

      // 4. Guardar el "pago" en la BD, marcado claramente como simulado
      const { error: paymentError } = await supabase.from('payments').insert({
        order_id: order.id,
        stripe_payment_id: fakeTransactionId,
        amount: product.price,
        currency: 'usd',
        status: 'succeeded',
        paid_at: new Date().toISOString(),
      });
      if (paymentError) throw paymentError;

      // 5. Reducir el stock del producto
      const { data: currentProduct } = await supabase
        .from('products')
        .select('stock, sales_count')
        .eq('id', product.id)
        .single();

      if (currentProduct) {
        await supabase
          .from('products')
          .update({
            stock: Math.max(0, currentProduct.stock - 1),
            sales_count: (currentProduct.sales_count || 0) + 1,
          })
          .eq('id', product.id);
      }

      // 6. Actualizar orden a pagada
      await supabase.from('orders').update({ status: 'paid' }).eq('id', order.id);

      setOrderId(order.id);
      setTransactionId(fakeTransactionId);
      setStep(2);
      toast.success('¡Pago procesado exitosamente!');

    } catch (error: any) {
      console.error(error);
      toast.error('Error al procesar el pago: ' + (error.message || ''));
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

            {/* Aviso de modo demo — transparencia para el usuario */}
            <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 p-3 rounded-lg">
              <ShieldCheck className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>
                Modo demostración: esta transacción no procesa dinero real.
                La orden se registra normalmente para fines de prueba.
              </span>
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
              <p className="font-mono text-xs break-all text-gray-700">{transactionId}</p>
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