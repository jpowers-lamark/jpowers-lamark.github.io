-- Lamark Search Everywhere Lab
-- Run this file once in Supabase SQL Editor, then enable Anonymous Sign-Ins.

create extension if not exists pgcrypto;

create table if not exists public.workshop_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z2-9]{6,8}$'),
  title text not null default 'Search Everywhere: The Decision Journey Lab' check (char_length(title) between 1 and 120),
  facilitator_id uuid not null references auth.users(id) on delete cascade,
  active_stage integer not null default 0 check (active_stage between 0 and 30),
  active_client text not null default 'both' check (active_client in ('breezy','kp','both')),
  timer jsonb not null default '{"running":false,"remaining":0,"endsAt":null,"label":"Activity timer"}'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workshop_members (
  room_id uuid not null references public.workshop_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 36),
  team text not null default 'auto' check (team in ('auto','breezy','kp','facilitator')),
  color text not null default '#2864dc' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  role text not null default 'participant' check (role in ('participant','facilitator')),
  joined_at timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  primary key (room_id, user_id)
);

create table if not exists public.workshop_items (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.workshop_rooms(id) on delete cascade,
  item_type text not null check (item_type in (
    'poll','journey','board','audit','auction','connection','shock','strategy','rating','takeaway','challenge','activity'
  )),
  owner_id uuid not null references auth.users(id) on delete cascade,
  client text check (client is null or client in ('breezy','kp','both')),
  stage text,
  platform text,
  dedupe_key text,
  x numeric,
  y numeric,
  payload jsonb not null default '{}'::jsonb check (octet_length(payload::text) <= 30000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists workshop_items_owner_dedupe
  on public.workshop_items (room_id, item_type, owner_id, dedupe_key)
  where dedupe_key is not null;
create index if not exists workshop_items_room_type on public.workshop_items (room_id, item_type);
create index if not exists workshop_items_room_client on public.workshop_items (room_id, client);

create table if not exists public.workshop_votes (
  room_id uuid not null references public.workshop_rooms(id) on delete cascade,
  target_key text not null check (char_length(target_key) between 1 and 120),
  user_id uuid not null references auth.users(id) on delete cascade,
  value smallint not null default 1 check (value between -1 and 5),
  created_at timestamptz not null default now(),
  primary key (room_id, target_key, user_id)
);
create index if not exists workshop_votes_room_target on public.workshop_votes (room_id, target_key);

create or replace function public.touch_updated_at()
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

drop trigger if exists workshop_rooms_touch_updated_at on public.workshop_rooms;
create trigger workshop_rooms_touch_updated_at before update on public.workshop_rooms
for each row execute function public.touch_updated_at();

drop trigger if exists workshop_items_touch_updated_at on public.workshop_items;
create trigger workshop_items_touch_updated_at before update on public.workshop_items
for each row execute function public.touch_updated_at();

create or replace function public.is_workshop_member(target_room uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.workshop_members m
    where m.room_id = target_room and m.user_id = auth.uid()
  );
$$;

create or replace function public.is_workshop_facilitator(target_room uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.workshop_rooms r
    where r.id = target_room and r.facilitator_id = auth.uid()
  );
$$;

create or replace function public.create_workshop_room(
  p_code text,
  p_display_name text,
  p_team text default 'facilitator',
  p_color text default '#2864dc'
)
returns setof public.workshop_rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  created_room public.workshop_rooms;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_code !~ '^[A-Z2-9]{6,8}$' then raise exception 'Invalid workshop code'; end if;
  if char_length(trim(p_display_name)) not between 1 and 36 then raise exception 'Invalid display name'; end if;

  insert into public.workshop_rooms (code, facilitator_id)
  values (upper(p_code), auth.uid())
  returning * into created_room;

  insert into public.workshop_members (room_id, user_id, display_name, team, color, role)
  values (created_room.id, auth.uid(), trim(p_display_name), 'facilitator', p_color, 'facilitator')
  on conflict (room_id, user_id) do update
    set display_name = excluded.display_name, team = excluded.team, color = excluded.color, role = 'facilitator', last_seen = now();

  return next created_room;
end;
$$;

create or replace function public.join_workshop_room(
  p_code text,
  p_display_name text,
  p_team text default 'auto',
  p_color text default '#2864dc'
)
returns setof public.workshop_rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  target_room public.workshop_rooms;
  current_count integer;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if char_length(trim(p_display_name)) not between 1 and 36 then raise exception 'Invalid display name'; end if;

  select * into target_room from public.workshop_rooms where code = upper(p_code);
  if target_room.id is null then raise exception 'Workshop room not found'; end if;

  select count(*) into current_count from public.workshop_members where room_id = target_room.id;
  if current_count >= 12 and not exists (
    select 1 from public.workshop_members where room_id = target_room.id and user_id = auth.uid()
  ) then
    raise exception 'Workshop room is full';
  end if;

  insert into public.workshop_members (room_id, user_id, display_name, team, color, role)
  values (target_room.id, auth.uid(), trim(p_display_name),
    case when p_team in ('auto','breezy','kp') then p_team else 'auto' end,
    p_color, 'participant')
  on conflict (room_id, user_id) do update
    set display_name = excluded.display_name, team = excluded.team, color = excluded.color, last_seen = now();

  return next target_room;
end;
$$;

grant execute on function public.create_workshop_room(text,text,text,text) to authenticated;
grant execute on function public.join_workshop_room(text,text,text,text) to authenticated;
grant execute on function public.is_workshop_member(uuid) to authenticated;
grant execute on function public.is_workshop_facilitator(uuid) to authenticated;

alter table public.workshop_rooms enable row level security;
alter table public.workshop_members enable row level security;
alter table public.workshop_items enable row level security;
alter table public.workshop_votes enable row level security;

drop policy if exists rooms_select_members on public.workshop_rooms;
create policy rooms_select_members on public.workshop_rooms for select to authenticated
using (public.is_workshop_member(id));

drop policy if exists rooms_update_facilitator on public.workshop_rooms;
create policy rooms_update_facilitator on public.workshop_rooms for update to authenticated
using (facilitator_id = auth.uid()) with check (facilitator_id = auth.uid());

drop policy if exists members_select_room on public.workshop_members;
create policy members_select_room on public.workshop_members for select to authenticated
using (public.is_workshop_member(room_id));

drop policy if exists members_update_self on public.workshop_members;
create policy members_update_self on public.workshop_members for update to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists items_select_members on public.workshop_items;
create policy items_select_members on public.workshop_items for select to authenticated
using (public.is_workshop_member(room_id));

drop policy if exists items_insert_members on public.workshop_items;
create policy items_insert_members on public.workshop_items for insert to authenticated
with check (public.is_workshop_member(room_id) and owner_id = auth.uid());

drop policy if exists items_update_owner_or_facilitator on public.workshop_items;
create policy items_update_owner_or_facilitator on public.workshop_items for update to authenticated
using (owner_id = auth.uid() or public.is_workshop_facilitator(room_id))
with check (public.is_workshop_member(room_id));

drop policy if exists items_delete_owner_or_facilitator on public.workshop_items;
create policy items_delete_owner_or_facilitator on public.workshop_items for delete to authenticated
using (owner_id = auth.uid() or public.is_workshop_facilitator(room_id));

drop policy if exists votes_select_members on public.workshop_votes;
create policy votes_select_members on public.workshop_votes for select to authenticated
using (public.is_workshop_member(room_id));

drop policy if exists votes_insert_self on public.workshop_votes;
create policy votes_insert_self on public.workshop_votes for insert to authenticated
with check (public.is_workshop_member(room_id) and user_id = auth.uid());

drop policy if exists votes_update_self on public.workshop_votes;
create policy votes_update_self on public.workshop_votes for update to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists votes_delete_self on public.workshop_votes;
create policy votes_delete_self on public.workshop_votes for delete to authenticated
using (user_id = auth.uid());

grant select, update on public.workshop_rooms to authenticated;
grant select, update on public.workshop_members to authenticated;
grant select, insert, update, delete on public.workshop_items to authenticated;
grant select, insert, update, delete on public.workshop_votes to authenticated;

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'workshop_rooms') then
    alter publication supabase_realtime add table public.workshop_rooms;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'workshop_items') then
    alter publication supabase_realtime add table public.workshop_items;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'workshop_votes') then
    alter publication supabase_realtime add table public.workshop_votes;
  end if;
end $$;

alter table public.workshop_rooms replica identity full;
alter table public.workshop_items replica identity full;
alter table public.workshop_votes replica identity full;
