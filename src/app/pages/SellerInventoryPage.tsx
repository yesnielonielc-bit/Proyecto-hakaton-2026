import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { Plus, Package, TrendingUp, DollarSign, Eye, Edit, Trash2, Camera } from 'lucide-react';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  image: string;
  views: number;
  sales: number;
}

export function SellerInventoryPage() {
  const [products, setProducts] = useState<Product[]>([
    {
      id: '1',
      name: 'Laptop HP Pavilion',
      category: 'Electrónica',
      price: 899.99,
      stock: 5,
      image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400',
      views: 234,
      sales: 12
    },
    {
      id: '2',
      name: 'Auriculares Sony WH-1000XM4',
      category: 'Electrónica',
      price: 349.99,
      stock: 12,
      image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400',
      views: 456,
      sales: 23
    },
    {
      id: '3',
      name: 'Cámara Canon EOS R6',
      category: 'Fotografía',
      price: 2499.99,
      stock: 3,
      image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400',
      views: 189,
      sales: 5
    }
  ]);

  const totalProducts = products.length;
  const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
  const totalSales = products.reduce((sum, p) => sum + p.sales, 0);

  const handleDeleteProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
    toast.success('Producto eliminado');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Mi Inventario</h1>
            <p className="text-gray-600 mt-1">Gestiona tus productos y ventas</p>
          </div>
          <AddProductDialog onAdd={(product) => {
            setProducts([...products, { ...product, id: Date.now().toString(), views: 0, sales: 0 }]);
            toast.success('Producto agregado exitosamente');
          }} />
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Productos</p>
                <p className="text-2xl font-bold mt-1">{totalProducts}</p>
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
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Producto</th>
                    <th className="text-left py-3 px-4">Categoría</th>
                    <th className="text-left py-3 px-4">Precio</th>
                    <th className="text-left py-3 px-4">Stock</th>
                    <th className="text-left py-3 px-4">Vistas</th>
                    <th className="text-left py-3 px-4">Ventas</th>
                    <th className="text-left py-3 px-4">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img src={product.image} alt={product.name} className="w-12 h-12 object-cover rounded" />
                          <span className="font-medium">{product.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="secondary">{product.category}</Badge>
                      </td>
                      <td className="py-3 px-4 font-semibold">${product.price}</td>
                      <td className="py-3 px-4">
                        <Badge variant={product.stock < 5 ? 'destructive' : 'default'}>
                          {product.stock} unidades
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Eye className="h-4 w-4" />
                          {product.views}
                        </div>
                      </td>
                      <td className="py-3 px-4">{product.sales}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteProduct(product.id)}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function AddProductDialog({ onAdd }: { onAdd: (product: Omit<Product, 'id' | 'views' | 'sales'>) => void }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    stock: '',
    image: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      name: formData.name,
      category: formData.category,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock),
      image: formData.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'
    });
    setFormData({ name: '', category: '', price: '', stock: '', image: '' });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Agregar Producto
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo Producto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nombre del Producto</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Laptop Dell XPS 13"
              required
            />
          </div>
          <div>
            <Label htmlFor="category">Categoría</Label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              required
            >
              <option value="">Seleccionar categoría</option>
              <option value="Electrónica">Electrónica</option>
              <option value="Ropa">Ropa</option>
              <option value="Hogar">Hogar</option>
              <option value="Deportes">Deportes</option>
              <option value="Fotografía">Fotografía</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Precio ($)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="99.99"
                required
              />
            </div>
            <div>
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                placeholder="10"
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="image">URL de Imagen (opcional)</Label>
            <Input
              id="image"
              type="url"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              placeholder="https://ejemplo.com/imagen.jpg"
            />
            <p className="text-xs text-gray-500 mt-1">
              O usa el botón para subir desde tu dispositivo
            </p>
          </div>
          <Button type="submit" className="w-full">Agregar Producto</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
