import { Context } from "npm:hono";
import * as kv from "./kv_store.tsx";

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: number;
}

export async function sendMessage(c: Context) {
  try {
    const { conversationId, senderId, senderName, message } = await c.req.json();

    if (!conversationId || !senderId || !message) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const messageData: Message = {
      id: crypto.randomUUID(),
      conversationId,
      senderId,
      senderName,
      message,
      timestamp: Date.now(),
    };

    const key = `chat:${conversationId}:${messageData.id}`;
    await kv.set(key, messageData);

    return c.json(messageData);
  } catch (error) {
    console.log('Error sending message:', error);
    return c.json({ error: 'Failed to send message' }, 500);
  }
}

export async function getMessages(c: Context) {
  try {
    const conversationId = c.req.query('conversationId');

    if (!conversationId) {
      return c.json({ error: 'Conversation ID required' }, 400);
    }

    const prefix = `chat:${conversationId}:`;
    const messages = await kv.getByPrefix(prefix);

    const sortedMessages = messages.sort((a, b) => a.timestamp - b.timestamp);

    return c.json({ messages: sortedMessages });
  } catch (error) {
    console.log('Error getting messages:', error);
    return c.json({ error: 'Failed to get messages' }, 500);
  }
}

export async function getConversations(c: Context) {
  try {
    const userId = c.req.query('userId');

    if (!userId) {
      return c.json({ error: 'User ID required' }, 400);
    }

    const allMessages = await kv.getByPrefix('chat:');

    const conversationMap = new Map<string, any>();

    allMessages.forEach((msg: Message) => {
      if (msg.conversationId.includes(userId)) {
        const existing = conversationMap.get(msg.conversationId);
        if (!existing || msg.timestamp > existing.timestamp) {
          conversationMap.set(msg.conversationId, {
            conversationId: msg.conversationId,
            lastMessage: msg.message,
            lastMessageTime: msg.timestamp,
            otherUserId: msg.senderId === userId ?
              msg.conversationId.replace(userId, '').replace(':', '') :
              msg.senderId,
            otherUserName: msg.senderName,
          });
        }
      }
    });

    const conversations = Array.from(conversationMap.values())
      .sort((a, b) => b.lastMessageTime - a.lastMessageTime);

    return c.json({ conversations });
  } catch (error) {
    console.log('Error getting conversations:', error);
    return c.json({ error: 'Failed to get conversations' }, 500);
  }
}
