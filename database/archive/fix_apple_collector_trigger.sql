-- Fix Apple Collector achievement to calculate from total points
CREATE OR REPLACE FUNCTION public.check_tree_achievements()
RETURNS TRIGGER AS $$
DECLARE
    v_tree_level INTEGER;
    v_total_points INTEGER;
    v_total_apples_collected INTEGER;
BEGIN
    -- Get user's total points to calculate total apples collected
    SELECT total_points INTO v_total_points
    FROM public.profiles
    WHERE id = NEW.user_id;
    
    -- Calculate total apples collected (10 points = 1 apple)
    v_total_apples_collected := FLOOR(COALESCE(v_total_points, 0) / 10);
    
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
    
    -- Apple Collector - now calculates from total points
    IF v_total_apples_collected >= 100 THEN
        PERFORM public.unlock_achievement(NEW.user_id, 'Apple Collector');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;