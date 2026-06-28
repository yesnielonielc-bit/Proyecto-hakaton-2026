import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { MapPin, Navigation, Loader2 } from 'lucide-react';

interface DeliveryMapProps {
  sellerAddress: string;
  buyerAddress: string;
}

export function DeliveryMap({ sellerAddress, buyerAddress }: DeliveryMapProps) {
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Tu navegador no soporta geolocalización');
      setLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setMyLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLoadingLocation(false);
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError('Permiso de ubicación denegado. Actívalo en tu navegador para ver tu posición.');
        } else {
          setLocationError('No se pudo obtener tu ubicación en este momento.');
        }
        setLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Navigation className="h-5 w-5 text-blue-600" />
        <h3 className="font-semibold">Información de Entrega</h3>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-start gap-3">
          <MapPin className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium">Desde</p>
            <p className="text-sm text-gray-600">{sellerAddress}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <MapPin className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium">Hasta</p>
            <p className="text-sm text-gray-600">{buyerAddress}</p>
          </div>
        </div>
      </div>

      {/* Tu ubicación en tiempo real */}
      <div className="border-t pt-4">
        <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
          <Navigation className="h-4 w-4 text-blue-500" /> Tu ubicación actual
        </p>

        {loadingLocation && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Obteniendo tu ubicación...
          </div>
        )}

        {!loadingLocation && locationError && (
          <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg">
            {locationError}
          </p>
        )}

        {!loadingLocation && myLocation && (
          <div className="bg-blue-50 rounded-lg p-3 text-sm">
            <p className="text-blue-700 font-medium">
              📍 Lat: {myLocation.lat.toFixed(5)}, Lng: {myLocation.lng.toFixed(5)}
            </p>
            <a
              href={`https://www.google.com/maps?q=${myLocation.lat},${myLocation.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 underline mt-1 inline-block"
            >
              Ver en Google Maps →
            </a>
          </div>
        )}
      </div>
    </Card>
  );
}
