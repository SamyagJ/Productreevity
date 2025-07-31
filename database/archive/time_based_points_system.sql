-- Function to update user points based on total focus time (1 point per 25 minutes)
CREATE OR REPLACE FUNCTION public.update_user_points_from_focus_time()
RETURNS TRIGGER AS $$
DECLARE
    total_focus_seconds INTEGER;
    new_points INTEGER;
BEGIN
    -- Only process completed focus sessions
    IF NEW.completed = true AND NEW.session_type = 'focus' THEN
        -- Calculate total focus time for this user from all completed focus sessions
        SELECT COALESCE(SUM(duration), 0) INTO total_focus_seconds
        FROM public.sessions 
        WHERE user_id = NEW.user_id 
            AND session_type = 'focus' 
            AND completed = true;
        
        -- Calculate points (1 point per 25 minutes = 1500 seconds)
        new_points := FLOOR(total_focus_seconds / 1500);
        
        -- Update user's total points
        UPDATE public.profiles 
        SET total_points = new_points,
            updated_at = NOW()
        WHERE id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update points when focus sessions are completed
CREATE TRIGGER update_user_points_from_focus_time_trigger 
    AFTER INSERT OR UPDATE ON public.sessions
    FOR EACH ROW EXECUTE FUNCTION public.update_user_points_from_focus_time();