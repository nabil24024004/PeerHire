import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type Payment = Tables<'payments'>;

export function usePayments(userId: string | undefined) {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        fetchPayments();

        // Subscribe to real-time payment updates
        const paymentsChannel = supabase
            .channel('payments-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'payments',
                },
                (payload) => {
                    // Only update if this payment involves the current user
                    const payment = payload.new as Payment;
                    if (payment.payer_id === userId || payment.payee_id === userId) {
                        fetchPayments();
                    }
                }
            )
            .subscribe();

        return () => {
            paymentsChannel.unsubscribe();
        };
    }, [userId]);

    const fetchPayments = async () => {
        if (!userId) return;

        try {
            const { data, error } = await supabase
                .from('payments')
                .select('*, jobs(title)')
                .or(`payer_id.eq.${userId},payee_id.eq.${userId}`)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPayments(data || []);
        } catch (error) {
            console.error('Error fetching payments:', error);
        } finally {
            setLoading(false);
        }
    };

    const createPayment = async (payment: {
        job_id: string;
        payer_id: string;
        payee_id: string;
        amount: number;
        payment_method?: string;
    }) => {
        try {
            const { data, error } = await supabase
                .from('payments')
                .insert(payment)
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error creating payment:', error);
            return { data: null, error };
        }
    };

    const updatePaymentStatus = async (paymentId: string, status: string) => {
        try {
            const { error } = await supabase
                .from('payments')
                .update({ status })
                .eq('id', paymentId);

            if (error) throw error;

            // Update local state
            setPayments(prev =>
                prev.map(p => (p.id === paymentId ? { ...p, status } : p))
            );
        } catch (error) {
            console.error('Error updating payment status:', error);
        }
    };

    return {
        payments,
        loading,
        createPayment,
        updatePaymentStatus,
        refetch: fetchPayments,
    };
}
