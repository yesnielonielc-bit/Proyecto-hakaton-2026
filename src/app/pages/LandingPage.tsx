import { Link } from 'react-router';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Shield, ShoppingBag, Truck, Star } from 'lucide-react';

export function LandingPage() {
  return (
    <div className="min-h-screen">
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-6">
            Marketplace Seguro con Verificación Biométrica
          </h1>
          <p className="text-xl mb-8 text-blue-100">
            Compra y vende con confianza. Cada vendedor verificado con tecnología antifraude.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/register?type=seller">
              <Button size="lg" variant="secondary">
                Vender Productos
              </Button>
            </Link>
            <Link to="/register?type=buyer">
              <Button size="lg" variant="outline" className="bg-white/10 border-white text-white hover:bg-white/20">
                Explorar Marketplace
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center mb-12">¿Por qué MarketSecure?</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 text-center">
            <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="font-bold mb-2">Verificación Biométrica</h3>
            <p className="text-sm text-gray-600">
              Todos los vendedores verificados con reconocimiento facial y validación de identidad
            </p>
          </Card>
          <Card className="p-6 text-center">
            <ShoppingBag className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="font-bold mb-2">Inventario Inteligente</h3>
            <p className="text-sm text-gray-600">
              IA para sugerir categorías y descripciones automáticas
            </p>
          </Card>
          <Card className="p-6 text-center">
            <Truck className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="font-bold mb-2">Logística Local</h3>
            <p className="text-sm text-gray-600">
              Calcula rutas de entrega y puntos de recolección cercanos
            </p>
          </Card>
          <Card className="p-6 text-center">
            <Star className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="font-bold mb-2">Sistema de Reputación</h3>
            <p className="text-sm text-gray-600">
              Reseñas verificadas solo de compradores reales
            </p>
          </Card>
        </div>
      </section>
    </div>
  );
}