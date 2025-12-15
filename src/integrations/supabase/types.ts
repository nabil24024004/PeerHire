export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    email: string
                    full_name: string | null
                    student_id: string | null
                    avatar_url: string | null
                    bio: string | null
                    skills: string[] | null
                    is_hirer: boolean
                    is_freelancer: boolean
                    portfolio_url: string | null
                    hourly_rate: number | null
                    availability: string | null
                    handwriting_sample_url: string | null
                    total_earnings: number
                    total_spent: number
                    rating: number | null
                    total_reviews: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    email: string
                    full_name?: string | null
                    student_id?: string | null
                    avatar_url?: string | null
                    bio?: string | null
                    skills?: string[] | null
                    is_hirer?: boolean
                    is_freelancer?: boolean
                    portfolio_url?: string | null
                    hourly_rate?: number | null
                    availability?: string | null
                    handwriting_sample_url?: string | null
                    total_earnings?: number
                    total_spent?: number
                    rating?: number | null
                    total_reviews?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    full_name?: string | null
                    student_id?: string | null
                    avatar_url?: string | null
                    bio?: string | null
                    skills?: string[] | null
                    is_hirer?: boolean
                    is_freelancer?: boolean
                    portfolio_url?: string | null
                    hourly_rate?: number | null
                    availability?: string | null
                    handwriting_sample_url?: string | null
                    total_earnings?: number
                    total_spent?: number
                    rating?: number | null
                    total_reviews?: number
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            jobs: {
                Row: {
                    id: string
                    hirer_id: string
                    title: string
                    description: string
                    category: string | null
                    budget: number
                    deadline: string | null
                    status: string
                    required_skills: string[] | null
                    attachment_urls: string[] | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    hirer_id: string
                    title: string
                    description: string
                    category?: string | null
                    budget: number
                    deadline?: string | null
                    status?: string
                    required_skills?: string[] | null
                    attachment_urls?: string[] | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    hirer_id?: string
                    title?: string
                    description?: string
                    category?: string | null
                    budget?: number
                    deadline?: string | null
                    status?: string
                    required_skills?: string[] | null
                    attachment_urls?: string[] | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            applications: {
                Row: {
                    id: string
                    job_id: string
                    freelancer_id: string
                    cover_letter: string | null
                    proposed_rate: number | null
                    estimated_duration: string | null
                    status: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    job_id: string
                    freelancer_id: string
                    cover_letter?: string | null
                    proposed_rate?: number | null
                    estimated_duration?: string | null
                    status?: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    job_id?: string
                    freelancer_id?: string
                    cover_letter?: string | null
                    proposed_rate?: number | null
                    estimated_duration?: string | null
                    status?: string
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            reviews: {
                Row: {
                    id: string
                    job_id: string
                    reviewer_id: string
                    reviewee_id: string
                    rating: number
                    comment: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    job_id: string
                    reviewer_id: string
                    reviewee_id: string
                    rating: number
                    comment?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    job_id?: string
                    reviewer_id?: string
                    reviewee_id?: string
                    rating?: number
                    comment?: string | null
                    created_at?: string
                }
                Relationships: []
            }
            messages: {
                Row: {
                    id: string
                    sender_id: string
                    receiver_id: string
                    content: string
                    attachment_urls: string[] | null
                    is_read: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    sender_id: string
                    receiver_id: string
                    content: string
                    attachment_urls?: string[] | null
                    is_read?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    sender_id?: string
                    receiver_id?: string
                    content?: string
                    attachment_urls?: string[] | null
                    is_read?: boolean
                    created_at?: string
                }
                Relationships: []
            }
            notifications: {
                Row: {
                    id: string
                    user_id: string
                    title: string
                    message: string
                    type: string
                    is_read: boolean
                    action_url: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    title: string
                    message: string
                    type: string
                    is_read?: boolean
                    action_url?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    title?: string
                    message?: string
                    type?: string
                    is_read?: boolean
                    action_url?: string | null
                    created_at?: string
                }
                Relationships: []
            }
            disputes: {
                Row: {
                    id: string
                    job_id: string
                    raised_by: string
                    against: string
                    reason: string
                    status: string
                    resolution: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    job_id: string
                    raised_by: string
                    against: string
                    reason: string
                    status?: string
                    resolution?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    job_id?: string
                    raised_by?: string
                    against?: string
                    reason?: string
                    status?: string
                    resolution?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

// Helper types for convenience
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Specific table types
export type Profile = Tables<'profiles'>
export type Job = Tables<'jobs'>
export type Application = Tables<'applications'>
export type Message = Tables<'messages'>
export type Review = Tables<'reviews'>
export type Notification = Tables<'notifications'>
export type Dispute = Tables<'disputes'>
