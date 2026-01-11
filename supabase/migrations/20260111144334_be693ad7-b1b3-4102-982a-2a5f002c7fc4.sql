-- Add admin moderation policies for condolences
-- Admins can update condolences (for approval)
CREATE POLICY "Admins can update condolences"
ON public.condolences
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can delete condolences (for moderation)
CREATE POLICY "Admins can delete condolences"
ON public.condolences
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can view all condolences (including unapproved)
CREATE POLICY "Admins can view all condolences"
ON public.condolences
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Add admin moderation policies for candles
-- Admins can update candles
CREATE POLICY "Admins can update candles"
ON public.candles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can delete candles (for moderation)
CREATE POLICY "Admins can delete candles"
ON public.candles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));