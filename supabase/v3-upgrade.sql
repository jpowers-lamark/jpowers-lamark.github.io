-- Search Everywhere Experience Lab v3.0.0
-- Run this once in the Supabase SQL Editor before publishing v3.
-- This migration is non-destructive. It expands the allowed workshop item types
-- while preserving existing rooms, participants, cards, votes, and audit data.

begin;

alter table public.workshop_items
  drop constraint if exists workshop_items_item_type_check;

alter table public.workshop_items
  add constraint workshop_items_item_type_check
  check (item_type in (
    'poll',
    'cognitive_profile',
    'knowledge_answer',
    'journey_prediction',
    'journey',
    'board',
    'audit',
    'wheel_response',
    'auction',
    'connection',
    'shock',
    'strategy',
    'rating',
    'takeaway',
    'challenge',
    'activity'
  ));

commit;

-- Verification: the returned definition should include cognitive_profile,
-- knowledge_answer, journey_prediction, and wheel_response.
select pg_get_constraintdef(oid) as item_type_constraint
from pg_constraint
where conrelid = 'public.workshop_items'::regclass
  and conname = 'workshop_items_item_type_check';
