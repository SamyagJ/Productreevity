-- Fix missing INSERT policy for user_achievements table
CREATE POLICY "Users can unlock own achievements" ON public.user_achievements
    FOR INSERT WITH CHECK (auth.uid() = user_id);