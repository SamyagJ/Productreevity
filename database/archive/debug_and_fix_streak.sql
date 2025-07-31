-- Debug current streak status
SELECT 
    username,
    total_points,
    current_streak,
    longest_streak,
    last_point_earned_date,
    CURRENT_DATE as today,
    CASE 
        WHEN last_point_earned_date = CURRENT_DATE THEN 'Earned points today'
        WHEN last_point_earned_date = CURRENT_DATE - INTERVAL '1 day' THEN 'Earned points yesterday'
        ELSE 'Last earned ' || (CURRENT_DATE - last_point_earned_date) || ' days ago'
    END as streak_status
FROM public.profiles
WHERE id = auth.uid();


UPDATE public.profiles
SET current_streak = current_streak + 1,
    longest_streak = GREATEST(longest_streak, current_streak + 1)
WHERE id = auth.uid()
    AND last_point_earned_date = CURRENT_DATE - INTERVAL '1 day'
    AND current_streak > 0;

-- Check the result
SELECT 
    username,
    current_streak,
    last_point_earned_date,
    'Streak should now be correct' as status
FROM public.profiles
WHERE id = auth.uid();
