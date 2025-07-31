-- Daily stats tracking table
CREATE TABLE public.daily_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    points_earned INTEGER DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    focus_time INTEGER DEFAULT 0, -- in seconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Create index for better performance
CREATE INDEX idx_daily_stats_user_date ON public.daily_stats(user_id, date);

-- Enable Row Level Security
ALTER TABLE public.daily_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for daily_stats
CREATE POLICY "Users can view own daily stats" ON public.daily_stats
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own daily stats" ON public.daily_stats
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily stats" ON public.daily_stats
    FOR UPDATE USING (auth.uid() = user_id);

-- Function to ensure daily stats record exists for today
CREATE OR REPLACE FUNCTION public.ensure_daily_stats_exists(p_user_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS UUID AS $$
DECLARE
    stats_id UUID;
BEGIN
    -- Try to get existing record
    SELECT id INTO stats_id 
    FROM public.daily_stats 
    WHERE user_id = p_user_id AND date = p_date;
    
    -- If doesn't exist, create it
    IF stats_id IS NULL THEN
        INSERT INTO public.daily_stats (user_id, date)
        VALUES (p_user_id, p_date)
        RETURNING id INTO stats_id;
    END IF;
    
    RETURN stats_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update daily stats when a task is completed
CREATE OR REPLACE FUNCTION public.update_daily_stats_on_task()
RETURNS TRIGGER AS $$
DECLARE
    stats_id UUID;
    task_date DATE;
BEGIN
    -- Only process when task status changes to completed
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        -- Get the date of completion
        task_date := COALESCE(NEW.completed_at::DATE, CURRENT_DATE);
        
        -- Ensure daily stats record exists
        stats_id := public.ensure_daily_stats_exists(NEW.user_id, task_date);
        
        -- Update the daily stats
        UPDATE public.daily_stats 
        SET 
            tasks_completed = tasks_completed + 1,
            points_earned = points_earned + NEW.points,
            updated_at = NOW()
        WHERE id = stats_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update daily stats when a session is completed
CREATE OR REPLACE FUNCTION public.update_daily_stats_on_session()
RETURNS TRIGGER AS $$
DECLARE
    stats_id UUID;
    session_date DATE;
BEGIN
    -- Only process completed focus sessions
    IF NEW.completed = true AND NEW.session_type = 'focus' THEN
        -- Get the date of the session
        session_date := NEW.start_time::DATE;
        
        -- Ensure daily stats record exists
        stats_id := public.ensure_daily_stats_exists(NEW.user_id, session_date);
        
        -- Update the daily stats
        UPDATE public.daily_stats 
        SET 
            focus_time = focus_time + COALESCE(NEW.duration, 0),
            points_earned = points_earned + COALESCE(NEW.points_earned, 0),
            updated_at = NOW()
        WHERE id = stats_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update daily stats
CREATE TRIGGER update_daily_stats_on_task_completion 
    AFTER UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.update_daily_stats_on_task();

CREATE TRIGGER update_daily_stats_on_session_completion 
    AFTER INSERT OR UPDATE ON public.sessions
    FOR EACH ROW EXECUTE FUNCTION public.update_daily_stats_on_session();

-- Update trigger for updated_at on daily_stats
CREATE TRIGGER update_daily_stats_updated_at BEFORE UPDATE ON public.daily_stats
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();