import { useState, useEffect } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { MessageCircle, Send } from 'lucide-react';
import { useAuth } from '../components/AuthContext';
import { ChatDialog } from '../components/ChatDialog';
import { projectId, publicAnonKey } from '/utils/supabase/info';

interface Conversation {
  conversationId: string;
  lastMessage: string;
  lastMessageTime: number;
  otherUserId: string;
  otherUserName: string;
}

export function MessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedChat, setSelectedChat] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchConversations = async () => {
    if (!user) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-7b39351d/chat/conversations?userId=${user.id}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      const data = await response.json();

      if (data.conversations) {
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Mensajes</h1>
          <p className="text-gray-600">Conversaciones con compradores y vendedores</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <span className="animate-spin text-3xl">⏳</span>
            <p className="text-gray-600 mt-4">Cargando conversaciones...</p>
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
                key={conv.conversationId}
                className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedChat({ id: conv.otherUserId, name: conv.otherUserName })}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <MessageCircle className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold">{conv.otherUserName}</h3>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-1">{conv.lastMessage}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(conv.lastMessageTime).toLocaleString('es', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {selectedChat && (
        <ChatDialog
          open={!!selectedChat}
          onClose={() => setSelectedChat(null)}
          otherUserId={selectedChat.id}
          otherUserName={selectedChat.name}
        />
      )}
    </div>
  );
}
