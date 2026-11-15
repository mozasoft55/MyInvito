-- Admin Security & RPC Alignment Migration
-- Provides admin_whoami, get_onboarding_config, manage_customer_dashboard,
-- submit_customer_onboarding, and track_invite_open.

begin;

-- 1. admin_whoami: Verifies caller's active admin status and MFA (AAL2) level
create or replace function public.admin_whoami()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_is_admin boolean := false;
  v_uid uuid := auth.uid();
  v_email text := auth.jwt() ->> 'email';
  v_aal text := coalesce(auth.jwt() ->> 'aal', 'aal1');
begin
  if v_uid is null then
    return jsonb_build_object(
      'is_admin', false,
      'user_id', null,
      'email', null,
      'aal', 'none'
    );
  end if;

  select coalesce(is_active, false) into v_is_admin
  from public.onboarding_admins
  where user_id = v_uid;

  return jsonb_build_object(
    'is_admin', coalesce(v_is_admin, false),
    'user_id', v_uid,
    'email', v_email,
    'aal', v_aal
  );
end;
$$;

revoke all on function public.admin_whoami() from public;
grant execute on function public.admin_whoami() to authenticated, service_role;

-- 2. get_onboarding_config: Returns active packages, styles, themes, and merchant payment info
create or replace function public.get_onboarding_config()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_packages jsonb;
  v_themes jsonb;
  v_styles jsonb;
  v_payment jsonb;
begin
  -- Fetch active packages
  select coalesce(jsonb_agg(jsonb_build_object(
    'code', package_code,
    'name', package_name,
    'list_price_paise', list_price_paise,
    'discount_paise', discount_paise,
    'advance_paise', advance_paise,
    'features', features
  ) order by list_price_paise), '[]'::jsonb)
  into v_packages
  from public.onboarding_packages
  where active = true;

  -- Fetch themes
  select coalesce(jsonb_agg(jsonb_build_object(
    'theme_name', theme_name,
    'primary_color', primary_color,
    'primary_dark_color', primary_dark_color,
    'accent_color', accent_color,
    'paper_top_color', paper_top_color,
    'paper_bottom_color', paper_bottom_color,
    'text_color', text_color
  ) order by theme_name), '[]'::jsonb)
  into v_themes
  from public.themes;

  -- Fetch styles
  select coalesce(jsonb_agg(jsonb_build_object(
    'template_id', template_id,
    'style_name', style_name,
    'css_class', css_class
  ) order by template_id), '[]'::jsonb)
  into v_styles
  from public.styles;

  v_payment := jsonb_build_object(
    'upi_vpa', '9477929927@okbizaxis',
    'merchant_name', 'Prime eCard'
  );

  return jsonb_build_object(
    'packages', v_packages,
    'themes', v_themes,
    'styles', v_styles,
    'payment', v_payment
  );
end;
$$;

revoke all on function public.get_onboarding_config() from public;
grant execute on function public.get_onboarding_config() to anon, authenticated, service_role;

-- 3. track_invite_open: Records link open timestamp and count
create or replace function public.track_invite_open(p_invite_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_code text := btrim(coalesce(p_invite_code, ''));
  v_now timestamptz := now();
begin
  if v_code = '' then
    return jsonb_build_object('success', false, 'error', 'Invite code required.');
  end if;

  update public.guests
  set first_opened_at = coalesce(first_opened_at, v_now),
      last_opened_at = v_now,
      open_count = coalesce(open_count, 0) + 1
  where invite_code = v_code;

  return jsonb_build_object('success', true);
end;
$$;

revoke all on function public.track_invite_open(text) from public;
grant execute on function public.track_invite_open(text) to anon, authenticated, service_role;

-- 4. manage_customer_dashboard: Unifies dashboard read & guest mutation operations
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
  v_action text := lower(btrim(coalesce(p_action, 'load')));
  v_result jsonb;
  v_guest_id uuid;
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

  if v_action = 'load' then
    select jsonb_build_object(
      'order_reference', v_order.order_reference,
      'order_status', v_order.status,
      'payment_status', v_order.payment_status,
      'package_name', v_order.package_name,
      'wedding_date', v_order.event_date,
      'created_at', v_order.created_at,
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
      raise exception using errcode = '22023', message = 'Valid guest_id is required.';
    end if;

    delete from public.guests
    where id = v_guest_id and wedding_id = v_order.wedding_id;

    return jsonb_build_object('success', true);

  elsif v_action = 'update_guest' then
    v_guest_id := (p_extra ->> 'guest_id')::uuid;
    if v_guest_id is null then
      raise exception using errcode = '22023', message = 'Valid guest_id is required.';
    end if;

    update public.guests
    set guest_name = coalesce(nullif(btrim(p_extra->'guest'->>'guest_name'), ''), guest_name),
        phone = coalesce(p_extra->'guest'->>'phone', phone),
        family_members = coalesce((p_extra->'guest'->>'family_members')::integer, family_members),
        category = coalesce(nullif(btrim(p_extra->'guest'->>'category'), ''), category),
        city_address = coalesce(p_extra->'guest'->>'city_address', city_address)
    where id = v_guest_id and wedding_id = v_order.wedding_id;

    return jsonb_build_object('success', true);

  else
    raise exception using errcode = '22023', message = 'Unsupported dashboard action: %', v_action;
  end if;
end;
$$;

revoke all on function public.manage_customer_dashboard(text, text, jsonb) from public;
grant execute on function public.manage_customer_dashboard(text, text, jsonb) to anon, authenticated, service_role;

-- 5. submit_customer_onboarding: Safe transactional gateway for onboarding form
create or replace function public.submit_customer_onboarding(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_intent text := coalesce(p_payload ->> 'intent', 'order_submission');
  v_input jsonb := coalesce(p_payload -> 'input', '{}'::jsonb);
  v_idempotency_key uuid := coalesce(
    nullif(p_payload ->> 'idempotency_key', '')::uuid,
    gen_random_uuid()
  );
  v_token text := encode(extensions.gen_random_bytes(24), 'hex');
  v_client_fp text := encode(extensions.digest(v_idempotency_key::text, 'sha256'), 'hex');
  v_res jsonb;
begin
  if v_intent = 'cash_quote_request' then
    v_res := public.submit_cash_quote_request(v_input, v_idempotency_key, v_client_fp);
    return v_res;
  else
    v_res := public.provision_new_customer(v_input, v_idempotency_key, v_token, v_client_fp);
    return jsonb_build_object(
      'success', true,
      'order_reference', v_res ->> 'order_reference',
      'dashboard_token', v_token,
      'payment_status', v_res ->> 'payment_status',
      'order_status', v_res ->> 'provisioning_status'
    );
  end if;
end;
$$;

revoke all on function public.submit_customer_onboarding(jsonb) from public;
grant execute on function public.submit_customer_onboarding(jsonb) to anon, authenticated, service_role;

-- 6. Enhanced get_admin_payment_queue with card_status and preview_guest_code
alter table if exists public.onboarding_orders
  add column if not exists card_status text not null default 'Active';

create or replace function public.get_admin_payment_queue()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_queue jsonb;
begin
  if not exists (
    select 1 from public.onboarding_admins a
    where a.user_id = auth.uid() and a.is_active
  ) then
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
    'preview_guest_code', (
      select g.invite_code from public.guests g
      where g.wedding_id = p.wedding_id
      order by g.created_at asc limit 1
    ),
    'submitted_at', p.submitted_at
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

-- 7. manage_admin_portal: Unified dispatch for admin portal actions
alter table if exists public.onboarding_orders
  add column if not exists card_status text not null default 'Active';

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
  v_is_admin boolean := false;
  v_res jsonb;
  v_payment_id uuid;
  v_request_id uuid;
  v_amount bigint;
  v_decision text;
  v_reason text;
  v_order_ref text;
  v_status text;
begin
  select coalesce(is_active, false) into v_is_admin
  from public.onboarding_admins
  where user_id = auth.uid();

  if not v_is_admin then
    return jsonb_build_object('success', false, 'code', 'not_authorised', 'error', 'Administrator access required.');
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

  else
    return jsonb_build_object('success', false, 'error', 'Unsupported admin action: ' || coalesce(p_action, 'null'));
  end if;
end;
$$;

revoke all on function public.manage_admin_portal(text, jsonb) from public;
grant execute on function public.manage_admin_portal(text, jsonb) to authenticated, service_role;

commit;
