import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '../components/AuthContext';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userType = searchParams.get('type') === 'seller' ? 'seller' : 'buyer';
  const [step, setStep] = useState(1);
  const { register } = useAuth();

  // Datos del formulario centralizados
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
    address: '',
    city: '',
    business_name: '',
  });

  const update = (field: string, value: string) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  const handleComplete = async () => {
    if (formData.password !== formData.confirm_password) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    if (formData.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    try {
      await register({
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        user_type: userType,
        phone: formData.phone,
      });
      toast.success('Cuenta creada. Revisa tu correo para confirmarla.');
      navigate('/verify-identity');
    } catch (err: any) {
      const msg = err?.message || 'Error al registrarse';
      if (msg.includes('already registered')) {
        toast.error('Este correo ya está registrado');
      } else {
        toast.error(msg);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">
              Registro de {userType === 'seller' ? 'Vendedor' : 'Comprador'}
            </h2>
            <div className="flex items-center gap-2 mt-4">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex-1">
                  <div className={`h-2 rounded-full ${step >= s ? 'bg-blue-600' : 'bg-gray-200'}`} />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-600">
              <span>Datos básicos</span>
              <span>Información</span>
              <span>Contraseña</span>
            </div>
          </div>

          {step === 1 && (
            <Step1
              data={formData}
              onChange={update}
              onNext={() => {
                if (!formData.full_name || !formData.email) {
                  toast.error('Completa nombre y correo');
                  return;
                }
                setStep(2);
              }}
            />
          )}
          {step === 2 && (
            <Step2
              data={formData}
              onChange={update}
              userType={userType}
              onNext={() => setStep(3)}
            />
          )}
          {step === 3 && (
            <Step3
              data={formData}
              onChange={update}
              onComplete={handleComplete}
            />
          )}
        </Card>
      </div>
    </div>
  );
}

function Step1({ data, onChange, onNext }: any) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold mb-4">Información Personal</h3>
      <div>
        <Label>Nombre Completo</Label>
        <Input value={data.full_name} onChange={e => onChange('full_name', e.target.value)} placeholder="Juan Pérez" />
      </div>
      <div>
        <Label>Correo Electrónico</Label>
        <Input type="email" value={data.email} onChange={e => onChange('email', e.target.value)} placeholder="juan@ejemplo.com" />
      </div>
      <div>
        <Label>Teléfono</Label>
        <Input type="tel" value={data.phone} onChange={e => onChange('phone', e.target.value)} placeholder="+1 234 567 8900" />
      </div>
      <Button onClick={onNext} className="w-full mt-4">Continuar</Button>
    </div>
  );
}

function Step2({ data, onChange, userType, onNext }: any) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold mb-4">
        {userType === 'seller' ? 'Información del Negocio' : 'Dirección de Entrega'}
      </h3>
      <div>
        <Label>Dirección</Label>
        <Input value={data.address} onChange={e => onChange('address', e.target.value)} placeholder="Calle Principal 123" />
      </div>
      <div>
        <Label>Ciudad</Label>
        <Input value={data.city} onChange={e => onChange('city', e.target.value)} placeholder="San José" />
      </div>
      {userType === 'seller' && (
        <div>
          <Label>Nombre del Negocio (opcional)</Label>
          <Input value={data.business_name} onChange={e => onChange('business_name', e.target.value)} placeholder="Mi Tienda" />
        </div>
      )}
      <Button onClick={onNext} className="w-full mt-4">Continuar</Button>
    </div>
  );
}

function Step3({ data, onChange, onComplete }: any) {
  const [loading, setLoading] = useState(false);
  const handle = async () => {
    setLoading(true);
    await onComplete();
    setLoading(false);
  };
  return (
    <div className="space-y-4">
      <h3 className="font-semibold mb-4">Crea tu Contraseña</h3>
      <div>
        <Label>Contraseña</Label>
        <Input type="password" value={data.password} onChange={e => onChange('password', e.target.value)} placeholder="Mínimo 6 caracteres" />
      </div>
      <div>
        <Label>Confirmar Contraseña</Label>
        <Input type="password" value={data.confirm_password} onChange={e => onChange('confirm_password', e.target.value)} placeholder="Repite la contraseña" />
      </div>
      <Button onClick={handle} className="w-full mt-4" disabled={loading}>
        {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creando cuenta...</> : 'Crear Cuenta'}
      </Button>
    </div>
  );
}
