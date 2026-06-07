
import { useState, useEffect } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Search, Star, MapPin, ShoppingCart, Heart, Shield, MessageCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '../components/AuthContext';
import { CheckoutDialog } from '../components/CheckoutDialog';
import { ChatDialog } from '../components/ChatDialog';
import { DeliveryMap } from '../components/DeliveryMap';
import { ReviewDialog } from '../components/ReviewDialog';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  condition: string;
  status: string;
  address: string;
  city: string;
  seller_id: string;
  description: string;
  view_count: number;
  created_at: string;
  product_images: { url: string; sort_order: number }[];
  profiles: {
    full_name: string;
    is_verified: boolean;
    rating: number;
    review_count: number;
  };
}

export function MarketplacePage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [checkoutProduct, setCheckoutProduct] = useState<Product | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatUser, setChatUser] = useState<{ id: string; name: string } | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [reviewSeller, setReviewSeller] = useState<{ id: string; name: string } | null>(null);

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        product_images (url, sort_order),
        profiles (full_name, is_verified, rating, review_count)
      `)
      .eq('status', 'active')
      .gt('stock', 0)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Error al cargar productos');
      console.error(error);
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  const fetchFavorites = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('favorites')
      .select('product_id')
      .eq('user_id', user.id);
    if (data) setFavorites(new Set(data.map((f: { product_id: string }) => f.product_id)));
  };

  useEffect(() => {
    fetchProducts();
    fetchFavorites();
  }, [user]);

  const toggleFavorite = async (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    if (!user) { toast.error('Inicia sesión para guardar favoritos'); return; }
    if (favorites.has(productId)) {
      await supabase.from('favorites').delete()
        .eq('user_id', user.id).eq('product_id', productId);
      setFavorites(prev => { const s = new Set(prev); s.delete(productId); return s; });
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, product_id: productId });
      setFavorites(prev => new Set(prev).add(productId));
    }
  };

  const handleOpenProduct = async (product: Product) => {
    setSelectedProduct(product);
    await supabase.from('products')
      .update({ view_count: (product.view_count || 0) + 1 })
      .eq('id', product.id);
  };

  const handleContactSeller = (product: Product) => {
    if (!user) { toast.error('Inicia sesión para contactar al vendedor'); return; }
    setChatUser({ id: product.seller_id, name: product.profiles.full_name });
    setChatOpen(true);
  };

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const getImage = (product: Product) => {
    const imgs = product.product_images?.sort((a, b) => a.sort_order - b.sort_order);
    return imgs?.[0]?.url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600';
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Marketplace</h1>
          <p className="text-gray-600">Descubre productos de vendedores verificados</p>
        </div>

        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {categories.map(cat => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(cat)}
                className="whitespace-nowrap"
              >
                {cat === 'all' ? 'Todas' : cat}
              </Button>
            ))}
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-lg">No se encontraron productos</p>
            <p className="text-sm mt-1">Intenta con otra búsqueda o categoría</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map(product => (
              <Card
                key={product.id}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleOpenProduct(product)}
              >
                <div className="relative">
                  <img src={getImage(product)} alt={product.name} className="w-full h-48 object-cover" />
                  <button
                    className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-100"
                    onClick={(e) => toggleFavorite(e, product.id)}
                  >
                    <Heart className={`h-5 w-5 ${favorites.has(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
                  </button>
                  {product.profiles?.is_verified && (
                    <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded-md text-xs flex items-center gap-1">
                      <Shield className="h-3 w-3" /> Verificado
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg">{product.name}</h3>
                    <Badge variant="secondary">{product.category}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                  <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>{product.profiles?.rating?.toFixed(1) || '0.0'}</span>
                    <span className="text-gray-400">({product.profiles?.review_count || 0})</span>
                    {product.city && <><span>•</span><MapPin className="h-4 w-4" /><span>{product.city}</span></>}
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-600">{product.profiles?.full_name}</span>
                    <span className="text-2xl font-bold text-blue-600">${product.price}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" onClick={(e) => { e.stopPropagation(); handleContactSeller(product); }}>
                      <MessageCircle className="h-4 w-4 mr-1" /> Chat
                    </Button>
                    <Button onClick={(e) => { e.stopPropagation(); setCheckoutProduct(product); }}>
                      <ShoppingCart className="h-4 w-4 mr-1" /> Comprar
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialog detalle del producto */}
      {selectedProduct && (
        <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedProduct.name}</DialogTitle>
            </DialogHeader>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <img src={getImage(selectedProduct)} alt={selectedProduct.name} className="w-full rounded-lg" />
                {selectedProduct.address && (
                  <DeliveryMap
                    sellerAddress={`${selectedProduct.address}, ${selectedProduct.city}`}
                    buyerAddress="Tu ubicación"
                  />
                )}
              </div>
              <div className="space-y-4">
                <Badge variant="secondary">{selectedProduct.category}</Badge>
                <p className="text-gray-600">{selectedProduct.description}</p>

                {/* Rating clickeable → abre reseñas */}
                <button
                  onClick={() => setReviewSeller({
                    id: selectedProduct.seller_id,
                    name: selectedProduct.profiles?.full_name
                  })}
                  className="flex items-center gap-2 hover:opacity-70 transition-opacity"
                >
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{selectedProduct.profiles?.rating?.toFixed(1) || '0.0'}</span>
                  <span className="text-gray-600 underline text-sm">
                    ({selectedProduct.profiles?.review_count || 0} reseñas)
                  </span>
                </button>

                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold">{selectedProduct.profiles?.full_name}</span>
                    {selectedProduct.profiles?.is_verified && (
                      <Badge className="bg-blue-600">Verificado</Badge>
                    )}
                  </div>
                  <Button variant="outline" onClick={() => handleContactSeller(selectedProduct)} className="w-full mb-2">
                    <MessageCircle className="h-4 w-4 mr-2" /> Contactar Vendedor
                  </Button>
                </div>
                <div className="border-t pt-4">
                  <p className="text-3xl font-bold text-blue-600 mb-4">${selectedProduct.price}</p>
                  <Badge variant="outline" className="mb-4">Stock: {selectedProduct.stock} disponibles</Badge>
                  <Button
                    onClick={() => { setSelectedProduct(null); setCheckoutProduct(selectedProduct); }}
                    className="w-full" size="lg"
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" /> Comprar Ahora
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {checkoutProduct && (
        <CheckoutDialog
          open={!!checkoutProduct}
          onClose={() => setCheckoutProduct(null)}
          product={{ id: checkoutProduct.id, name: checkoutProduct.name, price: checkoutProduct.price, seller: checkoutProduct.profiles?.full_name }}
        />
      )}

      {chatOpen && chatUser && (
        <ChatDialog open={chatOpen} onClose={() => setChatOpen(false)} otherUserId={chatUser.id} otherUserName={chatUser.name} />
      )}

      {/* Dialog de reseñas */}
      {reviewSeller && (
        <ReviewDialog
          open={!!reviewSeller}
          onClose={() => { setReviewSeller(null); fetchProducts(); }}
          sellerId={reviewSeller.id}
          sellerName={reviewSeller.name}
        />
      )}
    </div>
  );
}