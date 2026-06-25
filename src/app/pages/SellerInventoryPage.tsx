import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import {
  Plus, Package, TrendingUp, DollarSign, Eye, Edit, Trash2, Loader2,
  LayoutDashboard, ShoppingBag, Users, MessageCircle, BarChart2,
  Settings, Bell, ChevronDown, LogOut, ShoppingCart, Menu, Pause, Play
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '../components/AuthContext';
import { ImageUploader } from '../components/ImageUploader';

interface ProductImage { id: string; url: string; sort_order: number; }
interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: string;
  condition: string;
  description: string;
  city: string;
  address: string;
  view_count: number;
  sales_count: number;
  product_images: ProductImage[];
}

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

export function SellerInventoryPage() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const fetchProducts = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*, product_images(id, url, sort_order)')
      .eq('seller_id', user.id)
      .neq('status', 'deleted')
      .order('created_at', { ascending: false });

    if (error) toast.error('Error al cargar productos');
    else setProducts(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
    const channel = supabase
      .channel('seller-products')
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'products',
      }, (payload) => {
        setProducts(prev => prev.map(p =>
          p.id === payload.new.id ? { ...p, view_count: payload.new.view_count } : p
        ));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
  const totalSales = products.reduce((sum, p) => sum + (p.sales_count || 0), 0);
  const totalViews = products.reduce((sum, p) => sum + (p.view_count || 0), 0);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('products').update({ status: 'deleted' }).eq('id', id);
    if (error) { toast.error('Error al eliminar'); return; }
    setProducts(prev => prev.filter(p => p.id !== id));
    toast.success('Producto eliminado');
  };

  const handleToggleStatus = async (product: Product) => {
    const newStatus = product.status === 'active' ? 'paused' : 'active';
    const { error } = await supabase.from('products').update({ status: newStatus }).eq('id', product.id);
    if (error) { toast.error('Error al actualizar'); return; }
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, status: newStatus } : p));
    toast.success(newStatus === 'active' ? 'Producto activado' : 'Producto pausado');
  };

  const handleLogout = async () => { await logout(); navigate('/login'); };

  const getImage = (p: Product) =>
    p.product_images?.[0]?.url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400';

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* Sidebar */}
      <aside className={`flex flex-col bg-white border-r border-gray-100 shadow-sm transition-all duration-300 flex-shrink-0 ${sidebarCollapsed ? 'w-16' : 'w-60'}`}>
        <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <ShoppingCart className="h-5 w-5 text-white" />
          </div>
          {!sidebarCollapsed && <span className="font-bold text-blue-600 text-lg tracking-tight">MarketSecure</span>}
        </div>
        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={label} to={to}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!sidebarCollapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-gray-100 p-3">
          <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-3 w-full px-2 py-2 rounded-xl hover:bg-gray-50 transition-colors">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 font-semibold text-sm">{profile?.full_name?.charAt(0).toUpperCase() || 'V'}</span>
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
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full" />
            </button>
            <NavLink to="/marketplace" className="text-sm text-blue-600 font-medium px-4 py-2 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
              Ver Marketplace
            </NavLink>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Mi Inventario</h1>
                  <p className="text-gray-500 text-sm mt-0.5">Gestiona tus productos y ventas</p>
                </div>
                <AddProductDialog sellerId={user?.id || ''} onAdded={fetchProducts} />
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card className="p-5 border-0 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Total Productos</p>
                      <p className="text-2xl font-bold text-gray-900">{products.length}</p>
                      <p className="text-xs text-gray-400 mt-1">Productos registrados</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                      <Package className="h-6 w-6 text-blue-500" />
                    </div>
                  </div>
                </Card>
                <Card className="p-5 border-0 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Valor Inventario</p>
                      <p className="text-2xl font-bold text-gray-900">${totalValue.toFixed(2)}</p>
                      <p className="text-xs text-gray-400 mt-1">Valor total en inventario</p>
                    </div>
                    <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-green-500" />
                    </div>
                  </div>
                </Card>
                <Card className="p-5 border-0 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Ventas Totales</p>
                      <p className="text-2xl font-bold text-gray-900">{totalSales}</p>
                      <p className="text-xs text-gray-400 mt-1">Ventas realizadas</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-purple-500" />
                    </div>
                  </div>
                </Card>
                <Card className="p-5 border-0 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Vistas Totales</p>
                      <p className="text-2xl font-bold text-gray-900">{totalViews}</p>
                      <p className="text-xs text-gray-400 mt-1">Visitas a productos</p>
                    </div>
                    <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center">
                      <Eye className="h-6 w-6 text-orange-500" />
                    </div>
                  </div>
                </Card>
              </div>

              <Card className="border-0 shadow-sm">
                <div className="p-6">
                  <h2 className="text-base font-semibold text-gray-900 mb-4">Productos en Inventario</h2>
                  {products.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                      <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Package className="h-8 w-8 text-blue-300" />
                      </div>
                      <p className="font-medium text-gray-500">Aún no tienes productos</p>
                      <p className="text-sm mt-1">¡Agrega el primero y comienza a vender!</p>
                      <AddProductDialog sellerId={user?.id || ''} onAdded={fetchProducts} />
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-100">
                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Producto</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Categoría</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Precio</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Stock</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Vistas</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {products.map(product => (
                            <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <img src={getImage(product)} alt={product.name} className="w-10 h-10 object-cover rounded-lg" />
                                  <span className="font-medium text-sm text-gray-800">{product.name}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4"><Badge variant="secondary" className="text-xs">{product.category}</Badge></td>
                              <td className="py-3 px-4 font-semibold text-sm text-gray-800">${product.price}</td>
                              <td className="py-3 px-4">
                                <Badge variant={product.stock < 5 ? 'destructive' : 'default'} className="text-xs">{product.stock} uds.</Badge>
                              </td>
                              <td className="py-3 px-4">
                                <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${product.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${product.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                                  {product.status === 'active' ? 'Activo' : 'Pausado'}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                                  <Eye className="h-4 w-4" /><span>{product.view_count || 0}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex gap-1">
                                  <Button variant="ghost" size="sm" onClick={() => setEditingProduct(product)} title="Editar producto" className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600">
                                    <Edit className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => handleToggleStatus(product)} title={product.status === 'active' ? 'Pausar' : 'Activar'} className="h-8 w-8 p-0 hover:bg-yellow-50 hover:text-yellow-600">
                                    {product.status === 'active' ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => handleDelete(product.id)} title="Eliminar" className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600">
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </Card>
            </>
          )}
        </main>
      </div>

      {editingProduct && (
        <EditProductDialog
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSaved={() => { setEditingProduct(null); fetchProducts(); }}
        />
      )}
    </div>
  );
}

function AddProductDialog({ sellerId, onAdded }: { sellerId: string; onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<{ url: string }[]>([]);
  const [formData, setFormData] = useState({
    name: '', category: '', price: '', stock: '',
    description: '', condition: 'good', address: '', city: ''
  });
  const update = (k: string, v: string) => setFormData(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(formData.price);
    const stock = parseInt(formData.stock);
    if (isNaN(price) || price <= 0) { toast.error('El precio debe ser mayor a 0'); return; }
    if (isNaN(stock) || stock < 0) { toast.error('El stock no puede ser negativo'); return; }

    setLoading(true);
    const { data: product, error } = await supabase
      .from('products')
      .insert({
        seller_id: sellerId, name: formData.name, category: formData.category,
        price, stock, description: formData.description, condition: formData.condition,
        address: formData.address, city: formData.city, status: 'active',
      })
      .select()
      .single();

    if (error) { toast.error('Error al crear producto'); setLoading(false); return; }

    if (images.length > 0 && product) {
      await supabase.from('product_images').insert(
        images.map((img, i) => ({ product_id: product.id, url: img.url, sort_order: i }))
      );
    }

    toast.success('Producto agregado exitosamente');
    setFormData({ name: '', category: '', price: '', stock: '', description: '', condition: 'good', address: '', city: '' });
    setImages([]);
    setOpen(false);
    onAdded();
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" />Agregar Producto
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Nuevo Producto</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Fotos del Producto</Label>
            <ImageUploader userId={sellerId} images={images} onImagesChange={setImages} maxImages={5} />
          </div>
          <div>
            <Label>Nombre del Producto</Label>
            <Input value={formData.name} onChange={e => update('name', e.target.value)} placeholder="Laptop Dell XPS 13" required />
          </div>
          <div>
            <Label>Descripción</Label>
            <Input value={formData.description} onChange={e => update('description', e.target.value)} placeholder="Describe tu producto..." />
          </div>
          <div>
            <Label>Categoría</Label>
            <select value={formData.category} onChange={e => update('category', e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" required>
              <option value="">Seleccionar categoría</option>
              <option value="Electrónica">Electrónica</option>
              <option value="Ropa">Ropa</option>
              <option value="Hogar">Hogar</option>
              <option value="Deportes">Deportes</option>
              <option value="Fotografía">Fotografía</option>
              <option value="Gaming">Gaming</option>
              <option value="Audio">Audio</option>
            </select>
          </div>
          <div>
            <Label>Condición</Label>
            <select value={formData.condition} onChange={e => update('condition', e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm">
              <option value="new">Nuevo</option>
              <option value="like_new">Como nuevo</option>
              <option value="good">Buen estado</option>
              <option value="fair">Regular</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Precio ($)</Label>
              <Input type="number" step="0.01" min="0.01" value={formData.price} onChange={e => update('price', e.target.value)} placeholder="99.99" required />
            </div>
            <div>
              <Label>Stock</Label>
              <Input type="number" min="0" value={formData.stock} onChange={e => update('stock', e.target.value)} placeholder="10" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Ciudad</Label>
              <Input value={formData.city} onChange={e => update('city', e.target.value)} placeholder="San José" />
            </div>
            <div>
              <Label>Dirección</Label>
              <Input value={formData.address} onChange={e => update('address', e.target.value)} placeholder="Calle 5" />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</> : 'Agregar Producto'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditProductDialog({ product, onClose, onSaved }: {
  product: Product; onClose: () => void; onSaved: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<ProductImage[]>(product.product_images || []);
  const [formData, setFormData] = useState({
    name: product.name, category: product.category, price: String(product.price),
    stock: String(product.stock), description: product.description || '',
    condition: product.condition, address: product.address || '', city: product.city || '',
  });
  const update = (k: string, v: string) => setFormData(p => ({ ...p, [k]: v }));

  // Sincroniza el cambio de imágenes con la base de datos
  const handleImagesChange = async (newImages: { id?: string; url: string }[]) => {
    const currentIds = images.map(i => i.id);
    const newIds = newImages.map(i => i.id).filter(Boolean) as string[];

    // Imágenes eliminadas
    const removed = images.filter(img => !newIds.includes(img.id));
    for (const r of removed) {
      await supabase.from('product_images').delete().eq('id', r.id);
    }

    // Imágenes nuevas (sin id)
    const added = newImages.filter(img => !img.id);
    let insertedImages: ProductImage[] = [];
    if (added.length > 0) {
      const { data } = await supabase.from('product_images').insert(
        added.map((img, i) => ({ product_id: product.id, url: img.url, sort_order: images.length + i }))
      ).select();
      insertedImages = data || [];
    }

    setImages([...images.filter(img => newIds.includes(img.id)), ...insertedImages]);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(formData.price);
    const stock = parseInt(formData.stock);
    if (isNaN(price) || price <= 0) { toast.error('El precio debe ser mayor a 0'); return; }
    if (isNaN(stock) || stock < 0) { toast.error('El stock no puede ser negativo'); return; }

    setLoading(true);
    const { error } = await supabase
      .from('products')
      .update({
        name: formData.name, category: formData.category, price, stock,
        description: formData.description, condition: formData.condition,
        address: formData.address, city: formData.city,
      })
      .eq('id', product.id);

    if (error) { toast.error('Error al guardar cambios'); setLoading(false); return; }
    toast.success('Producto actualizado');
    onSaved();
    setLoading(false);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Editar Producto</DialogTitle></DialogHeader>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <Label>Fotos del Producto</Label>
            <ImageUploader
              userId={product.id}
              images={images.map(img => ({ id: img.id, url: img.url }))}
              onImagesChange={handleImagesChange}
              maxImages={5}
            />
          </div>
          <div>
            <Label>Nombre del Producto</Label>
            <Input value={formData.name} onChange={e => update('name', e.target.value)} required />
          </div>
          <div>
            <Label>Descripción</Label>
            <Input value={formData.description} onChange={e => update('description', e.target.value)} />
          </div>
          <div>
            <Label>Categoría</Label>
            <select value={formData.category} onChange={e => update('category', e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" required>
              <option value="Electrónica">Electrónica</option>
              <option value="Ropa">Ropa</option>
              <option value="Hogar">Hogar</option>
              <option value="Deportes">Deportes</option>
              <option value="Fotografía">Fotografía</option>
              <option value="Gaming">Gaming</option>
              <option value="Audio">Audio</option>
            </select>
          </div>
          <div>
            <Label>Condición</Label>
            <select value={formData.condition} onChange={e => update('condition', e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm">
              <option value="new">Nuevo</option>
              <option value="like_new">Como nuevo</option>
              <option value="good">Buen estado</option>
              <option value="fair">Regular</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Precio ($)</Label>
              <Input type="number" step="0.01" min="0.01" value={formData.price} onChange={e => update('price', e.target.value)} required />
            </div>
            <div>
              <Label>Stock</Label>
              <Input type="number" min="0" value={formData.stock} onChange={e => update('stock', e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Ciudad</Label>
              <Input value={formData.city} onChange={e => update('city', e.target.value)} />
            </div>
            <div>
              <Label>Dirección</Label>
              <Input value={formData.address} onChange={e => update('address', e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</> : 'Guardar Cambios'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
