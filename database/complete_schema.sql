-- Productreevity Database Schema
-- Complete database setup for the gamified productivity application
-- Built with Supabase (PostgreSQL)

-- =====================================================
-- EXTENSIONS
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Users profile table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_points INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_point_earned_date DATE,
    streak_popup_shown_date DATE,
    timezone VARCHAR(50) DEFAULT 'UTC'
);

-- Productivity sessions tracking
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration INTEGER, -- in seconds
    session_type VARCHAR(20) DEFAULT 'focus', -- 'focus', 'break', 'longbreak'
    completed BOOLEAN DEFAULT false,
    points_earned INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task management
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority INTEGER CHECK (priority IN (1, 5, 10)), -- low: 1, medium: 5, high: 10
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed'
    points INTEGER DEFAULT 5,
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tree progression and apple tracking
CREATE TABLE IF NOT EXISTS public.trees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    growth_level INTEGER DEFAULT 1,
    total_apples INTEGER DEFAULT 0,
    red_apples INTEGER DEFAULT 0,
    silver_apples INTEGER DEFAULT 0,
    gold_apples INTEGER DEFAULT 0,
    diamond_apples INTEGER DEFAULT 0,
    last_watered TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Achievement definitions
CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon_url VARCHAR(255),
    points_required INTEGER,
    special_condition VARCHAR(100), -- 'streak_7', 'tasks_100', etc.
    badge_color VARCHAR(20) DEFAULT 'bronze',
    category VARCHAR(50) DEFAULT 'general',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User achievements (junction table)
CREATE TABLE IF NOT EXISTS public.user_achievements (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, achievement_id)
);

-- Daily statistics
CREATE TABLE IF NOT EXISTS public.daily_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    points_earned INTEGER DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    focus_time INTEGER DEFAULT 0, -- in seconds
    sessions_completed INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Weekly statistics and goals
CREATE TABLE IF NOT EXISTS public.weekly_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,
    total_focus_time INTEGER DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    average_session_duration INTEGER DEFAULT 0,
    total_tasks_completed INTEGER DEFAULT 0,
    total_points_earned INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, week_start_date)
);

CREATE TABLE IF NOT EXISTS public.weekly_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,
    points_goal INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, week_start_date)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON public.sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_daily_stats_user_date ON public.daily_stats(user_id, date);
CREATE INDEX IF NOT EXISTS idx_weekly_stats_user_week ON public.weekly_stats(user_id, week_start_date);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to update user points
CREATE OR REPLACE FUNCTION public.update_user_points()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles
    SET total_points = total_points + NEW.points_earned,
        updated_at = NOW()
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update streak when points are earned
CREATE OR REPLACE FUNCTION public.update_user_streak_on_points()
RETURNS TRIGGER AS $$
DECLARE
    days_since_last_point INTEGER;
BEGIN
    -- Only process if points actually increased
    IF NEW.total_points > OLD.total_points THEN
        -- Calculate days since last point earned
        IF OLD.last_point_earned_date IS NOT NULL THEN
            days_since_last_point := CURRENT_DATE - OLD.last_point_earned_date;
        ELSE
            days_since_last_point := NULL;
        END IF;
        
        -- Streak logic
        IF days_since_last_point = 1 THEN
            -- Earned points yesterday - continue the streak
            NEW.current_streak := COALESCE(OLD.current_streak, 0) + 1;
        ELSIF days_since_last_point = 0 THEN
            -- Already earned points today - maintain current streak
            NEW.current_streak := COALESCE(OLD.current_streak, 1);
        ELSE
            -- Either first points or streak broken - reset to 1
            NEW.current_streak := 1;
        END IF;
        
        -- Update longest streak if necessary
        NEW.longest_streak := GREATEST(COALESCE(NEW.longest_streak, 0), NEW.current_streak);
        
        -- Update last point earned date
        NEW.last_point_earned_date := CURRENT_DATE;
        NEW.updated_at := NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to reset inactive streaks (runs daily)
CREATE OR REPLACE FUNCTION public.reset_inactive_streaks()
RETURNS VOID AS $$
BEGIN
    -- Only reset streak if user didn't earn points yesterday
    UPDATE public.profiles
    SET current_streak = 0,
        updated_at = NOW()
    WHERE current_streak > 0
        AND (last_point_earned_date IS NULL OR last_point_earned_date < CURRENT_DATE - INTERVAL '1 day');
END;
$$ LANGUAGE plpgsql;

-- Function to update daily stats
CREATE OR REPLACE FUNCTION public.update_daily_stats()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.daily_stats (user_id, date, points_earned, tasks_completed, focus_time, sessions_completed)
    VALUES (NEW.user_id, CURRENT_DATE, 0, 0, 0, 0)
    ON CONFLICT (user_id, date)
    DO NOTHING;
    
    IF TG_TABLE_NAME = 'sessions' AND NEW.completed = true THEN
        UPDATE public.daily_stats
        SET points_earned = points_earned + COALESCE(NEW.points_earned, 0),
            focus_time = focus_time + COALESCE(NEW.duration, 0),
            sessions_completed = sessions_completed + 1,
            updated_at = NOW()
        WHERE user_id = NEW.user_id AND date = CURRENT_DATE;
    ELSIF TG_TABLE_NAME = 'tasks' AND NEW.status = 'completed' THEN
        UPDATE public.daily_stats
        SET points_earned = points_earned + COALESCE(NEW.points, 0),
            tasks_completed = tasks_completed + 1,
            updated_at = NOW()
        WHERE user_id = NEW.user_id AND date = CURRENT_DATE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to unlock achievements
CREATE OR REPLACE FUNCTION public.unlock_achievement(p_user_id UUID, p_achievement_name VARCHAR)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.user_achievements (user_id, achievement_id)
    SELECT p_user_id, id 
    FROM public.achievements 
    WHERE name = p_achievement_name
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Achievement trigger function with timezone support
CREATE OR REPLACE FUNCTION public.handle_session_achievements()
RETURNS TRIGGER AS $$
DECLARE
    v_session_hour INTEGER;
    v_user_timezone VARCHAR(50);
    v_session_time_local TIMESTAMP WITH TIME ZONE;
    v_total_sessions INTEGER;
    v_total_focus_time INTEGER;
BEGIN
    -- Only process completed focus sessions
    IF NEW.completed = true AND NEW.session_type = 'focus' THEN
        
        -- Get user's timezone (default to UTC if not set)
        SELECT COALESCE(timezone, 'UTC') INTO v_user_timezone
        FROM public.profiles 
        WHERE id = NEW.user_id;
        
        -- Convert session time to user's local timezone
        v_session_time_local := NEW.start_time AT TIME ZONE v_user_timezone;
        v_session_hour := EXTRACT(HOUR FROM v_session_time_local);
        
        -- First Step achievement
        PERFORM public.unlock_achievement(NEW.user_id, 'First Step');
        
        -- Early Bird (5-8 AM in user's timezone)
        IF v_session_hour >= 5 AND v_session_hour < 8 THEN
            PERFORM public.unlock_achievement(NEW.user_id, 'Early Bird');
        END IF;
        
        -- Night Owl (11 PM - 2 AM in user's timezone) 
        IF v_session_hour >= 23 OR v_session_hour < 2 THEN
            PERFORM public.unlock_achievement(NEW.user_id, 'Night Owl');
        END IF;
        
        -- Marathon Mind (2+ hour session)
        IF NEW.duration >= 7200 THEN -- 2 hours = 7200 seconds
            PERFORM public.unlock_achievement(NEW.user_id, 'Marathon Mind');
        END IF;
        
        -- Get user's total stats for other achievements
        SELECT 
            COUNT(*) FILTER (WHERE completed = true AND session_type = 'focus'),
            COALESCE(SUM(duration) FILTER (WHERE completed = true AND session_type = 'focus'), 0)
        INTO v_total_sessions, v_total_focus_time
        FROM public.sessions 
        WHERE user_id = NEW.user_id;
        
        -- Century Club (100 focus sessions)
        IF v_total_sessions >= 100 THEN
            PERFORM public.unlock_achievement(NEW.user_id, 'Century Club');
        END IF;
        
        -- Hour Hero (1 hour total)
        IF v_total_focus_time >= 3600 THEN -- 1 hour = 3600 seconds
            PERFORM public.unlock_achievement(NEW.user_id, 'Hour Hero');
        END IF;
        
        -- Time Warrior (10 hours total)
        IF v_total_focus_time >= 36000 THEN -- 10 hours = 36000 seconds
            PERFORM public.unlock_achievement(NEW.user_id, 'Time Warrior');
        END IF;
        
        -- Century Club (100 hours total)
        IF v_total_focus_time >= 360000 THEN -- 100 hours = 360000 seconds
            PERFORM public.unlock_achievement(NEW.user_id, 'Century Club');
        END IF;
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update points when session completes
CREATE TRIGGER update_user_points_on_session
AFTER INSERT OR UPDATE ON public.sessions
FOR EACH ROW
WHEN (NEW.completed = true AND NEW.points_earned > 0)
EXECUTE FUNCTION public.update_user_points();

-- Update points when task completes
CREATE TRIGGER update_user_points_on_task
AFTER UPDATE ON public.tasks
FOR EACH ROW
WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
EXECUTE FUNCTION public.update_user_points();

-- Update streak when points change
CREATE TRIGGER update_streak_on_points_change
BEFORE UPDATE OF total_points ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_user_streak_on_points();

-- Update daily stats
CREATE TRIGGER update_daily_stats_on_session
AFTER INSERT OR UPDATE ON public.sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_daily_stats();

CREATE TRIGGER update_daily_stats_on_task
AFTER UPDATE ON public.tasks
FOR EACH ROW
WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
EXECUTE FUNCTION public.update_daily_stats();

-- Achievement trigger
CREATE TRIGGER handle_achievements_on_session
AFTER INSERT OR UPDATE ON public.sessions
FOR EACH ROW
WHEN (NEW.completed = true)
EXECUTE FUNCTION public.handle_session_achievements();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Profiles: Users can only see and update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Sessions: Users can only manage their own sessions
CREATE POLICY "Users can manage own sessions" ON public.sessions
    FOR ALL USING (auth.uid() = user_id);

-- Tasks: Users can only manage their own tasks
CREATE POLICY "Users can manage own tasks" ON public.tasks
    FOR ALL USING (auth.uid() = user_id);

-- Trees: Users can only see and update their own tree
CREATE POLICY "Users can manage own tree" ON public.trees
    FOR ALL USING (auth.uid() = user_id);

-- User Achievements: Users can only see their own achievements
CREATE POLICY "Users can view own achievements" ON public.user_achievements
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage achievements" ON public.user_achievements
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Daily Stats: Users can only see their own stats
CREATE POLICY "Users can view own daily stats" ON public.daily_stats
    FOR ALL USING (auth.uid() = user_id);

-- Weekly Stats and Goals: Users can only see their own
CREATE POLICY "Users can manage own weekly stats" ON public.weekly_stats
    FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own weekly goals" ON public.weekly_goals
    FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- SEED DATA: Achievements
-- =====================================================

INSERT INTO public.achievements (name, description, icon_url, points_required, special_condition, badge_color, category) VALUES
-- Milestone Achievements
('First Step', 'Complete your first focus session', '🌱', NULL, 'first_session', 'bronze', 'milestone'),

-- Streak Achievements
('Dedicated', 'Maintain a 7-day streak', '🔥', NULL, 'streak_7', 'silver', 'streak'),
('Committed', 'Maintain a 30-day streak', '💫', NULL, 'streak_30', 'gold', 'streak'),
('Unstoppable', 'Maintain a 100-day streak', '⚡', NULL, 'streak_100', 'diamond', 'streak'),

-- Task Achievements
('Task Novice', 'Complete 10 tasks', '✅', NULL, 'tasks_10', 'bronze', 'tasks'),
('Task Master', 'Complete 50 tasks', '📋', NULL, 'tasks_50', 'silver', 'tasks'),
('Task Legend', 'Complete 100 tasks', '🏆', NULL, 'tasks_100', 'gold', 'tasks'),

-- Points Achievements
('Point Collector', 'Earn 100 total points', '💎', 100, NULL, 'bronze', 'points'),
('Point Hoarder', 'Earn 500 total points', '💰', 500, NULL, 'silver', 'points'),
('Point Tycoon', 'Earn 1000 total points', '👑', 1000, NULL, 'gold', 'points'),

-- Apple Achievements
('Apple Picker', 'Collect your first apple', '🍎', NULL, 'first_apple', 'bronze', 'collection'),
('Silver Harvest', 'Collect 5 silver apples', '🥈', NULL, 'silver_apples_5', 'silver', 'collection'),
('Golden Bounty', 'Collect 5 gold apples', '🥇', NULL, 'gold_apples_5', 'gold', 'collection'),
('Diamond Elite', 'Collect your first diamond apple', '💎', NULL, 'diamond_apple_1', 'diamond', 'collection'),

-- Time Achievements
('Hour Hero', 'Complete 1 hour of focus time', '⏰', NULL, 'focus_1h', 'bronze', 'time'),
('Time Warrior', 'Complete 10 hours of focus time', '⚔️', NULL, 'focus_10h', 'silver', 'time'),
('Century Club', 'Complete 100 hours of focus time', '💯', NULL, 'focus_100h', 'gold', 'time'),

-- Special Time-based Achievements
('Early Bird', 'Start a session between 5-8 AM', '🌅', NULL, 'early_bird', 'silver', 'special'),
('Night Owl', 'Start a session between 11 PM-2 AM', '🦉', NULL, 'night_owl', 'silver', 'special'),
('Marathon Mind', 'Complete a 2+ hour focus session', '🏃', NULL, 'session_120', 'gold', 'special')
ON CONFLICT (name) DO NOTHING;