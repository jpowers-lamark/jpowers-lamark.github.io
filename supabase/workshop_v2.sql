-- Search Everywhere Learning Lab v2.0
-- Run this entire file once in the Supabase SQL Editor.
-- It creates new v2 tables and does not delete or modify the v1 workshop data.

create extension if not exists pgcrypto;

create table if not exists public.se_workshop_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null default 'Search Everywhere Learning Lab',
  facilitator_id uuid not null references auth.users(id) on delete cascade,
  current_stage integer not null default 0,
  timer_ends_at timestamptz,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.se_workshop_participants (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.se_workshop_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 60),
  color text not null default '#14532d',
  role text not null default 'participant' check (role in ('facilitator','participant')),
  squad text not null default 'auto' check (squad in ('auto','breezy','kp','observer')),
  joined_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique(room_id, user_id)
);

create table if not exists public.se_workshop_items (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.se_workshop_rooms(id) on delete cascade,
  item_type text not null,
  stage_key text not null default '',
  client_key text not null default '',
  created_by uuid not null references auth.users(id) on delete cascade,
  author_name text not null default '',
  content jsonb not null default '{}'::jsonb,
  position_x numeric not null default 20,
  position_y numeric not null default 20,
  sort_order numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.se_workshop_votes (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.se_workshop_rooms(id) on delete cascade,
  item_id uuid not null references public.se_workshop_items(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  vote_type text not null default 'upvote',
  value numeric not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(item_id, user_id, vote_type)
);

create index if not exists se_workshop_participants_room_idx on public.se_workshop_participants(room_id);
create index if not exists se_workshop_items_room_idx on public.se_workshop_items(room_id);
create index if not exists se_workshop_items_type_idx on public.se_workshop_items(room_id, item_type);
create index if not exists se_workshop_votes_room_idx on public.se_workshop_votes(room_id);
create index if not exists se_workshop_votes_item_idx on public.se_workshop_votes(item_id);

create or replace function public.se_touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists se_rooms_touch_updated_at on public.se_workshop_rooms;
create trigger se_rooms_touch_updated_at
before update on public.se_workshop_rooms
for each row execute function public.se_touch_updated_at();

drop trigger if exists se_items_touch_updated_at on public.se_workshop_items;
create trigger se_items_touch_updated_at
before update on public.se_workshop_items
for each row execute function public.se_touch_updated_at();

drop trigger if exists se_votes_touch_updated_at on public.se_workshop_votes;
create trigger se_votes_touch_updated_at
before update on public.se_workshop_votes
for each row execute function public.se_touch_updated_at();

create or replace function public.se_is_room_member(target_room uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.se_workshop_participants p
    where p.room_id = target_room
      and p.user_id = auth.uid()
  ) or exists (
    select 1
    from public.se_workshop_rooms r
    where r.id = target_room
      and r.facilitator_id = auth.uid()
  );
$$;

create or replace function public.se_is_room_facilitator(target_room uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.se_workshop_rooms r
    where r.id = target_room
      and r.facilitator_id = auth.uid()
  );
$$;

grant execute on function public.se_is_room_member(uuid) to authenticated;
grant execute on function public.se_is_room_facilitator(uuid) to authenticated;

alter table public.se_workshop_rooms enable row level security;
alter table public.se_workshop_participants enable row level security;
alter table public.se_workshop_items enable row level security;
alter table public.se_workshop_votes enable row level security;

drop policy if exists "Authenticated users can create rooms" on public.se_workshop_rooms;
create policy "Authenticated users can create rooms"
on public.se_workshop_rooms for insert
to authenticated
with check (facilitator_id = auth.uid());

drop policy if exists "Authenticated users can locate rooms by code" on public.se_workshop_rooms;
create policy "Authenticated users can locate rooms by code"
on public.se_workshop_rooms for select
to authenticated
using (true);

drop policy if exists "Facilitators can update rooms" on public.se_workshop_rooms;
create policy "Facilitators can update rooms"
on public.se_workshop_rooms for update
to authenticated
using (facilitator_id = auth.uid())
with check (facilitator_id = auth.uid());

drop policy if exists "Users can join rooms as themselves" on public.se_workshop_participants;
create policy "Users can join rooms as themselves"
on public.se_workshop_participants for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Room members can view participants" on public.se_workshop_participants;
create policy "Room members can view participants"
on public.se_workshop_participants for select
to authenticated
using (public.se_is_room_member(room_id) or user_id = auth.uid());

drop policy if exists "Users can update their participant profile" on public.se_workshop_participants;
create policy "Users can update their participant profile"
on public.se_workshop_participants for update
to authenticated
using (user_id = auth.uid() or public.se_is_room_facilitator(room_id))
with check (user_id = auth.uid() or public.se_is_room_facilitator(room_id));

drop policy if exists "Room members can view items" on public.se_workshop_items;
create policy "Room members can view items"
on public.se_workshop_items for select
to authenticated
using (public.se_is_room_member(room_id));

drop policy if exists "Room members can create items" on public.se_workshop_items;
create policy "Room members can create items"
on public.se_workshop_items for insert
to authenticated
with check (created_by = auth.uid() and public.se_is_room_member(room_id));

drop policy if exists "Creators or facilitators can update items" on public.se_workshop_items;
create policy "Creators or facilitators can update items"
on public.se_workshop_items for update
to authenticated
using (created_by = auth.uid() or public.se_is_room_facilitator(room_id))
with check (created_by = auth.uid() or public.se_is_room_facilitator(room_id));

drop policy if exists "Creators or facilitators can delete items" on public.se_workshop_items;
create policy "Creators or facilitators can delete items"
on public.se_workshop_items for delete
to authenticated
using (created_by = auth.uid() or public.se_is_room_facilitator(room_id));

drop policy if exists "Room members can view votes" on public.se_workshop_votes;
create policy "Room members can view votes"
on public.se_workshop_votes for select
to authenticated
using (public.se_is_room_member(room_id));

drop policy if exists "Room members can create their votes" on public.se_workshop_votes;
create policy "Room members can create their votes"
on public.se_workshop_votes for insert
to authenticated
with check (user_id = auth.uid() and public.se_is_room_member(room_id));

drop policy if exists "Users can update their votes" on public.se_workshop_votes;
create policy "Users can update their votes"
on public.se_workshop_votes for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can delete their votes" on public.se_workshop_votes;
create policy "Users can delete their votes"
on public.se_workshop_votes for delete
to authenticated
using (user_id = auth.uid());

grant select, insert, update, delete on public.se_workshop_rooms to authenticated;
grant select, insert, update, delete on public.se_workshop_participants to authenticated;
grant select, insert, update, delete on public.se_workshop_items to authenticated;
grant select, insert, update, delete on public.se_workshop_votes to authenticated;

-- Add the v2 tables to Supabase Realtime without failing if they are already present.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'se_workshop_rooms'
  ) then alter publication supabase_realtime add table public.se_workshop_rooms; end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'se_workshop_participants'
  ) then alter publication supabase_realtime add table public.se_workshop_participants; end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'se_workshop_items'
  ) then alter publication supabase_realtime add table public.se_workshop_items; end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'se_workshop_votes'
  ) then alter publication supabase_realtime add table public.se_workshop_votes; end if;
end $$;

-- Replica identity full improves update payload reliability for live clients.
alter table public.se_workshop_rooms replica identity full;
alter table public.se_workshop_participants replica identity full;
alter table public.se_workshop_items replica identity full;
alter table public.se_workshop_votes replica identity full;
