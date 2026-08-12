DROP POLICY IF EXISTS "Booked slots are visible" ON public.bookings;
REVOKE SELECT ON public.bookings FROM anon;

CREATE OR REPLACE FUNCTION public.taken_slots(_link_id uuid)
RETURNS TABLE (starts_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.starts_at FROM public.bookings b
  WHERE b.link_id = _link_id AND b.status <> 'cancelled'
$$;

GRANT EXECUTE ON FUNCTION public.taken_slots(uuid) TO anon, authenticated;