import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router';
import { Card } from '../components/ui/card';
import { useAuth } from '../components/AuthContext';
import {
  Settings, LayoutDashboard, Package, ShoppingBag, TrendingUp,
  Users, MessageCircle, BarChart2, Bell, ChevronDown,
  LogOut, ShoppingCart, Menu, Check, Sun, Moon, Monitor
} from 'lucide-react';
import { toast } from 'sonner';

const navItems = [
  { to: '/seller/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/seller/inventory', icon: Package, label: 'Inventario' },
  { to: '/seller/orders', icon: ShoppingBag, label: 'Pedidos' },
  { to: '/seller/sales', icon: TrendingUp, label: 'Ventas' },
  { to: '/seller/customers', icon: Users, label: 'Clientes' },
  { to: '/messages', icon: MessageCircle, label: 'Mensajes' },
  { to: '/seller/reports', icon: BarChart2, label: 'Reportes' },
  { to: '/seller/settings', icon: Settings, label: 'Configuración' },
];

const THEMES = [
  { id: 'blue', label: 'Azul', primary: '#2563EB', secondary: '#EFF6FF' },
  { id: 'purple', label: 'Morado', primary: '#7C3AED', secondary: '#F5F3FF' },
  { id: 'green', label: 'Verde', primary: '#16A34A', secondary: '#F0FDF4' },
  { id: 'orange', label: 'Naranja', primary: '#EA580C', secondary: '#FFF7ED' },
  { id: 'pink', label: 'Rosa', primary: '#DB2777', secondary: '#FDF2F8' },
  { id: 'teal', label: 'Teal', primary: '#0D9488', secondary: '#F0FDFA' },
];

const FONTS = [
  { id: 'inter', label: 'Inter', style: 'font-sans' },
  { id: 'serif', label: 'Serif', style: 'font-serif' },
  { id: 'mono', label: 'Mono', style: 'font-mono' },
];

const FONT_SIZES = [
  { id: 'sm', label: 'Pequeño', px: '13px' },
  { id: 'md', label: 'Normal', px: '14px' },
  { id: 'lg', label: 'Grande', px: '16px' },
];

const MODES = [
  { id: 'light', label: 'Claro', icon: Sun },
  { id: 'dark', label: 'Oscuro', icon: Moon },
  { id: 'system', label: 'Sistema', icon: Monitor },
];

const RADIUS = [
  { id: 'none', label: 'Sin bordes', value: '0px' },
  { id: 'sm', label: 'Suave', value: '6px' },
  { id: 'md', label: 'Normal', value: '12px' },
  { id: 'lg', label: 'Redondeado', value: '20px' },
];

interface AppSettings {
  theme: string;
  mode: string;
  font: string;
  fontSize: string;
  radius: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'blue',
  mode: 'light',
  font: 'inter',
  fontSize: 'md',
  radius: 'md',
};

function applySettings(settings: AppSettings) {
  const theme = THEMES.find(t => t.id === settings.theme) || THEMES[0];
  const fontSize = FONT_SIZES.find(f => f.id === settings.fontSize) || FONT_SIZES[1];
  const radius = RADIUS.find(r => r.id === settings.radius) || RADIUS[2];

  const root = document.documentElement;
  root.style.setProperty('--color-primary', theme.primary);
  root.style.setProperty('--color-primary-bg', theme.secondary);
  root.style.setProperty('--app-font-size', fontSize.px);
  root.style.setProperty('--app-radius', radius.value);

  // Modo oscuro
  if (settings.mode === 'dark' || (settings.mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  // Fuente
  root.style.fontFamily = settings.font === 'serif'
    ? 'Georgia, serif'
    : settings.font === 'mono'
    ? 'monospace'
    : 'Inter, sans-serif';

  localStorage.setItem('app-settings', JSON.stringify(settings));
}

export function SellerSettingsPage() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('app-settings');
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    } catch { return DEFAULT_SETTINGS; }
  });

  const handleChange = (key: keyof AppSettings, value: string) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    applySettings(newSettings);
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    applySettings(DEFAULT_SETTINGS);
    toast.success('Configuración restablecida');
  };

  const handleSave = () => {
    applySettings(settings);
    toast.success('Cambios guardados');
  };

  const handleLogout = async () => { await logout(); navigate('/login'); };

  const currentTheme = THEMES.find(t => t.id === settings.theme) || THEMES[0];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className={`flex flex-col bg-white border-r border-gray-100 shadow-sm transition-all duration-300 flex-shrink-0 ${sidebarCollapsed ? 'w-16' : 'w-60'}`}>
        <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: currentTheme.primary }}>
            <ShoppingCart className="h-5 w-5 text-white" />
          </div>
          {!sidebarCollapsed && <span className="font-bold text-lg tracking-tight" style={{ color: currentTheme.primary }}>MarketSecure</span>}
        </div>
        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={label} to={to}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? 'text-white' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}
              style={({ isActive }) => isActive ? { background: currentTheme.primary } : {}}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!sidebarCollapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-gray-100 p-3">
          <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-3 w-full px-2 py-2 rounded-xl hover:bg-gray-50 transition-colors">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: currentTheme.secondary }}>
              <span className="font-semibold text-sm" style={{ color: currentTheme.primary }}>{profile?.full_name?.charAt(0).toUpperCase() || 'V'}</span>
            </div>
            {!sidebarCollapsed && (
              <>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{profile?.full_name || 'Vendedor'}</p>
                  <p className="text-xs text-gray-400">Ver perfil</p>
                </div>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
              </>
            )}
          </button>
          {profileOpen && !sidebarCollapsed && (
            <button onClick={handleLogout} className="flex items-center gap-2 w-full px-3 py-2 mt-1 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors">
              <LogOut className="h-4 w-4" /> Cerrar sesión
            </button>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between flex-shrink-0">
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <Menu className="h-5 w-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Bell className="h-5 w-5 text-gray-600" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: currentTheme.primary }} />
            </button>
            <NavLink to="/marketplace" className="text-sm font-medium px-4 py-2 rounded-xl hover:opacity-80 transition-colors" style={{ color: currentTheme.primary, background: currentTheme.secondary }}>
              Ver Marketplace
            </NavLink>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
              <p className="text-gray-500 text-sm mt-0.5">Personaliza la apariencia de tu panel</p>
            </div>

            {/* Modo */}
            <Card className="border-0 shadow-sm p-5 mb-4">
              <h2 className="font-semibold text-gray-900 mb-3">Modo</h2>
              <div className="grid grid-cols-3 gap-3">
                {MODES.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => handleChange('mode', id)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      settings.mode === id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`h-6 w-6 ${settings.mode === id ? 'text-blue-600' : 'text-gray-500'}`} />
                    <span className={`text-sm font-medium ${settings.mode === id ? 'text-blue-600' : 'text-gray-600'}`}>{label}</span>
                    {settings.mode === id && <Check className="h-3.5 w-3.5 text-blue-600" />}
                  </button>
                ))}
              </div>
            </Card>

            {/* Color del tema */}
            <Card className="border-0 shadow-sm p-5 mb-4">
              <h2 className="font-semibold text-gray-900 mb-3">Color Principal</h2>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {THEMES.map(theme => (
                  <button
                    key={theme.id}
                    onClick={() => handleChange('theme', theme.id)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      settings.theme === theme.id ? 'border-gray-800' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full relative" style={{ background: theme.primary }}>
                      {settings.theme === theme.id && (
                        <Check className="h-4 w-4 text-white absolute inset-0 m-auto" />
                      )}
                    </div>
                    <span className="text-xs font-medium text-gray-600">{theme.label}</span>
                  </button>
                ))}
              </div>
            </Card>

            {/* Tipografía */}
            <Card className="border-0 shadow-sm p-5 mb-4">
              <h2 className="font-semibold text-gray-900 mb-3">Tipografía</h2>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {FONTS.map(font => (
                  <button
                    key={font.id}
                    onClick={() => handleChange('font', font.id)}
                    className={`p-3 rounded-xl border-2 transition-all text-center ${
                      settings.font === font.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className={`text-lg font-bold ${font.style} ${settings.font === font.id ? 'text-blue-600' : 'text-gray-700'}`}>Aa</p>
                    <p className={`text-xs mt-1 ${settings.font === font.id ? 'text-blue-500' : 'text-gray-500'}`}>{font.label}</p>
                  </button>
                ))}
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Tamaño de texto</p>
                <div className="grid grid-cols-3 gap-3">
                  {FONT_SIZES.map(size => (
                    <button
                      key={size.id}
                      onClick={() => handleChange('fontSize', size.id)}
                      className={`p-3 rounded-xl border-2 transition-all text-center ${
                        settings.fontSize === size.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <p className={`font-medium ${settings.fontSize === size.id ? 'text-blue-600' : 'text-gray-700'}`} style={{ fontSize: size.px }}>Texto</p>
                      <p className={`text-xs mt-1 ${settings.fontSize === size.id ? 'text-blue-500' : 'text-gray-500'}`}>{size.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            {/* Bordes */}
            <Card className="border-0 shadow-sm p-5 mb-6">
              <h2 className="font-semibold text-gray-900 mb-3">Bordes y Esquinas</h2>
              <div className="grid grid-cols-4 gap-3">
                {RADIUS.map(r => (
                  <button
                    key={r.id}
                    onClick={() => handleChange('radius', r.id)}
                    className={`p-3 rounded-xl border-2 transition-all text-center ${
                      settings.radius === r.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div
                      className="w-8 h-8 border-2 border-gray-400 mx-auto mb-1"
                      style={{ borderRadius: r.value, borderColor: settings.radius === r.id ? currentTheme.primary : undefined }}
                    />
                    <p className={`text-xs ${settings.radius === r.id ? 'text-blue-500' : 'text-gray-500'}`}>{r.label}</p>
                  </button>
                ))}
              </div>
            </Card>

            {/* Preview */}
            <Card className="border-0 shadow-sm p-5 mb-6" style={{ borderRadius: RADIUS.find(r => r.id === settings.radius)?.value }}>
              <h2 className="font-semibold text-gray-900 mb-3">Vista Previa</h2>
              <div className="p-4 rounded-xl" style={{ background: currentTheme.secondary, borderRadius: RADIUS.find(r => r.id === settings.radius)?.value }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: currentTheme.primary, borderRadius: RADIUS.find(r => r.id === settings.radius)?.value }}>
                    <ShoppingCart className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold" style={{ color: currentTheme.primary, fontFamily: settings.font === 'serif' ? 'Georgia, serif' : settings.font === 'mono' ? 'monospace' : 'Inter, sans-serif', fontSize: FONT_SIZES.find(f => f.id === settings.fontSize)?.px }}>MarketSecure</p>
                    <p className="text-xs text-gray-500">Panel del vendedor</p>
                  </div>
                </div>
                <button className="text-sm font-medium text-white px-4 py-2 transition-opacity hover:opacity-80" style={{ background: currentTheme.primary, borderRadius: RADIUS.find(r => r.id === settings.radius)?.value }}>
                  Botón de ejemplo
                </button>
              </div>
            </Card>

            {/* Botones */}
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                className="flex-1 text-white font-medium py-3 rounded-xl transition-opacity hover:opacity-90"
                style={{ background: currentTheme.primary }}
              >
                Guardar cambios
              </button>
              <button
                onClick={handleReset}
                className="px-6 text-gray-600 font-medium py-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Restablecer
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}