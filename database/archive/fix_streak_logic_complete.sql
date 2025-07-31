-- Comprehensive fix for streak system

-- 1. Fix the reset function to only reset if user missed yesterday
CREATE OR REPLACE FUNCTION public.reset_inactive_streaks()
RETURNS VOID AS $$
BEGIN
    -- Only reset streak if user didn't earn points yesterday (not today)
    -- This gives users all day today to maintain their streak
    UPDATE public.profiles
    SET current_streak = 0,
        updated_at = NOW()
    WHERE current_streak > 0
        AND (last_point_earned_date IS NULL OR last_point_earned_date < CURRENT_DATE - INTERVAL '1 day');
END;
$$ LANGUAGE plpgsql;

-- 2. Better streak update function that handles edge cases
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
        
        -- Debug log (remove in production)
        RAISE NOTICE 'Streak update: days_since_last=%s, old_streak=%s, last_date=%s', 
            days_since_last_point, OLD.current_streak, OLD.last_point_earned_date;
        
        -- Streak logic:
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

-- 3. Recreate the trigger
DROP TRIGGER IF EXISTS update_user_streak_trigger ON public.profiles;
CREATE TRIGGER update_user_streak_trigger
    BEFORE UPDATE OF total_points ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_user_streak_on_points();

-- 4. Fix current data based on the scenario you described:
-- If you earned points yesterday and today shows streak=1, it should be 2
UPDATE public.profiles
SET current_streak = 2,
    longest_streak = GREATEST(longest_streak, 2)
WHERE last_point_earned_date = CURRENT_DATE - INTERVAL '1 day'
    AND current_streak = 1;

-- 5. Check the results
SELECT 
    username,
    total_points,
    current_streak,
    longest_streak,
    last_point_earned_date,
    CASE 
        WHEN last_point_earned_date = CURRENT_DATE THEN 'Earned today'
        WHEN last_point_earned_date = CURRENT_DATE - INTERVAL '1 day' THEN 'Earned yesterday'
        ELSE 'Last earned ' || (CURRENT_DATE - last_point_earned_date) || ' days ago'
    END as status
FROM public.profiles
WHERE id = auth.uid();