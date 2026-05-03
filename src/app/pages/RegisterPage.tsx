import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { CheckCircle2 } from 'lucide-react';

export function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userType = searchParams.get('type') === 'seller' ? 'seller' : 'buyer';
  const [step, setStep] = useState(1);

  const handleComplete = () => {
    navigate('/verify-identity');
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
              <span>Verificación</span>
            </div>
          </div>

          {step === 1 && <Step1 onNext={() => setStep(2)} />}
          {step === 2 && <Step2 onNext={() => setStep(3)} userType={userType} />}
          {step === 3 && <Step3 onComplete={handleComplete} />}
        </Card>
      </div>
    </div>
  );
}

function Step1({ onNext }: { onNext: () => void }) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold mb-4">Información Personal</h3>
      <div>
        <label className="block text-sm font-medium mb-2">Nombre Completo</label>
        <input type="text" className="w-full px-3 py-2 border rounded-md" placeholder="Juan Pérez" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Correo Electrónico</label>
        <input type="email" className="w-full px-3 py-2 border rounded-md" placeholder="juan@ejemplo.com" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Teléfono</label>
        <input type="tel" className="w-full px-3 py-2 border rounded-md" placeholder="+1 234 567 8900" />
      </div>
      <Button onClick={onNext} className="w-full mt-4">Continuar</Button>
    </div>
  );
}

function Step2({ onNext, userType }: { onNext: () => void; userType: string }) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold mb-4">
        {userType === 'seller' ? 'Información del Negocio' : 'Dirección de Entrega'}
      </h3>
      {userType === 'seller' ? (
        <>
          <div>
            <label className="block text-sm font-medium mb-2">Nombre del Negocio</label>
            <input type="text" className="w-full px-3 py-2 border rounded-md" placeholder="Mi Tienda" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Categoría Principal</label>
            <select className="w-full px-3 py-2 border rounded-md">
              <option>Electrónica</option>
              <option>Ropa y Moda</option>
              <option>Hogar y Jardín</option>
              <option>Deportes</option>
            </select>
          </div>
        </>
      ) : (
        <>
          <div>
            <label className="block text-sm font-medium mb-2">Dirección</label>
            <input type="text" className="w-full px-3 py-2 border rounded-md" placeholder="Calle Principal 123" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Ciudad</label>
              <input type="text" className="w-full px-3 py-2 border rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Código Postal</label>
              <input type="text" className="w-full px-3 py-2 border rounded-md" />
            </div>
          </div>
        </>
      )}
      <Button onClick={onNext} className="w-full mt-4">Continuar</Button>
    </div>
  );
}

function Step3({ onComplete }: { onComplete: () => void }) {
  return (
    <div className="text-center py-8">
      <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
      <h3 className="font-semibold text-xl mb-2">Registro Completado</h3>
      <p className="text-gray-600 mb-6">
        Ahora necesitamos verificar tu identidad para garantizar la seguridad de la plataforma
      </p>
      <Button onClick={onComplete} className="w-full">
        Continuar a Verificación de Identidad
      </Button>
    </div>
  );
}
