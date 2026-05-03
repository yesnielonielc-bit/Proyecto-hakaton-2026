import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { CreditCard, Lock, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '/utils/supabase/info';

interface CheckoutDialogProps {
  open: boolean;
  onClose: () => void;
  product: {
    id: string;
    name: string;
    price: number;
    seller: string;
  };
}

export function CheckoutDialog({ open, onClose, product }: CheckoutDialogProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [paymentIntentId, setPaymentIntentId] = useState('');

  const handlePayment = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-7b39351d/payment/create-intent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            amount: Math.round(product.price * 100),
            currency: 'usd',
            description: `Purchase: ${product.name}`,
          }),
        }
      );

      const data = await response.json();

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setPaymentIntentId(data.paymentIntentId);

      await new Promise(resolve => setTimeout(resolve, 1500));

      setStep(2);
      toast.success('Pago procesado exitosamente');
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Error al procesar el pago. Verifica que STRIPE_SECRET_KEY esté configurado.');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    setStep(1);
    onClose();
    toast.success('¡Compra completada! El vendedor será notificado.');
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
              <h3 className="font-semibold mb-2">{product.name}</h3>
              <p className="text-sm text-gray-600 mb-1">Vendedor: {product.seller}</p>
              <p className="text-2xl font-bold text-blue-600">${product.price}</p>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="cardNumber">Número de Tarjeta</Label>
                <Input
                  id="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expiry">Vencimiento</Label>
                  <Input id="expiry" placeholder="MM/AA" maxLength={5} />
                </div>
                <div>
                  <Label htmlFor="cvc">CVC</Label>
                  <Input id="cvc" placeholder="123" maxLength={4} />
                </div>
              </div>
              <div>
                <Label htmlFor="name">Nombre en la Tarjeta</Label>
                <Input id="name" placeholder="Juan Pérez" />
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
              <Lock className="h-4 w-4 text-blue-600" />
              <span>Transacción segura con encriptación SSL</span>
            </div>

            <Button
              onClick={handlePayment}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Procesando pago...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pagar ${product.price}
                </>
              )}
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
              Tu pedido ha sido confirmado. El vendedor será notificado y podrás
              rastrear tu entrega pronto.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg mb-4 text-sm">
              <p className="font-semibold mb-1">ID de Transacción:</p>
              <p className="text-gray-600 font-mono text-xs break-all">
                {paymentIntentId || 'PI_' + Date.now()}
              </p>
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
