import { useState, useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import { supabase } from '@/lib/supabase';
import { Badge } from './ui/badge';
import { MapPin, Star, Package, MessageCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Seller {
  id: string;
  full_name: string;
  city: string;
  address: string;
  rating: number;
  review_count: number;
  is_verified: boolean;
  lat: number;
  lng: number;
  products: { id: string; name: string; price: number; product_images: { url: string }[] }[];
}

interface BusinessMapProps {
  onContactSeller?: (sellerId: string, sellerName: string) => void;
}

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  'Managua': { lat: 12.1149, lng: -86.2362 },
  'León': { lat: 12.4379, lng: -86.8779 },
  'Granada': { lat: 11.9344, lng: -85.9560 },
  'Masaya': { lat: 11.9754, lng: -86.0940 },
  'Estelí': { lat: 13.0851, lng: -86.3626 },
  'Matagalpa': { lat: 12.9254, lng: -85.9174 },
  'Chinandega': { lat: 12.6297, lng: -87.1335 },
  'Rivas': { lat: 11.4366, lng: -85.8369 },
  'Jinotepe': { lat: 11.8479, lng: -86.1988 },
  'default': { lat: 12.1149, lng: -86.2362 },
};

// Componente interno que tiene acceso al mapa ya cargado
function MapContent({ onContactSeller }: BusinessMapProps) {
  const map = useMap();
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);

  useEffect(() => {
    if (!map) return;
    fetchSellers();
  }, [map]);

  const fetchSellers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id, full_name, city, address, rating, review_count, is_verified,
        products!products_seller_id_fkey(
          id, name, price, status, stock,
          product_images(url, sort_order)
        )
      `)
      .eq('user_type', 'seller');

    if (error) { toast.error('Error al cargar negocios'); setLoading(false); return; }

    const geocoder = new window.google.maps.Geocoder();

    const sellersWithCoords = await Promise.all(
      (data || []).map(async (seller: any) => {
        const activeProducts = (seller.products || []).filter(
          (p: any) => p.status === 'active' && p.stock > 0
        );

        if (activeProducts.length === 0) return null;

        let baseCoords = CITY_COORDS[seller.city] || CITY_COORDS['default'];
        let coords = {
          lat: baseCoords.lat + (Math.random() - 0.5) * 0.02,
          lng: baseCoords.lng + (Math.random() - 0.5) * 0.02,
        };

        if (seller.address && seller.city) {
          try {
            const result = await new Promise<any[]>((resolve, reject) => {
              geocoder.geocode(
                { address: `${seller.address}, ${seller.city}, Nicaragua` },
                (results: any, status: any) => {
                  if (status === 'OK' && results) resolve(results);
                  else reject(status);
                }
              );
            });
            coords = {
              lat: result[0].geometry.location.lat(),
              lng: result[0].geometry.location.lng(),
            };
          } catch {
            // usar coords de ciudad con offset
          }
        }

        return { ...seller, lat: coords.lat, lng: coords.lng, products: activeProducts };
      })
    );

    setSellers(sellersWithCoords.filter(Boolean) as Seller[]);
    setLoading(false);
  };

  const getProductImage = (seller: Seller) =>
    seller.products[0]?.product_images?.[0]?.url ||
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200';

  if (loading) return (
    <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10 rounded-xl">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
        <p className="text-sm text-gray-500">Cargando negocios...</p>
      </div>
    </div>
  );

  return (
    <>
      {sellers.map(seller => (
        <AdvancedMarker
          key={seller.id}
          position={{ lat: seller.lat, lng: seller.lng }}
          onClick={() => setSelectedSeller(seller)}
        >
          <Pin
            background={seller.is_verified ? '#2563EB' : '#6B7280'}
            borderColor={seller.is_verified ? '#1D4ED8' : '#4B5563'}
            glyphColor="#FFFFFF"
            scale={selectedSeller?.id === seller.id ? 1.3 : 1}
          />
        </AdvancedMarker>
      ))}

      {selectedSeller && (
        <InfoWindow
          position={{ lat: selectedSeller.lat, lng: selectedSeller.lng }}
          onCloseClick={() => setSelectedSeller(null)}
        >
          <div className="w-60 p-1">
            <img
              src={getProductImage(selectedSeller)}
              alt={selectedSeller.full_name}
              className="w-full h-24 object-cover rounded-lg mb-2"
            />
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-gray-900 text-sm">{selectedSeller.full_name}</h3>
              {selectedSeller.is_verified && (
                <span className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded-full">✓</span>
              )}
            </div>
            {selectedSeller.city && (
              <p className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                <MapPin className="h-3 w-3" />{selectedSeller.city}
              </p>
            )}
            {selectedSeller.review_count > 0 && (
              <div className="flex items-center gap-1 mb-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-medium">{selectedSeller.rating?.toFixed(1)}</span>
                <span className="text-xs text-gray-400">({selectedSeller.review_count})</span>
              </div>
            )}
            <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
              <Package className="h-3 w-3" />
              <span>{selectedSeller.products.length} producto(s) disponible(s)</span>
            </div>
            <div className="text-xs text-gray-500 mb-2 space-y-0.5">
              {selectedSeller.products.slice(0, 3).map(p => (
                <div key={p.id} className="flex justify-between">
                  <span className="truncate mr-2">{p.name}</span>
                  <span className="font-medium text-blue-600 flex-shrink-0">${p.price}</span>
                </div>
              ))}
            </div>
            {onContactSeller && (
              <button
                onClick={() => onContactSeller(selectedSeller.id, selectedSeller.full_name)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-2 rounded-lg flex items-center justify-center gap-1.5 transition"
              >
                <MessageCircle className="h-3.5 w-3.5" /> Contactar vendedor
              </button>
            )}
          </div>
        </InfoWindow>
      )}

      {/* Leyenda */}
      <div className="absolute bottom-3 left-3 bg-white rounded-lg shadow-md px-3 py-2 text-xs space-y-1 z-10">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-600" />
          <span className="text-gray-600">Vendedor verificado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-500" />
          <span className="text-gray-600">Vendedor</span>
        </div>
      </div>

      {/* Contador */}
      <div className="absolute top-3 right-3 bg-white rounded-lg shadow-md px-3 py-1.5 text-xs font-medium text-gray-700 z-10">
        {sellers.length} negocio(s) activo(s)
      </div>
    </>
  );
}

export function BusinessMap({ onContactSeller }: BusinessMapProps) {
  return (
    <div className="relative w-full h-[500px] rounded-xl overflow-hidden shadow-sm border">
      <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_KEY}>
        <Map
          defaultCenter={{ lat: 12.1149, lng: -86.2362 }}
          defaultZoom={12}
          mapId="marketsecure-map"
          gestureHandling="greedy"
          style={{ width: '100%', height: '100%' }}
        >
          <MapContent onContactSeller={onContactSeller} />
        </Map>
      </APIProvider>
    </div>
  );
}