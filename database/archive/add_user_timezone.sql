-- Add timezone support for users
-- This allows time-based achievements to work correctly regardless of user location

-- 1. Add timezone column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC';

-- 2. Update the achievement trigger to use user's timezone
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
        
        -- Time Titan (100 hours total)
        IF v_total_focus_time >= 360000 THEN -- 100 hours = 360000 seconds
            PERFORM public.unlock_achievement(NEW.user_id, 'Time Titan');
        END IF;
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Set your timezone (replace with your actual timezone)
-- Common timezones:
-- 'America/New_York' (EST/EDT)
-- 'America/Chicago' (CST/CDT) 
-- 'America/Denver' (MST/MDT)
-- 'America/Los_Angeles' (PST/PDT)
-- 'Europe/London' (GMT/BST)
-- 'Asia/Tokyo' (JST)

-- Example: Set timezone to Pacific Time
-- UPDATE public.profiles SET timezone = 'America/Los_Angeles' WHERE id = auth.uid();

-- 4. Add a settings page option to let users set their timezone
-- You can add this to your settings popup component later