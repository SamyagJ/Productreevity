-- Update existing achievements to add emoji icons
-- Run this to add emojis to your current achievement records

UPDATE public.achievements 
SET icon_url = CASE name
    -- Streak Achievements
    WHEN 'First Step' THEN '🌱'
    WHEN 'Dedicated' THEN '🔥'
    WHEN 'Committed' THEN '💫'
    WHEN 'Unstoppable' THEN '⚡'
    
    -- Task Achievements
    WHEN 'Task Novice' THEN '✅'
    WHEN 'Task Master' THEN '📋'
    WHEN 'Task Legend' THEN '🏆'
    
    -- Points Achievements
    WHEN 'Point Collector' THEN '💎'
    WHEN 'Point Hoarder' THEN '💰'
    WHEN 'Point Tycoon' THEN '👑'
    
    -- Apple Achievements
    WHEN 'Apple Picker' THEN '🍎'
    WHEN 'Silver Harvest' THEN '🥈'
    WHEN 'Golden Bounty' THEN '🥇'
    WHEN 'Diamond Elite' THEN '💎'
    
    -- Time Achievements
    WHEN 'Hour Hero' THEN '⏰'
    WHEN 'Time Warrior' THEN '⚔️'
    WHEN 'Century Club' THEN '💯'
    
    -- Default case (keep existing icon_url if no match)
    ELSE icon_url
END
WHERE name IN (
    'First Step', 'Dedicated', 'Committed', 'Unstoppable',
    'Task Novice', 'Task Master', 'Task Legend',
    'Point Collector', 'Point Hoarder', 'Point Tycoon',
    'Apple Picker', 'Silver Harvest', 'Golden Bounty', 'Diamond Elite',
    'Hour Hero', 'Time Warrior', 'Century Club'
);