import { useState } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Search, Filter, Star, MapPin, ShoppingCart, Heart, Shield, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { CheckoutDialog } from '../components/CheckoutDialog';
import { ChatDialog } from '../components/ChatDialog';
import { DeliveryMap } from '../components/DeliveryMap';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  seller: string;
  rating: number;
  verified: boolean;
  image: string;
  distance: string;
  reviews: number;
  description: string;
}

const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Laptop HP Pavilion 15',
    category: 'Electrónica',
    price: 899.99,
    seller: 'TechStore Pro',
    rating: 4.8,
    verified: true,
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600',
    distance: '2.3 km',
    reviews: 124,
    description: 'Intel i7, 16GB RAM, 512GB SSD. Perfecto estado, garantía de 1 año.'
  },
  {
    id: '2',
    name: 'iPhone 14 Pro Max',
    category: 'Electrónica',
    price: 1299.99,
    seller: 'Mobile World',
    rating: 4.9,
    verified: true,
    image: 'https://images.unsplash.com/photo-1678652197831-2d180705cd2c?w=600',
    distance: '1.5 km',
    reviews: 89,
    description: '256GB, Color Morado Profundo. Nuevo sellado con factura.'
  },
  {
    id: '3',
    name: 'Auriculares Sony WH-1000XM4',
    category: 'Audio',
    price: 349.99,
    seller: 'Audio Premium',
    rating: 4.7,
    verified: true,
    image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=600',
    distance: '3.8 km',
    reviews: 203,
    description: 'Cancelación de ruido líder. Incluye estuche y todos los accesorios.'
  },
  {
    id: '4',
    name: 'Cámara Canon EOS R6',
    category: 'Fotografía',
    price: 2499.99,
    seller: 'Photo Expert',
    rating: 5.0,
    verified: true,
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600',
    distance: '5.2 km',
    reviews: 45,
    description: 'Cuerpo de cámara profesional. Usada solo 6 meses. Como nueva.'
  },
  {
    id: '5',
    name: 'iPad Air 5ta Gen',
    category: 'Electrónica',
    price: 649.99,
    seller: 'Apple Store CR',
    rating: 4.8,
    verified: true,
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600',
    distance: '0.8 km',
    reviews: 156,
    description: '64GB WiFi, incluye Apple Pencil y Smart Cover.'
  },
  {
    id: '6',
    name: 'Nintendo Switch OLED',
    category: 'Gaming',
    price: 349.99,
    seller: 'GameZone',
    rating: 4.9,
    verified: true,
    image: 'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=600',
    distance: '4.1 km',
    reviews: 98,
    description: 'Modelo OLED con 3 juegos incluidos. Excelente estado.'
  }
];

export function MarketplacePage() {
  const [products] = useState<Product[]>(MOCK_PRODUCTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [checkoutProduct, setCheckoutProduct] = useState<Product | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatUser, setChatUser] = useState<{ id: string; name: string } | null>(null);

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleBuyNow = (product: Product) => {
    setCheckoutProduct(product);
  };

  const handleContactSeller = (product: Product) => {
    setChatUser({ id: `seller_${product.id}`, name: product.seller });
    setChatOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Marketplace</h1>
          <p className="text-gray-600">Descubre productos de vendedores verificados cerca de ti</p>
        </div>

        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(category)}
                className="whitespace-nowrap"
              >
                {category === 'all' ? 'Todas' : category}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map(product => (
            <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedProduct(product)}>
              <div className="relative">
                <img src={product.image} alt={product.name} className="w-full h-48 object-cover" />
                <button className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-100">
                  <Heart className="h-5 w-5 text-gray-600" />
                </button>
                {product.verified && (
                  <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded-md text-xs flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    Verificado
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
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>{product.rating}</span>
                    <span className="text-gray-400">({product.reviews})</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{product.distance}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-600">{product.seller}</span>
                  <span className="text-2xl font-bold text-blue-600">${product.price}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleContactSeller(product);
                    }}
                  >
                    <MessageCircle className="h-4 w-4 mr-1" />
                    Chat
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBuyNow(product);
                    }}
                  >
                    <ShoppingCart className="h-4 w-4 mr-1" />
                    Comprar
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No se encontraron productos</p>
          </div>
        )}
      </div>

      {selectedProduct && (
        <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedProduct.name}</DialogTitle>
            </DialogHeader>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full rounded-lg" />
                <DeliveryMap
                  sellerAddress="Calle Principal 123, San José"
                  buyerAddress="Avenida Central 456, San José"
                />
              </div>
              <div>
                <div className="space-y-4">
                  <div>
                    <Badge variant="secondary">{selectedProduct.category}</Badge>
                  </div>
                  <p className="text-gray-600">{selectedProduct.description}</p>
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{selectedProduct.rating}</span>
                    <span className="text-gray-600">({selectedProduct.reviews} reseñas)</span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-5 w-5 text-blue-600" />
                      <span className="font-semibold">{selectedProduct.seller}</span>
                      {selectedProduct.verified && (
                        <Badge variant="default" className="bg-blue-600">Verificado</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                      <MapPin className="h-4 w-4" />
                      <span>A {selectedProduct.distance} de distancia</span>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => handleContactSeller(selectedProduct)}
                      className="w-full mb-2"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Contactar Vendedor
                    </Button>
                  </div>
                  <div className="border-t pt-4">
                    <p className="text-3xl font-bold text-blue-600 mb-4">${selectedProduct.price}</p>
                    <Button
                      onClick={() => {
                        setSelectedProduct(null);
                        handleBuyNow(selectedProduct);
                      }}
                      className="w-full"
                      size="lg"
                    >
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      Comprar Ahora
                    </Button>
                  </div>
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
          product={checkoutProduct}
        />
      )}

      {chatOpen && chatUser && (
        <ChatDialog
          open={chatOpen}
          onClose={() => setChatOpen(false)}
          otherUserId={chatUser.id}
          otherUserName={chatUser.name}
        />
      )}
    </div>
  );
}
