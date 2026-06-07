import { useState, useEffect } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { MessageCircle, Send, Loader2 } from 'lucide-react';
import { useAuth } from '../components/AuthContext';
import { ChatDialog } from '../components/ChatDialog';
import { supabase } from '@/lib/supabase';

interface Conversation {
  id: string;
  buyer_id: string;
  seller_id: string;
  last_message_at: string;
  product_id: string | null;
  last_message: string;
  other_user: {
    id: string;
    full_name: string;
  };
  unread_count: number;
}

export function MessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedChat, setSelectedChat] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchConversations = async () => {
    if (!user) return;

    // Traer conversaciones donde el usuario es comprador o vendedor
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        id,
        buyer_id,
        seller_id,
        last_message_at,
        product_id,
        buyer:profiles!conversations_buyer_id_fkey(id, full_name),
        seller:profiles!conversations_seller_id_fkey(id, full_name),
        messages(content, created_at, is_read, sender_id)
      `)
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      setLoading(false);
      return;
    }

    const formatted = (data || []).map((conv: any) => {
      const isbuyer = conv.buyer_id === user.id;
      const otherUser = isbuyer ? conv.seller : conv.buyer;
      const msgs = conv.messages || [];
      const lastMsg = msgs.sort((a: any, b: any) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];
      const unread = msgs.filter((m: any) => !m.is_read && m.sender_id !== user.id).length;

      return {
        id: conv.id,
        buyer_id: conv.buyer_id,
        seller_id: conv.seller_id,
        last_message_at: conv.last_message_at,
        product_id: conv.product_id,
        last_message: lastMsg?.content || 'Sin mensajes aún',
        other_user: otherUser || { id: '', full_name: 'Usuario' },
        unread_count: unread,
      };
    });

    setConversations(formatted);
    setLoading(false);
  };

  useEffect(() => {
    fetchConversations();

    // Suscripción en tiempo real para nuevos mensajes
    const channel = supabase
      .channel('conversations-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
      }, () => {
        fetchConversations();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Mensajes</h1>
          <p className="text-gray-600">Conversaciones con compradores y vendedores</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : conversations.length === 0 ? (
          <Card className="p-12 text-center">
            <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No hay conversaciones</h3>
            <p className="text-gray-600">
              Tus conversaciones con compradores y vendedores aparecerán aquí
            </p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {conversations.map((conv) => (
              <Card
                key={conv.id}
                className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedChat({
                  id: conv.other_user.id,
                  name: conv.other_user.full_name
                })}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 font-semibold text-sm">
                        {conv.other_user.full_name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold">{conv.other_user.full_name}</h3>
                        <span className="text-xs text-gray-400">
                          {new Date(conv.last_message_at).toLocaleString('es', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 truncate">{conv.last_message}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    {conv.unread_count > 0 && (
                      <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {conv.unread_count}
                      </span>
                    )}
                    <Button variant="ghost" size="sm">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {selectedChat && (
        <ChatDialog
          open={!!selectedChat}
          onClose={() => {
            setSelectedChat(null);
            fetchConversations(); // Actualizar conteo de no leídos al cerrar
          }}
          otherUserId={selectedChat.id}
          otherUserName={selectedChat.name}
        />
      )}
    </div>
  );
}