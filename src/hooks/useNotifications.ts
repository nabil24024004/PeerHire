import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type Notification = Tables<'notifications'>;
type NotificationPreferences = Tables<'notification_preferences'>;

export function useNotifications(userId: string | undefined) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        fetchNotifications();
        fetchPreferences();

        // Subscribe to real-time notifications
        const notificationsChannel = supabase
            .channel('notifications-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`,
                },
                () => {
                    fetchNotifications();
                }
            )
            .subscribe();

        return () => {
            notificationsChannel.unsubscribe();
        };
    }, [userId]);

    const fetchNotifications = async () => {
        if (!userId) return;

        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;

            setNotifications(data || []);
            setUnreadCount(data?.filter(n => !n.read).length || 0);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPreferences = async () => {
        if (!userId) return;

        try {
            const { data, error } = await supabase
                .from('notification_preferences')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error) {
                // If no preferences exist, create default ones
                if (error.code === 'PGRST116') {
                    const { data: newPrefs, error: insertError } = await supabase
                        .from('notification_preferences')
                        .insert({ user_id: userId })
                        .select()
                        .single();

                    if (insertError) throw insertError;
                    setPreferences(newPrefs);
                } else {
                    throw error;
                }
            } else {
                setPreferences(data);
            }
        } catch (error) {
            console.error('Error fetching notification preferences:', error);
        }
    };

    const markAsRead = async (notificationId: string) => {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ read: true })
                .eq('id', notificationId);

            if (error) throw error;

            // Update local state
            setNotifications(prev =>
                prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        if (!userId) return;

        try {
            const { error } = await supabase
                .from('notifications')
                .update({ read: true })
                .eq('user_id', userId)
                .eq('read', false);

            if (error) throw error;

            // Update local state
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    const updatePreferences = async (updates: Partial<NotificationPreferences>) => {
        if (!userId) return;

        try {
            const { data, error } = await supabase
                .from('notification_preferences')
                .update(updates)
                .eq('user_id', userId)
                .select()
                .single();

            if (error) throw error;
            setPreferences(data);
        } catch (error) {
            console.error('Error updating notification preferences:', error);
        }
    };

    const createNotification = async (
        notification: Omit<Notification, 'id' | 'created_at' | 'user_id'>
    ) => {
        if (!userId) return;

        try {
            const { error } = await supabase
                .from('notifications')
                .insert({ ...notification, user_id: userId });

            if (error) throw error;
        } catch (error) {
            console.error('Error creating notification:', error);
        }
    };

    return {
        notifications,
        unreadCount,
        preferences,
        loading,
        markAsRead,
        markAllAsRead,
        updatePreferences,
        createNotification,
        refetch: fetchNotifications,
    };
}
