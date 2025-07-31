-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    total_points INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_active_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Productivity sessions
CREATE TABLE public.sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration INTEGER, -- in seconds
    session_type VARCHAR(20) CHECK (session_type IN ('focus', 'break', 'longbreak')),
    completed BOOLEAN DEFAULT false,
    points_earned INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks
CREATE TABLE public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    points INTEGER DEFAULT 5, -- Default to medium priority points
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tree progression
CREATE TABLE public.trees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    growth_level INTEGER DEFAULT 1 CHECK (growth_level BETWEEN 1 AND 100),
    total_apples INTEGER DEFAULT 0,
    red_apples INTEGER DEFAULT 0,
    silver_apples INTEGER DEFAULT 0,
    gold_apples INTEGER DEFAULT 0,
    diamond_apples INTEGER DEFAULT 0,
    last_watered TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Achievements
CREATE TABLE public.achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon_url VARCHAR(255),
    points_required INTEGER,
    special_condition VARCHAR(100), -- 'streak_7', 'tasks_100', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User achievements (junction table)
CREATE TABLE public.user_achievements (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, achievement_id)
);

-- Weekly goals and tracking
CREATE TABLE public.weekly_goals (
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
CREATE TABLE public.weekly_stats (
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
CREATE INDEX idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX idx_sessions_created_at ON public.sessions(created_at);
CREATE INDEX idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX idx_weekly_goals_user_week ON public.weekly_goals(user_id, week_start_date);
CREATE INDEX idx_weekly_stats_user_week ON public.weekly_stats(user_id, week_start_date);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for sessions
CREATE POLICY "Users can view own sessions" ON public.sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions" ON public.sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON public.sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for tasks
CREATE POLICY "Users can view own tasks" ON public.tasks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tasks" ON public.tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" ON public.tasks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks" ON public.tasks
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for trees
CREATE POLICY "Users can view own tree" ON public.trees
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own tree" ON public.trees
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for user_achievements
CREATE POLICY "Users can view own achievements" ON public.user_achievements
    FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for weekly_goals
CREATE POLICY "Users can view own weekly goals" ON public.weekly_goals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own weekly goals" ON public.weekly_goals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weekly goals" ON public.weekly_goals
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for weekly_stats
CREATE POLICY "Users can view own weekly stats" ON public.weekly_stats
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own weekly stats" ON public.weekly_stats
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weekly stats" ON public.weekly_stats
    FOR UPDATE USING (auth.uid() = user_id);

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, username)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
    );
    
    -- Create initial tree for user
    INSERT INTO public.trees (user_id)
    VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to calculate task points based on priority
CREATE OR REPLACE FUNCTION public.calculate_task_points()
RETURNS TRIGGER AS $$
BEGIN
    -- Set points based on priority
    CASE NEW.priority
        WHEN 'low' THEN NEW.points := 1;
        WHEN 'medium' THEN NEW.points := 5;
        WHEN 'high' THEN NEW.points := 10;
        ELSE NEW.points := 5; -- Default to medium
    END CASE;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to calculate task points on insert/update
CREATE TRIGGER calculate_task_points_trigger BEFORE INSERT OR UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.calculate_task_points();

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trees_updated_at BEFORE UPDATE ON public.trees
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_weekly_goals_updated_at BEFORE UPDATE ON public.weekly_goals
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

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
CREATE TRIGGER update_weekly_stats_on_session_completion 
    AFTER INSERT OR UPDATE ON public.sessions
    FOR EACH ROW EXECUTE FUNCTION public.update_weekly_stats_on_session();

CREATE TRIGGER update_weekly_stats_on_task_completion 
    AFTER UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.update_weekly_stats_on_task();