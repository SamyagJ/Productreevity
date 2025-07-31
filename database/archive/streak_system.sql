-- Efficient streak system using existing structure

-- Add column to track when user last earned points
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_point_earned_date DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS streak_popup_shown_date DATE;

-- Function to update streak when points are earned
CREATE OR REPLACE FUNCTION public.update_user_streak_on_points()
RETURNS TRIGGER AS $$
BEGIN
    -- Only process if points actually increased
    IF NEW.total_points > OLD.total_points THEN
        -- Check if last point was earned yesterday (continuous streak)
        IF OLD.last_point_earned_date = CURRENT_DATE - INTERVAL '1 day' THEN
            -- Continue the streak
            NEW.current_streak := OLD.current_streak + 1;
            NEW.longest_streak := GREATEST(NEW.longest_streak, NEW.current_streak);
        -- Check if already earned points today (no streak change)
        ELSIF OLD.last_point_earned_date = CURRENT_DATE THEN
            -- Already updated today, keep current streak
            NEW.current_streak := OLD.current_streak;
        ELSE
            -- Either first points ever, or streak was broken - restart at 1
            NEW.current_streak := 1;
            NEW.longest_streak := GREATEST(COALESCE(NEW.longest_streak, 0), 1);
        END IF;
        
        -- Update the last point earned date
        NEW.last_point_earned_date := CURRENT_DATE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for streak updates
DROP TRIGGER IF EXISTS update_user_streak_trigger ON public.profiles;
CREATE TRIGGER update_user_streak_trigger
    BEFORE UPDATE OF total_points ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_user_streak_on_points();

-- Function to reset streaks for users who didn't earn points today
-- This should be called daily at midnight
CREATE OR REPLACE FUNCTION public.reset_inactive_streaks()
RETURNS VOID AS $$
BEGIN
    -- Reset streak for users who didn't earn points today
    UPDATE public.profiles
    SET current_streak = 0,
        updated_at = NOW()
    WHERE current_streak > 0
        AND (last_point_earned_date IS NULL OR last_point_earned_date < CURRENT_DATE);
END;
$$ LANGUAGE plpgsql;