-- Migration: 20261123_scale_and_performance_indexes.sql
-- Optimizes query performance for 100,000+ guests and high-volume RSVP traffic.

begin;

-- 1. Instant B-Tree functional index for guest invite code lookups (case-insensitive & trimmed)
create index if not exists idx_guests_invite_code_lower 
  on public.guests (lower(btrim(invite_code)));

-- 2. Compound index for dashboard guest list filtering and ordering by wedding
create index if not exists idx_guests_wedding_created 
  on public.guests (wedding_id, created_at desc);

-- 3. Compound index for RSVP response tracking per wedding
create index if not exists idx_rsvps_wedding_submitted 
  on public.rsvps (wedding_id, submitted_at desc);

-- 4. Functional index for fast RSVP submissions and joins on invite_code
create index if not exists idx_rsvps_invite_code_lower 
  on public.rsvps (lower(btrim(invite_code)));

-- 5. Compound index for event timeline rendering
create index if not exists idx_events_wedding_sort 
  on public.events (wedding_id, sort_order);

commit;
