-- Migration 001: Add Weekly Tracking System
-- Run this migration to add weekly goals and stats tracking

-- Weekly goals and tracking
CREATE TABLE IF NOT EXISTS public.weekly_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL, -- Always Sunday at 00:00:00
    points_goal INTEGER DEFAULT 100,
    focus_time_goal INTEGER DEFAULT 0, -- in minutes
    tasks_goal INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, week_start_date)
);

-- Weekly stats tracking (aggregated data for performance)
CREATE TABLE IF NOT EXISTS public.weekly_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL, -- Always Sunday at 00:00:00
    total_focus_time INTEGER DEFAULT 0, -- in seconds
    total_tasks_completed INTEGER DEFAULT 0,
    total_points_earned INTEGER DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    average_session_duration INTEGER DEFAULT 0, -- in seconds
    streak_maintained BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, week_start_date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_weekly_goals_user_week ON public.weekly_goals(user_id, week_start_date);
CREATE INDEX IF NOT EXISTS idx_weekly_stats_user_week ON public.weekly_stats(user_id, week_start_date);

-- Enable Row Level Security
ALTER TABLE public.weekly_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for weekly_goals
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'weekly_goals' AND policyname = 'Users can view own weekly goals') THEN
        CREATE POLICY "Users can view own weekly goals" ON public.weekly_goals
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'weekly_goals' AND policyname = 'Users can create own weekly goals') THEN
        CREATE POLICY "Users can create own weekly goals" ON public.weekly_goals
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'weekly_goals' AND policyname = 'Users can update own weekly goals') THEN
        CREATE POLICY "Users can update own weekly goals" ON public.weekly_goals
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

-- RLS Policies for weekly_stats
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'weekly_stats' AND policyname = 'Users can view own weekly stats') THEN
        CREATE POLICY "Users can view own weekly stats" ON public.weekly_stats
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'weekly_stats' AND policyname = 'Users can create own weekly stats') THEN
        CREATE POLICY "Users can create own weekly stats" ON public.weekly_stats
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'weekly_stats' AND policyname = 'Users can update own weekly stats') THEN
        CREATE POLICY "Users can update own weekly stats" ON public.weekly_stats
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_weekly_goals_updated_at ON public.weekly_goals;
CREATE TRIGGER update_weekly_goals_updated_at BEFORE UPDATE ON public.weekly_goals
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_weekly_stats_updated_at ON public.weekly_stats;
CREATE TRIGGER update_weekly_stats_updated_at BEFORE UPDATE ON public.weekly_stats
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to get the start of the current week (Sunday at 00:00:00)
CREATE OR REPLACE FUNCTION public.get_week_start_date(input_date TIMESTAMP WITH TIME ZONE DEFAULT NOW())
RETURNS DATE AS $$
BEGIN
    -- Get Sunday of the current week at 00:00:00
    RETURN (input_date::date - EXTRACT(DOW FROM input_date)::INTEGER)::date;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to ensure weekly stats record exists for current week
CREATE OR REPLACE FUNCTION public.ensure_weekly_stats_exists(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
    week_start DATE := public.get_week_start_date();
    stats_id UUID;
BEGIN
    -- Try to get existing record
    SELECT id INTO stats_id 
    FROM public.weekly_stats 
    WHERE user_id = p_user_id AND week_start_date = week_start;
    
    -- If doesn't exist, create it
    IF stats_id IS NULL THEN
        INSERT INTO public.weekly_stats (user_id, week_start_date)
        VALUES (p_user_id, week_start)
        RETURNING id INTO stats_id;
    END IF;
    
    RETURN stats_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update weekly stats when a session is completed
CREATE OR REPLACE FUNCTION public.update_weekly_stats_on_session()
RETURNS TRIGGER AS $$
DECLARE
    stats_id UUID;
    total_sessions INTEGER;
    avg_duration INTEGER;
BEGIN
    -- Only process completed sessions
    IF NEW.completed = true THEN
        -- Ensure weekly stats record exists
        stats_id := public.ensure_weekly_stats_exists(NEW.user_id);
        
        -- Update the weekly stats
        WITH session_totals AS (
            SELECT 
                COUNT(*) as session_count,
                COALESCE(AVG(duration), 0)::INTEGER as avg_duration
            FROM public.sessions 
            WHERE user_id = NEW.user_id 
                AND completed = true
                AND start_time >= (public.get_week_start_date()::timestamp)
                AND start_time < (public.get_week_start_date()::timestamp + interval '7 days')
        )
        UPDATE public.weekly_stats 
        SET 
            total_focus_time = COALESCE((
                SELECT SUM(duration) 
                FROM public.sessions 
                WHERE user_id = NEW.user_id 
                    AND session_type = 'focus'
                    AND completed = true
                    AND start_time >= (public.get_week_start_date()::timestamp)
                    AND start_time < (public.get_week_start_date()::timestamp + interval '7 days')
            ), 0),
            total_sessions = (SELECT session_count FROM session_totals),
            average_session_duration = (SELECT avg_duration FROM session_totals),
            total_points_earned = COALESCE((
                SELECT SUM(points_earned) 
                FROM public.sessions 
                WHERE user_id = NEW.user_id 
                    AND completed = true
                    AND start_time >= (public.get_week_start_date()::timestamp)
                    AND start_time < (public.get_week_start_date()::timestamp + interval '7 days')
            ), 0),
            updated_at = NOW()
        WHERE id = stats_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update weekly stats when a task is completed
CREATE OR REPLACE FUNCTION public.update_weekly_stats_on_task()
RETURNS TRIGGER AS $$
DECLARE
    stats_id UUID;
BEGIN
    -- Only process when task status changes to completed
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        -- Ensure weekly stats record exists
        stats_id := public.ensure_weekly_stats_exists(NEW.user_id);
        
        -- Update the weekly stats
        UPDATE public.weekly_stats 
        SET 
            total_tasks_completed = COALESCE((
                SELECT COUNT(*) 
                FROM public.tasks 
                WHERE user_id = NEW.user_id 
                    AND status = 'completed'
                    AND completed_at >= (public.get_week_start_date()::timestamp)
                    AND completed_at < (public.get_week_start_date()::timestamp + interval '7 days')
            ), 0),
            total_points_earned = total_points_earned + NEW.points,
            updated_at = NOW()
        WHERE id = stats_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update weekly stats
DROP TRIGGER IF EXISTS update_weekly_stats_on_session_completion ON public.sessions;
CREATE TRIGGER update_weekly_stats_on_session_completion 
    AFTER INSERT OR UPDATE ON public.sessions
    FOR EACH ROW EXECUTE FUNCTION public.update_weekly_stats_on_session();

DROP TRIGGER IF EXISTS update_weekly_stats_on_task_completion ON public.tasks;
CREATE TRIGGER update_weekly_stats_on_task_completion 
    AFTER UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.update_weekly_stats_on_task();