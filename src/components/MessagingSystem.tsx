import { useEffect, useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Send, Search, MessageCircle, ChevronLeft } from "lucide-react";
import { format } from "date-fns";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  is_read: boolean;
  created_at: string;
}

interface ChatPartner {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  last_message?: Message;
  unread_count: number;
}

interface MessagingSystemProps {
  currentUserId: string;
  selectedConversationId?: string;
  onConversationSelect?: (conversationId: string | undefined) => void;
}

export function MessagingSystem({
  currentUserId,
  selectedConversationId,
  onConversationSelect,
}: MessagingSystemProps) {
  const [chatPartners, setChatPartners] = useState<ChatPartner[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedPartner = chatPartners.find(p => p.id === selectedConversationId);

  // Load chat partners (people you've messaged)
  useEffect(() => {
    loadChatPartners();
    const cleanup = subscribeToMessages();
    return cleanup;
  }, [currentUserId]);

  // Load messages for selected partner
  useEffect(() => {
    if (selectedConversationId) {
      loadMessages(selectedConversationId);

      // If partner not in list yet (new chat from LiveBoard), add them
      const existingPartner = chatPartners.find(p => p.id === selectedConversationId);
      if (!existingPartner) {
        loadNewPartner(selectedConversationId);
      }
    }
  }, [selectedConversationId]);

  // Load a new partner profile (for starting new conversation)
  const loadNewPartner = async (partnerId: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('id', partnerId)
        .single();

      if (profile) {
        setChatPartners(prev => {
          // Check if already added
          if (prev.find(p => p.id === profile.id)) return prev;
          return [...prev, {
            id: profile.id,
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
            unread_count: 0,
          }];
        });
      }
    } catch (error) {
      console.error('Error loading partner:', error);
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadChatPartners = async () => {
    try {
      // Get all messages where user is sender or receiver
      const { data: allMessages, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Extract unique partner IDs
      const partnerIds = new Set<string>();
      (allMessages || []).forEach(msg => {
        const partnerId = msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id;
        partnerIds.add(partnerId);
      });

      // Get partner profiles and last messages
      const partners: ChatPartner[] = [];
      for (const partnerId of partnerIds) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .eq('id', partnerId)
          .single();

        if (profile) {
          // Get last message
          const lastMessage = (allMessages || []).find(msg =>
            msg.sender_id === partnerId || msg.receiver_id === partnerId
          );

          // Count unread
          const unreadCount = (allMessages || []).filter(msg =>
            msg.sender_id === partnerId &&
            msg.receiver_id === currentUserId &&
            !msg.is_read
          ).length;

          partners.push({
            id: profile.id,
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
            last_message: lastMessage,
            unread_count: unreadCount,
          });
        }
      }

      setChatPartners(partners);
    } catch (error: any) {
      toast({
        title: "Error loading conversations",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const loadMessages = async (partnerId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${currentUserId})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark as read
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('sender_id', partnerId)
        .eq('receiver_id', currentUserId)
        .eq('is_read', false);
    } catch (error: any) {
      toast({
        title: "Error loading messages",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        () => {
          loadChatPartners();
          if (selectedConversationId) {
            loadMessages(selectedConversationId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversationId) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('messages').insert({
        content: newMessage.trim(),
        sender_id: currentUserId,
        receiver_id: selectedConversationId,
      });

      if (error) throw error;

      setNewMessage("");
      await loadMessages(selectedConversationId);
      await loadChatPartners();
    } catch (error: any) {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredPartners = chatPartners.filter(p =>
    p.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100dvh-4rem)] lg:h-[calc(100vh-10rem)] flex flex-col lg:grid lg:grid-cols-[340px_1fr] gap-0 bg-background rounded-xl overflow-hidden border border-border/20">
      {/* Chat Partners List */}
      <div className={`${selectedConversationId ? 'hidden lg:flex' : 'flex'} flex-col h-full min-h-0 bg-card border-r border-border/20`}>
        <div className="p-5 border-b border-border/20">
          <h2 className="text-2xl font-bold text-foreground mb-4">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 bg-muted/50 border-0 rounded-full"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {filteredPartners.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <MessageCircle className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground text-center">No conversations yet</p>
            </div>
          ) : (
            filteredPartners.map((partner) => (
              <div
                key={partner.id}
                onClick={() => onConversationSelect?.(partner.id)}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all ${selectedConversationId === partner.id
                  ? 'bg-primary/10 border-l-2 border-primary'
                  : 'hover:bg-muted/50 border-l-2 border-transparent'
                  }`}
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage src={partner.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/20">
                    {partner.full_name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold truncate">{partner.full_name || 'Unknown'}</p>
                    {partner.last_message && (
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(partner.last_message.created_at), 'h:mm a')}
                      </span>
                    )}
                  </div>
                  {partner.last_message && (
                    <p className="text-sm text-muted-foreground truncate">
                      {partner.last_message.content}
                    </p>
                  )}
                </div>
                {partner.unread_count > 0 && (
                  <div className="h-5 min-w-[20px] px-1.5 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-primary-foreground">{partner.unread_count}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Messages View */}
      <div className={`${selectedConversationId ? 'flex lg:flex' : 'hidden lg:flex'} flex-col h-full min-h-0 bg-background`}>
        {selectedPartner ? (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-card border-b border-border/20">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => onConversationSelect?.(undefined)}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Avatar className="h-11 w-11">
                <AvatarImage src={selectedPartner.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/20">
                  {selectedPartner.full_name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{selectedPartner.full_name || 'Unknown'}</h3>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {messages.map((message) => {
                const isSender = message.sender_id === currentUserId;
                return (
                  <div
                    key={message.id}
                    className={`flex mb-3 ${isSender ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${isSender
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card border border-border/20'
                        }`}
                    >
                      <p className="text-[15px] whitespace-pre-wrap">{message.content}</p>
                      <span className={`text-[11px] ${isSender ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                        {format(new Date(message.created_at), 'h:mm a')}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border/20">
              <div className="flex items-center gap-3">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className="h-11 rounded-full"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || loading}
                  size="icon"
                  className="h-10 w-10 rounded-full"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
              <p className="font-semibold">PeerHire Messages</p>
              <p className="text-sm text-muted-foreground">Select a chat to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
