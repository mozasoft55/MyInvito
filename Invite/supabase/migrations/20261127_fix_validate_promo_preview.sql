-- Migration: Fix validate_promo_preview signature and defaults (PGRST202 404 Fix)
-- Description:
-- 1. Makes p_package_code and p_phone optional (DEFAULT NULL::text) so PostgREST can match any parameter combination
-- 2. Defaults to the lowest-priced active package if p_package_code is omitted/null
-- 3. Supports standard promo codes, 10-digit phone filtering, and dynamic couple referral Order IDs (ORD-XXXXX)

BEGIN;

DROP FUNCTION IF EXISTS public.validate_promo_preview(text, text, text);

CREATE OR REPLACE FUNCTION public.validate_promo_preview(
  p_promo_code text,
  p_phone text DEFAULT NULL::text,
  p_package_code text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
declare
  v_pkg record;
  v_promo record;
  v_disc_paise bigint := 0;
  v_clean_phone text := right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 10);
  v_target_pkg text := nullif(trim(coalesce(p_package_code, '')), '');
  v_ref_order record;
  v_ref_settings record;
  v_ref_customer_phone text;
begin
  if coalesce(trim(p_promo_code), '') = '' then
    return jsonb_build_object('valid', false, 'message', 'Please enter a promo code.');
  end if;

  if v_target_pkg is not null then
    select * into v_pkg
    from public.onboarding_packages
    where package_code = v_target_pkg and active = true;
  else
    select * into v_pkg
    from public.onboarding_packages
    where active = true
    order by list_price_paise asc
    limit 1;
  end if;

  if not found then
    return jsonb_build_object('valid', false, 'message', 'Invalid or inactive package selected.');
  end if;

  -- 1. Check promo_codes table first (B2B Partner & Campaign Codes)
  select * into v_promo
  from public.promo_codes
  where code = upper(trim(coalesce(p_promo_code, ''))) and is_active = true;

  if found then
    if v_promo.valid_until is not null and v_promo.valid_until < now() then
      return jsonb_build_object('valid', false, 'message', 'Promo code has expired.');
    end if;

    if v_promo.usage_limit is not null and v_promo.used_count >= v_promo.usage_limit then
      return jsonb_build_object('valid', false, 'message', 'Promo code usage limit reached.');
    end if;

    if v_promo.applicable_package_code is not null and v_promo.applicable_package_code <> v_pkg.package_code then
      return jsonb_build_object('valid', false, 'message', 'Promo code is not valid for this package.');
    end if;

    if v_promo.allowed_phones is not null and array_length(v_promo.allowed_phones, 1) > 0 then
      if length(v_clean_phone) < 10 or not (v_clean_phone = any(v_promo.allowed_phones)) then
        return jsonb_build_object('valid', false, 'message', 'Promo code is not valid for this mobile number.');
      end if;
    end if;

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
      'is_referral', false,
      'discount_type', v_promo.discount_type,
      'promo_discount_paise', v_disc_paise,
      'is_stackable', v_promo.is_stackable,
      'message', 'Promo code applied successfully!'
    );
  end if;

  -- 2. Check Dynamic Couple Referral via Order ID (e.g. ORD-DFE714DB)
  select * into v_ref_settings
  from public.onboarding_referral_settings
  where id = 1;

  if v_ref_settings is not null and v_ref_settings.is_enabled then
    select o.*, c.phone as customer_phone into v_ref_order
    from public.onboarding_orders o
    join public.customers c on c.customer_id = o.customer_id
    where upper(trim(o.order_reference)) = upper(trim(coalesce(p_promo_code, '')));

    if found then
      -- Rule 1: Order must be Verified / Confirmed & Live & Active
      if v_ref_order.order_status not in ('Confirmed', 'In Production', 'Delivered')
         or coalesce(v_ref_order.card_status, 'Active') = 'Suspended'
         or coalesce(v_ref_order.advance_verified_paise, 0) < 1 then
        return jsonb_build_object('valid', false, 'message', 'Referral Order ID must be verified and active to grant a discount.');
      end if;

      -- Rule 2: 1-time use per Order ID
      if exists (
        select 1 from public.onboarding_orders
        where upper(trim(coalesce(applied_promo_code, ''))) = upper(trim(coalesce(p_promo_code, '')))
      ) then
        return jsonb_build_object('valid', false, 'message', 'This couple referral Order ID has already been redeemed.');
      end if;

      -- Rule 3: Anti-chain loop
      if v_ref_order.applied_promo_code is not null and v_ref_order.applied_promo_code like 'ORD-%' then
        return jsonb_build_object('valid', false, 'message', 'This order was booked using a referral code and cannot refer another order.');
      end if;

      -- Rule 4: Self-referral prevention
      if v_clean_phone <> '' then
        v_ref_customer_phone := right(regexp_replace(coalesce(v_ref_order.customer_phone, ''), '\D', '', 'g'), 10);
        if v_clean_phone = v_ref_customer_phone and v_clean_phone <> '' then
          return jsonb_build_object('valid', false, 'message', 'You cannot use your own Order ID as a referral code.');
        end if;
      end if;

      -- Calculate referral discount
      if v_ref_settings.discount_type = 'FLAT' then
        v_disc_paise := v_ref_settings.discount_value_paise;
      else
        v_disc_paise := round((v_pkg.list_price_paise * v_ref_settings.discount_value_paise) / 100.0);
        if v_ref_settings.max_discount_cap_paise is not null and v_disc_paise > v_ref_settings.max_discount_cap_paise then
          v_disc_paise := v_ref_settings.max_discount_cap_paise;
        end if;
      end if;

      return jsonb_build_object(
        'valid', true,
        'code', v_ref_order.order_reference,
        'is_referral', true,
        'discount_type', v_ref_settings.discount_type,
        'promo_discount_paise', v_disc_paise,
        'is_stackable', v_ref_settings.is_stackable,
        'message', 'Couple Referral Applied! Special discount unlocked.'
      );
    end if;
  end if;

  return jsonb_build_object('valid', false, 'message', 'Invalid or inactive promo code.');
end;
$function$;

GRANT EXECUTE ON FUNCTION public.validate_promo_preview(text, text, text) TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
