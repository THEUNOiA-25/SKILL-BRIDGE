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
        className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-sm ${
          isSender
            ? 'bg-gradient-to-br from-yellow-100 to-amber-100 text-gray-800 rounded-br-sm'
            : 'bg-gradient-to-br from-green-50 to-emerald-50 text-gray-800 rounded-bl-sm border border-green-100'
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
