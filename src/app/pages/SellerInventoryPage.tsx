import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { Plus, Package, TrendingUp, DollarSign, Eye, Edit, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '../components/AuthContext';

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
  product_images: { url: string }[];
}

export function SellerInventoryPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*, product_images(url, sort_order)')
      .eq('seller_id', user.id)
      .neq('status', 'deleted')
      .order('created_at', { ascending: false });

    if (error) toast.error('Error al cargar productos');
    else setProducts(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, [user]);

  const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
  const totalSales = products.reduce((sum, p) => sum + (p.sales_count || 0), 0);

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('products')
      .update({ status: 'deleted' })
      .eq('id', id);
    if (error) { toast.error('Error al eliminar'); return; }
    setProducts(prev => prev.filter(p => p.id !== id));
    toast.success('Producto eliminado');
  };

  const handleToggleStatus = async (product: Product) => {
    const newStatus = product.status === 'active' ? 'paused' : 'active';
    const { error } = await supabase
      .from('products').update({ status: newStatus }).eq('id', product.id);
    if (error) { toast.error('Error al actualizar'); return; }
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, status: newStatus } : p));
    toast.success(newStatus === 'active' ? 'Producto activado' : 'Producto pausado');
  };

  const getImage = (p: Product) =>
    p.product_images?.[0]?.url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400';

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Mi Inventario</h1>
            <p className="text-gray-600 mt-1">Gestiona tus productos y ventas</p>
          </div>
          <AddProductDialog sellerId={user?.id || ''} onAdded={fetchProducts} />
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Productos</p>
                <p className="text-2xl font-bold mt-1">{products.length}</p>
              </div>
              <Package className="h-12 w-12 text-blue-600 opacity-20" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Valor Inventario</p>
                <p className="text-2xl font-bold mt-1">${totalValue.toFixed(2)}</p>
              </div>
              <DollarSign className="h-12 w-12 text-green-600 opacity-20" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ventas Totales</p>
                <p className="text-2xl font-bold mt-1">{totalSales}</p>
              </div>
              <TrendingUp className="h-12 w-12 text-purple-600 opacity-20" />
            </div>
          </Card>
        </div>

        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Productos en Inventario</h2>
            {products.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Aún no tienes productos. ¡Agrega el primero!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Producto</th>
                      <th className="text-left py-3 px-4">Categoría</th>
                      <th className="text-left py-3 px-4">Precio</th>
                      <th className="text-left py-3 px-4">Stock</th>
                      <th className="text-left py-3 px-4">Estado</th>
                      <th className="text-left py-3 px-4">Vistas</th>
                      <th className="text-left py-3 px-4">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(product => (
                      <tr key={product.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img src={getImage(product)} alt={product.name} className="w-12 h-12 object-cover rounded" />
                            <span className="font-medium">{product.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4"><Badge variant="secondary">{product.category}</Badge></td>
                        <td className="py-3 px-4 font-semibold">${product.price}</td>
                        <td className="py-3 px-4">
                          <Badge variant={product.stock < 5 ? 'destructive' : 'default'}>
                            {product.stock} uds.
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                            {product.status === 'active' ? 'Activo' : 'Pausado'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1 text-gray-600">
                            <Eye className="h-4 w-4" />{product.view_count || 0}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleToggleStatus(product)}
                              title={product.status === 'active' ? 'Pausar' : 'Activar'}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(product.id)}>
                              <Trash2 className="h-4 w-4 text-red-600" />
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
      </div>
    </div>
  );
}

function AddProductDialog({ sellerId, onAdded }: { sellerId: string; onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '', category: '', price: '', stock: '',
    description: '', condition: 'good', address: '', city: '', image_url: ''
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
        seller_id: sellerId,
        name: formData.name,
        category: formData.category,
        price,
        stock,
        description: formData.description,
        condition: formData.condition,
        address: formData.address,
        city: formData.city,
        status: 'active',
      })
      .select()
      .single();

    if (error) { toast.error('Error al crear producto'); setLoading(false); return; }

    if (formData.image_url && product) {
      await supabase.from('product_images').insert({
        product_id: product.id,
        url: formData.image_url,
        sort_order: 0,
      });
    }

    toast.success('Producto agregado exitosamente');
    setFormData({ name: '', category: '', price: '', stock: '', description: '', condition: 'good', address: '', city: '', image_url: '' });
    setOpen(false);
    onAdded();
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="mr-2 h-4 w-4" />Agregar Producto</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Nuevo Producto</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <select value={formData.category} onChange={e => update('category', e.target.value)}
              className="w-full px-3 py-2 border rounded-md" required>
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
            <select value={formData.condition} onChange={e => update('condition', e.target.value)}
              className="w-full px-3 py-2 border rounded-md">
              <option value="new">Nuevo</option>
              <option value="like_new">Como nuevo</option>
              <option value="good">Buen estado</option>
              <option value="fair">Regular</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Precio ($)</Label>
              <Input type="number" step="0.01" min="0.01" value={formData.price}
                onChange={e => update('price', e.target.value)} placeholder="99.99" required />
            </div>
            <div>
              <Label>Stock</Label>
              <Input type="number" min="0" value={formData.stock}
                onChange={e => update('stock', e.target.value)} placeholder="10" required />
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
          <div>
            <Label>URL de Imagen (opcional)</Label>
            <Input type="url" value={formData.image_url}
              onChange={e => update('image_url', e.target.value)} placeholder="https://..." />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</> : 'Agregar Producto'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
