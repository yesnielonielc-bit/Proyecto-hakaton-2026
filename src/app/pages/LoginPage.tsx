import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router';
import { useAuth } from '../components/AuthContext';
import { toast } from 'sonner';
import { Loader2, Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowRight } from 'lucide-react';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultType = searchParams.get('type') === 'seller' ? 'seller' : 'buyer';
  const [userType, setUserType] = useState<'seller' | 'buyer'>(defaultType);

  // ── Lógica sin cambios ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      await login(email, password);
      toast.success('¡Bienvenido de vuelta!');
      const type = profile?.user_type ?? userType;
      navigate(type === 'seller' ? '/seller/inventory' : '/marketplace');
    } catch (err: any) {
      const msg = err?.message || 'Error al iniciar sesión';
      if (msg.includes('Invalid login credentials')) {
        toast.error('Correo o contraseña incorrectos');
      } else if (msg.includes('Email not confirmed')) {
        toast.error('Confirma tu correo electrónico primero');
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white overflow-hidden">

      {/* ── Hero superior azul ── */}
      <div className="relative bg-gradient-to-b from-blue-50 to-white pt-10 pb-32 px-4 text-center overflow-hidden">
        {/* Dots decorativos */}
        <div className="absolute top-4 left-4 grid grid-cols-5 gap-1.5 opacity-20">
          {Array.from({length: 25}).map((_, i) => <div key={i} className="w-1 h-1 bg-blue-400 rounded-full" />)}
        </div>
        <div className="absolute top-4 right-4 grid grid-cols-5 gap-1.5 opacity-20">
          {Array.from({length: 25}).map((_, i) => <div key={i} className="w-1 h-1 bg-blue-400 rounded-full" />)}
        </div>

        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative mb-3">
            <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
              <ShieldCheck className="h-10 w-10 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-400 rounded-full flex items-center justify-center border-2 border-white">
              <span className="text-white text-xs">✓</span>
            </div>
          </div>
          <h1 className="text-3xl font-black text-blue-900">
            Market<span className="text-blue-500">Secure</span>
          </h1>
          <p className="text-blue-400 text-sm mt-1">Compra seguro, vende confiable</p>
        </div>

        {/* Selector de tipo */}
        <div className="max-w-xs mx-auto">
          <p className="text-lg font-bold text-gray-800 mb-1">¿Cómo quieres continuar?</p>
          <p className="text-sm text-gray-500 mb-5">Selecciona tu perfil para personalizar tu experiencia</p>
          <div className="grid grid-cols-2 gap-3">
            {/* Vendedor */}
            <button
              type="button"
              onClick={() => setUserType('seller')}
              className={`relative p-4 rounded-2xl border-2 transition-all text-center ${
                userType === 'seller'
                  ? 'border-blue-500 bg-white shadow-md shadow-blue-100'
                  : 'border-gray-200 bg-white hover:border-blue-200'
              }`}
            >
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2 text-2xl">
                📦
              </div>
              <p className={`font-bold text-sm ${userType === 'seller' ? 'text-blue-600' : 'text-gray-700'}`}>
                Vendedor
              </p>
              <p className="text-xs text-gray-400 mt-0.5 leading-tight">Publica tus productos y llega a más clientes</p>
              {userType === 'seller' && (
                <div className="absolute bottom-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
            </button>

            {/* Comprador */}
            <button
              type="button"
              onClick={() => setUserType('buyer')}
              className={`relative p-4 rounded-2xl border-2 transition-all text-center ${
                userType === 'buyer'
                  ? 'border-green-500 bg-white shadow-md shadow-green-100'
                  : 'border-gray-200 bg-white hover:border-green-200'
              }`}
            >
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2 text-2xl">
                🛍️
              </div>
              <p className={`font-bold text-sm ${userType === 'buyer' ? 'text-green-600' : 'text-gray-700'}`}>
                Comprador
              </p>
              <p className="text-xs text-gray-400 mt-0.5 leading-tight">Encuentra productos increíbles y seguros</p>
              {userType === 'buyer' && (
                <div className="absolute bottom-2 right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Sección inferior azul oscuro ── */}
      <div className="flex-1 bg-blue-700 -mt-16 rounded-t-[2.5rem] px-6 pt-8 pb-10 relative">
        {/* Features laterales (decorativo) */}
        <div className="absolute right-4 top-8 flex flex-col gap-4 items-center opacity-80">
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <span className="text-white text-xs text-center leading-tight w-14">Usuarios verificados</span>
          </div>
          <div className="w-px h-4 bg-blue-500" />
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
              <Lock className="h-5 w-5 text-white" />
            </div>
            <span className="text-white text-xs text-center leading-tight w-14">Pagos seguros</span>
          </div>
          <div className="w-px h-4 bg-blue-500" />
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">👍</span>
            </div>
            <span className="text-white text-xs text-center leading-tight w-14">Compra y vende con confianza</span>
          </div>
        </div>

        <h2 className="text-2xl font-black text-white mb-1">¡Bienvenido de nuevo!</h2>
        <p className="text-blue-200 text-sm mb-6">Inicia sesión para continuar</p>

        <form onSubmit={handleSubmit} className="space-y-4 max-w-xs">
          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Correo electrónico"
              required
              disabled={loading}
              className="w-full pl-11 pr-4 py-3.5 bg-white rounded-2xl text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-300 transition"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Contraseña"
              required
              disabled={loading}
              className="w-full pl-11 pr-11 py-3.5 bg-white rounded-2xl text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-300 transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {/* Botón */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-400 disabled:opacity-60 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition shadow-lg shadow-blue-900/30"
          >
            {loading
              ? <><Loader2 className="h-4 w-4 animate-spin" />Ingresando...</>
              : <><span>Iniciar sesión</span><ArrowRight className="h-4 w-4" /></>
            }
          </button>
        </form>

        {/* Registro */}
        <p className="text-blue-200 text-sm mt-6">
          ¿No tienes cuenta?{' '}
          <Link to={`/register?type=${userType}`} className="text-white font-semibold hover:underline">
            Regístrate ahora →
          </Link>
        </p>
      </div>
    </div>
  );
}