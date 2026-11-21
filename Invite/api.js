import { SUPABASE_CONFIG } from './supabase-config.js';

const REQUEST_TIMEOUT_MS = 8000;
const THEME_COLOR_KEYS = ['primary', 'primary_dark', 'accent', 'paper_top', 'paper_bottom', 'text'];
const inflightInvitationRequests = new Map();
const invitationMemoryCache = new Map();
const CACHE_TTL_MS = 60000;

export function clearInvitationCache(code) {
  if (code) {
    invitationMemoryCache.delete(String(code).trim().toUpperCase());
  } else {
    invitationMemoryCache.clear();
  }
}

function cleanText(value, maxLength) {
  if (typeof value !== 'string' && typeof value !== 'number') return '';
  return String(value).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, maxLength);
}

function cleanPhoto(value) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('data:image/') || trimmed.startsWith('https://') || trimmed.startsWith('http://') || trimmed.startsWith('./') || trimmed.startsWith('/') || trimmed.startsWith('blob:')) {
    return trimmed.slice(0, 2097152);
  }
  return trimmed.slice(0, 4000);
}

function isValidIsoDate(value) {
  const parts = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!parts) return false;
  const date = new Date(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3]));
  return date.getFullYear() === Number(parts[1])
    && date.getMonth() === Number(parts[2]) - 1
    && date.getDate() === Number(parts[3]);
}

function normalizeDate(value) {
  const raw = cleanText(value, 40);
  if (isValidIsoDate(raw)) return raw;
  const namedMonth = raw.match(/^(\d{1,2})[\s/-]+([A-Za-z]{3,9})[\s/-]+(\d{4})$/);
  const numeric = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  let iso = '';
  if (namedMonth) {
    const month = new Date(`${namedMonth[2]} 1, 2000`).getMonth();
    if (!Number.isNaN(month)) {
      iso = `${namedMonth[3]}-${String(month + 1).padStart(2, '0')}-${namedMonth[1].padStart(2, '0')}`;
    }
  } else if (numeric) {
    iso = `${numeric[3]}-${numeric[2].padStart(2, '0')}-${numeric[1].padStart(2, '0')}`;
  } else {
    const isoDate = raw.match(/^(\d{4})-(\d{2})-(\d{2})[T\s]/);
    if (isoDate) iso = `${isoDate[1]}-${isoDate[2]}-${isoDate[3]}`;
  }
  return isValidIsoDate(iso) ? iso : '';
}

function normalizeTime(value) {
  const raw = cleanText(value, 40);
  const twelveHour = raw.match(/^(0?[1-9]|1[0-2])(?::([0-5]\d))?\s*([AP]M)$/i);
  if (twelveHour) return `${Number(twelveHour[1])}:${twelveHour[2] || '00'} ${twelveHour[3].toUpperCase()}`;
  const twentyFourHour = raw.match(/^([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/);
  if (!twentyFourHour) return '';
  const hour = Number(twentyFourHour[1]);
  return `${hour % 12 || 12}:${twentyFourHour[2]} ${hour < 12 ? 'AM' : 'PM'}`;
}

export function normalizeWeddingRecord(record) {
  const coupleName = cleanText(record.couple_name, 200);
  const names = coupleName.split(/\s*&\s*/, 2);
  const color = /^#[\da-f]{6}$/i.test(String(record.theme_color || '')) ? record.theme_color : '';
  const sourceColors = record.theme_colors && typeof record.theme_colors === 'object'
    ? record.theme_colors
    : {};
  const themeColors = Object.fromEntries(THEME_COLOR_KEYS
    .map(key => [key, sourceColors[key]])
    .filter(([, value]) => /^#[\da-f]{6}$/i.test(String(value || ''))));
  if (color) themeColors.primary = color;

  const groomPhoto = cleanPhoto(record.groom_photo || record.groom_photo_url || record.groom_image || record.image1 || record.photo_groom);
  const bridePhoto = cleanPhoto(record.bride_photo || record.bride_photo_url || record.bride_image || record.image2 || record.photo_bride);
  const couplePhoto = cleanPhoto(record.couple_photo || record.couple_photo_url || record.hero_image || record.image3 || record.couple_image);
  const venuePhoto = cleanPhoto(record.venue_photo || record.venue_photo_url || record.venue_image || record.banquet_photo || record.image4 || record.banquet_image);
  const landingBg = cleanPhoto(record.landing_background || record.landingBackground || record.front_background || record.cover_background || record.image5);
  const pageBg = cleanPhoto(record.page_background || record.pageBackground || record.couple_background);

  const resolvedVenue = cleanText(record.venue || record.venue_name || record.banquet_name || record.hall_name || '', 180);
  const resolvedAddress = cleanText(record.address || record.venue_address || record.location || '', 500);
  const resolvedMusicUrl = cleanText(record.music_url || record.audio_url || record.music_link || record.soundtrack_url || '', 500000);
  const resolvedMusicTitle = cleanText(record.music_title || record.audio_title || '', 200);
  const resolvedMusicId = cleanText(record.music_id || '', 100);

  return {
    ...record,
    bride_name: cleanText(record.bride_name || names[0], 100),
    groom_name: cleanText(record.groom_name || names[1], 100),
    bride_full: cleanText(record.bride_full, 140),
    groom_full: cleanText(record.groom_full, 140),
    date: normalizeDate(record.event_date || record.date),
    time: normalizeTime(record.time),
    venue: resolvedVenue,
    venue_name: resolvedVenue,
    banquet_name: resolvedVenue,
    venue_title: cleanText(record.venue_title, 120),
    address: resolvedAddress,
    venue_address: resolvedAddress,
    map_url: cleanText(record.map_url, 2000),
    music_url: resolvedMusicUrl,
    audio_url: resolvedMusicUrl,
    music_title: resolvedMusicTitle,
    music_id: resolvedMusicId,
    rsvp_contacts: cleanText(record.rsvp_contacts, 1200),
    rsvp_number: cleanText(record.rsvp_number, 40).replace(/[^\d+]/g, ''),
    theme_colors: Object.keys(themeColors).length ? themeColors : undefined,
    theme_color: color,
    message: cleanText(record.message, 1200),
    share_message: cleanText(record.share_message, 1200),
    template_id: cleanText(record.template_style || record.template_id, 30) || 'template-02',
    theme: cleanText(record.theme_name || record.theme, 40),
    name_order: cleanText(record.name_order || record.couple_order, 30) || 'groom_first',
    bride_parents: cleanText(record.bride_parents || record.bride_father, 240),
    groom_parents: cleanText(record.groom_parents || record.groom_father, 240),
    bride_father: cleanText(record.bride_parents || record.bride_father, 240),
    groom_father: cleanText(record.groom_parents || record.groom_father, 240),
    bride_address: cleanText(record.bride_address, 250),
    groom_address: cleanText(record.groom_address, 250),
    groom_photo: groomPhoto,
    groom_photo_url: groomPhoto,
    bride_photo: bridePhoto,
    bride_photo_url: bridePhoto,
    couple_photo: couplePhoto,
    couple_photo_url: couplePhoto,
    venue_photo: venuePhoto,
    venue_photo_url: venuePhoto,
    landing_background: landingBg,
    landingBackground: landingBg,
    page_background: pageBg,
    pageBackground: pageBg,
    hero_image: couplePhoto,
    venue_image: venuePhoto,
    banquet_photo: venuePhoto,
    image1: groomPhoto,
    image2: bridePhoto,
    image3: couplePhoto,
    image4: venuePhoto,
    image5: landingBg
  };
}

export function buildMapEmbedUrl(customMapUrl, venueName = '', venueAddress = '') {
  const urlStr = String(customMapUrl || '').trim();
  if (urlStr && (urlStr.includes('/embed') || urlStr.includes('output=embed'))) {
    return urlStr;
  }
  if (urlStr) {
    try {
      const parsed = new URL(urlStr);
      const q = parsed.searchParams.get('q') || parsed.searchParams.get('query');
      if (q) {
        return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
      }
    } catch (_) {}
  }
  const cleanVenue = String(venueName || '').trim();
  const cleanAddr = String(venueAddress || '').trim();
  const queryParts = [cleanVenue && cleanVenue !== 'Wedding Celebration Venue' ? cleanVenue : '', cleanAddr].filter(Boolean);
  const query = queryParts.join(', ').trim() || cleanAddr || cleanVenue;
  if (query) {
    return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  }
  return '';
}

export function buildNavigateUrl(customMapUrl, venueName = '', venueAddress = '') {
  const urlStr = String(customMapUrl || '').trim();
  if (urlStr) {
    return urlStr;
  }
  const cleanVenue = String(venueName || '').trim();
  const cleanAddr = String(venueAddress || '').trim();
  const queryParts = [cleanVenue && cleanVenue !== 'Wedding Celebration Venue' ? cleanVenue : '', cleanAddr].filter(Boolean);
  const query = queryParts.join(', ').trim() || cleanAddr || cleanVenue;
  if (query) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }
  return 'https://maps.google.com';
}

function normalizeEvents(events) {
  if (!Array.isArray(events)) return [];
  return events
    .filter(event => event && typeof event === 'object' && !Array.isArray(event))
    .map(event => ({
      ...event,
      event_name: cleanText(event.event_name, 100),
      event_date: normalizeDate(event.event_date),
      event_time: normalizeTime(event.event_time),
      note: cleanText(event.note || event.comment || event.event_comment || event.description, 500)
    }));
}

function assertSupabaseConfig() {
  if (!SUPABASE_CONFIG.url || !SUPABASE_CONFIG.anonKey || SUPABASE_CONFIG.anonKey.includes('PASTE_')) {
    throw new Error('Supabase is not configured. Add your project publishable/anon key in supabase-config.js.');
  }
}

async function supabaseRequest(path, { method = 'GET', body, signal } = {}) {
  assertSupabaseConfig();
  if (signal?.aborted) {
    const cancelErr = new Error('Request cancelled by caller.');
    cancelErr.name = 'AbortError';
    cancelErr.isCallerAbort = true;
    throw cancelErr;
  }
  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  const onCallerAbort = () => {
    controller.abort();
  };
  if (signal) {
    signal.addEventListener('abort', onCallerAbort, { once: true });
  }

  try {
    const response = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/${path}`, {
      method,
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        apikey: SUPABASE_CONFIG.anonKey,
        Authorization: `Bearer ${SUPABASE_CONFIG.anonKey}`,
        ...(body ? { 'Content-Type': 'application/json' } : {})
      },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
    if (!response.ok) {
      let message = `Supabase returned HTTP ${response.status}.`;
      try {
        const error = await response.json();
        if (error.message) message = error.message;
      } catch {
        // Preserve the HTTP status when the service response is not JSON.
      }
      const httpErr = new Error(message);
      httpErr.status = response.status;
      throw httpErr;
    }
    const responseText = await response.text();
    return responseText ? JSON.parse(responseText) : null;
  } catch (error) {
    if (signal?.aborted || error.isCallerAbort) {
      const cancelErr = new Error('Request cancelled by caller.');
      cancelErr.name = 'AbortError';
      cancelErr.isCallerAbort = true;
      throw cancelErr;
    }
    if (timedOut || error.name === 'AbortError') {
      const timeoutErr = new Error('Supabase took too long to respond. Please try again.');
      timeoutErr.name = 'TimeoutError';
      timeoutErr.isTimeout = true;
      timeoutErr.status = 408;
      throw timeoutErr;
    }
    throw error;
  } finally {
    clearTimeout(timeout);
    if (signal) {
      signal.removeEventListener('abort', onCallerAbort);
    }
  }
}

function normalizeWeddingPayload(data) {
  if (!data || !data.wedding || typeof data.wedding !== 'object') {
    throw new Error('Wedding record not found.');
  }
  return {
    ...data,
    wedding: normalizeWeddingRecord(data.wedding),
    events: normalizeEvents(data.events)
  };
}

export function normalizeInvitation(data, code = '') {
  if (!data || !data.guest || !data.wedding) {
    throw new Error('This invitation code was not found. Please check the link and try again.');
  }
  const guest = data.guest;
  if (guest.is_deleted === true || guest.status === 'deleted' || guest.status === 'withdrawn' || guest.status === 'cancelled') {
    throw new Error('Sorry, your invitation card is cancelled or withdrawn. Please confirm.');
  }
  const capacity = Number(guest.family_members !== undefined ? guest.family_members : guest.persons);
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 20) {
    throw new Error('This invitation has an invalid guest limit.');
  }
  return {
    ...normalizeWeddingPayload(data),
    guest: {
      ...guest,
      name: cleanText(guest.guest_name || guest.name, 100),
      invite_code: cleanText(guest.invite_code, 120),
      persons: capacity,
      family_members: capacity,
      person_display: String(capacity),
      with_family: guest.with_family === true || String(guest.category || '').toLowerCase() === 'family',
      family_display: guest.with_family === true || String(guest.category || '').toLowerCase() === 'family' ? '✓' : '✕'
    }
  };
}

function findLocalInvitation(code) {
  if (typeof localStorage === 'undefined') return null;
  const upperCode = code.toUpperCase();
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('customer-dashboard-guests-')) {
      try {
        const guests = JSON.parse(localStorage.getItem(key) || '[]');
        const guest = guests.find(g => (g.invite_code && (g.invite_code === code || g.invite_code.toUpperCase() === upperCode)));
        if (guest) {
          const ref = key.replace('customer-dashboard-guests-', '');
          const order = JSON.parse(localStorage.getItem('primeecard_order_' + ref) || localStorage.getItem('primeecard_last_order') || '{}');
          const wedding = order.wedding || order || {
            bride_name: 'Bride',
            groom_name: 'Groom',
            event_date: '2026-12-05',
            ceremony_title: 'Shubho Bibaho',
            venue: 'Wedding Celebration Venue'
          };
          wedding.order_reference = ref;
          wedding.ref = ref;
          const capacity = Number(guest.family_members || guest.persons || (guest.with_family ? 4 : 1));
          const isExplicitPerson = guest.with_family === false || String(guest.category || '').toLowerCase() === 'person';
          const isFamily = !isExplicitPerson && (guest.with_family === true || String(guest.category || '').toLowerCase() === 'family' || (capacity > 1 && guest.with_family !== false));

          const bridePhoto = cleanPhoto(wedding.bride_photo
            || wedding.bride_photo_url
            || order.bride_photo
            || order.bride_photo_url
            || wedding.bride_image
            || wedding.image2
            || (ref ? localStorage.getItem('wedding_bride_photo_' + ref) : '')
            || '');
          const groomPhoto = cleanPhoto(wedding.groom_photo
            || wedding.groom_photo_url
            || order.groom_photo
            || order.groom_photo_url
            || wedding.groom_image
            || wedding.image1
            || (ref ? localStorage.getItem('wedding_groom_photo_' + ref) : '')
            || '');
          const couplePhoto = cleanPhoto(wedding.couple_photo
            || wedding.couple_photo_url
            || order.couple_photo
            || order.couple_photo_url
            || wedding.hero_image
            || wedding.image3
            || (ref ? localStorage.getItem('wedding_couple_photo_' + ref) : '')
            || '');
          const venuePhoto = cleanPhoto(wedding.venue_photo
            || wedding.venue_photo_url
            || order.venue_photo
            || order.venue_photo_url
            || wedding.venue_image
            || wedding.banquet_photo
            || wedding.image4
            || (ref ? localStorage.getItem('wedding_venue_photo_' + ref) : '')
            || '');

          wedding.bride_photo = bridePhoto || wedding.bride_photo;
          wedding.groom_photo = groomPhoto || wedding.groom_photo;
          wedding.couple_photo = couplePhoto || wedding.couple_photo;
          wedding.venue_photo = venuePhoto || wedding.venue_photo;
          wedding.banquet_photo = venuePhoto || wedding.banquet_photo;

          const landingBg = cleanPhoto(wedding.landing_background
            || wedding.landingBackground
            || order.landing_background
            || order.landingBackground
            || (ref ? localStorage.getItem('wedding_landing_background_' + ref) : '')
            || '');
          const pageBg = cleanPhoto(wedding.page_background
            || wedding.pageBackground
            || order.page_background
            || order.pageBackground
            || (ref ? localStorage.getItem('wedding_page_background_' + ref) : '')
            || '');

          if (landingBg) {
            wedding.landing_background = landingBg;
            wedding.landingBackground = landingBg;
          }
          if (pageBg) {
            wedding.page_background = pageBg;
            wedding.pageBackground = pageBg;
          }

          const musicUrl = wedding.music_url
            || order.music_url
            || localStorage.getItem('wedding_music_url_' + ref)
            || localStorage.getItem('wedding-music-url')
            || '';
          const musicTitle = wedding.music_title
            || order.music_title
            || localStorage.getItem('wedding_music_title_' + ref)
            || localStorage.getItem('wedding-music-title')
            || '';
          const musicId = wedding.music_id
            || order.music_id
            || localStorage.getItem('wedding-music-id')
            || '';

          if (musicUrl) wedding.music_url = musicUrl;
          if (musicTitle) wedding.music_title = musicTitle;
          if (musicId) wedding.music_id = musicId;

          if (!wedding.bride_parents && (order.bride_parents || order.bride_father)) wedding.bride_parents = order.bride_parents || order.bride_father;
          if (!wedding.groom_parents && (order.groom_parents || order.groom_father)) wedding.groom_parents = order.groom_parents || order.groom_father;
          if (!wedding.bride_parents && ref && typeof localStorage !== 'undefined') wedding.bride_parents = localStorage.getItem('wedding_bride_parents_' + ref) || '';
          if (!wedding.groom_parents && ref && typeof localStorage !== 'undefined') wedding.groom_parents = localStorage.getItem('wedding_groom_parents_' + ref) || '';
          if (!wedding.bride_father && (wedding.bride_parents || order.bride_parents || order.bride_father)) wedding.bride_father = wedding.bride_parents || order.bride_parents || order.bride_father;
          if (!wedding.groom_father && (wedding.groom_parents || order.groom_parents || order.groom_father)) wedding.groom_father = wedding.groom_parents || order.groom_parents || order.groom_father;
          if (!wedding.bride_address && order.bride_address) wedding.bride_address = order.bride_address;
          if (!wedding.groom_address && order.groom_address) wedding.groom_address = order.groom_address;
          if (!wedding.map_url && order.map_url) wedding.map_url = order.map_url;
          if (!wedding.venue && (order.venue || order.venue_name || order.banquet_name)) wedding.venue = order.venue || order.venue_name || order.banquet_name;
          if (!wedding.venue_name && (order.venue || order.venue_name || order.banquet_name)) wedding.venue_name = order.venue || order.venue_name || order.banquet_name;
          if (!wedding.venue_title && order.venue_title) wedding.venue_title = order.venue_title;
          if (!wedding.address && (order.address || order.venue_address || order.location)) wedding.address = order.address || order.venue_address || order.location;
          if (!wedding.venue_address && (order.address || order.venue_address || order.location)) wedding.venue_address = order.address || order.venue_address || order.location;

          return {
            guest: {
              id: guest.id,
              name: guest.guest_name || guest.name || 'Respected Guest',
              phone: guest.phone || '',
              city: guest.city_address || guest.city || '',
              address: guest.city_address || guest.address || '',
              category: guest.category || (isFamily ? 'Family' : 'Person'),
              invite_code: guest.invite_code || code,
              persons: capacity,
              person_display: String(capacity),
              with_family: isFamily,
              family_display: isFamily ? '✓' : '✕'
            },
            wedding,
            events: order.events || wedding.events || []
          };
        }
      } catch (_) {}
    }
  }
  return null;
}

export function fetchInvitationByCode(inviteCode, { signal, skipCache = false } = {}) {
  const code = String(inviteCode || '').trim();
  if (!code || code.length > 120) {
    return Promise.reject(new Error('Open your personalized invitation using its ?code= invite link.'));
  }

  const inflightKey = code.toUpperCase();

  if (!skipCache && invitationMemoryCache.has(inflightKey)) {
    const cached = invitationMemoryCache.get(inflightKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
      return Promise.resolve(cached.data);
    }
    invitationMemoryCache.delete(inflightKey);
  }

  if (inflightInvitationRequests.has(inflightKey)) {
    return inflightInvitationRequests.get(inflightKey);
  }

  const requestPromise = (async () => {
    try {
      // Check if guest link was explicitly deleted / withdrawn from dashboard
      try {
        const deletedCodes = typeof localStorage !== 'undefined' ? JSON.parse(localStorage.getItem('primeecard_deleted_invite_codes') || '[]') : [];
        if (deletedCodes.includes(code) || deletedCodes.includes(inflightKey)) {
          throw new Error('Sorry, your invitation card is cancelled or withdrawn. Please confirm.');
        }
      } catch (err) {
        if (err.message && err.message.includes('cancelled or withdrawn')) throw err;
      }

      // Fast-path preview codes (e.g. preview or local dashboard)
      if (inflightKey === 'PREVIEW' || inflightKey.startsWith('PREVIEW-')) {
        const localMatch = findLocalInvitation(code);
        if (localMatch) return localMatch;
      }

      let data;
      try {
        data = await supabaseRequest('rpc/lookup_invitation', {
          method: 'POST',
          body: { p_invite_code: code },
          signal
        });
      } catch (err) {
        // Explicit caller cancellation MUST NEVER be retried
        if (err.isCallerAbort || (signal && signal.aborted)) {
          throw err;
        }

        // Automatic 1-time retry strictly for bounded transient failures (application timeout, HTTP 408, network drop, or 5xx server errors).
        // HTTP 4xx client errors (400, 401, 403, 404), invalid invitations, or caller aborts are NEVER retried.
        const isClientError = typeof err.status === 'number' && err.status >= 400 && err.status < 500 && err.status !== 408;
        const isTransient = !isClientError && (
          err.name === 'TimeoutError' ||
          err.isTimeout === true ||
          err.status === 408 ||
          (typeof err.status === 'number' && err.status >= 500 && err.status <= 599) ||
          /network|failed to fetch|fetch failed|connection/i.test(err.message || '')
        );

        if (isTransient) {
          try {
            if (signal?.aborted) {
              const cancelErr = new Error('Request cancelled by caller.');
              cancelErr.name = 'AbortError';
              cancelErr.isCallerAbort = true;
              throw cancelErr;
            }

            // Await 400ms backoff, cancellable immediately if caller aborts during backoff
            await new Promise((resolve, reject) => {
              const timer = setTimeout(resolve, 400);
              if (signal) {
                const onAbort = () => {
                  clearTimeout(timer);
                  const cancelErr = new Error('Request cancelled by caller.');
                  cancelErr.name = 'AbortError';
                  cancelErr.isCallerAbort = true;
                  reject(cancelErr);
                };
                signal.addEventListener('abort', onAbort, { once: true });
              }
            });

            if (signal?.aborted) {
              const cancelErr = new Error('Request cancelled by caller.');
              cancelErr.name = 'AbortError';
              cancelErr.isCallerAbort = true;
              throw cancelErr;
            }

            data = await supabaseRequest('rpc/lookup_invitation', {
              method: 'POST',
              body: { p_invite_code: code },
              signal
            });
          } catch (retryErr) {
            if (retryErr.isCallerAbort || (signal && signal.aborted)) {
              throw retryErr;
            }
            const localMatch = findLocalInvitation(code);
            if (localMatch) return localMatch;
            throw retryErr;
          }
        } else {
          const localMatch = findLocalInvitation(code);
          if (localMatch) return localMatch;
          throw err;
        }
      }

      if (!data || !data.guest || !data.wedding) {
        const localMatch = findLocalInvitation(code);
        if (localMatch) return localMatch;
      }

      // Check if local dashboard has an edited/updated record for this guest code
      const localMatch = findLocalInvitation(code);
      if (data && data.guest && localMatch && localMatch.guest) {
        const localCount = Number(localMatch.guest.family_members !== undefined ? localMatch.guest.family_members : localMatch.guest.persons);
        if (Number.isInteger(localCount) && localCount >= 1 && localCount <= 20) {
          data.guest.family_members = localCount;
          data.guest.persons = localCount;
        }
        if (localMatch.guest.with_family !== undefined) {
          data.guest.with_family = localMatch.guest.with_family;
        }
        if (localMatch.guest.category) {
          data.guest.category = localMatch.guest.category;
        }
        if (localMatch.guest.name || localMatch.guest.guest_name) {
          data.guest.guest_name = localMatch.guest.name || localMatch.guest.guest_name;
        }
      }

      if (data && data.wedding && localMatch && localMatch.wedding) {
        const lw = localMatch.wedding;
        const dw = data.wedding;
        if (!dw.music_url && lw.music_url) dw.music_url = lw.music_url;
        if (!dw.music_title && lw.music_title) dw.music_title = lw.music_title;
        if (!dw.music_id && lw.music_id) dw.music_id = lw.music_id;
        if (!dw.venue && lw.venue) dw.venue = lw.venue;
        if (!dw.venue_name && lw.venue_name) dw.venue_name = lw.venue_name;
        if (!dw.address && lw.address) dw.address = lw.address;
        if (!dw.venue_address && lw.venue_address) dw.venue_address = lw.venue_address;
        if (!dw.map_url && lw.map_url) dw.map_url = lw.map_url;
        if (!dw.groom_photo && lw.groom_photo) dw.groom_photo = lw.groom_photo;
        if (!dw.bride_photo && lw.bride_photo) dw.bride_photo = lw.bride_photo;
        if (!dw.couple_photo && lw.couple_photo) dw.couple_photo = lw.couple_photo;
        if (!dw.venue_photo && lw.venue_photo) dw.venue_photo = lw.venue_photo;
        if (!dw.landing_background && lw.landing_background) dw.landing_background = lw.landing_background;
        if (!dw.page_background && lw.page_background) dw.page_background = lw.page_background;
      }

      const normalized = normalizeInvitation(data, code);
      invitationMemoryCache.set(inflightKey, { timestamp: Date.now(), data: normalized });
      return normalized;
    } finally {
      inflightInvitationRequests.delete(inflightKey);
    }
  })();

  inflightInvitationRequests.set(inflightKey, requestPromise);
  return requestPromise;
}

export async function fetchWeddingById(id) {
  const weddingId = String(id || '').trim();
  if (!weddingId || weddingId.length > 120) throw new Error('A wedding ID is required.');
  const data = await supabaseRequest('rpc/lookup_wedding', {
    method: 'POST',
    body: { p_wedding_id: weddingId }
  });
  return normalizeWeddingPayload(data);
}

export async function submitRsvp({ inviteCode, response, attendees, wishesMessage, capacity }) {
  const code = String(inviteCode || '').trim();
  const normalizedResponse = String(response || '').trim().toLowerCase();
  const count = Number(attendees);
  const maxGuests = Number(capacity);

  if (!code) throw new Error('A valid invitation link is required to send your RSVP.');
  if (!['attending', 'declined', 'tentative'].includes(normalizedResponse)) {
    throw new Error('Choose attending, declined, or tentative.');
  }
  if (!Number.isInteger(maxGuests) || maxGuests < 1 || maxGuests > 20) {
    throw new Error('This invitation has an invalid guest limit.');
  }
  if (normalizedResponse === 'attending' && (!Number.isInteger(count) || count < 1 || count > maxGuests)) {
    throw new Error(`Guest count must be between 1 and ${maxGuests}.`);
  }

  const result = await supabaseRequest('rpc/submit_invitation_rsvp', {
    method: 'POST',
    body: {
      p_invite_code: code,
      p_status: normalizedResponse,
      p_attending_count: normalizedResponse === 'attending' ? count : 0,
      p_wishes_message: cleanText(wishesMessage, 1000)
    }
  });
  if (!result || result.success !== true) throw new Error('Your RSVP could not be saved.');
  invitationMemoryCache.delete(code.toUpperCase());
  return result;
}
