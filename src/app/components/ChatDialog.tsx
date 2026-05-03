import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Send, MessageCircle } from 'lucide-react';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '/utils/supabase/info';

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: number;
}

interface ChatDialogProps {
  open: boolean;
  onClose: () => void;
  otherUserId: string;
  otherUserName: string;
}

export function ChatDialog({ open, onClose, otherUserId, otherUserName }: ChatDialogProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const conversationId = [user?.id, otherUserId].sort().join(':');

  const fetchMessages = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-7b39351d/chat/messages?conversationId=${conversationId}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      const data = await response.json();

      if (data.messages) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-7b39351d/chat/send`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            conversationId,
            senderId: user.id,
            senderName: user.name,
            message: newMessage,
          }),
        }
      );

      const data = await response.json();

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setMessages([...messages, data]);
      setNewMessage('');

      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Error al enviar mensaje');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [open, conversationId]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Chat con {otherUserName}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-3">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No hay mensajes aún</p>
                <p className="text-xs">Inicia la conversación</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isOwn = msg.senderId === user?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        isOwn
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      {!isOwn && (
                        <p className="text-xs font-semibold mb-1 opacity-70">
                          {msg.senderName}
                        </p>
                      )}
                      <p className="text-sm">{msg.message}</p>
                      <p
                        className={`text-xs mt-1 ${
                          isOwn ? 'text-blue-100' : 'text-gray-500'
                        }`}
                      >
                        {new Date(msg.timestamp).toLocaleTimeString('es', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <div className="flex gap-2 pt-4 border-t">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Escribe un mensaje..."
            disabled={loading}
          />
          <Button onClick={sendMessage} disabled={loading || !newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
