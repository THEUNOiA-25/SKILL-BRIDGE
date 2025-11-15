import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

interface ConversationItemProps {
  conversation: {
    id: string;
    project_title: string;
    other_user_name: string;
    other_user_avatar?: string;
    last_message?: string;
    last_message_at?: string;
    unread_count?: number;
  };
  isActive: boolean;
  onClick: () => void;
}

export const ConversationItem = ({ conversation, isActive, onClick }: ConversationItemProps) => {
  const initials = conversation.other_user_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <button
      onClick={onClick}
      className={`w-full p-4 flex items-start gap-3 hover:bg-muted/50 transition-colors border-b border-border text-left ${
        isActive ? 'bg-muted' : ''
      }`}
    >
      <Avatar className="h-12 w-12">
        <AvatarImage src={conversation.other_user_avatar} />
        <AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-foreground truncate">
            {conversation.other_user_name}
          </h3>
          {conversation.last_message_at && (
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true })}
            </span>
          )}
        </div>
        
        <p className="text-sm text-muted-foreground mb-1 truncate">
          {conversation.project_title}
        </p>
        
        <div className="flex items-center justify-between gap-2">
          {conversation.last_message && (
            <p className="text-sm text-muted-foreground truncate flex-1">
              {conversation.last_message}
            </p>
          )}
          {conversation.unread_count && conversation.unread_count > 0 && (
            <Badge variant="default" className="ml-auto">
              {conversation.unread_count}
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
};
