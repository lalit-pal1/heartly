-- Create surprise_analytics table for telemetry and insights
CREATE TABLE IF NOT EXISTS public.surprise_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    surprise_id UUID NOT NULL REFERENCES public.surprises(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    device_type TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Disable Row Level Security to allow direct client inserts
ALTER TABLE public.surprise_analytics DISABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_surprise_analytics_surprise_id ON public.surprise_analytics(surprise_id);
CREATE INDEX IF NOT EXISTS idx_surprise_analytics_session_id ON public.surprise_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_surprise_analytics_created_at ON public.surprise_analytics(created_at DESC);
