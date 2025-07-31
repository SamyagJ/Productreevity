-- Fix streak system to properly track consecutive days

-- First ensure columns exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_point_earned_date DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS streak_popup_shown_date DATE;

-- Improved streak update function
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
        
        -- Streak logic:
        -- If earned points yesterday (1 day gap): increment streak
        -- If earned points today already (0 day gap): keep same streak
        -- If gap is more than 1 day: reset streak to 1
        -- If first time earning points: start streak at 1
        
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
        
        -- Update the last point earned date
        NEW.last_point_earned_date := CURRENT_DATE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
DROP TRIGGER IF EXISTS update_user_streak_trigger ON public.profiles;
CREATE TRIGGER update_user_streak_trigger
    BEFORE UPDATE OF total_points ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_user_streak_on_points();

-- Optional: Fix existing streaks based on current data
-- This will recalculate streaks for users who have earned points recently
UPDATE public.profiles
SET current_streak = CASE 
    WHEN last_point_earned_date = CURRENT_DATE THEN current_streak
    WHEN last_point_earned_date = CURRENT_DATE - INTERVAL '1 day' THEN current_streak
    WHEN last_point_earned_date < CURRENT_DATE - INTERVAL '1 day' THEN 0
    ELSE 1
END
WHERE last_point_earned_date IS NOT NULL;