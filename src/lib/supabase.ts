import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Realtime channel names
export const REALTIME_CHANNELS = {
  MESSAGES: 'messages',
  CHANNELS: 'channels',
  CHANNEL_MEMBERS: 'channel_members',
  TYPING_INDICATORS: 'typing_indicators',
} as const;

// Realtime event types
export const REALTIME_EVENTS = {
  INSERT: 'INSERT',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
} as const;

export interface RealtimeMessageEvent {
  type: typeof REALTIME_EVENTS.INSERT | typeof REALTIME_EVENTS.UPDATE | typeof REALTIME_EVENTS.DELETE;
  table: string;
  schema: string;
  record: any;
  old_record: any;
}

export interface RealtimeChannelEvent {
  type: typeof REALTIME_EVENTS.INSERT | typeof REALTIME_EVENTS.UPDATE | typeof REALTIME_EVENTS.DELETE;
  table: string;
  schema: string;
  record: any;
  old_record: any;
}

export interface RealtimeChannelMemberEvent {
  type: typeof REALTIME_EVENTS.INSERT | typeof REALTIME_EVENTS.UPDATE | typeof REALTIME_EVENTS.DELETE;
  table: string;
  schema: string;
  record: any;
  old_record: any;
}

export interface TypingIndicatorEvent {
  userId: number;
  channelId: number;
  isTyping: boolean;
  timestamp: string;
}

function normalizePayload(payload: any): RealtimeMessageEvent {
  return {
    type: (payload?.eventType || payload?.type) as typeof REALTIME_EVENTS.INSERT | typeof REALTIME_EVENTS.UPDATE | typeof REALTIME_EVENTS.DELETE,
    table: payload?.table,
    schema: payload?.schema,
    record: payload?.new ?? payload?.record,
    old_record: payload?.old ?? payload?.old_record,
  };
}

// Subscribe to message changes in a specific channel
export function subscribeToChannelMessages(
  channelId: number,
  callback: (event: RealtimeMessageEvent) => void
) {
  const subscription = supabase
    .channel(`channel:${channelId}:messages`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `channel_id=eq.${channelId}`,
      },
      (payload) => {
        const event = normalizePayload(payload);
        callback(event);
      }
    )
    .subscribe();

  return subscription;
}

// Subscribe to channel member changes
export function subscribeToChannelMembers(
  channelId: number,
  callback: (event: RealtimeChannelMemberEvent) => void
) {
  const subscription = supabase
    .channel(`channel:${channelId}:members`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'channel_members',
        filter: `channel_id=eq.${channelId}`,
      },
      (payload) => {
        const event = normalizePayload(payload) as RealtimeChannelMemberEvent;
        callback(event);
      }
    )
    .subscribe();

  return subscription;
}

// Subscribe to user's channel changes
export function subscribeToUserChannels(
  userId: number,
  callback: (event: RealtimeChannelEvent) => void
) {
  const subscription = supabase
    .channel(`user:${userId}:channels`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'channels',
      },
      (payload) => {
        const event = normalizePayload(payload) as RealtimeChannelEvent;
        callback(event);
      }
    )
    .subscribe();

  return subscription;
}

// Unsubscribe from all channels
export function unsubscribeAll() {
  return supabase.removeAllChannels();
}

// Broadcast a custom event to a channel
export function broadcastToChannel(channelName: string, event: string, data: any) {
  return supabase.channel(channelName).send({
    type: 'broadcast',
    event,
    payload: data,
  });
}

// Typing indicator functions
export function subscribeToTypingIndicators(
  channelId: number,
  callback: (event: TypingIndicatorEvent) => void
) {
  const subscription = supabase
    .channel(`channel:${channelId}:typing`)
    .on('broadcast', { event: 'typing' }, (payload) => {
      callback(payload.payload as TypingIndicatorEvent);
    })
    .subscribe();

  return subscription;
}

export function broadcastTypingIndicator(
  channelId: number,
  userId: number,
  isTyping: boolean
) {
  return broadcastToChannel(`channel:${channelId}:typing`, 'typing', {
    userId,
    channelId,
    isTyping,
    timestamp: new Date().toISOString(),
  });
}
