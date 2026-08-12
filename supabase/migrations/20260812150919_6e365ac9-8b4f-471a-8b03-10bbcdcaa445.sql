GRANT SELECT ON public.booking_links TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.booking_links TO authenticated;
GRANT ALL ON public.booking_links TO service_role;
GRANT INSERT ON public.bookings TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
CREATE POLICY "Booked slots are visible" ON public.bookings FOR SELECT TO anon USING (true);