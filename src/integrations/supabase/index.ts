export { supabase } from './client';
export type { Database } from './types';

// Helper types for convenience
import type { Database } from './types';

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

// Specific table types
export type Profile = Tables<'profiles'>;
export type Job = Tables<'jobs'>;
export type Application = Tables<'applications'>;
export type Message = Tables<'messages'>;
export type Review = Tables<'reviews'>;
export type Notification = Tables<'notifications'>;
export type Dispute = Tables<'disputes'>;
