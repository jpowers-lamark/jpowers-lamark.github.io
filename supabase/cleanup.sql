-- Optional monthly cleanup for internal workshop data.
delete from public.workshop_rooms where created_at < now() - interval '45 days';
delete from auth.users where is_anonymous is true and created_at < now() - interval '45 days';
