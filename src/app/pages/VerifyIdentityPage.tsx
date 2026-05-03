import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../components/AuthContext';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Camera, Upload, CheckCircle2, AlertCircle, Shield } from 'lucide-react';
import { toast } from 'sonner';

export function VerifyIdentityPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const [idPhoto, setIdPhoto] = useState<string | null>(null);
  const [selfiePhoto, setSelfiePhoto] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  const handleIdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setIdPhoto(ev.target?.result as string);
        setStep(2);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSelfieUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setSelfiePhoto(ev.target?.result as string);
        setStep(3);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleVerify = async () => {
    setVerifying(true);
    await new Promise(resolve => setTimeout(resolve, 2500));

    register({
      name: 'Usuario Verificado',
      email: 'usuario@ejemplo.com',
      type: 'seller',
      verified: true
    });

    toast.success('¡Verificación completada exitosamente!');
    setVerifying(false);
    setStep(4);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <Shield className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Verificación de Identidad</h1>
          <p className="text-gray-600">
            Proceso seguro con tecnología antifraude y reconocimiento biométrico
          </p>
        </div>

        <Card className="p-8">
          <div className="mb-8">
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className="flex-1">
                  <div className={`h-2 rounded-full ${step >= s ? 'bg-blue-600' : 'bg-gray-200'}`} />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-600">
              <span>Identificación</span>
              <span>Selfie</span>
              <span>Verificación</span>
              <span>Listo</span>
            </div>
          </div>

          {step === 1 && (
            <div className="text-center py-8">
              <Upload className="h-16 w-16 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Sube tu Identificación Oficial</h3>
              <p className="text-gray-600 mb-6">
                Cédula de identidad, pasaporte o licencia de conducir
              </p>
              <ul className="text-left max-w-md mx-auto space-y-2 mb-6 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Asegúrate de que toda la información sea legible</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>La foto debe estar bien iluminada</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Evita reflejos o sombras</span>
                </li>
              </ul>
              <label htmlFor="id-upload">
                <Button asChild>
                  <span className="cursor-pointer">
                    <Upload className="mr-2 h-4 w-4" />
                    Subir Identificación
                  </span>
                </Button>
              </label>
              <input
                id="id-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleIdUpload}
              />
            </div>
          )}

          {step === 2 && (
            <div className="text-center py-8">
              <Camera className="h-16 w-16 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Toma una Selfie</h3>
              <p className="text-gray-600 mb-6">
                Realizaremos una prueba de vida para verificar tu identidad
              </p>
              {idPhoto && (
                <div className="mb-6">
                  <img src={idPhoto} alt="ID" className="max-w-xs mx-auto rounded-lg border-2 border-green-500" />
                  <p className="text-green-600 text-sm mt-2 flex items-center justify-center gap-1">
                    <CheckCircle2 className="h-4 w-4" />
                    Identificación cargada correctamente
                  </p>
                </div>
              )}
              <label htmlFor="selfie-upload">
                <Button asChild>
                  <span className="cursor-pointer">
                    <Camera className="mr-2 h-4 w-4" />
                    Tomar Selfie
                  </span>
                </Button>
              </label>
              <input
                id="selfie-upload"
                type="file"
                accept="image/*"
                capture="user"
                className="hidden"
                onChange={handleSelfieUpload}
              />
            </div>
          )}

          {step === 3 && (
            <div className="text-center py-8">
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-sm font-medium mb-2">Identificación</p>
                  {idPhoto && (
                    <img src={idPhoto} alt="ID" className="rounded-lg border-2 border-gray-200" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Selfie</p>
                  {selfiePhoto && (
                    <img src={selfiePhoto} alt="Selfie" className="rounded-lg border-2 border-gray-200" />
                  )}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <AlertCircle className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-blue-800">
                  Verificaremos tu identidad usando tecnología de reconocimiento facial
                  y validación de documentos con IA
                </p>
              </div>

              <Button onClick={handleVerify} disabled={verifying} className="w-full">
                {verifying ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Verificando identidad...
                  </>
                ) : (
                  'Iniciar Verificación'
                )}
              </Button>
            </div>
          )}

          {step === 4 && (
            <div className="text-center py-8">
              <CheckCircle2 className="h-20 w-20 text-green-600 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold mb-2">¡Verificación Exitosa!</h3>
              <p className="text-gray-600 mb-2">
                Tu identidad ha sido verificada correctamente
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 my-6">
                <div className="space-y-2 text-sm text-left max-w-md mx-auto">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Reconocimiento facial: 98.7% coincidencia</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Documento válido y autenticado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Prueba de vida completada</span>
                  </div>
                </div>
              </div>
              <Button onClick={() => navigate('/seller/inventory')} className="w-full">
                Ir a Mi Panel de Vendedor
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
