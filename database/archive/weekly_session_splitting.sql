-- Function to handle session splitting across week boundaries
CREATE OR REPLACE FUNCTION public.split_session_at_week_boundary(
    p_user_id UUID,
    p_start_time TIMESTAMP WITH TIME ZONE,
    p_end_time TIMESTAMP WITH TIME ZONE,
    p_session_type VARCHAR(20),
    p_total_duration INTEGER
)
RETURNS VOID AS $$
DECLARE
    week1_start DATE;
    week2_start DATE;
    week_boundary TIMESTAMP WITH TIME ZONE;
    duration1 INTEGER;
    duration2 INTEGER;
BEGIN
    -- Get week start dates
    week1_start := public.get_week_start_date(p_start_time);
    week2_start := public.get_week_start_date(p_end_time);
    
    -- If session doesn't cross week boundary, insert normally
    IF week1_start = week2_start THEN
        INSERT INTO public.sessions (user_id, start_time, end_time, duration, session_type, completed, points_earned)
        VALUES (p_user_id, p_start_time, p_end_time, p_total_duration, p_session_type, true, 0);
        RETURN;
    END IF;
    
    -- Calculate the exact week boundary timestamp (Sunday 00:00:00)
    week_boundary := (week2_start::timestamp with time zone);
    
    -- Calculate durations for each part
    duration1 := EXTRACT(EPOCH FROM (week_boundary - p_start_time))::INTEGER;
    duration2 := EXTRACT(EPOCH FROM (p_end_time - week_boundary))::INTEGER;
    
    -- Insert first part of session (ends at week boundary)
    INSERT INTO public.sessions (user_id, start_time, end_time, duration, session_type, completed, points_earned)
    VALUES (p_user_id, p_start_time, week_boundary, duration1, p_session_type, true, 0);
    
    -- Insert second part of session (starts at week boundary)
    INSERT INTO public.sessions (user_id, start_time, end_time, duration, session_type, completed, points_earned)
    VALUES (p_user_id, week_boundary, p_end_time, duration2, p_session_type, true, 0);
END;
$$ LANGUAGE plpgsql;

-- Update the timer component to use this function when saving sessions
-- This will be called from the frontend when a session completes