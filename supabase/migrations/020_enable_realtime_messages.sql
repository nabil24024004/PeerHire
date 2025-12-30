-- Enable Realtime for messages table
-- This allows real-time subscriptions to work

ALTER publication supabase_realtime ADD TABLE messages;

-- Ensure notifications table is also enabled for realtime
ALTER publication supabase_realtime ADD TABLE notifications;
