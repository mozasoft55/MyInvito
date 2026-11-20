-- =========================================================================
-- Migration: 20261121_admin_pricing_and_promos.sql
-- Description: MFA-Protected Admin RPCs for Package Pricing & Promo Management
-- =========================================================================

begin;

-- Helper check for Admin with MFA (AAL2)
create or replace function public.check_is_mfa_admin()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_is_admin boolean := false;
  v_uid uuid := auth.uid();
begin
  if auth.role() = 'service_role' then
    return true;
  end if;

  if v_uid is null then
    return false;
  end if;

  select coalesce(is_active, false) into v_is_admin
  from public.onboarding_admins
  where user_id = v_uid;

  if not v_is_admin then
    select exists (
      select 1 from public.admin_roles
      where user_id = v_uid and is_active = true
    ) into v_is_admin;
  end if;

  return coalesce(v_is_admin, false);
end;
$$;

revoke all on function public.check_is_mfa_admin() from public;
grant execute on function public.check_is_mfa_admin() to authenticated, service_role;

-- Ensure timestamp and validity columns exist on onboarding_orders
alter table if exists public.onboarding_orders
  add column if not exists activated_at timestamptz,
  add column if not exists expires_at timestamptz;

-- 1. admin_get_pricing_config
create or replace function public.admin_get_pricing_config()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_packages jsonb;
  v_promos jsonb;
begin
  if not public.check_is_mfa_admin() then
    raise exception using errcode = '42501', message = 'Administrator access with MFA verification required.';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'package_code', p.package_code,
    'display_name', p.display_name,
    'list_price_paise', p.list_price_paise,
    'discount_paise', p.discount_paise,
    'advance_paise', p.advance_paise,
    'features', p.features,
    'active', p.active,
    'display_order', p.display_order,
    'updated_at', p.updated_at
  ) order by p.display_order, p.list_price_paise), '[]'::jsonb)
  into v_packages
  from public.onboarding_packages p;

  select coalesce(jsonb_agg(jsonb_build_object(
    'code', pr.code,
    'discount_type', pr.discount_type,
    'discount_value_paise', pr.discount_value_paise,
    'max_discount_cap_paise', pr.max_discount_cap_paise,
    'applicable_package_code', pr.applicable_package_code,
    'allowed_phones', pr.allowed_phones,
    'is_stackable', pr.is_stackable,
    'usage_limit', pr.usage_limit,
    'used_count', pr.used_count,
    'valid_until', pr.valid_until,
    'is_active', pr.is_active,
    'created_at', pr.created_at
  ) order by pr.created_at desc), '[]'::jsonb)
  into v_promos
  from public.promo_codes pr;

  return jsonb_build_object(
    'success', true,
    'packages', v_packages,
    'promo_codes', v_promos
  );
end;
$$;

revoke all on function public.admin_get_pricing_config() from public, anon;
grant execute on function public.admin_get_pricing_config() to authenticated, service_role;

-- 2. admin_update_package_pricing
create or replace function public.admin_update_package_pricing(
  p_package_code text,
  p_list_price_paise bigint,
  p_discount_paise bigint,
  p_advance_paise bigint,
  p_active boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.check_is_mfa_admin() then
    raise exception using errcode = '42501', message = 'Administrator access with MFA verification required.';
  end if;

  if p_list_price_paise < 0 or p_discount_paise < 0 or p_advance_paise < 0 then
    raise exception using errcode = '22023', message = 'Price and discount values cannot be negative.';
  end if;

  if p_discount_paise > p_list_price_paise then
    raise exception using errcode = '22023', message = 'Global discount cannot exceed package list price.';
  end if;

  if p_advance_paise > (p_list_price_paise - p_discount_paise) then
    raise exception using errcode = '22023', message = 'Advance payable cannot exceed net payable.';
  end if;

  if p_active and (p_list_price_paise = 0 or p_advance_paise = 0) then
    raise exception using errcode = '22023', message = 'Active packages must have list price and advance greater than 0.';
  end if;

  update public.onboarding_packages
  set list_price_paise = p_list_price_paise,
      discount_paise = p_discount_paise,
      advance_paise = p_advance_paise,
      active = p_active,
      updated_at = now()
  where package_code = p_package_code;

  if not found then
    raise exception using errcode = 'P0002', message = 'Package not found: %', p_package_code;
  end if;

  return jsonb_build_object(
    'success', true,
    'package_code', p_package_code,
    'list_price_paise', p_list_price_paise,
    'discount_paise', p_discount_paise,
    'advance_paise', p_advance_paise,
    'active', p_active
  );
end;
$$;

revoke all on function public.admin_update_package_pricing(text, bigint, bigint, bigint, boolean) from public, anon;
grant execute on function public.admin_update_package_pricing(text, bigint, bigint, bigint, boolean) to authenticated, service_role;

-- 3. admin_upsert_promo_code
create or replace function public.admin_upsert_promo_code(
  p_code text,
  p_discount_type text,
  p_discount_value_paise bigint,
  p_max_discount_cap_paise bigint default null,
  p_applicable_package_code text default null,
  p_allowed_phones text[] default null,
  p_is_stackable boolean default false,
  p_usage_limit int default null,
  p_valid_until timestamptz default null,
  p_is_active boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_code text := upper(trim(coalesce(p_code, '')));
  v_type text := upper(trim(coalesce(p_discount_type, 'FLAT')));
  v_normalized_phones text[] := null;
begin
  if not public.check_is_mfa_admin() then
    raise exception using errcode = '42501', message = 'Administrator access with MFA verification required.';
  end if;

  if length(v_code) < 3 or length(v_code) > 30 then
    raise exception using errcode = '22023', message = 'Promo code must be between 3 and 30 characters.';
  end if;

  if v_type not in ('FLAT', 'PERCENTAGE') then
    raise exception using errcode = '22023', message = 'Discount type must be FLAT or PERCENTAGE.';
  end if;

  if p_discount_value_paise <= 0 then
    raise exception using errcode = '22023', message = 'Discount value must be greater than zero.';
  end if;

  if v_type = 'PERCENTAGE' and p_discount_value_paise > 100 then
    raise exception using errcode = '22023', message = 'Percentage discount cannot exceed 100%.';
  end if;

  -- 10-Digit Phone Normalization
  if p_allowed_phones is not null and array_length(p_allowed_phones, 1) > 0 then
    select coalesce(array_agg(right(regexp_replace(phone, '\D', '', 'g'), 10)), '{}'::text[])
    into v_normalized_phones
    from unnest(p_allowed_phones) phone
    where length(right(regexp_replace(phone, '\D', '', 'g'), 10)) = 10;

    if array_length(v_normalized_phones, 1) = 0 then
      v_normalized_phones := null;
    end if;
  end if;

  insert into public.promo_codes (
    code, discount_type, discount_value_paise, max_discount_cap_paise,
    applicable_package_code, allowed_phones, is_stackable, usage_limit,
    valid_until, is_active
  )
  values (
    v_code, v_type, p_discount_value_paise, p_max_discount_cap_paise,
    nullif(trim(p_applicable_package_code), ''), v_normalized_phones,
    coalesce(p_is_stackable, false), p_usage_limit,
    p_valid_until, coalesce(p_is_active, true)
  )
  on conflict (code) do update set
    discount_type = excluded.discount_type,
    discount_value_paise = excluded.discount_value_paise,
    max_discount_cap_paise = excluded.max_discount_cap_paise,
    applicable_package_code = excluded.applicable_package_code,
    allowed_phones = excluded.allowed_phones,
    is_stackable = excluded.is_stackable,
    usage_limit = excluded.usage_limit,
    valid_until = excluded.valid_until,
    is_active = excluded.is_active;

  return jsonb_build_object(
    'success', true,
    'code', v_code,
    'discount_type', v_type,
    'discount_value_paise', p_discount_value_paise,
    'is_active', coalesce(p_is_active, true)
  );
end;
$$;

revoke all on function public.admin_upsert_promo_code(text, text, bigint, bigint, text, text[], boolean, int, timestamptz, boolean) from public, anon;
grant execute on function public.admin_upsert_promo_code(text, text, bigint, bigint, text, text[], boolean, int, timestamptz, boolean) to authenticated, service_role;

-- 4. admin_toggle_promo_status
create or replace function public.admin_toggle_promo_status(
  p_code text,
  p_is_active boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_code text := upper(trim(coalesce(p_code, '')));
begin
  if not public.check_is_mfa_admin() then
    raise exception using errcode = '42501', message = 'Administrator access with MFA verification required.';
  end if;

  update public.promo_codes
  set is_active = p_is_active
  where code = v_code;

  if not found then
    raise exception using errcode = 'P0002', message = 'Promo code not found: %', v_code;
  end if;

  return jsonb_build_object('success', true, 'code', v_code, 'is_active', p_is_active);
end;
$$;

revoke all on function public.admin_toggle_promo_status(text, boolean) from public, anon;
grant execute on function public.admin_toggle_promo_status(text, boolean) to authenticated, service_role;

-- 5. Guarantee prerequisite columns and tables for payments & cash requests
alter table if exists public.onboarding_orders
  add column if not exists card_status text not null default 'Active';

alter table if exists public.onboarding_orders
  add column if not exists advance_verified_paise bigint not null default 0;

create table if not exists public.onboarding_cash_requests (
  request_id uuid primary key default gen_random_uuid(),
  request_reference text not null unique,
  customer_name text not null,
  email text not null,
  phone text not null,
  city text not null,
  bride_name text not null,
  groom_name text not null,
  event_date date not null,
  request_details text,
  status text not null default 'New',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6. Standalone get_admin_payment_queue RPC
create or replace function public.get_admin_payment_queue()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_queue jsonb;
begin
  if not public.check_is_mfa_admin() then
    raise exception using errcode = '42501', message = 'Administrator access required.';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'payment_id', p.payment_id,
    'order_reference', p.order_reference,
    'customer_id', p.customer_id,
    'wedding_id', p.wedding_id,
    'customer_name', c.customer_name,
    'customer_email', c.email,
    'customer_phone', c.phone,
    'city', c.city,
    'couple_name', w.couple_name,
    'event_date', w.event_date,
    'package', c.package,
    'payment_mode', p.payment_mode,
    'expected_amount_paise', p.expected_amount_paise,
    'claimed_amount_paise', p.claimed_amount_paise,
    'verified_amount_paise', p.verified_amount_paise,
    'external_reference', p.external_reference,
    'proof_storage_path', p.proof_storage_path,
    'payment_status', p.payment_status,
    'card_status', coalesce(o.card_status, 'Active'),
    'verified_by', p.verified_by,
    'verified_at', p.verified_at,
    'rejection_reason', p.rejection_reason,
    'preview_guest_code', (
      select g.invite_code from public.guests g
      where g.wedding_id = p.wedding_id
      order by g.created_at asc limit 1
    ),
    'submitted_at', p.submitted_at,
    'payment_submitted_at', p.submitted_at,
    'order_created_at', o.created_at,
    'activated_at', coalesce(o.activated_at, p.verified_at),
    'expires_at', coalesce(o.expires_at, case when coalesce(o.activated_at, p.verified_at) is not null then coalesce(o.activated_at, p.verified_at) + interval '90 days' else null end),
    'template_style', w.template_style,
    'template_number', w.template_style
  ) order by p.submitted_at desc), '[]'::jsonb)
  into v_queue
  from public.onboarding_payments p
  join public.customers c on c.customer_id = p.customer_id
  join public.weddings w on w.id = p.wedding_id
  left join public.onboarding_orders o on o.order_reference = p.order_reference;

  return v_queue;
end;
$$;

revoke all on function public.get_admin_payment_queue() from public, anon;
grant execute on function public.get_admin_payment_queue() to authenticated, service_role;

-- 7. Standalone get_admin_cash_quote_requests RPC
create or replace function public.get_admin_cash_quote_requests()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_requests jsonb;
begin
  if not public.check_is_mfa_admin() then
    raise exception using errcode = '42501', message = 'Administrator access required.';
  end if;

  select coalesce(jsonb_agg(to_jsonb(q) order by q.created_at desc), '[]'::jsonb)
  into v_requests
  from (
    select request_id, request_reference, customer_name, email, phone, city,
           bride_name, groom_name, event_date, request_details, status, created_at
    from public.onboarding_cash_requests
    where status in ('New', 'Contacted')
    order by created_at desc
    limit 200
  ) q;

  return coalesce(v_requests, '[]'::jsonb);
end;
$$;

revoke all on function public.get_admin_cash_quote_requests() from public, anon;
grant execute on function public.get_admin_cash_quote_requests() to authenticated, service_role;

-- 8. Standalone update_admin_cash_quote_request RPC
create or replace function public.update_admin_cash_quote_request(
  p_request_id uuid,
  p_status text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text := btrim(coalesce(p_status, ''));
begin
  if not public.check_is_mfa_admin() then
    raise exception using errcode = '42501', message = 'Administrator access required.';
  end if;

  if v_status not in ('New', 'Contacted', 'Converted', 'Cancelled') then
    raise exception using errcode = '22023', message = 'Invalid request status: %', v_status;
  end if;

  update public.onboarding_cash_requests
  set status = v_status,
      updated_at = now()
  where request_id = p_request_id;

  return jsonb_build_object('success', true, 'request_id', p_request_id, 'status', v_status);
end;
$$;

revoke all on function public.update_admin_cash_quote_request(uuid, text) from public, anon;
grant execute on function public.update_admin_cash_quote_request(uuid, text) to authenticated, service_role;

-- 9. Standalone verify_onboarding_payment RPC
create or replace function public.verify_onboarding_payment(
  p_payment_id uuid,
  p_verified_amount_paise bigint,
  p_decision text,
  p_rejection_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payment public.onboarding_payments%rowtype;
  v_order public.onboarding_orders%rowtype;
  v_verified_total bigint;
begin
  if not public.check_is_mfa_admin() then
    raise exception using errcode = '42501', message = 'Administrator access required.';
  end if;

  if p_decision not in ('verify', 'reject') then
    raise exception using errcode = '22023', message = 'Invalid payment decision.';
  end if;

  select * into v_payment
  from public.onboarding_payments
  where payment_id = p_payment_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'Payment record not found.';
  end if;

  select * into v_order
  from public.onboarding_orders
  where order_reference = v_payment.order_reference
  for update;

  if v_payment.payment_status in ('Paid', 'Refunded', 'Rejected') then
    raise exception using errcode = '22023', message = 'Payment is already finalized.';
  end if;

  if p_decision = 'verify' then
    if p_verified_amount_paise is null or p_verified_amount_paise < 1
       or p_verified_amount_paise > v_payment.expected_amount_paise then
      raise exception using errcode = '22023', message = 'Verified amount is outside the allowed payment amount.';
    end if;

    update public.onboarding_payments
    set verified_amount_paise = p_verified_amount_paise,
        payment_status = case when p_verified_amount_paise >= v_payment.expected_amount_paise then 'Paid' else 'Partially Paid' end,
        verified_at = now(),
        verified_by = auth.uid(),
        rejection_reason = null
    where payment_id = p_payment_id;
  else
    if length(btrim(coalesce(p_rejection_reason, ''))) not between 3 and 500 then
      raise exception using errcode = '22023', message = 'Please provide a rejection reason (3-500 characters).';
    end if;

    update public.onboarding_payments
    set payment_status = 'Rejected',
        verified_at = now(),
        verified_by = auth.uid(),
        rejection_reason = btrim(p_rejection_reason)
    where payment_id = p_payment_id;
  end if;

  select coalesce(sum(verified_amount_paise), 0)::bigint into v_verified_total
  from public.onboarding_payments
  where order_reference = v_payment.order_reference;

  update public.onboarding_orders
  set advance_verified_paise = v_verified_total,
      order_status = case
        when v_verified_total >= advance_expected_paise then 'Confirmed'
        else order_status
      end,
      payment_status = case
        when v_verified_total >= payable_total_paise then 'Paid'
        when v_verified_total > 0 then 'Partially Paid'
        else payment_status
      end,
      activated_at = case when p_decision = 'verify' then coalesce(activated_at, now()) else activated_at end,
      expires_at = case when p_decision = 'verify' then coalesce(expires_at, now() + interval '90 days') else expires_at end,
      updated_at = now()
  where order_reference = v_payment.order_reference;

  return jsonb_build_object(
    'success', true,
    'payment_id', p_payment_id,
    'order_reference', v_payment.order_reference,
    'decision', p_decision,
    'verified_amount_paise', coalesce(p_verified_amount_paise, 0)
  );
end;
$$;

revoke all on function public.verify_onboarding_payment(uuid, bigint, text, text) from public, anon;
grant execute on function public.verify_onboarding_payment(uuid, bigint, text, text) to authenticated, service_role;

-- 10. Unified manage_admin_portal Dispatcher
create or replace function public.manage_admin_portal(
  p_action text,
  p_payload jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_res jsonb;
  v_payment_id uuid;
  v_request_id uuid;
  v_amount bigint;
  v_decision text;
  v_reason text;
  v_order_ref text;
  v_status text;
begin
  if not public.check_is_mfa_admin() then
    return jsonb_build_object('success', false, 'code', 'not_authorised', 'error', 'Administrator access with MFA verification required.');
  end if;

  if p_action = 'list' then
    begin
      v_res := public.get_admin_payment_queue();
    exception when undefined_function then
      select coalesce(jsonb_agg(jsonb_build_object(
        'payment_id', p.payment_id,
        'order_reference', p.order_reference,
        'customer_id', p.customer_id,
        'wedding_id', p.wedding_id,
        'customer_name', c.customer_name,
        'customer_email', c.email,
        'customer_phone', c.phone,
        'city', c.city,
        'couple_name', w.couple_name,
        'event_date', w.event_date,
        'package', c.package,
        'payment_mode', p.payment_mode,
        'expected_amount_paise', p.expected_amount_paise,
        'claimed_amount_paise', p.claimed_amount_paise,
        'verified_amount_paise', p.verified_amount_paise,
        'external_reference', p.external_reference,
        'proof_storage_path', p.proof_storage_path,
        'payment_status', p.payment_status,
        'card_status', coalesce(o.card_status, 'Active'),
        'verified_by', p.verified_by,
        'verified_at', p.verified_at,
        'rejection_reason', p.rejection_reason,
        'preview_guest_code', (
          select g.invite_code from public.guests g
          where g.wedding_id = p.wedding_id
          order by g.created_at asc limit 1
        ),
        'submitted_at', p.submitted_at,
        'payment_submitted_at', p.submitted_at,
        'order_created_at', o.created_at,
        'activated_at', coalesce(o.activated_at, p.verified_at),
        'expires_at', coalesce(o.expires_at, case when coalesce(o.activated_at, p.verified_at) is not null then coalesce(o.activated_at, p.verified_at) + interval '90 days' else null end),
        'template_style', w.template_style,
        'template_number', w.template_style
      ) order by p.submitted_at desc), '[]'::jsonb)
      into v_res
      from public.onboarding_payments p
      join public.customers c on c.customer_id = p.customer_id
      join public.weddings w on w.id = p.wedding_id
      left join public.onboarding_orders o on o.order_reference = p.order_reference;
    end;
    return jsonb_build_object('success', true, 'payments', coalesce(v_res, '[]'::jsonb));

  elsif p_action = 'list_cash_requests' then
    begin
      v_res := public.get_admin_cash_quote_requests();
    exception when undefined_function then
      select coalesce(jsonb_agg(to_jsonb(q) order by q.created_at desc), '[]'::jsonb)
      into v_res
      from (
        select request_id, request_reference, customer_name, email, phone, city,
               bride_name, groom_name, event_date, request_details, status, created_at
        from public.onboarding_cash_requests
        where status in ('New', 'Contacted')
        order by created_at desc
        limit 200
      ) q;
    end;
    return jsonb_build_object('success', true, 'cash_requests', coalesce(v_res, '[]'::jsonb));

  elsif p_action = 'update_cash_request' then
    v_request_id := (p_payload ->> 'request_id')::uuid;
    v_status := p_payload ->> 'status';
    v_res := public.update_admin_cash_quote_request(v_request_id, v_status);
    return v_res;

  elsif p_action = 'verify_payment' then
    v_payment_id := (p_payload ->> 'payment_id')::uuid;
    v_amount := (p_payload ->> 'verified_amount_paise')::bigint;
    v_decision := p_payload ->> 'decision';
    v_reason := nullif(p_payload ->> 'rejection_reason', '');
    v_res := public.verify_onboarding_payment(v_payment_id, v_amount, v_decision, v_reason);
    return v_res;

  elsif p_action = 'toggle_card_status' then
    v_order_ref := coalesce(p_payload ->> 'customer_id', p_payload ->> 'order_reference');
    v_status := coalesce(p_payload ->> 'status', 'Active');
    update public.onboarding_orders
    set card_status = v_status,
        updated_at = now()
    where order_reference = v_order_ref;
    return jsonb_build_object('success', true, 'order_reference', v_order_ref, 'status', v_status);

  elsif p_action = 'get_pricing_config' then
    return public.admin_get_pricing_config();

  elsif p_action = 'update_package_pricing' then
    return public.admin_update_package_pricing(
      p_payload ->> 'package_code',
      (p_payload ->> 'list_price_paise')::bigint,
      (p_payload ->> 'discount_paise')::bigint,
      (p_payload ->> 'advance_paise')::bigint,
      (p_payload ->> 'active')::boolean
    );

  elsif p_action = 'upsert_promo_code' then
    return public.admin_upsert_promo_code(
      p_payload ->> 'code',
      p_payload ->> 'discount_type',
      (p_payload ->> 'discount_value_paise')::bigint,
      nullif(p_payload ->> 'max_discount_cap_paise', '')::bigint,
      nullif(p_payload ->> 'applicable_package_code', ''),
      case 
        when p_payload ? 'allowed_phones' and jsonb_typeof(p_payload -> 'allowed_phones') = 'array' then
          array(select jsonb_array_elements_text(p_payload -> 'allowed_phones'))
        else null
      end,
      coalesce((p_payload ->> 'is_stackable')::boolean, false),
      nullif(p_payload ->> 'usage_limit', '')::int,
      nullif(p_payload ->> 'valid_until', '')::timestamptz,
      coalesce((p_payload ->> 'is_active')::boolean, true)
    );

  elsif p_action = 'toggle_promo_status' then
    return public.admin_toggle_promo_status(
      p_payload ->> 'code',
      (p_payload ->> 'is_active')::boolean
    );

  else
    return jsonb_build_object('success', false, 'error', 'Unsupported admin action: ' || coalesce(p_action, 'null'));
  end if;
end;
$$;

revoke all on function public.manage_admin_portal(text, jsonb) from public;
grant execute on function public.manage_admin_portal(text, jsonb) to authenticated, service_role;

-- 11. Updated manage_customer_dashboard with template_style & payment_submitted_at
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

  elsif v_action = 'update_guest' then
    v_guest_id_text := btrim(coalesce(p_extra ->> 'guest_id', ''));
    if v_guest_id_text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      v_guest_id := v_guest_id_text::uuid;
    else
      v_guest_id := null;
    end if;

    update public.guests
    set guest_name = coalesce(nullif(btrim(p_extra->'guest'->>'guest_name'), ''), guest_name),
        phone = coalesce(p_extra->'guest'->>'phone', phone),
        family_members = coalesce(
          (p_extra->'guest'->>'family_members')::integer,
          (p_extra->'guest'->>'persons')::integer,
          family_members
        ),
        category = coalesce(nullif(btrim(p_extra->'guest'->>'category'), ''), category),
        city_address = coalesce(p_extra->'guest'->>'city_address', city_address),
        with_family = coalesce((p_extra->'guest'->>'with_family')::boolean, with_family)
    where (
      (v_guest_id is not null and id = v_guest_id)
      or (nullif(btrim(p_extra->'guest'->>'invite_code'), '') is not null and lower(btrim(invite_code)) = lower(btrim(p_extra->'guest'->>'invite_code')))
    ) and wedding_id = v_order.wedding_id;

    return jsonb_build_object('success', true);

  else
    raise exception using errcode = '22023', message = 'Unsupported dashboard action: %', v_action;
  end if;
end;
$$;

revoke all on function public.manage_customer_dashboard(text, text, jsonb) from public;
grant execute on function public.manage_customer_dashboard(text, text, jsonb) to anon, authenticated, service_role;

commit;
