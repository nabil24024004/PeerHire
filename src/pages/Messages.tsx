import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { MessagingSystem } from "@/components/MessagingSystem";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const Messages = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading, role } = useAuth();
  const [selectedConversationId, setSelectedConversationId] = useState<string>();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    // Check if there's a conversation or chat ID in URL params
    const conversationId = searchParams.get('conversation');
    const chatId = searchParams.get('chat');
    if (conversationId) {
      setSelectedConversationId(conversationId);
    } else if (chatId) {
      // 'chat' param from LiveBoard - set as selected partner
      setSelectedConversationId(chatId);
    }
  }, [searchParams]);

  if (loading || !user || !role) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <DashboardLayout role={role}>
      <div className="h-[calc(100vh-4rem)] -mx-6 -my-6 lg:mx-0 lg:my-0 lg:space-y-6 lg:h-auto">
        <div className="hidden lg:block px-6 pt-6">
          <h1 className="text-3xl font-bold mb-2">Messages</h1>
          <p className="text-muted-foreground">Chat with your clients and freelancers</p>
        </div>

        <MessagingSystem
          currentUserId={user.id}
          selectedConversationId={selectedConversationId}
          onConversationSelect={setSelectedConversationId}
        />
      </div>
    </DashboardLayout>
  );
};

export default Messages;
