-- Fix Century Club achievement to only count focus sessions
CREATE OR REPLACE FUNCTION public.check_session_achievements()
RETURNS TRIGGER AS $$
DECLARE
    v_session_count INTEGER;
    v_session_time TIMESTAMP;
    v_total_focus_hours DECIMAL;
    v_session_duration_minutes INTEGER;
BEGIN
    -- Only process completed sessions
    IF NEW.completed = true THEN
        -- First Focus achievement
        SELECT COUNT(*) INTO v_session_count
        FROM public.sessions
        WHERE user_id = NEW.user_id AND completed = true AND session_type = 'focus';
        
        IF v_session_count = 1 THEN
            PERFORM public.unlock_achievement(NEW.user_id, 'First Focus');
        END IF;
        
        -- Century Club (100 focus sessions)
        IF v_session_count >= 100 THEN
            PERFORM public.unlock_achievement(NEW.user_id, 'Century Club');
        END IF;
        
        -- Time Titan (100 hours of focus time)
        SELECT SUM(duration) / 3600.0 INTO v_total_focus_hours
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