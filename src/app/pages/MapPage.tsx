import { useState } from 'react';
import { BusinessMap } from '../components/BusinessMap';
import { ChatDialog } from '../components/ChatDialog';
import { MapPin, Store } from 'lucide-react';

export function MapPage() {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatUser, setChatUser] = useState<{ id: string; name: string } | null>(null);

  const handleContactSeller = (sellerId: string, sellerName: string) => {
    setChatUser({ id: sellerId, name: sellerName });
    setChatOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Mapa de Negocios</h1>
          </div>
          <p className="text-gray-500 text-sm">
            Encuentra vendedores verificados cerca de ti y contacta directamente
          </p>
        </div>

        <BusinessMap onContactSeller={handleContactSeller} />

        <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
          <Store className="h-4 w-4" />
          <span>Haz clic en un marcador para ver los productos y contactar al vendedor</span>
        </div>
      </div>

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