DROP POLICY IF EXISTS "Active booking links are public" ON public.booking_links;

CREATE POLICY "Visitors can view active booking links"
ON public.booking_links
FOR SELECT
TO anon
USING (is_active = true);

CREATE POLICY "Admins can view all booking links"
ON public.booking_links
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;

REVOKE ALL ON FUNCTION public.touch_mission_config() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.touch_mission_config() TO service_role;

REVOKE ALL ON FUNCTION public.taken_slots(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.taken_slots(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.taken_slots(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.taken_slots(uuid) TO service_role;