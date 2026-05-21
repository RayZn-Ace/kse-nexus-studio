UPDATE public.posts_log
SET status='failed', error_message='CPU Time exceeded (Edge Function timeout) — slides waren zu hochauflösend'
WHERE status='pending' AND created_at < now() - interval '1 minute';
