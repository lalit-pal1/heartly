-- Create surprise_reactions table for receiver feedback
CREATE TABLE IF NOT EXISTS public.surprise_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    surprise_id UUID REFERENCES public.surprises(id) ON DELETE CASCADE NOT NULL,
    reaction_emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.surprise_reactions ENABLE ROW LEVEL SECURITY;

-- Allow public insert of reactions (so receivers can react)
CREATE POLICY "Allow public insert of surprise reactions" ON public.surprise_reactions
    FOR INSERT WITH CHECK (true);

-- Allow creators to view reactions of their own surprises
CREATE POLICY "Allow read reactions of own surprises" ON public.surprise_reactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.surprises
            WHERE surprises.id = surprise_reactions.surprise_id
            AND surprises.user_id = auth.uid()
        )
    );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_surprise_reactions_surprise_id ON public.surprise_reactions(surprise_id);
