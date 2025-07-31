-- Fix the ambiguous column reference in the trigger
CREATE OR REPLACE FUNCTION public.update_weekly_stats_on_session()
RETURNS TRIGGER AS $$
DECLARE
    stats_id UUID;
BEGIN
    -- Only process completed sessions
    IF NEW.completed = true THEN
        -- Ensure weekly stats record exists
        stats_id := public.ensure_weekly_stats_exists(NEW.user_id);
        
        -- Update the weekly stats
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
            total_sessions = COALESCE((
                SELECT COUNT(*) 
                FROM public.sessions 
                WHERE user_id = NEW.user_id 
                    AND completed = true
                    AND start_time >= (public.get_week_start_date()::timestamp)
                    AND start_time < (public.get_week_start_date()::timestamp + interval '7 days')
            ), 0),
            average_session_duration = COALESCE((
                SELECT AVG(duration)::INTEGER
                FROM public.sessions 
                WHERE user_id = NEW.user_id 
                    AND completed = true
                    AND start_time >= (public.get_week_start_date()::timestamp)
                    AND start_time < (public.get_week_start_date()::timestamp + interval '7 days')
            ), 0),
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