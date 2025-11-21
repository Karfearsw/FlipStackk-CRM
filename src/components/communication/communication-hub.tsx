import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/hooks/use-api';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  Users, 
  Hash, 
  Plus, 
  Search, 
  Settings,
  Bell,
  Send,
  Paperclip,
  Smile,
  MoreVertical,
  Bot,
  Phone,
  UserPlus,
  UserMinus,
  X,
  Edit,
  Trash2,
  Image,
  FileText,
  Download
} from 'lucide-react';
import { useChannelMessages } from '@/hooks/use-realtime-messaging';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { WhatsAppPanel } from '@/components/whatsapp-panel';
import { MessageReactions, MessageReactionPicker } from './message-reactions';
import type { ReactionSummary } from './message-reactions';
import { Channel, Message, ChannelMember, User } from '@/types/communication';
import { FileUpload } from './file-upload';

interface CommunicationHubProps {
  leadId?: number;
  className?: string;
}

export function CommunicationHub({ leadId, className }: CommunicationHubProps) {
  const { data: session } = useSession();
  const userId = session?.user?.id ? parseInt(session.user.id) : undefined;
  
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChannelDialog, setShowNewChannelDialog] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDescription, setNewChannelDescription] = useState('');
  const [newChannelDiscordWebhook, setNewChannelDiscordWebhook] = useState('');
  const [newChannelDiscordChannelId, setNewChannelDiscordChannelId] = useState('');
  const [newChannelDiscordEnabled, setNewChannelDiscordEnabled] = useState(false);
  const [channelMembers, setChannelMembers] = useState<ChannelMember[]>([]);
  const [showMembersPanel, setShowMembersPanel] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteUserId, setInviteUserId] = useState('');
  const [messageReactions, setMessageReactions] = useState<Record<number, ReactionSummary[]>>({});
  const [attachedFile, setAttachedFile] = useState<{ url: string; fileName: string; fileSize: number; fileType: string } | null>(null);

  const { data: channels = [], isLoading: channelsLoading, error: channelsError } = useQuery({
    queryKey: ['channels', userId],
    queryFn: () => apiGet<any[]>(`/api/channels?userId=${userId}`),
    enabled: !!userId,
  });

  const { 
    messages, 
    isLoading: messagesLoading, 
    error: messagesError,
    typingUsers,
    isTyping,
    sendMessage,
    editMessage,
    deleteMessage,
    markAsRead,
    handleTyping
  } = useChannelMessages({ 
    channelId: selectedChannel?.id!, 
    initialMessages: [] 
  });

  // Filter channels based on search query
  const filteredChannels = channels.filter(channel => 
    channel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    channel.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter messages based on search query
  const filteredMessages = messages.filter(message => 
    message.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (leadId && channels.length > 0) {
      const leadChannel = channels.find(channel => channel.leadId === leadId);
      if (leadChannel) {
        setSelectedChannel(leadChannel);
      }
    } else if (channels.length > 0 && !selectedChannel) {
      setSelectedChannel(channels[0]);
    }
  }, [leadId, channels, selectedChannel]);

  useEffect(() => {
    if (selectedChannel && messages.length > 0) {
      // Mark messages as read when channel is selected
      const latestMessage = messages[messages.length - 1];
      if (latestMessage && latestMessage.userId !== userId) {
        markAsRead(latestMessage.id);
      }
    }
  }, [selectedChannel, messages, userId, markAsRead]);

  useEffect(() => {
    if (selectedChannel) {
      fetchChannelMembers(selectedChannel.id);
    }
  }, [selectedChannel]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !attachedFile) return;
    if (!selectedChannel) return;

    try {
      const messageContent = newMessage.trim() || (attachedFile ? `📎 ${attachedFile.fileName}` : '');
      
      await sendMessage(messageContent, 'text', {
        fileUrl: attachedFile?.url || null,
        fileName: attachedFile?.fileName || null,
        fileSize: attachedFile?.fileSize || null,
      });
      
      setNewMessage('');
      setAttachedFile(null);
      
      // Stop typing indicator after sending message
      if (isTyping) {
        handleTyping();
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleCreateChannel = async () => {
    if (!newChannelName.trim()) return;

    try {
      const resp = await fetch('/api/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newChannelName.trim(),
          description: newChannelDescription.trim(),
          type: leadId ? 'lead' : 'group',
          leadId: leadId ?? undefined,
        })
      });
      if (!resp.ok) throw new Error('Failed to create channel');
      const channel = await resp.json();
      
      // Then update it with Discord configuration if provided
      if (channel && (newChannelDiscordWebhook.trim() || newChannelDiscordChannelId.trim())) {
        // We'll need to add an updateChannel function to the hooks
        // For now, we'll make a direct API call
        await fetch(`/api/channels/${channel.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            discordWebhookUrl: newChannelDiscordWebhook.trim() || undefined,
            discordChannelId: newChannelDiscordChannelId.trim() || undefined,
            discordMirroringEnabled: newChannelDiscordEnabled
          })
        });
      }
      
      if (leadId) {
        setSelectedChannel(channel);
      }
      // refresh channels list
      await apiGet<any[]>(`/api/channels?userId=${userId}`);
      
      setNewChannelName('');
      setNewChannelDescription('');
      setNewChannelDiscordWebhook('');
      setNewChannelDiscordChannelId('');
      setNewChannelDiscordEnabled(false);
      setShowNewChannelDialog(false);
    } catch (error) {
      console.error('Failed to create channel:', error);
    }
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'direct':
        return <MessageCircle className="h-4 w-4" />;
      case 'lead':
        return <Hash className="h-4 w-4" />;
      case 'team':
        return <Users className="h-4 w-4" />;
      default:
        return <Hash className="h-4 w-4" />;
    }
  };

  const getMessageTime = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  // Channel Member Management Functions
  const fetchChannelMembers = async (channelId: number) => {
    try {
      const response = await fetch(`/api/channels/${channelId}/members`);
      if (response.ok) {
        const members = await response.json();
        setChannelMembers(members);
      }
    } catch (error) {
      console.error('Failed to fetch channel members:', error);
    }
  };

  const handleInviteMember = async () => {
    if (!selectedChannel || !inviteUserId.trim()) return;

    try {
      const response = await fetch(`/api/channels/${selectedChannel.id}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: parseInt(inviteUserId.trim()),
          role: 'member'
        })
      });

      if (response.ok) {
        await fetchChannelMembers(selectedChannel.id);
        setInviteUserId('');
        setShowInviteDialog(false);
      } else {
        console.error('Failed to invite member:', await response.text());
      }
    } catch (error) {
      console.error('Failed to invite member:', error);
    }
  };

  const handleRemoveMember = async (memberUserId: number) => {
    if (!selectedChannel) return;

    try {
      const response = await fetch(`/api/channels/${selectedChannel.id}/members`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: memberUserId
        })
      });

      if (response.ok) {
        await fetchChannelMembers(selectedChannel.id);
      } else {
        console.error('Failed to remove member:', await response.text());
      }
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
  };

  const handleLeaveChannel = async () => {
    if (!selectedChannel || !userId) return;

    try {
      const response = await fetch(`/api/channels/${selectedChannel.id}/members`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId
        })
      });

      if (response.ok) {
        setSelectedChannel(null);
        setChannelMembers([]);
      } else {
        console.error('Failed to leave channel:', await response.text());
      }
    } catch (error) {
      console.error('Failed to leave channel:', error);
    }
  };

  // Message Reaction Functions
  const fetchMessageReactions = async (messageId: number) => {
    try {
      const response = await fetch(`/api/messages/${messageId}/reactions`);
      if (response.ok) {
        const reactions = await response.json();
        setMessageReactions(prev => ({
          ...prev,
          [messageId]: reactions
        }));
      }
    } catch (error) {
      console.error('Failed to fetch message reactions:', error);
    }
  };

  const handleAddReaction = async (messageId: number, emoji: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emoji }),
      });

      if (response.ok) {
        await fetchMessageReactions(messageId);
      } else {
        throw new Error('Failed to add reaction');
      }
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
  };

  const handleRemoveReaction = async (messageId: number, emoji: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}/reactions`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emoji }),
      });

      if (response.ok) {
        await fetchMessageReactions(messageId);
      } else {
        throw new Error('Failed to remove reaction');
      }
    } catch (error) {
      console.error('Failed to remove reaction:', error);
    }
  };

  useEffect(() => {
    // Fetch reactions for all visible messages
    messages.forEach(message => {
      if (!messageReactions[message.id]) {
        fetchMessageReactions(message.id);
      }
    });
  }, [messages]);

  if (channelsLoading) {
    return (
      <Card className={cn("h-[600px]", className)}>
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-muted-foreground">Loading channels...</div>
        </CardContent>
      </Card>
    );
  }

  if (channelsError) {
    return (
      <Card className={cn("h-[600px]", className)}>
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-destructive">Error loading channels: {String((channelsError as any)?.message ?? channelsError)}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("h-[600px] flex", className)}>
      {/* Sidebar */}
      <div className="w-80 border-r flex flex-col">
        <CardHeader className="border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Communication Hub</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowNewChannelDialog(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search channels and messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {filteredChannels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => setSelectedChannel(channel)}
                className={cn(
                  "w-full text-left p-2 rounded-lg flex items-center gap-2 hover:bg-accent transition-colors",
                  selectedChannel?.id === channel.id && "bg-accent"
                )}
              >
                {getChannelIcon(channel.type || 'group')}
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{channel.name}</div>
                  {channel.description && (
                    <div className="text-sm text-muted-foreground truncate">
                      {channel.description}
                    </div>
                  )}
                </div>
                <Badge variant="secondary" className="text-xs">
                  {channel.type}
                </Badge>
                {channel.discordMirroringEnabled && (
                  <Bot className="h-3 w-3 text-blue-500" />
                )}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <Tabs defaultValue="internal" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="internal" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Internal
            </TabsTrigger>
            <TabsTrigger value="discord" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Discord
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              WhatsApp
            </TabsTrigger>
          </TabsList>

          <TabsContent value="internal" className="flex-1 flex flex-col mt-0">
            {selectedChannel ? (
              <div className="flex flex-1">
                {/* Chat Area */}
                <div className="flex-1 flex flex-col">
                  {/* Channel Header */}
                  <CardHeader className="border-b px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getChannelIcon(selectedChannel.type || 'group')}
                        <div>
                          <CardTitle className="text-lg">{selectedChannel.name}</CardTitle>
                          {selectedChannel.description && (
                            <div className="text-sm text-muted-foreground">
                              {selectedChannel.description}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setShowMembersPanel(!showMembersPanel)}
                          title="Channel Members"
                        >
                          <Users className="h-4 w-4" />
                        </Button>
                        {selectedChannel.discordMirroringEnabled && (
                          <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            <Bot className="h-3 w-3" />
                            Discord
                          </div>
                        )}
                        <Button variant="ghost" size="icon">
                          <Bell className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {filteredMessages.map((message) => (
                        <div key={message.id} className="flex gap-3 group">
                          <div className="h-8 w-8 bg-primary text-white rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-medium">
                              {message.userId.toString().slice(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">
                                User {message.userId}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {getMessageTime(typeof message.createdAt === 'string' ? message.createdAt : message.createdAt?.toISOString?.() || new Date(message.createdAt as any).toISOString())}
                              </span>
                              {message.editedAt && (
                                <span className="text-xs text-muted-foreground">(edited)</span>
                              )}
                            </div>
                            <div className="text-sm">
                              {message.content}
                            </div>
                            
                            {/* File Attachments */}
                            {message.fileUrl && (
                              <div className="mt-2">
                                {message.messageType === 'image' ? (
                                  <div className="relative group">
                                    <img
                                      src={message.fileUrl}
                                      alt={message.fileName || 'Image attachment'}
                                      className="max-w-xs rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
                                      onClick={() => message.fileUrl && window.open(message.fileUrl, '_blank')}
                                    />
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Button
                                        variant="secondary"
                                        size="sm"
                                        className="h-6 px-2"
                                        onClick={() => message.fileUrl && window.open(message.fileUrl, '_blank')}
                                      >
                                        <Download className="h-3 w-3 mr-1" />
                                        View
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg border max-w-md">
                                    <div className="flex-shrink-0">
                                      {message.fileName?.toLowerCase().endsWith('.pdf') ? (
                                        <FileText className="h-8 w-8 text-red-500" />
                                      ) : message.fileName?.toLowerCase().match(/\.(doc|docx)$/) ? (
                                        <FileText className="h-8 w-8 text-blue-500" />
                                      ) : message.fileName?.toLowerCase().match(/\.(xls|xlsx)$/) ? (
                                        <FileText className="h-8 w-8 text-green-500" />
                                      ) : (
                                        <FileText className="h-8 w-8 text-gray-500" />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium text-sm truncate">
                                        {message.fileName || 'Unknown file'}
                                      </div>
                                      {message.fileSize && (
                                        <div className="text-xs text-muted-foreground">
                                          {(message.fileSize / 1024).toFixed(1)} KB
                                        </div>
                                      )}
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 px-2 flex-shrink-0"
                                      onClick={() => message.fileUrl && window.open(message.fileUrl, '_blank')}
                                    >
                                      <Download className="h-3 w-3" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Message Reactions */}
                            {messageReactions[message.id] && messageReactions[message.id].length > 0 && (
                              <MessageReactions
                                messageId={message.id}
                                reactions={messageReactions[message.id]}
                                onAddReaction={async (emoji) => await handleAddReaction(message.id, emoji)}
                                onRemoveReaction={async (emoji) => await handleRemoveReaction(message.id, emoji)}
                                className="mt-2"
                              />
                            )}
                          </div>
                          
                          {/* Message Actions */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MessageReactionPicker
                              onSelect={async (emoji) => await handleAddReaction(message.id, emoji)}
                              className="h-6 w-6"
                            />
                            {message.userId === userId && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => {/* TODO: Implement edit */}}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-destructive"
                                  onClick={() => deleteMessage(message.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                      {messages.length === 0 && (
                        <div className="text-center text-muted-foreground py-8">
                          No messages yet. Start the conversation!
                        </div>
                      )}
                    </div>
                  </ScrollArea>

                  {/* Message Input */}
                  <div className="border-t p-4">
                    {/* Typing Indicator */}
                    {typingUsers.length > 0 && (
                      <div className="text-xs text-muted-foreground mb-2">
                        {typingUsers.length === 1 
                          ? `User ${typingUsers[0].userId} is typing...`
                          : `${typingUsers.length} people are typing...`
                        }
                      </div>
                    )}
                    
                    {/* File Attachment Preview */}
                    {attachedFile && (
                      <div className="mb-2 p-2 bg-muted rounded-lg flex items-center gap-2">
                        {attachedFile.fileType.startsWith('image/') ? (
                          <Image className="h-4 w-4" />
                        ) : (
                          <FileText className="h-4 w-4" />
                        )}
                        <span className="text-sm flex-1">{attachedFile.fileName}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => setAttachedFile(null)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <FileUpload
                        channelId={selectedChannel.id}
                        onFileSelect={() => {}}
                        onUploadComplete={(fileData) => setAttachedFile(fileData)}
                        onUploadError={(error) => console.error('Upload error:', error)}
                      />
                      <Input
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => {
                          setNewMessage(e.target.value);
                          // Trigger typing indicator
                          handleTyping();
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        className="flex-1"
                      />
                      <Button variant="ghost" size="icon">
                        <Smile className="h-4 w-4" />
                      </Button>
                      <Button 
                        onClick={handleSendMessage}
                        disabled={(!newMessage.trim() && !attachedFile) || messagesLoading}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Members Panel */}
                {showMembersPanel && (
                  <div className="w-80 border-l bg-muted/30">
                    <CardHeader className="border-b px-4 py-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Channel Members</CardTitle>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setShowMembersPanel(false)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <ScrollArea className="flex-1 p-4">
                      <div className="space-y-3">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => setShowInviteDialog(true)}
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Invite Member
                        </Button>
                        
                        {channelMembers.map((member) => (
                          <div key={member.userId} className="flex items-center justify-between p-2 rounded-lg bg-background">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 bg-primary text-white rounded-full flex items-center justify-center">
                                <span className="text-xs font-medium">
                                  {member.userId.toString().slice(0, 2).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium text-sm">User {member.userId}</div>
                                <div className="text-xs text-muted-foreground capitalize">{member.role}</div>
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleRemoveMember(member.userId)}
                              title="Remove member"
                            >
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        
                        {channelMembers.length === 0 && (
                          <div className="text-center text-muted-foreground text-sm py-4">
                            No members in this channel
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>
            ) : (
              <CardContent className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <div className="text-muted-foreground">
                    Select a channel to start messaging
                  </div>
                </div>
              </CardContent>
            )}
          </TabsContent>

          <TabsContent value="discord" className="flex-1 flex flex-col mt-0">
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-center">
                <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <div className="text-muted-foreground">
                  Discord integration is configured. Messages are automatically mirrored.
                </div>
              </div>
            </CardContent>
          </TabsContent>

          <TabsContent value="whatsapp" className="flex-1 flex flex-col mt-0">
            <WhatsAppPanel />
          </TabsContent>
        </Tabs>
      </div>

      {/* New Channel Dialog */}
      {showNewChannelDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Create New Channel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Channel Name</label>
                <Input
                  placeholder="Enter channel name"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description (optional)</label>
                <Input
                  placeholder="Enter channel description"
                  value={newChannelDescription}
                  onChange={(e) => setNewChannelDescription(e.target.value)}
                />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="discord-mirroring"
                    checked={newChannelDiscordEnabled}
                    onChange={(e) => setNewChannelDiscordEnabled(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="discord-mirroring" className="text-sm font-medium">
                    Enable Discord Mirroring
                  </label>
                </div>
                
                {newChannelDiscordEnabled && (
                  <div className="space-y-3 pl-6">
                    <div>
                      <label className="text-sm font-medium">Discord Webhook URL</label>
                      <Input
                        placeholder="https://discord.com/api/webhooks/..."
                        value={newChannelDiscordWebhook}
                        onChange={(e) => setNewChannelDiscordWebhook(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Discord Channel ID (optional)</label>
                      <Input
                        placeholder="123456789012345678"
                        value={newChannelDiscordChannelId}
                        onChange={(e) => setNewChannelDiscordChannelId(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowNewChannelDialog(false);
                    setNewChannelName('');
                    setNewChannelDescription('');
                    setNewChannelDiscordWebhook('');
                    setNewChannelDiscordChannelId('');
                    setNewChannelDiscordEnabled(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateChannel}
                  disabled={!newChannelName.trim()}
                >
                  Create Channel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Invite Member Dialog */}
      {showInviteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Invite Member</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">User ID</label>
                <Input
                  placeholder="Enter user ID to invite"
                  value={inviteUserId}
                  onChange={(e) => setInviteUserId(e.target.value)}
                  type="number"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowInviteDialog(false);
                    setInviteUserId('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleInviteMember}
                  disabled={!inviteUserId.trim()}
                >
                  Invite Member
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Card>
  );
}
