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

-- 5. Extend manage_admin_portal to route pricing & promo actions
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
    v_res := public.get_admin_payment_queue();
    return jsonb_build_object('success', true, 'payments', coalesce(v_res, '[]'::jsonb));

  elsif p_action = 'list_cash_requests' then
    v_res := public.get_admin_cash_quote_requests();
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

commit;
