-- ==============================================================================
-- Migration: 20261122_dashboard_rsvps_and_template_fix.sql
-- Description:
--   1. Update manage_customer_dashboard RPC:
--      - Support 'update_template' action to sync chosen template_style to weddings table.
--      - Support 'sync_rsvps' action to upsert offline/client RSVPs.
--      - Support 'add_guests' with 12-char hex invite codes and return inserted rows.
--      - Enhance 'load' action to return guest details (name, phone) with each RSVP.
--   2. Update submit_invitation_rsvp:
--      - Clamp attending_count and auto-expand family capacity instead of throwing limit errors.
--      - Always record guest wishes and comments.
--   3. Update lookup_invitation:
--      - Return full guest id and metadata.
-- ==============================================================================

-- 1. manage_customer_dashboard
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
  v_guest_item jsonb;
  v_template_style text;
  v_inserted_guests jsonb := '[]'::jsonb;
  v_code text;
  v_gid uuid;
  v_rsvp_item jsonb;
  v_rcode text;
  v_rstatus text;
  v_rcount int;
  v_rwishes text;
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
          'bride_parents', coalesce(wd.bride_parents, wd.bride_father, w.bride_parents, w.bride_father, ''),
          'groom_parents', coalesce(wd.groom_parents, wd.groom_father, w.groom_parents, w.groom_father, ''),
          'bride_father', coalesce(wd.bride_parents, wd.bride_father, w.bride_parents, w.bride_father, ''),
          'groom_father', coalesce(wd.groom_parents, wd.groom_father, w.groom_parents, w.groom_father, ''),
          'bride_address', coalesce(wd.bride_address, w.bride_address, ''),
          'groom_address', coalesce(wd.groom_address, w.groom_address, ''),
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
          'guest_id', g.id,
          'guest_name', coalesce(g.guest_name, 'Guest'),
          'phone', g.phone,
          'status', r.status,
          'attending_count', r.attending_count,
          'wishes_message', r.wishes_message,
          'submitted_at', r.submitted_at
        ) order by r.submitted_at desc), '[]'::jsonb)
        from public.rsvps r
        left join public.guests g on lower(btrim(g.invite_code)) = lower(btrim(r.invite_code))
          and g.wedding_id = v_order.wedding_id
        where r.wedding_id = v_order.wedding_id
      )
    ) into v_result;

    return jsonb_build_object('success', true, 'dashboard', v_result);

  elsif v_action = 'update_template' then
    v_template_style := coalesce(
      nullif(btrim(p_extra ->> 'template_style'), ''),
      nullif(btrim(p_extra ->> 'template_id'), '')
    );
    if v_template_style is null then
      raise exception using errcode = '22023', message = 'Template style is required.';
    end if;

    update public.weddings
    set template_style = v_template_style
    where id = v_order.wedding_id;

    return jsonb_build_object('success', true, 'template_style', v_template_style);

  elsif v_action = 'delete_guest' then
    v_guest_id := (p_extra ->> 'guest_id')::uuid;
    if v_guest_id is null then
      raise exception using errcode = '22023', message = 'Guest ID required for deletion.';
    end if;

    delete from public.guests
    where id = v_guest_id and wedding_id = v_order.wedding_id;

    return jsonb_build_object('success', true, 'deleted_guest_id', v_guest_id);

  elsif v_action = 'add_guests' then
    for v_guest_item in select * from jsonb_array_elements(coalesce(p_extra->'guests', '[]'::jsonb))
    loop
      v_code := coalesce(
        nullif(btrim(v_guest_item->>'invite_code'), ''),
        upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 12))
      );
      v_gid := coalesce(nullif(v_guest_item->>'id', '')::uuid, gen_random_uuid());

      insert into public.guests (
        id,
        wedding_id,
        guest_name,
        phone,
        family_members,
        persons,
        category,
        city_address,
        with_family,
        invite_code
      ) values (
        v_gid,
        v_order.wedding_id,
        coalesce(nullif(btrim(v_guest_item->>'guest_name'), ''), 'Guest'),
        coalesce(v_guest_item->>'phone', ''),
        coalesce((v_guest_item->>'family_members')::integer, (v_guest_item->>'persons')::integer, 1),
        coalesce((v_guest_item->>'persons')::integer, (v_guest_item->>'family_members')::integer, 1),
        coalesce(nullif(btrim(v_guest_item->>'category'), ''), 'Person'),
        coalesce(v_guest_item->>'city_address', ''),
        coalesce((v_guest_item->>'with_family')::boolean, false),
        v_code
      )
      on conflict (invite_code) do update
      set guest_name = excluded.guest_name,
          phone = excluded.phone,
          family_members = excluded.family_members,
          persons = excluded.persons,
          category = excluded.category,
          city_address = excluded.city_address,
          with_family = excluded.with_family
      returning id, invite_code into v_gid, v_code;

      v_inserted_guests := v_inserted_guests || jsonb_build_array(jsonb_build_object(
        'id', v_gid,
        'invite_code', v_code,
        'guest_name', coalesce(nullif(btrim(v_guest_item->>'guest_name'), ''), 'Guest')
      ));
    end loop;

    return jsonb_build_object('success', true, 'guests', v_inserted_guests);

  elsif v_action = 'sync_rsvps' then
    for v_rsvp_item in select * from jsonb_array_elements(coalesce(p_extra->'rsvps', '[]'::jsonb))
    loop
      v_rcode := nullif(btrim(v_rsvp_item->>'invite_code'), '');
      if v_rcode is not null then
        v_rstatus := lower(btrim(coalesce(v_rsvp_item->>'status', v_rsvp_item->>'response', 'attending')));
        if v_rstatus not in ('attending', 'declined', 'tentative') then
          v_rstatus := 'attending';
        end if;
        v_rcount := coalesce((v_rsvp_item->>'attending_count')::integer, (v_rsvp_item->>'attendees')::integer, 1);
        v_rwishes := coalesce(v_rsvp_item->>'wishes_message', v_rsvp_item->>'wishes', v_rsvp_item->>'note', v_rsvp_item->>'comment', '');

        insert into public.rsvps (
          wedding_id,
          invite_code,
          status,
          attending_count,
          wishes_message
        ) values (
          v_order.wedding_id,
          v_rcode,
          v_rstatus,
          case when v_rstatus = 'attending' then v_rcount else 0 end,
          v_rwishes
        )
        on conflict (wedding_id, (lower(btrim(invite_code))))
        do update set
          status = excluded.status,
          attending_count = excluded.attending_count,
          wishes_message = case when excluded.wishes_message <> '' then excluded.wishes_message else public.rsvps.wishes_message end,
          updated_at = now();
      end if;
    end loop;

    return jsonb_build_object('success', true);

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

-- 2. submit_invitation_rsvp
create or replace function public.submit_invitation_rsvp(
  p_invite_code text,
  p_status text,
  p_attending_count integer,
  p_wishes_message text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_guest record;
  v_status text;
  v_wishes_message text;
begin
  if p_invite_code is null or length(btrim(p_invite_code)) = 0 then
    raise exception 'A valid invitation code is required.';
  end if;

  if length(btrim(p_invite_code)) > 120 then
    raise exception 'Invitation code is too long.';
  end if;

  v_status := lower(btrim(coalesce(p_status, '')));
  if v_status not in ('attending', 'declined', 'tentative') then
    raise exception 'Choose attending, declined, or tentative.';
  end if;

  v_wishes_message := btrim(coalesce(p_wishes_message, ''));
  if char_length(v_wishes_message) > 1000 then
    raise exception 'Wishes message must be 1000 characters or fewer.';
  end if;

  select g.id, g.wedding_id, g.invite_code, g.family_members
    into v_guest
  from public.guests g
  where lower(btrim(g.invite_code)) = lower(btrim(p_invite_code))
  limit 1;

  if not found then
    raise exception 'Invitation code was not found.';
  end if;

  if v_status = 'attending' then
    if p_attending_count is null or p_attending_count < 1 then
      p_attending_count := 1;
    end if;
    if p_attending_count > 20 then
      p_attending_count := 20;
    end if;
    -- Automatically expand guest capacity if more family members are attending
    if p_attending_count > v_guest.family_members then
      update public.guests
      set family_members = p_attending_count,
          persons = p_attending_count,
          with_family = true
      where id = v_guest.id;
    end if;
  else
    p_attending_count := 0;
  end if;

  insert into public.rsvps (
    wedding_id,
    invite_code,
    status,
    attending_count,
    wishes_message
  )
  values (
    v_guest.wedding_id,
    v_guest.invite_code,
    v_status,
    p_attending_count,
    v_wishes_message
  )
  on conflict (wedding_id, (lower(btrim(invite_code))))
  do update set
    status = excluded.status,
    attending_count = excluded.attending_count,
    wishes_message = excluded.wishes_message,
    submitted_at = now(),
    updated_at = now();

  return jsonb_build_object(
    'success', true,
    'wedding_id', v_guest.wedding_id,
    'invite_code', v_guest.invite_code,
    'status', v_status,
    'attending_count', p_attending_count,
    'wishes_message', v_wishes_message
  );
end;
$$;

revoke all on function public.submit_invitation_rsvp(text, text, integer, text) from public;
grant execute on function public.submit_invitation_rsvp(text, text, integer, text) to anon, authenticated, service_role;

-- 3. lookup_invitation
create or replace function public.lookup_invitation(p_invite_code text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'guest', jsonb_build_object(
      'id', g.id,
      'wedding_id', g.wedding_id,
      'invite_code', g.invite_code,
      'guest_name', g.guest_name,
      'family_members', g.family_members,
      'phone', g.phone,
      'category', g.category,
      'city_address', g.city_address,
      'with_family', g.with_family
    ),
    'wedding', payload.value,
    'events', payload.value->'events'
  )
  from public.guests g
  cross join lateral (
    select private.wedding_card_payload(g.wedding_id) as value
  ) payload
  where p_invite_code is not null
    and lower(btrim(g.invite_code)) = lower(btrim(p_invite_code))
  limit 1
$$;

revoke all on function public.lookup_invitation(text) from public;
grant execute on function public.lookup_invitation(text) to anon, authenticated, service_role;
