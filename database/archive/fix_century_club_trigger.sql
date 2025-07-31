-- Fix Century Club achievement to properly count all completed focus sessions

-- First, let's check the current session count for debugging
CREATE OR REPLACE FUNCTION public.get_user_focus_session_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM public.sessions
    WHERE user_id = p_user_id
        AND completed = true
        AND session_type = 'focus';
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Update the session achievements trigger to properly count sessions
CREATE OR REPLACE FUNCTION public.check_session_achievements()
RETURNS TRIGGER AS $$
DECLARE
    v_session_count INTEGER;
    v_session_time TIMESTAMP;
    v_total_focus_hours DECIMAL;
    v_session_duration_minutes INTEGER;
BEGIN
    -- Only process completed focus sessions
    IF NEW.completed = true AND NEW.session_type = 'focus' THEN
        -- Log for debugging
        RAISE NOTICE 'Checking achievements for user % after focus session completion', NEW.user_id;
        
        -- Count total focus sessions for this user
        SELECT COUNT(*) INTO v_session_count
        FROM public.sessions
        WHERE user_id = NEW.user_id 
            AND completed = true 
            AND session_type = 'focus';
        
        RAISE NOTICE 'User % has completed % focus sessions', NEW.user_id, v_session_count;
        
        -- First Focus achievement
        IF v_session_count = 1 THEN
            PERFORM public.unlock_achievement(NEW.user_id, 'First Focus');
        END IF;
        
        -- Century Club (100 focus sessions) - check every time
        IF v_session_count >= 100 THEN
            RAISE NOTICE 'User % qualifies for Century Club achievement', NEW.user_id;
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

-- Make sure the trigger is properly attached
DROP TRIGGER IF EXISTS check_session_achievements_trigger ON public.sessions;
CREATE TRIGGER check_session_achievements_trigger
    AFTER INSERT OR UPDATE OF completed ON public.sessions
    FOR EACH ROW 
    WHEN (NEW.completed = true AND NEW.session_type = 'focus')
    EXECUTE FUNCTION public.check_session_achievements();

-- Also ensure the unlock_achievement function exists and works properly
CREATE OR REPLACE FUNCTION public.unlock_achievement(p_user_id UUID, p_achievement_name VARCHAR)
RETURNS VOID AS $$
DECLARE
    v_achievement_id UUID;
BEGIN
    -- Get achievement ID
    SELECT id INTO v_achievement_id
    FROM public.achievements
    WHERE name = p_achievement_name;
    
    IF v_achievement_id IS NULL THEN
        RAISE WARNING 'Achievement % not found', p_achievement_name;
        RETURN;
    END IF;
    
    -- Insert user achievement if not already unlocked
    INSERT INTO public.user_achievements (user_id, achievement_id, unlocked_at)
    VALUES (p_user_id, v_achievement_id, NOW())
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
    
    -- Log if the achievement was newly unlocked
    IF FOUND THEN
        RAISE NOTICE 'Achievement % unlocked for user %', p_achievement_name, p_user_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Test function to manually check and award achievements for a user
CREATE OR REPLACE FUNCTION public.recalculate_session_achievements(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_session_count INTEGER;
    v_total_focus_hours DECIMAL;
    v_result TEXT := '';
BEGIN
    -- Count focus sessions
    SELECT COUNT(*) INTO v_session_count
    FROM public.sessions
    WHERE user_id = p_user_id
        AND completed = true
        AND session_type = 'focus';
    
    v_result := v_result || 'Focus sessions: ' || v_session_count || E'\n';
    
    -- Calculate total focus hours
    SELECT COALESCE(SUM(duration), 0) / 3600.0 INTO v_total_focus_hours
    FROM public.sessions
    WHERE user_id = p_user_id 
        AND completed = true 
        AND session_type = 'focus';
    
    v_result := v_result || 'Total focus hours: ' || v_total_focus_hours || E'\n';
    
    -- Check Century Club
    IF v_session_count >= 100 THEN
        PERFORM public.unlock_achievement(p_user_id, 'Century Club');
        v_result := v_result || 'Century Club: Eligible' || E'\n';
    ELSE
        v_result := v_result || 'Century Club: ' || v_session_count || '/100' || E'\n';
    END IF;
    
    -- Check Time Titan
    IF v_total_focus_hours >= 100 THEN
        PERFORM public.unlock_achievement(p_user_id, 'Time Titan');
        v_result := v_result || 'Time Titan: Eligible' || E'\n';
    ELSE
        v_result := v_result || 'Time Titan: ' || ROUND(v_total_focus_hours, 2) || '/100 hours' || E'\n';
    END IF;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- You can run this to manually check a user's achievement status:
-- SELECT recalculate_session_achievements('your-user-id-here');