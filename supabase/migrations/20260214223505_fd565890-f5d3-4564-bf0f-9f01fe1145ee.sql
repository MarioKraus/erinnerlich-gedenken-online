
-- Fix the view to use SECURITY INVOKER instead of SECURITY DEFINER
DROP VIEW IF EXISTS public.condolences_public;

CREATE VIEW public.condolences_public
WITH (security_invoker = true)
AS
SELECT id, obituary_id, author_name, message, is_approved, created_at
FROM public.condolences
WHERE is_approved = true;

GRANT SELECT ON public.condolences_public TO anon, authenticated;
