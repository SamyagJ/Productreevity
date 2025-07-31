-- Achievement unlocking functions and triggers

-- Function to unlock an achievement for a user
CREATE OR REPLACE FUNCTION public.unlock_achievement(p_user_id UUID, p_achievement_name VARCHAR)
RETURNS VOID AS $$
DECLARE
    v_achievement_id UUID;
BEGIN
    -- Get achievement ID
    SELECT id INTO v_achievement_id FROM public.achievements WHERE name = p_achievement_name;
    
    IF v_achievement_id IS NOT NULL THEN
        -- Insert if not already unlocked
        INSERT INTO public.user_achievements (user_id, achievement_id)
        VALUES (p_user_id, v_achievement_id)
        ON CONFLICT (user_id, achievement_id) DO NOTHING;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to check and unlock achievements after session completion
CREATE OR REPLACE FUNCTION public.check_session_achievements()
RETURNS TRIGGER AS $$
DECLARE
    v_session_count INTEGER;
    v_total_focus_hours NUMERIC;
    v_session_hour INTEGER;
BEGIN
    -- Only check for completed sessions
    IF NEW.completed = true THEN
        -- First Focus achievement
        SELECT COUNT(*) INTO v_session_count
        FROM public.sessions
        WHERE user_id = NEW.user_id AND completed = true;
        
        IF v_session_count = 1 THEN
            PERFORM public.unlock_achievement(NEW.user_id, 'First Focus');
        END IF;
        
        -- Century Club (100 sessions)
        IF v_session_count >= 100 THEN
            PERFORM public.unlock_achievement(NEW.user_id, 'Century Club');
        END IF;
        
        -- Time Titan (100 hours of focus time)
        SELECT SUM(duration) / 3600.0 INTO v_total_focus_hours
        FROM public.sessions
        WHERE user_id = NEW.user_id 
            AND session_type = 'focus' 
            AND completed = true;
        
        IF v_total_focus_hours >= 100 THEN
            PERFORM public.unlock_achievement(NEW.user_id, 'Time Titan');
        END IF;
        
        -- Marathon Mind (2-hour session)
        IF NEW.duration >= 7200 THEN -- 2 hours = 7200 seconds
            PERFORM public.unlock_achievement(NEW.user_id, 'Marathon Mind');
        END IF;
        
        -- Early Bird (session before 6 AM)
        v_session_hour := EXTRACT(HOUR FROM NEW.start_time AT TIME ZONE 'UTC');
        IF v_session_hour < 6 THEN
            PERFORM public.unlock_achievement(NEW.user_id, 'Early Bird');
        END IF;
        
        -- Night Owl (session after 11 PM)
        IF v_session_hour >= 23 THEN
            PERFORM public.unlock_achievement(NEW.user_id, 'Night Owl');
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to check and unlock task achievements
CREATE OR REPLACE FUNCTION public.check_task_achievements()
RETURNS TRIGGER AS $$
DECLARE
    v_task_count INTEGER;
    v_daily_task_count INTEGER;
    v_task_date DATE;
BEGIN
    -- Only check when task is completed
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        -- Count total completed tasks
        SELECT COUNT(*) INTO v_task_count
        FROM public.tasks
        WHERE user_id = NEW.user_id AND status = 'completed';
        
        -- Task Master (10 tasks)
        IF v_task_count >= 10 THEN
            PERFORM public.unlock_achievement(NEW.user_id, 'Task Master');
        END IF;
        
        -- Task Tornado (100 tasks)
        IF v_task_count >= 100 THEN
            PERFORM public.unlock_achievement(NEW.user_id, 'Task Tornado');
        END IF;
        
        -- Quick Start (5 tasks in one day)
        v_task_date := COALESCE(NEW.completed_at::DATE, CURRENT_DATE);
        
        SELECT COUNT(*) INTO v_daily_task_count
        FROM public.tasks
        WHERE user_id = NEW.user_id 
            AND status = 'completed'
            AND completed_at::DATE = v_task_date;
        
        IF v_daily_task_count >= 5 THEN
            PERFORM public.unlock_achievement(NEW.user_id, 'Quick Start');
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to check and unlock points-based achievements
CREATE OR REPLACE FUNCTION public.check_points_achievements()
RETURNS TRIGGER AS $$
BEGIN
    -- Productivity Pro (1000 points)
    IF NEW.total_points >= 1000 AND (OLD.total_points IS NULL OR OLD.total_points < 1000) THEN
        PERFORM public.unlock_achievement(NEW.user_id, 'Productivity Pro');
    END IF;
    
    -- Point Pinnacle (10000 points)
    IF NEW.total_points >= 10000 AND (OLD.total_points IS NULL OR OLD.total_points < 10000) THEN
        PERFORM public.unlock_achievement(NEW.user_id, 'Point Pinnacle');
    END IF;
    
    -- Streak achievements
    IF NEW.current_streak >= 7 THEN
        PERFORM public.unlock_achievement(NEW.user_id, 'Week Warrior');
    END IF;
    
    IF NEW.current_streak >= 30 THEN
        PERFORM public.unlock_achievement(NEW.user_id, 'Month Master');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to check and unlock tree/apple achievements
CREATE OR REPLACE FUNCTION public.check_tree_achievements()
RETURNS TRIGGER AS $$
DECLARE
    v_tree_level INTEGER;
BEGIN
    -- Calculate tree level
    IF NEW.diamond_apples > 0 THEN v_tree_level := 4;
    ELSIF NEW.gold_apples > 0 THEN v_tree_level := 3;
    ELSIF NEW.silver_apples > 0 THEN v_tree_level := 2;
    ELSIF NEW.red_apples > 0 THEN v_tree_level := 1;
    ELSE v_tree_level := 0;
    END IF;
    
    -- Tree achievements
    IF v_tree_level >= 3 THEN
        PERFORM public.unlock_achievement(NEW.user_id, 'Tree Tender');
    END IF;
    
    IF v_tree_level >= 4 THEN
        PERFORM public.unlock_achievement(NEW.user_id, 'Forest Guardian');
    END IF;
    
    -- Apple achievements
    IF NEW.gold_apples > 0 AND (OLD.gold_apples IS NULL OR OLD.gold_apples = 0) THEN
        PERFORM public.unlock_achievement(NEW.user_id, 'Golden Harvest');
    END IF;
    
    IF NEW.diamond_apples > 0 AND (OLD.diamond_apples IS NULL OR OLD.diamond_apples = 0) THEN
        PERFORM public.unlock_achievement(NEW.user_id, 'Diamond Excellence');
    END IF;
    
    IF NEW.total_apples >= 100 THEN
        PERFORM public.unlock_achievement(NEW.user_id, 'Apple Collector');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to check Consistent Creator achievement (daily sessions for a week)
CREATE OR REPLACE FUNCTION public.check_consistent_creator()
RETURNS VOID AS $$
DECLARE
    v_user RECORD;
    v_consecutive_days INTEGER;
BEGIN
    -- Check for each user who had a session today
    FOR v_user IN 
        SELECT DISTINCT user_id 
        FROM public.sessions 
        WHERE DATE(start_time) = CURRENT_DATE AND completed = true
    LOOP
        -- Count consecutive days with sessions going back from today
        WITH consecutive_days AS (
            SELECT COUNT(DISTINCT DATE(start_time)) as days
            FROM public.sessions
            WHERE user_id = v_user.user_id
                AND completed = true
                AND DATE(start_time) >= CURRENT_DATE - INTERVAL '6 days'
                AND DATE(start_time) <= CURRENT_DATE
        )
        SELECT days INTO v_consecutive_days FROM consecutive_days;
        
        IF v_consecutive_days >= 7 THEN
            PERFORM public.unlock_achievement(v_user.user_id, 'Consistent Creator');
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS check_session_achievements_trigger ON public.sessions;
CREATE TRIGGER check_session_achievements_trigger
    AFTER INSERT OR UPDATE ON public.sessions
    FOR EACH ROW EXECUTE FUNCTION public.check_session_achievements();

DROP TRIGGER IF EXISTS check_task_achievements_trigger ON public.tasks;
CREATE TRIGGER check_task_achievements_trigger
    AFTER UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.check_task_achievements();

DROP TRIGGER IF EXISTS check_points_achievements_trigger ON public.profiles;
CREATE TRIGGER check_points_achievements_trigger
    AFTER UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.check_points_achievements();

DROP TRIGGER IF EXISTS check_tree_achievements_trigger ON public.trees;
CREATE TRIGGER check_tree_achievements_trigger
    AFTER UPDATE ON public.trees
    FOR EACH ROW EXECUTE FUNCTION public.check_tree_achievements();


