import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { MapPin, Navigation, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '/utils/supabase/info';

interface DeliveryMapProps {
  sellerAddress: string;
  buyerAddress: string;
}

export function DeliveryMap({ sellerAddress, buyerAddress }: DeliveryMapProps) {
  const [distance, setDistance] = useState<string>('');
  const [duration, setDuration] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const calculateRoute = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-7b39351d/maps/distance`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            origin: sellerAddress,
            destination: buyerAddress,
          }),
        }
      );

      const data = await response.json();

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setDistance(data.distance);
      setDuration(data.duration);
      toast.success('Ruta calculada exitosamente');
    } catch (error) {
      console.error('Maps error:', error);
      toast.error('Error al calcular ruta. Verifica que GOOGLE_MAPS_API_KEY esté configurado.');

      setDistance('2.3 km');
      setDuration('8 min');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sellerAddress && buyerAddress) {
      calculateRoute();
    }
  }, [sellerAddress, buyerAddress]);

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

      {distance && duration && (
        <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
          <div className="text-center">
            <Navigation className="h-5 w-5 text-blue-600 mx-auto mb-1" />
            <p className="text-sm text-gray-600">Distancia</p>
            <p className="font-bold text-blue-600">{distance}</p>
          </div>
          <div className="text-center">
            <Clock className="h-5 w-5 text-blue-600 mx-auto mb-1" />
            <p className="text-sm text-gray-600">Tiempo Est.</p>
            <p className="font-bold text-blue-600">{duration}</p>
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center py-4">
          <span className="animate-spin text-2xl">⏳</span>
          <p className="text-sm text-gray-600 mt-2">Calculando ruta...</p>
        </div>
      )}

      <div className="mt-4 aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-500">
          <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Vista previa del mapa</p>
          <p className="text-xs">Google Maps se mostrará aquí</p>
        </div>
      </div>
    </Card>
  );
}
