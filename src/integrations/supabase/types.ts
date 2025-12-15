export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
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
                Relationships: [
                    {
                        foreignKeyName: "profiles_id_fkey"
                        columns: ["id"]
                        isOneToOne: true
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            jobs: {
                Row: {
                    id: string
                    hirer_id: string
                    title: string
                    description: string
                    category: string
                    budget: number
                    deadline: string | null
                    status: 'open' | 'in_progress' | 'completed' | 'cancelled'
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
                    category: string
                    budget: number
                    deadline?: string | null
                    status?: 'open' | 'in_progress' | 'completed' | 'cancelled'
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
                    category?: string
                    budget?: number
                    deadline?: string | null
                    status?: 'open' | 'in_progress' | 'completed' | 'cancelled'
                    required_skills?: string[] | null
                    attachment_urls?: string[] | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "jobs_hirer_id_fkey"
                        columns: ["hirer_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            applications: {
                Row: {
                    id: string
                    job_id: string
                    freelancer_id: string
                    cover_letter: string
                    proposed_rate: number
                    estimated_duration: string | null
                    status: 'pending' | 'accepted' | 'rejected'
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    job_id: string
                    freelancer_id: string
                    cover_letter: string
                    proposed_rate: number
                    estimated_duration?: string | null
                    status?: 'pending' | 'accepted' | 'rejected'
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    job_id?: string
                    freelancer_id?: string
                    cover_letter?: string
                    proposed_rate?: number
                    estimated_duration?: string | null
                    status?: 'pending' | 'accepted' | 'rejected'
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "applications_job_id_fkey"
                        columns: ["job_id"]
                        isOneToOne: false
                        referencedRelation: "jobs"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "applications_freelancer_id_fkey"
                        columns: ["freelancer_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
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
            }
            disputes: {
                Row: {
                    id: string
                    job_id: string
                    raised_by: string
                    against: string
                    reason: string
                    status: 'open' | 'resolved' | 'closed'
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
                    status?: 'open' | 'resolved' | 'closed'
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
                    status?: 'open' | 'resolved' | 'closed'
                    resolution?: string | null
                    created_at?: string
                    updated_at?: string
                }
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
    }
}
