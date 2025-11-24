import { formatDistanceToNow } from 'date-fns';

interface MessageBubbleProps {
  message: {
    id: string;
    content: string;
    sender_id: string;
    created_at: string;
    is_read: boolean;
  };
  isSender: boolean;
}

export const MessageBubble = ({ message, isSender }: MessageBubbleProps) => {
  return (
    <div className={`flex ${isSender ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-md ${
          isSender
            ? 'bg-gradient-to-br from-white to-primary/10 text-foreground rounded-br-sm border border-primary/10'
            : 'bg-gradient-to-br from-white to-muted/30 text-foreground rounded-bl-sm border border-border/50'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
        <div className="flex items-center justify-end gap-2 mt-1.5">
          <span className="text-xs text-gray-500">
            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
          </span>
        </div>
      </div>
    </div>
  );
};
