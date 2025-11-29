import { useEffect, useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Send, Paperclip, Search, Download, FileText, Image as ImageIcon, MessageCircle, ChevronLeft, X } from "lucide-react";
import { format } from "date-fns";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  conversation_id: string;
  created_at: string;
  read: boolean;
  attachment_url?: string;
}

interface Conversation {
  id: string;
  hirer_id: string;
  freelancer_id: string;
  job_id?: string;
  created_at: string;
  updated_at: string;
}

interface ConversationWithProfile extends Conversation {
  profile?: {
    full_name: string;
    avatar_url?: string;
    department: string;
  };
  last_message?: Message;
  unread_count: number;
}

interface MessagingSystemProps {
  currentUserId: string;
  selectedConversationId?: string;
  onConversationSelect?: (conversationId: string) => void;
}

export function MessagingSystem({
  currentUserId,
  selectedConversationId,
  onConversationSelect,
}: MessagingSystemProps) {
  const [conversations, setConversations] = useState<ConversationWithProfile[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);

  // Load conversations
  useEffect(() => {
    loadConversations();
    const cleanup = subscribeToConversations();
    return cleanup;
  }, [currentUserId]);

  // Load messages for selected conversation
  useEffect(() => {
    if (selectedConversationId) {
      loadMessages(selectedConversationId);
      const cleanup = subscribeToMessages(selectedConversationId);
      return cleanup;
    }
  }, [selectedConversationId]);

  const loadConversations = async () => {
    try {
      const { data: convos, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`hirer_id.eq.${currentUserId},freelancer_id.eq.${currentUserId}`)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Load profile info and last message for each conversation
      const convosWithData = await Promise.all(
        (convos || []).map(async (convo) => {
          const otherUserId = convo.hirer_id === currentUserId ? convo.freelancer_id : convo.hirer_id;
          
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url, department')
            .eq('id', otherUserId)
            .single();

          const { data: lastMsg } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', convo.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', convo.id)
            .eq('receiver_id', currentUserId)
            .eq('read', false);

          return {
            ...convo,
            profile: profile || { full_name: 'Unknown', department: '' },
            last_message: lastMsg,
            unread_count: unreadCount || 0,
          };
        })
      );

      setConversations(convosWithData);
    } catch (error: any) {
      toast({
        title: "Error loading conversations",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);

      // Mark messages as read
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('conversation_id', conversationId)
        .eq('receiver_id', currentUserId)
        .eq('read', false);
    } catch (error: any) {
      toast({
        title: "Error loading messages",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const subscribeToConversations = () => {
    const channel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        () => {
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const subscribeToMessages = (conversationId: string) => {
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
          // Reload conversations to update unread count and last message
          loadConversations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          // Reload conversations when messages are marked as read
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Only images (JPEG, PNG, GIF, WebP) and PDFs are allowed",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "File size must be less than 10MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUserId}/${selectedConversationId}/${Date.now()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from('message-attachments')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('message-attachments')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const sendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || !selectedConversationId) return;

    setLoading(true);
    setUploading(true);
    try {
      const receiverId = selectedConversation?.hirer_id === currentUserId 
        ? selectedConversation?.freelancer_id 
        : selectedConversation?.hirer_id;

      let attachmentUrl = null;
      if (selectedFile) {
        attachmentUrl = await uploadFile(selectedFile);
        if (!attachmentUrl) {
          setLoading(false);
          setUploading(false);
          return;
        }
      }

      const { error } = await supabase.from('messages').insert({
        content: newMessage.trim() || (selectedFile ? `Sent ${selectedFile.type.startsWith('image/') ? 'an image' : 'a file'}` : ''),
        sender_id: currentUserId,
        receiver_id: receiverId,
        conversation_id: selectedConversationId,
        attachment_url: attachmentUrl,
      });

      if (error) throw error;

      setNewMessage("");
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const downloadAttachment = async (url: string, fileName: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error: any) {
      toast({
        title: "Download failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredConversations = conversations.filter(convo =>
    convo.profile?.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="h-[100dvh] lg:h-[calc(100vh-8rem)] flex flex-col lg:grid lg:grid-cols-3 gap-0 lg:gap-6">
      {/* Conversations List */}
      <div className={`${selectedConversationId ? 'hidden lg:flex' : 'flex'} flex-col h-full bg-background lg:bg-card lg:rounded-lg lg:border`}>
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Messages</h2>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 rounded-full bg-muted/50 border-0"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <MessageCircle className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground text-center">No conversations yet</p>
            </div>
          ) : (
            filteredConversations.map((conversation) => {
              const hasUnread = (conversation.unread_count || 0) > 0;

              return (
                <div
                  key={conversation.id}
                  onClick={() => onConversationSelect?.(conversation.id)}
                  className={`flex items-center gap-3 p-4 cursor-pointer transition-colors active:bg-muted/80 ${
                    selectedConversationId === conversation.id
                      ? 'bg-primary/5'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={conversation.profile?.avatar_url || undefined} />
                      <AvatarFallback className="text-lg font-semibold">
                        {conversation.profile?.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    {hasUnread && (
                      <div className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-primary rounded-full border-2 border-background" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2 mb-0.5">
                      <p className={`font-semibold truncate ${hasUnread ? 'text-foreground' : 'text-foreground/90'}`}>
                        {conversation.profile?.full_name || 'Unknown User'}
                      </p>
                      {conversation.last_message && (
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {format(new Date(conversation.last_message.created_at), 'h:mm a')}
                        </span>
                      )}
                    </div>
                    {conversation.last_message && (
                      <p className={`text-sm truncate ${hasUnread ? 'font-medium text-foreground/80' : 'text-muted-foreground'}`}>
                        {conversation.last_message.content}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Messages View */}
      <div className={`${selectedConversationId ? 'flex lg:flex' : 'hidden lg:flex'} lg:col-span-2 flex-col h-full bg-background lg:bg-card lg:rounded-lg lg:border`}>
        {selectedConversation ? (
          <>
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center gap-3 p-4 border-b bg-background/50 backdrop-blur-sm">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-9 w-9 rounded-full"
                onClick={() => onConversationSelect?.(undefined)}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedConversation?.profile?.avatar_url || undefined} />
                <AvatarFallback className="text-base font-semibold">
                  {selectedConversation?.profile?.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">
                  {selectedConversation?.profile?.full_name || 'Unknown User'}
                </h3>
                {selectedConversation?.profile?.department && (
                  <p className="text-xs text-muted-foreground truncate">
                    {selectedConversation.profile.department}
                  </p>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {messages.map((message) => {
                const isSender = message.sender_id === currentUserId;
                return (
                  <div
                    key={message.id}
                    className={`flex items-end gap-2 ${isSender ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <div className={`flex flex-col ${isSender ? 'items-end' : 'items-start'} max-w-[75%]`}>
                      <div
                        className={`rounded-2xl px-4 py-2.5 ${
                          isSender
                            ? 'bg-primary text-primary-foreground rounded-br-md'
                            : 'bg-muted rounded-bl-md'
                        }`}
                      >
                        {message.attachment_url && (
                          <div className="mb-2">
                            {message.attachment_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                              <div className="relative group">
                                <img
                                  src={message.attachment_url}
                                  alt="attachment"
                                  className="rounded-xl max-w-full h-auto max-h-64 object-cover"
                                />
                                <button
                                  onClick={() => downloadAttachment(message.attachment_url!, 'image')}
                                  className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-black/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Download className="h-4 w-4 text-white" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => downloadAttachment(message.attachment_url!, 'document')}
                                className="flex items-center gap-2 p-3 bg-background/10 rounded-xl hover:bg-background/20 transition-colors min-w-[200px]"
                              >
                                <FileText className="h-5 w-5" />
                                <span className="text-sm flex-1 truncate">Document.pdf</span>
                                <Download className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        )}
                        {message.content && (
                          <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground mt-1 px-3">
                        {format(new Date(message.created_at), 'h:mm a')}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area - Fixed at bottom */}
            <div className="border-t bg-background/50 backdrop-blur-sm p-3 lg:p-4">
              {selectedFile && (
                <div className="mb-3 p-3 bg-muted rounded-2xl flex items-center gap-3">
                  <div className="flex-shrink-0 p-2 bg-primary/10 rounded-xl">
                    {selectedFile.type.startsWith('image/') ? (
                      <ImageIcon className="h-5 w-5 text-primary" />
                    ) : (
                      <FileText className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <span className="text-sm flex-1 truncate font-medium">{selectedFile.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => setSelectedFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex-shrink-0 h-10 w-10 rounded-full hover:bg-primary/10"
                >
                  <Paperclip className="h-5 w-5" />
                </Button>
                <div className="flex-1 relative">
                  <Input
                    placeholder="Message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    disabled={uploading}
                    className="h-10 rounded-full bg-muted/50 border-0 pr-12"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={(!newMessage.trim() && !selectedFile) || uploading}
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
                  >
                    {uploading ? (
                      <div className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center space-y-3">
              <MessageCircle className="h-20 w-20 mx-auto text-muted-foreground/30" />
              <p className="text-muted-foreground">Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
