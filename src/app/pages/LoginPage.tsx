import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router';
import { useAuth } from '../components/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultType = searchParams.get('type') === 'seller' ? 'seller' : 'buyer';
  const [userType, setUserType] = useState<'seller' | 'buyer'>(defaultType);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password, userType);
    navigate(userType === 'seller' ? '/seller/inventory' : '/marketplace');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <Card className="max-w-md w-full p-8">
        <h2 className="text-2xl font-bold text-center mb-6">Iniciar Sesión</h2>

        <Tabs value={userType} onValueChange={(v) => setUserType(v as 'seller' | 'buyer')} className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="buyer">Comprador</TabsTrigger>
            <TabsTrigger value="seller">Vendedor</TabsTrigger>
          </TabsList>
        </Tabs>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full">
            Ingresar
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <p className="text-gray-600">
            ¿No tienes cuenta?{' '}
            <Link to={`/register?type=${userType}`} className="text-blue-600 hover:underline">
              Regístrate aquí
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
