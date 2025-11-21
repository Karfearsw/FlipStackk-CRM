// Client-safe types for communication
export interface Channel {
  id: number;
  name: string;
  description?: string;
  type: 'direct' | 'group' | 'lead' | 'team';
  leadId?: number;
  createdByUserId: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
  discordWebhookUrl?: string;
  discordChannelId?: string;
  discordMirroringEnabled: boolean;
  whatsappPhoneNumberId?: string;
  whatsappMirroringEnabled: boolean;
}

export interface Message {
  id: number;
  channelId: number;
  userId: number;
  content: string;
  messageType: 'text' | 'image' | 'file' | 'system';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  replyToMessageId?: number;
  isEdited: boolean;
  editedAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

export interface ChannelMember {
  id: number;
  channelId: number;
  userId: number;
  role: 'admin' | 'member';
  lastReadAt?: Date;
  joinedAt: Date;
  notificationsEnabled: boolean;
}

export interface User {
  id: number;
  username: string;
  email: string;
  name?: string;
  role: 'admin' | 'acquisitions' | 'caller' | 'investor';
  createdAt: Date;
  updatedAt?: Date;
}