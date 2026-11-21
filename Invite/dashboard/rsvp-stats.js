// Pure calculation layer for the guest tracker. No DOM, no network.
// Every number on the dashboard comes from guests + RSVP replies + open tracking + the goal.

const norm = value => String(value ?? '').trim().toLowerCase();
const toInt = (value, fallback = 0) => {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};
const toTime = value => {
  const t = Date.parse(value);
  return Number.isFinite(t) ? t : 0;
};

export const STATUS_ORDER = ['attending', 'maybe', 'declined', 'seen', 'not_opened'];

// Maps any RSVP wording coming from the database to one of: attending | maybe | declined | null
export function classifyResponse(raw) {
  const s = norm(raw);
  if (!s || s === 'pending' || s === 'none' || s === 'no response') return null;
  if (/(declin|unable|not attend|not coming|cannot attend|reject|^no$)/.test(s)) return 'declined';
  if (/(tentative|maybe|not sure|unsure|undecided)/.test(s)) return 'maybe';
  if (/(attend|accept|confirm|coming|^yes$)/.test(s)) return 'attending';
  return null;
}

// One state object per guest row.
// status: attending | maybe | declined | seen (opened, no reply) | not_opened
export function buildGuestStates(guests = [], rsvps = [], opens = {}) {
  const list = Array.isArray(guests) ? guests : [];
  const replies = Array.isArray(rsvps) ? rsvps : [];

  // Normalize open-tracking keys for case-insensitive lookup
  const normalizedOpens = new Map();
  if (opens && typeof opens === 'object') {
    for (const [code, data] of Object.entries(opens)) {
      if (code) normalizedOpens.set(norm(code), data);
    }
  }

  const nameCounts = new Map();
  for (const g of list) {
    const key = norm(g.guest_name || g.name);
    if (key) nameCounts.set(key, (nameCounts.get(key) || 0) + 1);
  }
  const byId = new Map();
  const byCode = new Map();
  const byPhone = new Map();
  const byUniqueName = new Map();
  for (const g of list) {
    if (g.id != null) byId.set(String(g.id), g);
    if (g.guest_id != null) byId.set(String(g.guest_id), g);
    if (g.invite_code) byCode.set(norm(g.invite_code), g);
    if (g.code) byCode.set(norm(g.code), g);
    const cleanPhone = String(g.phone || '').replace(/\D/g, '');
    if (cleanPhone && cleanPhone.length >= 10) byPhone.set(cleanPhone.slice(-10), g);
    const key = norm(g.guest_name || g.name);
    // A name is only a safe match key when exactly one guest has it.
    if (key && nameCounts.get(key) === 1) byUniqueName.set(key, g);
  }

  const latest = new Map();
  const unmatchedReplies = [];
  for (const reply of replies) {
    const repTime = toTime(reply.submitted_at || reply.timestamp || reply.created_at);
    const replyPhone = String(reply.phone || '').replace(/\D/g, '').slice(-10);
    const guest =
      (reply.guest_id != null && byId.get(String(reply.guest_id))) ||
      (reply.id != null && byId.get(String(reply.id))) ||
      (reply.invite_code && byCode.get(norm(reply.invite_code))) ||
      (reply.code && byCode.get(norm(reply.code))) ||
      (replyPhone && byPhone.get(replyPhone)) ||
      byUniqueName.get(norm(reply.guest_name || reply.name));

    if (guest) {
      const previous = latest.get(guest);
      const prevTime = previous ? toTime(previous.submitted_at || previous.timestamp || previous.created_at) : 0;
      if (!previous || repTime >= prevTime) latest.set(guest, reply);
    } else {
      unmatchedReplies.push(reply);
    }
  }

  const states = list.map(guest => {
    const invited = Math.max(1, toInt(guest.family_members || guest.persons, 1));
    const isFamily = Boolean(guest.with_family === true || norm(guest.category) === 'family');
    const reply = latest.get(guest) || null;
    const guestCodeKey = norm(guest.invite_code || guest.code);
    const open = normalizedOpens.get(guestCodeKey) || (guest.invite_code && opens[guest.invite_code]) || {};
    const openCount = Math.max(toInt(open.open_count), toInt(guest.open_count));
    const firstOpenedAt = open.first_opened_at || guest.first_opened_at || null;
    const lastOpenedAt = open.last_opened_at || guest.last_opened_at || firstOpenedAt;
    const opened = openCount > 0 || Boolean(firstOpenedAt) || Boolean(reply);

    let status = classifyResponse(reply && (reply.status || reply.response));
    let source = status ? 'rsvp' : null;
    if (!status) {
      status = classifyResponse(guest.rsvp_status_manual);
      if (status) source = 'manual';
    }

    const replyCount = reply ? toInt(reply.attending_count != null ? reply.attending_count : (reply.attendees != null ? reply.attendees : -1), -1) : -1;
    if (status === 'attending' && source === 'rsvp' && replyCount === 0) status = 'declined';
    if (!status) status = (opened || reply) ? 'seen' : 'not_opened';

    const people = { attending: 0, maybe: 0, declined: 0, seen: 0, not_opened: 0 };
    let invitedPeople = invited;
    let attendingNow = 0;
    if (status === 'attending') {
      attendingNow = source === 'rsvp' && replyCount > 0 ? replyCount : invited;
      invitedPeople = Math.max(invited, attendingNow);
      people.attending = attendingNow;
      people.declined = invitedPeople - attendingNow; // family members who are not attending
    } else {
      people[status] = invited;
    }

    if (reply) {
      reply.wishes_message = reply.wishes_message || reply.wishes || reply.note || reply.comment || '';
    }

    return {
      guest: {
        ...guest,
        guest_name: guest.guest_name || guest.name || 'Guest'
      },
      isFamily,
      status,
      source,
      invitedPeople,
      attendingPeople: attendingNow,
      people,
      reply,
      replyAt: reply ? toTime(reply.submitted_at || reply.timestamp || reply.created_at) : 0,
      opened,
      openCount,
      firstOpenedAt,
      lastOpenedAt,
      sent: Boolean(guest.invite_sent) || opened || Boolean(reply)
    };
  });

  // Synthesize states for unmatched replies (e.g. preview testing or forwarded invitations)
  for (const reply of unmatchedReplies) {
    const rawStatus = classifyResponse(reply.status || reply.response);
    const wishText = reply.wishes_message || reply.wishes || reply.note || reply.comment || '';
    if (!rawStatus && !wishText) continue;
    const replyCount = toInt(reply.attending_count != null ? reply.attending_count : (reply.attendees != null ? reply.attendees : 1), 1);
    const isFamily = Boolean(norm(reply.category) === 'family' || replyCount > 1);
    let status = rawStatus || 'attending';
    if (status === 'attending' && replyCount === 0 && !wishText) status = 'declined';
    const attendingNow = status === 'attending' ? replyCount : 0;
    const people = { attending: 0, maybe: 0, declined: 0, seen: 0, not_opened: 0 };
    people[status] = status === 'attending' ? replyCount : 1;

    reply.wishes_message = wishText;

    states.push({
      guest: {
        id: reply.guest_id || reply.id || ('rsvp-guest-' + Math.random().toString(36).slice(2, 9)),
        guest_name: reply.guest_name || reply.name || (reply.phone ? ('Guest (' + reply.phone + ')') : 'Respected Guest'),
        phone: reply.phone || '',
        category: isFamily ? 'Family' : 'Person',
        with_family: isFamily,
        family_members: replyCount,
        persons: replyCount,
        invite_code: reply.invite_code || reply.code || ''
      },
      isFamily,
      status,
      source: 'rsvp',
      invitedPeople: Math.max(1, replyCount),
      attendingPeople: attendingNow,
      people,
      reply,
      replyAt: toTime(reply.submitted_at || reply.timestamp || reply.created_at),
      opened: true,
      openCount: 1,
      firstOpenedAt: reply.submitted_at || reply.timestamp || new Date().toISOString(),
      lastOpenedAt: reply.submitted_at || reply.timestamp || new Date().toISOString(),
      sent: true
    });
  }

  return states;
}

export function computeStats({ guests = [], rsvps = [], opens = {}, goal = 0 } = {}) {
  const states = buildGuestStates(guests, rsvps, opens);
  const people = { attending: 0, maybe: 0, declined: 0, seen: 0, not_opened: 0 };
  const invites = { attending: 0, maybe: 0, declined: 0, seen: 0, not_opened: 0 };
  let invitedPeople = 0;

  let totalFamilies = 0;
  let confirmedFamilies = 0;
  let declinedFamilies = 0;
  let tentativeFamilies = 0;
  let familySeats = 0;
  let familySeatsAttending = 0;

  let totalPersonal = 0;
  let confirmedPersonal = 0;
  let declinedPersonal = 0;
  let tentativePersonal = 0;
  let personalSeats = 0;
  let personalSeatsAttending = 0;

  for (const state of states) {
    if (state.isFamily) {
      totalFamilies += 1;
      familySeats += state.invitedPeople;
      if (state.status === 'attending') {
        confirmedFamilies += 1;
        familySeatsAttending += state.attendingPeople;
      } else if (state.status === 'declined') {
        declinedFamilies += 1;
      } else if (state.status === 'maybe') {
        tentativeFamilies += 1;
      }
    } else {
      totalPersonal += 1;
      personalSeats += state.invitedPeople;
      if (state.status === 'attending') {
        confirmedPersonal += 1;
        personalSeatsAttending += state.attendingPeople;
      } else if (state.status === 'declined') {
        declinedPersonal += 1;
      } else if (state.status === 'maybe') {
        tentativePersonal += 1;
      }
    }

    invitedPeople += state.invitedPeople;
    invites[state.status] += 1;
    for (const key of STATUS_ORDER) people[key] += state.people[key];
  }

  const invitations = states.length;
  const target = toInt(goal);
  const remaining = target ? Math.max(0, target - invitedPeople) : 0;
  const overBy = target && invitedPeople > target ? invitedPeople - target : 0;
  const repliedInvites = invites.attending + invites.maybe + invites.declined;
  const base = Math.max(target, invitedPeople);

  const segments = STATUS_ORDER.map(key => ({
    key,
    people: people[key],
    pct: base ? (people[key] / base) * 100 : 0
  }));
  if (target) segments.push({ key: 'remaining', people: remaining, pct: base ? (remaining / base) * 100 : 100 });

  return {
    states,
    goal: target,
    invitations,
    invitedPeople,
    remaining,
    overBy,
    people,
    invites,
    repliedInvites,
    replyRatePct: invitations ? Math.round((repliedInvites / invitations) * 100) : 0,
    confirmedPctOfGoal: target ? Math.round((people.attending / target) * 100) : null,
    seatsToPlan: people.attending + people.maybe,
    totalFamilies,
    confirmedFamilies,
    declinedFamilies,
    tentativeFamilies,
    familySeats,
    familySeatsAttending,
    totalPersonal,
    confirmedPersonal,
    declinedPersonal,
    tentativePersonal,
    personalSeats,
    personalSeatsAttending,
    segments
  };
}