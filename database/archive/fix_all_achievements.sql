-- Comprehensive fix for all achievement tracking

-- 1. Add total_apples_earned column if it doesn't exist
ALTER TABLE public.trees ADD COLUMN IF NOT EXISTS total_apples_earned INTEGER DEFAULT 0;

-- Update existing records
UPDATE public.trees t
SET total_apples_earned = FLOOR(p.total_points / 10)
FROM public.profiles p
WHERE t.user_id = p.id;

-- 2. Fix session achievements to only count focus sessions and trigger on any completed session
CREATE OR REPLACE FUNCTION public.check_session_achievements()
RETURNS TRIGGER AS $$
DECLARE
    v_session_count INTEGER;
    v_session_time TIMESTAMP;
    v_total_focus_hours DECIMAL;
    v_session_duration_minutes INTEGER;
BEGIN
    -- Only process completed sessions
    IF NEW.completed = true AND NEW.session_type = 'focus' THEN
        -- Count total focus sessions for this user
        SELECT COUNT(*) INTO v_session_count
        FROM public.sessions
        WHERE user_id = NEW.user_id 
            AND completed = true 
            AND session_type = 'focus';
        
        -- First Focus achievement
        IF v_session_count = 1 THEN
            PERFORM public.unlock_achievement(NEW.user_id, 'First Focus');
        END IF;
        
        -- Century Club (100 focus sessions) - check every time
        IF v_session_count >= 100 THEN
            PERFORM public.unlock_achievement(NEW.user_id, 'Century Club');
        END IF;
        
        -- Time Titan (100 hours of focus time)
        SELECT COALESCE(SUM(duration), 0) / 3600.0 INTO v_total_focus_hours
        FROM public.sessions
        WHERE user_id = NEW.user_id 
            AND completed = true 
            AND session_type = 'focus';
        
        IF v_total_focus_hours >= 100 THEN
            PERFORM public.unlock_achievement(NEW.user_id, 'Time Titan');
        END IF;
        
        -- Marathon Mind (2+ hour single session)
        v_session_duration_minutes := NEW.duration / 60;
        IF v_session_duration_minutes >= 120 THEN
            PERFORM public.unlock_achievement(NEW.user_id, 'Marathon Mind');
        END IF;
        
        -- Time-based achievements (Early Bird / Night Owl)
        v_session_time := NEW.start_time;
        
        -- Early Bird (5-8 AM)
        IF EXTRACT(HOUR FROM v_session_time) >= 5 AND EXTRACT(HOUR FROM v_session_time) < 8 THEN
            PERFORM public.unlock_achievement(NEW.user_id, 'Early Bird');
        END IF;
        
        -- Night Owl (10 PM - 2 AM)
        IF EXTRACT(HOUR FROM v_session_time) >= 22 OR EXTRACT(HOUR FROM v_session_time) < 2 THEN
            PERFORM public.unlock_achievement(NEW.user_id, 'Night Owl');
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Update tree achievements to use total_apples_earned
CREATE OR REPLACE FUNCTION public.check_tree_achievements()
RETURNS TRIGGER AS $$
DECLARE
    v_tree_level INTEGER;
BEGIN
    -- Calculate tree level based on current apples
    IF NEW.diamond_apples > 0 THEN v_tree_level := 4;
    ELSIF NEW.gold_apples > 0 THEN v_tree_level := 3;
    ELSIF NEW.silver_apples > 0 THEN v_tree_level := 2;
    ELSIF NEW.red_apples > 0 THEN v_tree_level := 1;
    ELSE v_tree_level := 0;
    END IF;
    
    -- Tree level achievements
    IF v_tree_level >= 3 THEN
        PERFORM public.unlock_achievement(NEW.user_id, 'Tree Tender');
    END IF;
    
    IF v_tree_level >= 4 THEN
        PERFORM public.unlock_achievement(NEW.user_id, 'Forest Guardian');
    END IF;
    
    -- Golden/Diamond apple achievements (first time getting them)
    IF NEW.gold_apples > 0 AND (OLD.gold_apples IS NULL OR OLD.gold_apples = 0) THEN
        PERFORM public.unlock_achievement(NEW.user_id, 'Golden Harvest');
    END IF;
    
    IF NEW.diamond_apples > 0 AND (OLD.diamond_apples IS NULL OR OLD.diamond_apples = 0) THEN
        PERFORM public.unlock_achievement(NEW.user_id, 'Diamond Excellence');
    END IF;
    
    -- Apple Collector - uses total earned, not current
    IF NEW.total_apples_earned >= 100 THEN
        PERFORM public.unlock_achievement(NEW.user_id, 'Apple Collector');
    END IF;
    
    -- Update total_apples_earned based on user's total points
    UPDATE public.trees t
    SET total_apples_earned = GREATEST(
        COALESCE(t.total_apples_earned, 0),
        FLOOR(p.total_points / 10)
    )
    FROM public.profiles p
    WHERE t.user_id = p.id AND t.id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Ensure daily/weekly achievements work correctly
CREATE OR REPLACE FUNCTION public.check_daily_achievements()
RETURNS TRIGGER AS $$
DECLARE
    v_daily_count INTEGER;
    v_week_count INTEGER;
    v_week_start DATE;
BEGIN
    -- Daily Dedication (7 consecutive days with points)
    SELECT current_streak INTO v_daily_count
    FROM public.profiles
    WHERE id = NEW.user_id;
    
    IF v_daily_count >= 7 THEN
        PERFORM public.unlock_achievement(NEW.user_id, 'Daily Dedication');
    END IF;
    
    -- Perfect Week (earn points every day for a week)
    v_week_start := CURRENT_DATE - INTERVAL '6 days';
    
    SELECT COUNT(DISTINCT date) INTO v_week_count
    FROM public.daily_stats
    WHERE user_id = NEW.user_id
        AND date >= v_week_start
        AND date <= CURRENT_DATE
        AND points_earned > 0;
    
    IF v_week_count = 7 THEN
        PERFORM public.unlock_achievement(NEW.user_id, 'Perfect Week');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create trigger for daily achievements on daily_stats
DROP TRIGGER IF EXISTS check_daily_achievements_trigger ON public.daily_stats;
CREATE TRIGGER check_daily_achievements_trigger
    AFTER INSERT OR UPDATE ON public.daily_stats
    FOR EACH ROW EXECUTE FUNCTION public.check_daily_achievements();

-- 6. Ensure all triggers are properly set up
DROP TRIGGER IF EXISTS check_session_achievements_trigger ON public.sessions;
CREATE TRIGGER check_session_achievements_trigger
    AFTER INSERT OR UPDATE OF completed ON public.sessions
    FOR EACH ROW EXECUTE FUNCTION public.check_session_achievements();

DROP TRIGGER IF EXISTS check_tree_achievements_trigger ON public.trees;
CREATE TRIGGER check_tree_achievements_trigger
    AFTER UPDATE ON public.trees
    FOR EACH ROW EXECUTE FUNCTION public.check_tree_achievements();

-- 7. Insert all achievements if they don't exist
INSERT INTO public.achievements (name, description, points_required, special_condition)
VALUES 
    ('First Focus', 'Complete your first focus session', NULL, 'first_session'),
    ('Task Master', 'Complete 10 tasks', NULL, 'tasks_10'),
    ('Productivity Pro', 'Earn 1,000 points', 1000, NULL),
    ('Week Warrior', 'Maintain a 7-day streak', NULL, 'streak_7'),
    ('Tree Tender', 'Grow your tree to level 3', NULL, 'tree_level_3'),
    ('Golden Harvest', 'Earn your first gold apple', NULL, 'gold_apple'),
    ('Time Titan', 'Accumulate 100 hours of focus time', NULL, 'hours_100'),
    ('Century Club', 'Complete 100 focus sessions', NULL, 'sessions_100'),
    ('Quick Start', 'Complete 5 tasks in one day', NULL, 'tasks_5_day'),
    ('Early Bird', 'Start a session between 5-8 AM', NULL, 'early_bird'),
    ('Night Owl', 'Start a session between 10 PM-2 AM', NULL, 'night_owl'),
    ('Marathon Mind', 'Complete a 2+ hour focus session', NULL, 'session_120'),
    ('Task Tornado', 'Complete 100 tasks', NULL, 'tasks_100'),
    ('Point Pinnacle', 'Earn 10,000 points', 10000, NULL),
    ('Month Master', 'Maintain a 30-day streak', NULL, 'streak_30'),
    ('Forest Guardian', 'Grow your tree to level 4', NULL, 'tree_level_4'),
    ('Diamond Excellence', 'Earn your first diamond apple', NULL, 'diamond_apple'),
    ('Apple Collector', 'Collect 100 apples total', NULL, 'apples_100'),
    ('Daily Dedication', 'Earn points for 7 consecutive days', NULL, 'daily_week'),
    ('Perfect Week', 'Earn points every day for a week', NULL, 'perfect_week')
ON CONFLICT (name) DO NOTHING;