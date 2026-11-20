-- =========================================================================
-- Migration: 20261120_promo_codes_and_snapshots.sql
-- Description: Promo code system, frozen financial snapshots, 10-digit phone
--              normalization, RLS lockdown, and updated RPCs.
-- =========================================================================

begin;

-- 1. Create promo_codes table
create table if not exists public.promo_codes (
  code text primary key,
  discount_type text not null check (discount_type in ('FLAT', 'PERCENTAGE')),
  discount_value_paise bigint not null check (discount_value_paise > 0),
  max_discount_cap_paise bigint,
  applicable_package_code text references public.onboarding_packages(package_code),
  allowed_phones text[],
  is_stackable boolean not null default false,
  usage_limit int,
  used_count int not null default 0,
  valid_until timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- RLS Lockdown on promo_codes (Zero public direct access, only via RPC or Admin)
alter table public.promo_codes enable row level security;
revoke all on public.promo_codes from public, anon;
grant select, insert, update, delete on public.promo_codes to service_role;

-- Allow authenticated admins with MFA (AAL2) to view and manage promo codes
drop policy if exists "Admins can view and manage promo codes" on public.promo_codes;
create policy "Admins can view and manage promo codes"
  on public.promo_codes
  for all
  to authenticated
  using (
    exists (
      select 1 from public.admin_roles ar
      where ar.user_id = auth.uid()
        and ar.is_active = true
    )
    and (auth.jwt() ->> 'aal') = 'aal2'
  );

-- Seed Sample Promo Codes for Testing / Launch
insert into public.promo_codes (
  code, discount_type, discount_value_paise, max_discount_cap_paise,
  applicable_package_code, allowed_phones, is_stackable, usage_limit, is_active
)
values
  ('NIKAH500', 'FLAT', 50000, null, null, null, false, 100, true),
  ('VIP1000', 'FLAT', 100000, null, 'standard', null, true, 50, true),
  ('SPECIAL10', 'PERCENTAGE', 10, 100000, null, null, false, null, true)
on conflict (code) do nothing;

-- 2. Add Snapshot Columns to onboarding_orders
alter table public.onboarding_orders
  add column if not exists list_price_paise bigint,
  add column if not exists global_discount_paise bigint default 0,
  add column if not exists applied_promo_code text references public.promo_codes(code),
  add column if not exists promo_discount_paise bigint default 0;

-- 3. Package-Aware Backfill for Existing Orders (Preserves exact financial history)
update public.onboarding_orders o
set
  list_price_paise = coalesce(p.list_price_paise, o.payable_total_paise),
  global_discount_paise = greatest(coalesce(p.list_price_paise, o.payable_total_paise) - o.payable_total_paise, 0),
  promo_discount_paise = 0
from public.onboarding_packages p
where o.package_code = p.package_code
  and o.list_price_paise is null;

-- Fallback for any legacy orders without matching package
update public.onboarding_orders
set
  list_price_paise = payable_total_paise,
  global_discount_paise = 0,
  promo_discount_paise = 0
where list_price_paise is null;

-- 4. Lightweight Promo Preview RPC (Public callable with 10-digit phone normalization)
create or replace function public.validate_promo_preview(
  p_package_code text,
  p_promo_code text,
  p_phone text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pkg record;
  v_promo record;
  v_disc_paise bigint := 0;
  v_normalized_input_phone text;
begin
  select * into v_pkg
  from public.onboarding_packages
  where package_code = p_package_code and active = true;

  if not found then
    return jsonb_build_object('valid', false, 'message', 'Invalid or unavailable package selected.');
  end if;

  select * into v_promo
  from public.promo_codes
  where code = upper(trim(p_promo_code)) and is_active = true;

  if not found then
    return jsonb_build_object('valid', false, 'message', 'Invalid or inactive promo code.');
  end if;

  if v_promo.valid_until is not null and v_promo.valid_until < now() then
    return jsonb_build_object('valid', false, 'message', 'Promo code has expired.');
  end if;

  if v_promo.usage_limit is not null and v_promo.used_count >= v_promo.usage_limit then
    return jsonb_build_object('valid', false, 'message', 'Promo code usage limit has been reached.');
  end if;

  if v_promo.applicable_package_code is not null and v_promo.applicable_package_code <> p_package_code then
    return jsonb_build_object('valid', false, 'message', 'This promo code is not valid for the selected package.');
  end if;

  -- 10-Digit Phone Normalization Check
  if v_promo.allowed_phones is not null and array_length(v_promo.allowed_phones, 1) > 0 then
    v_normalized_input_phone := right(regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g'), 10);
    if v_normalized_input_phone = '' or not exists (
      select 1 from unnest(v_promo.allowed_phones) allowed
      where right(regexp_replace(allowed, '[^0-9]', '', 'g'), 10) = v_normalized_input_phone
    ) then
      return jsonb_build_object('valid', false, 'message', 'This promo code is not applicable for your phone number.');
    end if;
  end if;

  -- Calculate discount
  if v_promo.discount_type = 'FLAT' then
    v_disc_paise := v_promo.discount_value_paise;
  else
    v_disc_paise := round((v_pkg.list_price_paise * v_promo.discount_value_paise) / 100.0);
    if v_promo.max_discount_cap_paise is not null and v_disc_paise > v_promo.max_discount_cap_paise then
      v_disc_paise := v_promo.max_discount_cap_paise;
    end if;
  end if;

  return jsonb_build_object(
    'valid', true,
    'code', v_promo.code,
    'discount_type', v_promo.discount_type,
    'promo_discount_paise', v_disc_paise,
    'is_stackable', v_promo.is_stackable,
    'message', 'Promo code applied successfully!'
  );
end;
$$;

revoke all on function public.validate_promo_preview(text, text, text) from public;
grant execute on function public.validate_promo_preview(text, text, text) to anon, authenticated, service_role;

-- 5. Updated provision_new_customer with Promo Code Processing & Concurrency Lock
create or replace function public.provision_new_customer(
  p_input jsonb,
  p_idempotency_key uuid,
  p_dashboard_token text,
  p_client_fingerprint text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_existing public.onboarding_orders%rowtype;
  v_package public.onboarding_packages%rowtype;
  v_wedding_id text;
  v_source_id text;
  v_customer_id text;
  v_order_reference text;
  v_slug text;
  v_preview_guest_code text;
  v_payment_id uuid;
  v_email text;
  v_customer_name text;
  v_phone text;
  v_whatsapp text;
  v_city text;
  v_bride text;
  v_groom text;
  v_template text;
  v_theme text;
  v_theme_color text;
  v_payment_mode text;
  v_payment_status text;
  v_utr text;
  v_payable bigint;
  v_advance bigint;
  v_events jsonb;
  v_event jsonb;
  v_now timestamptz := now();
  v_access_hash text;
  v_request_hash text;
  v_outbox_event_id uuid;
  v_rate_count integer;

  -- Promo Code Variables
  v_promo_code text;
  v_promo public.promo_codes%rowtype;
  v_global_disc bigint := 0;
  v_promo_disc bigint := 0;
  v_normalized_phone text;
begin
  if p_idempotency_key is null then
    raise exception using errcode = '22023', message = 'Invalid request.';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_idempotency_key::text, 0)
  );

  if p_dashboard_token is null or length(p_dashboard_token) < 32
     or length(p_dashboard_token) > 200 then
    raise exception using errcode = '22023', message = 'Invalid request.';
  end if;

  v_request_hash := encode(extensions.digest(convert_to(p_input::text, 'UTF8'), 'sha256'), 'hex');
  select * into v_existing
  from public.onboarding_orders
  where idempotency_key = p_idempotency_key;
  if found then
    if v_existing.request_hash <> v_request_hash then
      raise exception using errcode = '22023', message = 'This request key was already used for different order details.';
    end if;
    return jsonb_build_object(
      'success', true,
      'replayed', true,
      'order_reference', v_existing.order_reference,
      'customer_id', v_existing.customer_id,
      'wedding_id', v_existing.wedding_id,
      'preview_guest_code', (
        select g.invite_code
        from public.guests g
        where g.wedding_id = v_existing.wedding_id and g.category = 'preview'
        order by g.created_at limit 1
      ),
      'payment_status', v_existing.payment_status,
      'provisioning_status', v_existing.provisioning_status
    );
  end if;

  if p_client_fingerprint is null or length(p_client_fingerprint) < 32 then
    raise exception using errcode = '22023', message = 'Invalid request.';
  end if;

  insert into public.onboarding_rate_limits (fingerprint, window_started_at, request_count)
  values (p_client_fingerprint, date_trunc('hour', v_now), 1)
  on conflict (fingerprint, window_started_at)
  do update set request_count = public.onboarding_rate_limits.request_count + 1
  returning request_count into v_rate_count;
  if v_rate_count > 5 then
    raise exception using errcode = 'P0001', message = 'Too many requests. Please try again later.';
  end if;
  delete from public.onboarding_rate_limits
  where window_started_at < date_trunc('hour', v_now) - interval '24 hours';

  v_email := lower(btrim(coalesce(p_input->>'email', '')));
  v_customer_name := btrim(coalesce(p_input->>'customer_name', ''));
  v_phone := regexp_replace(coalesce(p_input->>'phone', ''), '[^0-9+]', '', 'g');
  v_whatsapp := regexp_replace(coalesce(p_input->>'whatsapp_phone', ''), '[^0-9+]', '', 'g');
  v_city := btrim(coalesce(p_input->>'city', ''));
  v_bride := btrim(coalesce(p_input->>'bride_name', ''));
  v_groom := btrim(coalesce(p_input->>'groom_name', ''));
  v_template := btrim(coalesce(p_input->>'template_style', ''));
  v_theme := btrim(coalesce(p_input->>'theme_name', ''));
  v_payment_mode := lower(btrim(coalesce(p_input->>'payment_mode', '')));
  v_utr := nullif(btrim(coalesce(p_input->>'utr', '')), '');
  v_events := p_input->'events';

  if length(v_customer_name) not between 2 and 120
     or v_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
     or length(v_phone) not between 8 and 16
     or length(v_city) not between 1 and 100
     or length(v_bride) not between 1 and 100
     or length(v_groom) not between 1 and 100
     or v_template !~ '^template-(0[1-9]|1[0-5])$'
     or v_payment_mode not in ('upi', 'cash')
     or coalesce(jsonb_typeof(v_events), '') <> 'array' then
    raise exception using errcode = '22023', message = 'Please check the required onboarding fields.';
  end if;
  if jsonb_array_length(v_events) not between 1 and 40 then
    raise exception using errcode = '22023', message = 'Please provide between 1 and 40 events.';
  end if;
  if coalesce(p_input->>'preferred_contact', 'whatsapp') not in ('whatsapp', 'phone', 'email') then
    raise exception using errcode = '22023', message = 'Choose a valid contact preference.';
  end if;

  select * into v_package
  from public.onboarding_packages
  where package_code = p_input->>'package_code'
    and active
  for share;
  if not found then
    raise exception using errcode = '22023', message = 'The selected package is unavailable.';
  end if;

  v_global_disc := v_package.discount_paise;
  v_promo_disc := 0;
  v_promo_code := upper(nullif(btrim(coalesce(p_input->>'promo_code', '')), ''));

  -- Promo Code Concurrency Lock and Validation
  if v_promo_code is not null then
    select * into v_promo
    from public.promo_codes
    where code = v_promo_code
      and is_active = true
    for update;

    if not found then
      raise exception using errcode = '22023', message = 'Invalid or inactive promo code.';
    end if;

    if v_promo.valid_until is not null and v_promo.valid_until < now() then
      raise exception using errcode = '22023', message = 'Promo code has expired.';
    end if;

    if v_promo.usage_limit is not null and v_promo.used_count >= v_promo.usage_limit then
      raise exception using errcode = '22023', message = 'Promo code usage limit has been reached.';
    end if;

    if v_promo.applicable_package_code is not null and v_promo.applicable_package_code <> v_package.package_code then
      raise exception using errcode = '22023', message = 'Promo code is not applicable for this package.';
    end if;

    -- 10-Digit Phone Normalization
    if v_promo.allowed_phones is not null and array_length(v_promo.allowed_phones, 1) > 0 then
      v_normalized_phone := right(regexp_replace(v_phone, '[^0-9]', '', 'g'), 10);
      if v_normalized_phone = '' or not exists (
        select 1 from unnest(v_promo.allowed_phones) allowed
        where right(regexp_replace(allowed, '[^0-9]', '', 'g'), 10) = v_normalized_phone
      ) then
        raise exception using errcode = '22023', message = 'Promo code is not valid for this mobile number.';
      end if;
    end if;

    -- Calculate promo discount
    if v_promo.discount_type = 'FLAT' then
      v_promo_disc := v_promo.discount_value_paise;
    else
      v_promo_disc := round((v_package.list_price_paise * v_promo.discount_value_paise) / 100.0);
      if v_promo.max_discount_cap_paise is not null and v_promo_disc > v_promo.max_discount_cap_paise then
        v_promo_disc := v_promo.max_discount_cap_paise;
      end if;
    end if;

    -- Override global discount if not stackable
    if not v_promo.is_stackable then
      v_global_disc := 0;
    end if;

    -- Increment usage count
    update public.promo_codes
    set used_count = used_count + 1
    where code = v_promo.code;
  end if;

  -- Net Payable and Advance Expected Rules
  v_payable := greatest(0, v_package.list_price_paise - v_global_disc - v_promo_disc);
  v_advance := least(v_package.advance_paise, v_payable);

  v_payment_status := case
    when v_payment_mode = 'upi' then 'Pending Verification'
    else 'Pending Cash Verification'
  end;

  for v_event in select value from jsonb_array_elements(v_events)
  loop
    if jsonb_typeof(v_event) <> 'object'
       or length(btrim(coalesce(v_event->>'event_name', ''))) not between 1 and 100
       or coalesce(v_event->>'event_date', '') !~ '^\d{4}-\d{2}-\d{2}$'
       or (v_event ? 'event_time' and nullif(v_event->>'event_time', '') is not null
           and (v_event->>'event_time') !~ '^\d{2}:\d{2}(:\d{2})?$')
       or length(coalesce(v_event->>'note', '')) > 500 then
      raise exception using errcode = '22023', message = 'One or more event details are invalid.';
    end if;
  end loop;

  v_wedding_id := gen_random_uuid()::text;
  v_source_id := 'W-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
  v_customer_id := 'C-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));
  v_order_reference := 'ORD-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));
  v_slug := lower(v_source_id) || '-' || lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
  v_preview_guest_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 24));
  v_access_hash := encode(extensions.digest(convert_to(p_dashboard_token, 'UTF8'), 'sha256'), 'hex');

  select t.primary_color into v_theme_color
  from public.themes t
  where t.theme_name = v_theme;

  insert into public.weddings (
    id, source_id, couple_name, bride_name, groom_name, event_date,
    template_style, theme_name, theme_color
  )
  values (
    v_wedding_id,
    v_source_id,
    v_bride || ' & ' || v_groom,
    v_bride,
    v_groom,
    (p_input->>'event_date')::date,
    v_template,
    v_theme,
    v_theme_color
  );

  insert into public.wedding_details (
    wedding_id, status, host_name, bride_full, groom_full, bride_parents,
    groom_parents, ceremony_title, invocation, ceremony_time, venue_title,
    venue, address, map_url, slug, image1, image2, image3, image4, image5, music_url
  )
  values (
    v_wedding_id,
    'active',
    nullif(btrim(coalesce(p_input->>'host_name', '')), ''),
    v_bride,
    v_groom,
    nullif(btrim(coalesce(p_input->>'bride_parents', '')), ''),
    nullif(btrim(coalesce(p_input->>'groom_parents', '')), ''),
    nullif(btrim(coalesce(p_input->>'ceremony_title', '')), ''),
    nullif(btrim(coalesce(p_input->>'invocation', '')), ''),
    nullif(p_input->>'ceremony_time', '')::time,
    nullif(btrim(coalesce(p_input->>'venue_title', '')), ''),
    nullif(btrim(coalesce(p_input->>'venue', p_input->>'venue_name', p_input->>'banquet_name', '')), ''),
    nullif(btrim(coalesce(p_input->>'address', p_input->>'venue_address', p_input->>'location', '')), ''),
    nullif(btrim(coalesce(p_input->>'map_url', '')), ''),
    v_slug,
    nullif(btrim(coalesce(p_input->>'groom_photo', p_input->>'groom_photo_url', p_input->>'photo_groom', p_input->>'image1', '')), ''),
    nullif(btrim(coalesce(p_input->>'bride_photo', p_input->>'bride_photo_url', p_input->>'photo_bride', p_input->>'image2', '')), ''),
    nullif(btrim(coalesce(p_input->>'couple_photo', p_input->>'couple_photo_url', p_input->>'hero_image', p_input->>'image3', '')), ''),
    nullif(btrim(coalesce(p_input->>'venue_photo', p_input->>'venue_photo_url', p_input->>'banquet_photo', p_input->>'image4', '')), ''),
    nullif(btrim(coalesce(p_input->>'landing_background', p_input->>'landingBackground', p_input->>'page_background', p_input->>'image5', '')), ''),
    nullif(btrim(coalesce(p_input->>'music_url', p_input->>'audio_url', p_input->>'soundtrack_url', '')), '')
  );

  insert into public.guests (
    wedding_id, invite_code, guest_name, family_members, category, with_family
  )
  values (
    v_wedding_id, v_preview_guest_code, 'Sample Preview Guest', 1, 'preview', false
  );

  insert into public.events (
    wedding_id, sort_order, event_name, event_date, event_time, note
  )
  select v_wedding_id,
         ordinality::smallint,
         btrim(value->>'event_name'),
         (value->>'event_date')::date,
         nullif(value->>'event_time', '')::time,
         nullif(btrim(coalesce(value->>'note', '')), '')
  from jsonb_array_elements(v_events) with ordinality;

  insert into public.customers (
    customer_id, wedding_id, customer_name, phone, city, package,
    list_price_inr, discount_inr, advance_paid_inr, order_status,
    order_date, delivery_due, notes, email, whatsapp_phone, preferred_contact
  )
  values (
    v_customer_id,
    v_wedding_id,
    v_customer_name,
    v_phone,
    v_city,
    v_package.display_name,
    v_package.list_price_paise::numeric / 100,
    (v_global_disc + v_promo_disc)::numeric / 100,
    0,
    'Pending',
    current_date,
    nullif(p_input->>'delivery_due', '')::date,
    null,
    v_email,
    nullif(v_whatsapp, ''),
    nullif(btrim(coalesce(p_input->>'preferred_contact', '')), '')
  );

  insert into public.rsvp_contacts (
    wedding_id, sort_order, contact_name, phone, is_primary
  )
  values (
    v_wedding_id,
    1,
    v_customer_name,
    coalesce(nullif(v_whatsapp, ''), v_phone),
    true
  );

  -- Insert Order with Frozen Financial Snapshot
  insert into public.onboarding_orders (
    order_reference, idempotency_key, request_hash, customer_id, wedding_id, email,
    package_code, payment_mode, order_status, payment_status,
    payable_total_paise, advance_expected_paise, advance_verified_paise,
    list_price_paise, global_discount_paise, applied_promo_code, promo_discount_paise,
    access_token_hash, access_expires_at
  )
  values (
    v_order_reference,
    p_idempotency_key,
    v_request_hash,
    v_customer_id,
    v_wedding_id,
    v_email,
    v_package.package_code,
    v_payment_mode,
    'Pending',
    v_payment_status,
    v_payable,
    v_advance,
    0,
    v_package.list_price_paise,
    v_global_disc,
    v_promo_code,
    v_promo_disc,
    v_access_hash,
    v_now + interval '30 days'
  );

  insert into public.onboarding_access_tokens (
    order_reference, token_hash, expires_at
  )
  values (v_order_reference, v_access_hash, v_now + interval '30 days');

  insert into public.onboarding_payments (
    order_reference, customer_id, wedding_id, payment_mode,
    expected_amount_paise, claimed_amount_paise, verified_amount_paise,
    external_reference, payment_status
  )
  values (
    v_order_reference,
    v_customer_id,
    v_wedding_id,
    v_payment_mode,
    v_advance,
    case when v_payment_mode = 'upi' and v_utr is not null then v_advance else 0 end,
    0,
    case when v_payment_mode = 'upi' then v_utr else null end,
    v_payment_status
  )
  returning payment_id into v_payment_id;

  insert into public.notification_outbox (
    order_reference, event_type, payload
  )
  values (
    v_order_reference,
    'customer_order_confirmation',
    jsonb_build_object(
      'order_reference', v_order_reference,
      'customer_id', v_customer_id,
      'wedding_id', v_wedding_id,
      'wedding_slug', v_slug,
      'preview_guest_code', v_preview_guest_code,
      'customer_name', v_customer_name,
      'email', v_email,
      'phone', v_phone,
      'city', v_city,
      'bride_name', v_bride,
      'groom_name', v_groom,
      'event_date', p_input->>'event_date',
      'package_name', v_package.display_name,
      'list_price_paise', v_package.list_price_paise,
      'discount_paise', (v_global_disc + v_promo_disc),
      'promo_code', v_promo_code,
      'promo_discount_paise', v_promo_disc,
      'advance_expected_paise', v_advance,
      'advance_verified_paise', 0,
      'balance_paise', v_payable,
      'payment_mode', v_payment_mode,
      'payment_status', v_payment_status,
      'utr', v_utr,
      'dashboard_token', p_dashboard_token
    )
  )
  returning event_id into v_outbox_event_id;

  return jsonb_build_object(
    'success', true,
    'replayed', false,
    'order_reference', v_order_reference,
    'customer_id', v_customer_id,
    'wedding_id', v_wedding_id,
    'wedding_slug', v_slug,
    'preview_guest_code', v_preview_guest_code,
    'payment_status', v_payment_status,
    'provisioning_status', 'Provisioned',
    'notification_status', 'pending',
    'notification_event_id', v_outbox_event_id,
    'payment_id', v_payment_id,
    'list_price_paise', v_package.list_price_paise,
    'discount_paise', (v_global_disc + v_promo_disc),
    'promo_discount_paise', v_promo_disc,
    'advance_expected_paise', v_advance,
    'payable_total_paise', v_payable
  );
exception
  when unique_violation then
    select * into v_existing
    from public.onboarding_orders
    where idempotency_key = p_idempotency_key;
    if found then
      if v_existing.request_hash <> v_request_hash then
        raise exception using errcode = '22023', message = 'This request key was already used for different order details.';
      end if;
      return jsonb_build_object(
        'success', true,
        'replayed', true,
        'order_reference', v_existing.order_reference,
        'customer_id', v_existing.customer_id,
        'wedding_id', v_existing.wedding_id,
        'preview_guest_code', (
          select g.invite_code
          from public.guests g
          where g.wedding_id = v_existing.wedding_id and g.category = 'preview'
          order by g.created_at limit 1
        ),
        'payment_status', v_existing.payment_status,
        'provisioning_status', v_existing.provisioning_status
      );
    end if;
    raise exception using errcode = 'P0001', message = 'Unable to provision order; retry with the same request key.';
end;
$$;

revoke all on function public.provision_new_customer(jsonb, uuid, text, text) from public, anon, authenticated;
grant execute on function public.provision_new_customer(jsonb, uuid, text, text) to service_role;

-- 6. Updated manage_customer_dashboard with Exact Financial Snapshot Output
create or replace function public.manage_customer_dashboard(
  p_order_reference text,
  p_action text,
  p_extra jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ref text := upper(btrim(coalesce(p_order_reference, '')));
  v_order public.onboarding_orders%rowtype;
  v_package public.onboarding_packages%rowtype;
  v_action text := lower(btrim(coalesce(p_action, 'load')));
  v_result jsonb;
  v_guest_id uuid;
  v_guest_id_text text;
begin
  if v_ref = '' then
    raise exception using errcode = '22023', message = 'Order reference is required.';
  end if;

  select * into v_order
  from public.onboarding_orders
  where order_reference = v_ref;

  if not found then
    raise exception using errcode = 'P0002', message = 'Order not found.';
  end if;

  select * into v_package
  from public.onboarding_packages
  where package_code = v_order.package_code;

  if v_action = 'load' then
    select jsonb_build_object(
      'order_reference', v_order.order_reference,
      'order_status', v_order.order_status,
      'payment_status', v_order.payment_status,
      'package_code', v_order.package_code,
      'package_name', coalesce(v_package.display_name, 'Standard Package'),
      'created_at', v_order.created_at,
      'payment_submitted_at', (
        select p.submitted_at from public.onboarding_payments p
        where p.order_reference = v_order.order_reference
        order by p.submitted_at desc limit 1
      ),
      'template_style', (
        select w.template_style from public.weddings w
        where w.id = v_order.wedding_id
      ),
      -- Financial Snapshot
      'list_price_paise', coalesce(v_order.list_price_paise, v_package.list_price_paise, 400000),
      'discount_paise', coalesce(v_order.global_discount_paise + v_order.promo_discount_paise, 0),
      'applied_promo_code', v_order.applied_promo_code,
      'promo_discount_paise', coalesce(v_order.promo_discount_paise, 0),
      'payable_total_paise', v_order.payable_total_paise,
      'advance_expected_paise', v_order.advance_expected_paise,
      'advance_verified_paise', v_order.advance_verified_paise,
      'balance_paise', greatest(0, v_order.payable_total_paise - v_order.advance_verified_paise),
      'wedding', (
        select jsonb_build_object(
          'id', w.id,
          'couple_name', w.couple_name,
          'bride_name', w.bride_name,
          'groom_name', w.groom_name,
          'event_date', w.event_date,
          'template_style', w.template_style,
          'theme_name', w.theme_name,
          'venue', wd.venue,
          'venue_title', wd.venue_title,
          'address', wd.address,
          'map_url', wd.map_url
        )
        from public.weddings w
        left join public.wedding_details wd on wd.wedding_id = w.id
        where w.id = v_order.wedding_id
      ),
      'events', (
        select coalesce(jsonb_agg(jsonb_build_object(
          'id', e.id,
          'event_name', e.event_name,
          'event_date', e.event_date,
          'event_time', e.event_time,
          'note', e.note
        ) order by e.sort_order), '[]'::jsonb)
        from public.events e
        where e.wedding_id = v_order.wedding_id
      ),
      'guests', (
        select coalesce(jsonb_agg(jsonb_build_object(
          'id', g.id,
          'guest_name', g.guest_name,
          'invite_code', g.invite_code,
          'family_members', g.family_members,
          'phone', g.phone,
          'category', g.category,
          'city_address', g.city_address,
          'with_family', g.with_family,
          'first_opened_at', g.first_opened_at,
          'last_opened_at', g.last_opened_at,
          'open_count', coalesce(g.open_count, 0)
        ) order by g.created_at), '[]'::jsonb)
        from public.guests g
        where g.wedding_id = v_order.wedding_id
      ),
      'rsvps', (
        select coalesce(jsonb_agg(jsonb_build_object(
          'id', r.id,
          'invite_code', r.invite_code,
          'status', r.status,
          'attending_count', r.attending_count,
          'wishes_message', r.wishes_message,
          'submitted_at', r.submitted_at
        ) order by r.submitted_at desc), '[]'::jsonb)
        from public.rsvps r
        where r.wedding_id = v_order.wedding_id
      )
    ) into v_result;

    return jsonb_build_object('success', true, 'dashboard', v_result);

  elsif v_action = 'delete_guest' then
    v_guest_id := (p_extra ->> 'guest_id')::uuid;
    if v_guest_id is null then
      raise exception using errcode = '22023', message = 'Guest ID required for deletion.';
    end if;

    delete from public.guests
    where id = v_guest_id and wedding_id = v_order.wedding_id;

    return jsonb_build_object('success', true, 'deleted_guest_id', v_guest_id);

  elsif v_action = 'add_guest' then
    v_guest_id_text := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 24));
    insert into public.guests (
      wedding_id, invite_code, guest_name, family_members, phone, category, city_address, with_family
    )
    values (
      v_order.wedding_id,
      v_guest_id_text,
      coalesce(nullif(btrim(p_extra ->> 'guest_name'), ''), 'Guest'),
      coalesce((p_extra ->> 'family_members')::int, 1),
      nullif(btrim(p_extra ->> 'phone'), ''),
      coalesce(nullif(btrim(p_extra ->> 'category'), ''), 'general'),
      nullif(btrim(p_extra ->> 'city_address'), ''),
      coalesce((p_extra ->> 'with_family')::boolean, false)
    );

    return jsonb_build_object('success', true, 'invite_code', v_guest_id_text);

  else
    raise exception using errcode = '22023', message = 'Unsupported dashboard action.';
  end if;
end;
$$;

revoke all on function public.manage_customer_dashboard(text, text, jsonb) from public;
grant execute on function public.manage_customer_dashboard(text, text, jsonb) to anon, authenticated, service_role;

commit;
