import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type SavedJob = Tables<'saved_jobs'>;
type Job = Tables<'jobs'>;

interface SavedJobWithDetails extends SavedJob {
    jobs?: Job;
}

export function useSavedJobs(userId: string | undefined) {
    const [savedJobs, setSavedJobs] = useState<SavedJobWithDetails[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        fetchSavedJobs();

        // Subscribe to real-time saved jobs updates
        const savedJobsChannel = supabase
            .channel('saved-jobs-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'saved_jobs',
                    filter: `freelancer_id=eq.${userId}`,
                },
                () => {
                    fetchSavedJobs();
                }
            )
            .subscribe();

        return () => {
            savedJobsChannel.unsubscribe();
        };
    }, [userId]);

    const fetchSavedJobs = async () => {
        if (!userId) return;

        try {
            const { data, error } = await supabase
                .from('saved_jobs')
                .select('*, jobs(*)')
                .eq('freelancer_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setSavedJobs(data || []);
        } catch (error) {
            console.error('Error fetching saved jobs:', error);
        } finally {
            setLoading(false);
        }
    };

    const saveJob = async (jobId: string) => {
        if (!userId) return { success: false, error: 'User not authenticated' };

        try {
            const { error } = await supabase
                .from('saved_jobs')
                .insert({ freelancer_id: userId, job_id: jobId });

            if (error) throw error;
            return { success: true, error: null };
        } catch (error: any) {
            console.error('Error saving job:', error);
            return { success: false, error: error.message };
        }
    };

    const unsaveJob = async (jobId: string) => {
        if (!userId) return { success: false, error: 'User not authenticated' };

        try {
            const { error } = await supabase
                .from('saved_jobs')
                .delete()
                .eq('freelancer_id', userId)
                .eq('job_id', jobId);

            if (error) throw error;
            return { success: true, error: null };
        } catch (error: any) {
            console.error('Error unsaving job:', error);
            return { success: false, error: error.message };
        }
    };

    const isJobSaved = (jobId: string) => {
        return savedJobs.some(sj => sj.job_id === jobId);
    };

    return {
        savedJobs,
        loading,
        saveJob,
        unsaveJob,
        isJobSaved,
        refetch: fetchSavedJobs,
    };
}
