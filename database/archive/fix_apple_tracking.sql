-- Add column to track total apples ever earned (not just current)
ALTER TABLE public.trees ADD COLUMN IF NOT EXISTS total_apples_earned INTEGER DEFAULT 0;

-- Update existing records to set total_apples_earned based on current points
-- Each 10 points = 1 red apple
UPDATE public.trees t
SET total_apples_earned = FLOOR(p.total_points / 10)
FROM public.profiles p
WHERE t.user_id = p.id;

-- Update the tree update logic to track total apples earned
CREATE OR REPLACE FUNCTION public.update_tree_apples()
RETURNS TRIGGER AS $$
DECLARE
    v_total_points INTEGER;
    v_new_apples INTEGER;
    v_old_apples INTEGER;
BEGIN
    -- Get user's total points
    SELECT total_points INTO v_total_points
    FROM public.profiles
    WHERE id = NEW.user_id;
    
    -- Calculate total apples from points (1 apple per 10 points)
    v_new_apples := FLOOR(v_total_points / 10);
    
    -- Get old total apples earned
    v_old_apples := COALESCE(OLD.total_apples_earned, 0);
    
    -- Update total_apples_earned to be the maximum of current value and calculated value
    -- This ensures it never decreases
    NEW.total_apples_earned := GREATEST(v_old_apples, v_new_apples);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update total apples earned
DROP TRIGGER IF EXISTS update_tree_apples_trigger ON public.trees;
CREATE TRIGGER update_tree_apples_trigger
    BEFORE UPDATE ON public.trees
    FOR EACH ROW EXECUTE FUNCTION public.update_tree_apples();

-- Update the achievement check to use total_apples_earned
CREATE OR REPLACE FUNCTION public.check_tree_achievements()
RETURNS TRIGGER AS $$
DECLARE
    v_tree_level INTEGER;
BEGIN
    -- Calculate tree level
    IF NEW.diamond_apples > 0 THEN v_tree_level := 4;
    ELSIF NEW.gold_apples > 0 THEN v_tree_level := 3;
    ELSIF NEW.silver_apples > 0 THEN v_tree_level := 2;
    ELSIF NEW.red_apples > 0 THEN v_tree_level := 1;
    ELSE v_tree_level := 0;
    END IF;
    
    -- Tree achievements
    IF v_tree_level >= 3 THEN
        PERFORM public.unlock_achievement(NEW.user_id, 'Tree Tender');
    END IF;
    
    IF v_tree_level >= 4 THEN
        PERFORM public.unlock_achievement(NEW.user_id, 'Forest Guardian');
    END IF;
    
    -- Apple achievements
    IF NEW.gold_apples > 0 AND (OLD.gold_apples IS NULL OR OLD.gold_apples = 0) THEN
        PERFORM public.unlock_achievement(NEW.user_id, 'Golden Harvest');
    END IF;
    
    IF NEW.diamond_apples > 0 AND (OLD.diamond_apples IS NULL OR OLD.diamond_apples = 0) THEN
        PERFORM public.unlock_achievement(NEW.user_id, 'Diamond Excellence');
    END IF;
    
    -- Apple Collector - now uses total_apples_earned instead of total_apples
    IF NEW.total_apples_earned >= 100 THEN
        PERFORM public.unlock_achievement(NEW.user_id, 'Apple Collector');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;