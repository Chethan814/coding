-- DUAL ROUND & DEBUGGING MIGRATION

-- 1. Add starter_code to problems for Logical Error templates
ALTER TABLE public.problems 
ADD COLUMN IF NOT EXISTS starter_code text;

-- 2. Ensure type column exists (coding vs debugging)
-- Already exists in TypeScript model, but ensuring DB consistency
ALTER TABLE public.problems 
ADD COLUMN IF NOT EXISTS type text DEFAULT 'coding';

-- 3. Add round duration metadata to events if needed
-- (Calculated in app logic, but useful for admin overrides)
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS round1_duration_mins integer DEFAULT 60,
ADD COLUMN IF NOT EXISTS break_duration_mins integer DEFAULT 5,
ADD COLUMN IF NOT EXISTS round2_duration_mins integer DEFAULT 30;
