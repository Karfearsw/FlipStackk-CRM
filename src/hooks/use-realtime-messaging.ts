import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { 
  subscribeToChannelMessages, 
  subscribeToChannelMembers,
  subscribeToUserChannels,
  subscribeToTypingIndicators,
  broadcastTypingIndicator,
  unsubscribeAll,
  RealtimeMessageEvent,
  RealtimeChannelEvent,
  RealtimeChannelMemberEvent,
  TypingIndicatorEvent
} from '@/lib/supabase';
import { Message, Channel, ChannelMember } from '@/types/communication';

interface UseRealtimeMessagingProps {
  channelId?: number;
  onMessage?: (message: Message) => void;
  onChannelUpdate?: (channel: Channel) => void;
  onMemberUpdate?: (member: ChannelMember) => void;
}

export function useRealtimeMessaging({
  channelId,
  onMessage,
  onChannelUpdate,
  onMemberUpdate,
}: UseRealtimeMessagingProps) {
  const { data: session } = useSession();
  const userId = session?.user?.id ? parseInt(session.user.id) : undefined;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [members, setMembers] = useState<ChannelMember[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const handleMessageEvent = useCallback((event: RealtimeMessageEvent) => {
    const message = event.record as Message;
    
    switch (event.type) {
      case 'INSERT':
        setMessages(prev => [...prev, message]);
        onMessage?.(message);
        break;
      case 'UPDATE':
        setMessages(prev => prev.map(msg => 
          msg.id === message.id ? message : msg
        ));
        break;
      case 'DELETE':
        setMessages(prev => prev.filter(msg => msg.id !== message.id));
        break;
    }
  }, [onMessage]);

  const handleChannelEvent = useCallback((event: RealtimeChannelEvent) => {
    const channel = event.record as Channel;
    
    switch (event.type) {
      case 'INSERT':
        setChannels(prev => [...prev, channel]);
        onChannelUpdate?.(channel);
        break;
      case 'UPDATE':
        setChannels(prev => prev.map(ch => 
          ch.id === channel.id ? channel : ch
        ));
        onChannelUpdate?.(channel);
        break;
      case 'DELETE':
        setChannels(prev => prev.filter(ch => ch.id !== channel.id));
        break;
    }
  }, [onChannelUpdate]);

  const handleMemberEvent = useCallback((event: RealtimeChannelMemberEvent) => {
    const member = event.record as ChannelMember;
    
    switch (event.type) {
      case 'INSERT':
        setMembers(prev => [...prev, member]);
        onMemberUpdate?.(member);
        break;
      case 'UPDATE':
        setMembers(prev => prev.map(mem => 
          mem.id === member.id ? member : mem
        ));
        onMemberUpdate?.(member);
        break;
      case 'DELETE':
        setMembers(prev => prev.filter(mem => mem.id !== member.id));
        break;
    }
  }, [onMemberUpdate]);

  useEffect(() => {
    if (!userId) return;

    const subscriptions: any[] = [];

    // Subscribe to user channels
    const channelSub = subscribeToUserChannels(userId, handleChannelEvent);
    subscriptions.push(channelSub);

    // Subscribe to specific channel messages if channelId is provided
    if (channelId) {
      const messageSub = subscribeToChannelMessages(channelId, handleMessageEvent);
      const memberSub = subscribeToChannelMembers(channelId, handleMemberEvent);
      subscriptions.push(messageSub, memberSub);
    }

    setIsConnected(true);

    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
      setIsConnected(false);
    };
  }, [userId, channelId, handleMessageEvent, handleChannelEvent, handleMemberEvent]);

  const addMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const updateMessage = useCallback((messageId: number, updates: Partial<Message>) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, ...updates } : msg
    ));
  }, []);

  const removeMessage = useCallback((messageId: number) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  }, []);

  const addChannel = useCallback((channel: Channel) => {
    setChannels(prev => [...prev, channel]);
  }, []);

  const updateChannel = useCallback((channelId: number, updates: Partial<Channel>) => {
    setChannels(prev => prev.map(ch => 
      ch.id === channelId ? { ...ch, ...updates } : ch
    ));
  }, []);

  const removeChannel = useCallback((channelId: number) => {
    setChannels(prev => prev.filter(ch => ch.id !== channelId));
  }, []);

  const addMember = useCallback((member: ChannelMember) => {
    setMembers(prev => [...prev, member]);
  }, []);

  const updateMember = useCallback((memberId: number, updates: Partial<ChannelMember>) => {
    setMembers(prev => prev.map(mem => 
      mem.id === memberId ? { ...mem, ...updates } : mem
    ));
  }, []);

  const removeMember = useCallback((memberId: number) => {
    setMembers(prev => prev.filter(mem => mem.id !== memberId));
  }, []);

  return {
    messages,
    channels,
    members,
    isConnected,
    addMessage,
    updateMessage,
    removeMessage,
    addChannel,
    updateChannel,
    removeChannel,
    addMember,
    updateMember,
    removeMember,
  };
}

interface UseChannelMessagesProps {
  channelId: number;
  initialMessages?: Message[];
}

interface TypingUser {
  userId: number;
  timestamp: string;
}

export function useChannelMessages({ channelId, initialMessages = [] }: UseChannelMessagesProps) {
  const { data: session } = useSession();
  const userId = session?.user?.id ? parseInt(session.user.id) : undefined;
  
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

  const { messages: realtimeMessages, addMessage, updateMessage, removeMessage } = useRealtimeMessaging({
    channelId,
    onMessage: (message) => {
      // Handle new message
      console.log('New message received:', message);
    },
  });

  // Handle typing indicators
  useEffect(() => {
    if (!channelId || !userId) return;

    const typingSubscription = subscribeToTypingIndicators(channelId, (event) => {
      if (event.userId === userId) return; // Ignore own typing

      if (event.isTyping) {
        setTypingUsers(prev => {
          const filtered = prev.filter(u => u.userId !== event.userId);
          return [...filtered, { userId: event.userId, timestamp: event.timestamp }];
        });
      } else {
        setTypingUsers(prev => prev.filter(u => u.userId !== event.userId));
      }
    });

    return () => {
      typingSubscription.unsubscribe();
    };
  }, [channelId, userId]);

  // Clean up old typing indicators
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const fiveSecondsAgo = now - 5000;
      
      setTypingUsers(prev => 
        prev.filter(user => new Date(user.timestamp).getTime() > fiveSecondsAgo)
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleTyping = useCallback(() => {
    if (!channelId || !userId) return;

    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // Broadcast typing start
    if (!isTyping) {
      setIsTyping(true);
      broadcastTypingIndicator(channelId, userId, true);
    }

    // Set timeout to stop typing after 3 seconds
    const timeout = setTimeout(() => {
      setIsTyping(false);
      broadcastTypingIndicator(channelId, userId, false);
    }, 3000);

    setTypingTimeout(timeout);
  }, [channelId, userId, isTyping, typingTimeout]);

  useEffect(() => {
    setMessages(realtimeMessages);
  }, [realtimeMessages]);

  const sendMessage = useCallback(async (content: string, messageType: string = 'text', fileData?: { fileUrl: string | null; fileName: string | null; fileSize: number | null }) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/channels/${channelId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          messageType,
          fileUrl: fileData?.fileUrl,
          fileName: fileData?.fileName,
          fileSize: fileData?.fileSize,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const newMessage = await response.json();
      addMessage(newMessage);
      
      // Notifications are triggered server-side in the API route after persistence
      
      return newMessage;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [channelId, addMessage]);

  const editMessage = useCallback(async (messageId: number, content: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error('Failed to edit message');
      }

      const updatedMessage = await response.json();
      updateMessage(messageId, updatedMessage);
      return updatedMessage;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to edit message');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [updateMessage]);

  const deleteMessage = useCallback(async (messageId: number) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete message');
      }

      removeMessage(messageId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete message');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [removeMessage]);

  const markAsRead = useCallback(async (messageId: number) => {
    try {
      await fetch(`/api/messages/${messageId}/read`, {
        method: 'POST',
      });
    } catch (err) {
      console.error('Failed to mark message as read:', err);
    }
  }, []);

  return {
    messages,
    isLoading,
    error,
    typingUsers,
    isTyping,
    sendMessage,
    editMessage,
    deleteMessage,
    markAsRead,
    handleTyping,
  };
}

interface UseUserChannelsProps {
  userId: number;
  initialChannels?: Channel[];
}

export function useUserChannels({ userId, initialChannels = [] }: UseUserChannelsProps) {
  const [channels, setChannels] = useState<Channel[]>(initialChannels);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { channels: realtimeChannels, addChannel, updateChannel, removeChannel } = useRealtimeMessaging({
    onChannelUpdate: (channel) => {
      // Handle channel update
      console.log('Channel updated:', channel);
    },
  });

  useEffect(() => {
    setChannels(realtimeChannels);
  }, [realtimeChannels]);

  const createChannel = useCallback(async (name: string, description?: string, type: string = 'group') => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/channels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description,
          type,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create channel');
      }

      const newChannel = await response.json();
      addChannel(newChannel);
      return newChannel;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create channel');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [addChannel]);

  const updateChannelDetails = useCallback(async (channelId: number, updates: { name?: string; description?: string }) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/channels/${channelId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update channel');
      }

      const updatedChannel = await response.json();
      updateChannel(channelId, updatedChannel);
      return updatedChannel;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update channel');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [updateChannel]);

  const deleteChannel = useCallback(async (channelId: number) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/channels/${channelId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete channel');
      }

      removeChannel(channelId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete channel');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [removeChannel]);

  return {
    channels,
    isLoading,
    error,
    createChannel,
    updateChannelDetails,
    deleteChannel,
  };
}