import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ConversationItem } from '@/components/ConversationItem';
import { MessageBubble } from '@/components/MessageBubble';
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages';
import { Send, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

export default function MessagesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to real-time updates for the selected conversation
  const { isSubscribed } = useRealtimeMessages(selectedConversationId);

  // Fetch conversations
  const { data: conversations, isLoading: conversationsLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const { data: convos, error } = await supabase
        .from('conversations')
        .select(`
          id,
          project_id,
          client_id,
          freelancer_id,
          last_message_at,
          user_projects (
            title
          )
        `)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (error) throw error;

      // Fetch user profiles and last messages for each conversation
      const enrichedConvos = await Promise.all(
        (convos || []).map(async (convo) => {
          const otherUserId = convo.client_id === user?.id ? convo.freelancer_id : convo.client_id;
          
          // Fetch other user's profile
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('first_name, last_name, profile_picture_url')
            .eq('user_id', otherUserId)
            .single();

          // Fetch last message
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('content')
            .eq('conversation_id', convo.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Count unread messages
          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', convo.id)
            .eq('is_read', false)
            .neq('sender_id', user?.id || '');

          return {
            id: convo.id,
            project_title: convo.user_projects?.title || 'Unknown Project',
            other_user_name: profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown User',
            other_user_avatar: profile?.profile_picture_url,
            last_message: lastMessage?.content,
            last_message_at: convo.last_message_at,
            unread_count: unreadCount || 0,
          };
        })
      );

      return enrichedConvos;
    },
  });

  // Fetch messages for selected conversation
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', selectedConversationId],
    queryFn: async () => {
      if (!selectedConversationId) return [];

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', selectedConversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!selectedConversationId,
  });

  // Mark messages as read when conversation is opened
  useEffect(() => {
    if (selectedConversationId && messages && user) {
      const unreadMessages = messages.filter(
        (msg) => !msg.is_read && msg.sender_id !== user.id
      );

      if (unreadMessages.length > 0) {
        unreadMessages.forEach(async (msg) => {
          await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('id', msg.id);
        });
        
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      }
    }
  }, [selectedConversationId, messages, user, queryClient]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!selectedConversationId || !user) throw new Error('No conversation selected');

      const { error } = await supabase.from('messages').insert({
        conversation_id: selectedConversationId,
        sender_id: user.id,
        content: content.trim(),
      });

      if (error) throw error;

      // Update last_message_at for the conversation
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', selectedConversationId);
    },
    onSuccess: () => {
      setMessageInput('');
      queryClient.invalidateQueries({ queryKey: ['messages', selectedConversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error) => {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageInput.trim() && !sendMessageMutation.isPending) {
      sendMessageMutation.mutate(messageInput);
    }
  };

  const selectedConversation = conversations?.find(c => c.id === selectedConversationId);

  return (
    <main className="flex-1 flex h-screen overflow-hidden">
      {/* Left Column - Conversations List */}
      <div className="w-80 border-r border-border flex flex-col bg-background">
        <div className="p-4 border-b border-border">
          <h1 className="text-2xl font-bold text-foreground">Messages</h1>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {conversationsLoading ? (
            <div className="p-4 text-center text-muted-foreground">Loading conversations...</div>
          ) : conversations && conversations.length > 0 ? (
            conversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isActive={selectedConversationId === conversation.id}
                onClick={() => setSelectedConversationId(conversation.id)}
              />
            ))
          ) : (
            <div className="p-8 text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-2">No conversations yet</p>
              <p className="text-sm text-muted-foreground">
                Start by bidding on a project or posting your own
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Middle Column - Active Chat */}
      <div className="flex-1 flex flex-col bg-background">
        {selectedConversationId && selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border bg-muted/50">
              <h2 className="font-semibold text-foreground">{selectedConversation.other_user_name}</h2>
              <p className="text-sm text-muted-foreground">{selectedConversation.project_title}</p>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4">
              {messagesLoading ? (
                <div className="text-center text-muted-foreground">Loading messages...</div>
              ) : messages && messages.length > 0 ? (
                <>
                  {messages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      isSender={message.sender_id === user?.id}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No messages yet. Start the conversation!
                </div>
              )}
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-border bg-background">
              <div className="flex gap-2">
                <Input
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1"
                  disabled={sendMessageMutation.isPending}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!messageInput.trim() || sendMessageMutation.isPending}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-muted/20">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Select a conversation</h3>
              <p className="text-muted-foreground">Choose a conversation from the list to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* Right Column - Project Details */}
      {selectedConversationId && selectedConversation && (
        <div className="w-80 border-l border-border p-4 bg-muted/50">
          <Card className="p-4">
            <h3 className="font-semibold text-foreground mb-2">Project Details</h3>
            <p className="text-sm text-muted-foreground mb-4">{selectedConversation.project_title}</p>
            
            <div className="space-y-2">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Participant</p>
                <p className="text-sm font-medium text-foreground">{selectedConversation.other_user_name}</p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </main>
  );
}
