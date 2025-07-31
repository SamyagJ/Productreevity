import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Type definitions for our database tables
export interface Profile {
  id: string
  username: string
  email: string
  total_points: number
  current_streak: number
  longest_streak: number
  last_active_date: string | null
  created_at: string
  updated_at: string
}

export interface Session {
  id: string
  user_id: string
  start_time: string
  end_time: string | null
  duration: number | null
  session_type: 'focus' | 'break' | 'longbreak'
  completed: boolean
  points_earned: number
  created_at: string
}

export interface Task {
  id: string
  user_id: string
  title: string
  description: string | null
  priority: number
  status: 'pending' | 'in_progress' | 'completed'
  points: number
  due_date: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface Tree {
  id: string
  user_id: string
  growth_level: number
  total_apples: number
  bronze_apples: number
  silver_apples: number
  gold_apples: number
  diamond_apples: number
  last_watered: string
  created_at: string
  updated_at: string
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon_url: string
  points_required: number | null
  special_condition: string | null
  created_at: string
}

export interface UserAchievement {
  user_id: string
  achievement_id: string
  unlocked_at: string
}