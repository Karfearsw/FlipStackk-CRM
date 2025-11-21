import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Heart, ThumbsUp, Smile, Star, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';

interface MessageReaction {
  id: number;
  messageId: number;
  userId: number;
  emoji: string;
  createdAt: string;
}

export interface ReactionSummary {
  emoji: string;
  count: number;
  userIds: number[];
}

interface MessageReactionsProps {
  messageId: number;
  reactions: ReactionSummary[];
  onAddReaction: (emoji: string) => Promise<void>;
  onRemoveReaction: (emoji: string) => Promise<void>;
  className?: string;
}

const COMMON_REACTIONS = ['👍', '❤️', '😄', '🎉', '🔥', '👏'];

export function MessageReactions({ 
  messageId, 
  reactions, 
  onAddReaction, 
  onRemoveReaction,
  className 
}: MessageReactionsProps) {
  const { data: session } = useSession();
  const userId = session?.user?.id ? parseInt(session.user.id) : undefined;
  const [isAddingReaction, setIsAddingReaction] = useState(false);

  const handleReactionClick = async (emoji: string) => {
    if (!userId) return;
    
    const existingReaction = reactions.find(r => r.emoji === emoji && r.userIds.includes(userId));
    
    try {
      if (existingReaction) {
        await onRemoveReaction(emoji);
      } else {
        await onAddReaction(emoji);
      }
    } catch (error) {
      console.error('Failed to toggle reaction:', error);
    }
  };

  const handleCustomReaction = async (emoji: string) => {
    setIsAddingReaction(true);
    try {
      await onAddReaction(emoji);
    } catch (error) {
      console.error('Failed to add custom reaction:', error);
    } finally {
      setIsAddingReaction(false);
    }
  };

  const getReactionTooltip = (reaction: ReactionSummary) => {
    const userNames = reaction.userIds.map(id => `User ${id}`);
    const isUserReacted = userId && reaction.userIds.includes(userId);
    
    if (reaction.count === 1 && isUserReacted) {
      return `You reacted with ${reaction.emoji}`;
    } else if (reaction.count === 2 && isUserReacted) {
      const otherUser = userNames.find(name => name !== `User ${userId}`);
      return `You and ${otherUser} reacted with ${reaction.emoji}`;
    } else if (isUserReacted) {
      const othersCount = reaction.count - 1;
      return `You and ${othersCount} other${othersCount > 1 ? 's' : ''} reacted with ${reaction.emoji}`;
    } else {
      return `${userNames.join(', ')} reacted with ${reaction.emoji}`;
    }
  };

  return (
    <div className={cn('flex items-center gap-1 mt-1', className)}>
      {/* Existing reactions */}
      {reactions.map((reaction) => {
        const isUserReacted = userId && reaction.userIds.includes(userId);
        
        return (
          <Button
            key={reaction.emoji}
            variant={isUserReacted ? 'default' : 'outline'}
            size="sm"
            className={cn(
              'h-7 px-2 text-xs rounded-full transition-all',
              isUserReacted && 'bg-primary text-primary-foreground'
            )}
            onClick={() => handleReactionClick(reaction.emoji)}
            title={getReactionTooltip(reaction)}
          >
            <span className="mr-1">{reaction.emoji}</span>
            <span className="font-medium">{reaction.count}</span>
          </Button>
        );
      })}

      {/* Add reaction button */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            disabled={isAddingReaction}
            aria-label="Add reaction"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="start">
          <div className="flex gap-1">
            {COMMON_REACTIONS.map((emoji) => (
              <Button
                key={emoji}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-lg hover:bg-accent"
                onClick={() => handleCustomReaction(emoji)}
                disabled={isAddingReaction}
              >
                {emoji}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

interface MessageReactionPickerProps {
  onSelect: (emoji: string) => void;
  className?: string;
}

export function MessageReactionPicker({ onSelect, className }: MessageReactionPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleEmojiClick = (emoji: string) => {
    onSelect(emoji);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn('h-8 w-8 p-0', className)}
        >
          <Smile className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="end">
        <div className="grid grid-cols-6 gap-1">
          {COMMON_REACTIONS.map((emoji) => (
            <Button
              key={emoji}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-lg hover:bg-accent"
              onClick={() => handleEmojiClick(emoji)}
            >
              {emoji}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}