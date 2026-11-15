/* ==========================================================================
   PURUSHOTTAM & SANJUKTA / PARI & PARAM (Template 14)
   Royal Palace 3D Grand Door Wedding Invitation Suite:
   - Act I (1st Image - Intro Palace Grand Door):
     - Starry night entrance with 1024x1536 geometry.
     - 3D swinging palace door leaves (lL / lR with perspective: 120cqw, transform-origin: 24.2% & 75.8%).
     - 6 glowing lanterns on the door frame igniting sequentially at i * 420ms.
     - Realtime HTML5 canvas fireworks with 5 fountain launchers & soaring rocket bursts.
     - Synthesized Web Audio API sound for offline sparkler crackle & palace chime.
     - Center royal welcome board inside arch (left: 29.3%, top: 49.5%, width: 41.4%, height: 29.6%):
       "WELCOME" in Cinzel gold, "A CELEBRATION OF LOVE", couple names in Great Vibes cursive,
       "CORDIALLY INVITED", guest name & party count badge, pulsating "OPEN" button,
       and tap hotspot on red carpet ("✦ Tap to open the invitation ✦").
     - Skip Intro button neatly nested on the board.
     - Bottom navigation dock strictly hidden on intro.
     - NO top suite bar.
   - Act II (2nd Image - Screen 1): The Royal Couple & Lineage:
     - Backdrop: Royal palace interior stage (--t14-page) with dolly zoom (.t14-bg.d { transform: scale(1.2); }).
     - Frosted glass board (.t14-board) with blur 13px, gold border, and soft shadow.
     - Traditional shloka: "॥ শ্রী শ্রী প্রজাপতয়ে নমঃ ॥"
     - "Two Hearts · One Destiny", "Together with their Families"
     - "The Journey of Love & Togetherness"
     - Left: Bride medallion photo, "Bride", dynamic Pari, "d/o", Kalam (no mother name), formatted address.
     - Center: Calligraphic "&".
     - Right: Groom medallion photo, "Groom", dynamic Param, "s/o", Abdul (no mother name), formatted address.
     - Footer tagline:
       "❖"
       "Two hearts, two families,"
       "one beautiful beginning."
     - "✦ SCROLL FOR SACRED MUHURAT ✦"
     - Floating bottom navigation dock visible from this screen onward.
   - Act III (3rd Image - Screen 2): Auspicious Wedding Muhurat:
     - Mirrored side pillars using template-14-border.svg (.t14-border-l at left:0, .t14-border-r at right:0 scaleX(-1)).
     - "Auspicious Wedding Muhurat · The Sacred Wedding Date"
     - "Scratch below to reveal our sacred wedding date, followed by live countdown & calendar"
     - Interactive Scratch & Reveal Wedding Date card with gold foil canvas.
     - Live 4-box Countdown Timer (Days, Hours, Minutes, Seconds).
     - "📅 SAVE DATE TO CALENDAR" (Google Calendar link).
   - Act IV (4th Image - Screen 3): Wedding Programme:
     - Framed with mirrored side pillars (.t14-border-l & .t14-border-r).
     - Ceremony cards with event photo thumbnails, date/time ribbons, venue, and "RSVP →" links.
   - Act V (5th Image - Screen 4): Banquet & Venue:
     - Framed with mirrored side pillars (.t14-border-l & .t14-border-r).
     - Banquet Name, Location/Address, banquet hero photo (or palace fallback), and Google Maps directions.
   - Act VI (Screen 5): Closing Blessing & Royal RSVP Suite:
     - Framed with mirrored side pillars (.t14-border-l & .t14-border-r).
     - Family Invitation Board / Respected Guest badge.
     - "✉️ OPEN ROYAL RSVP MODAL" button.
     - Closing family blessing: "With love, affection, and best wishes, / The Pari & Para Families".
     - "✨ REPLAY ENTRANCE & LIGHTS" button.
   ========================================================================== */

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ESC[c]);
const clean = v => String(v ?? '').trim();
const safeUrl = u => (/^https?:\/\//i.test(clean(u)) ? esc(clean(u)) : '');
const safeImg = u => {
  const c = clean(u);
  if (!c) return '';
  if (/^(https?:\/\/|data:image\/(png|jpe?g|webp|gif|svg\+xml);base64,|\/|\.\/)/i.test(c)) {
    return esc(c);
  }
  return '';
};

const getStoredPhoto = k => {
  try {
    if (typeof localStorage !== 'undefined') {
      const v = localStorage.getItem(k);
      return safeImg(v);
    }
  } catch (_) {}
  return '';
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatWeddingDate(raw) {
  if (!raw) return 'Saturday, 28 November 2026';
  const m = String(raw).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return clean(raw);
  const d = new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10));
  if (isNaN(d.getTime())) return clean(raw);
  const dayName = DAYS[d.getDay()];
  const monthName = MONTHS[d.getMonth()];
  return `${dayName}, ${d.getDate()} ${monthName} ${d.getFullYear()}`;
}

function formatRibbonDate(dateStr, timeStr) {
  let datePart = '28 Nov 2026';
  if (dateStr) {
    const m = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) {
      const d = new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10));
      if (!isNaN(d.getTime())) {
        const shortMonth = MONTHS[d.getMonth()].slice(0, 3);
        datePart = `${d.getDate()} ${shortMonth} ${d.getFullYear()}`;
      }
    } else {
      datePart = clean(dateStr);
    }
  }
  const timePart = clean(timeStr) || '07:00 PM';
  return `${datePart} · ${timePart}`;
}

function formatAddress(addr) {
  const cleaned = clean(addr) || 'Ancestral Heritage, West Bengal';
  const parts = cleaned.split(/,\s*/);
  if (parts.length <= 1) return esc(cleaned);
  return parts.map(p => esc(p.trim())).filter(Boolean).join('<br>');
}

function getFatherOnly(str, fallback) {
  const c = clean(str);
  if (!c) return fallback;
  const cleaned = c.replace(/^(Mr\.?\s*and\s*Mrs\.?|Mr\.?\s*&amp;\s*Mrs\.?|Mr\.?\s*&\s*Mrs\.?)\s+/i, '');
  const m = cleaned.match(/^([A-Za-z\s]+?)(?:\s+(?:and|&amp;|&)\s+|$)/i);
  if (m && m[1]) return m[1].trim();
  const f = cleaned.split(/\s*,\s*|\s+(?:and|&amp;|&)\s+/i)[0];
  return f ? f.trim() : fallback;
}

const CEREMONY_IMAGES = [
  { re: /gaye\s*holud|haldi/i, img: './assets/template-06-gaye-holud.webp' },
  { re: /mehendi|mehndi|sangeet/i, img: './assets/template-06-mehendi.webp' },
  { re: /bibaho|wedding|biye|shaadi/i, img: './assets/template-06-shubho-bibaho.webp' },
  { re: /reception|bou\s*bhat/i, img: './assets/template-06-reception.webp' }
];

function getEventPhoto(ev) {
  const photo = safeImg(ev.photo || ev.event_photo || ev.image);
  if (photo) return photo;
  const name = clean(ev.event_name || ev.name || '');
  for (const item of CEREMONY_IMAGES) {
    if (item.re.test(name)) return item.img;
  }
  return './assets/template-06-shubho-bibaho.webp';
}

function makeCalendarLink({ title, description, location, startDate, startTime }) {
  let sDate = '20261128';
  let sTime = '190000';
  if (startDate) {
    const m = String(startDate).match(/^(\d{4})-?(\d{2})-?(\d{2})$/);
    if (m) sDate = `${m[1]}${m[2]}${m[3]}`;
  }
  if (startTime) {
    const tm = String(startTime).match(/(\d{1,2}):?(\d{2})/);
    if (tm) {
      let hh = parseInt(tm[1], 10);
      const mm = tm[2];
      if (/pm/i.test(startTime) && hh < 12) hh += 12;
      if (/am/i.test(startTime) && hh === 12) hh = 0;
      sTime = `${String(hh).padStart(2, '0')}${mm}00`;
    }
  }
  const startIso = `${sDate}T${sTime}`;
  const endIso = `${sDate}T235900`;
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title || 'Sacred Wedding Ceremony',
    dates: `${startIso}/${endIso}`,
    details: description || 'Cordially invited to grace the auspicious wedding celebration.',
    location: location || 'Royal Palace Banquet'
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/* ==========================================================================
   DEFAULT EXPORT: RENDER HTML
   ========================================================================== */
export default function renderTemplate14({ guest = {}, wedding = {}, events = [] } = {}) {
  const gName = clean(guest.name) || clean(guest.family_name) || 'Respected Guest';
  const partySize = parseInt(guest.party_size || guest.passes || 2, 10) || 2;
  const isFamily = partySize > 1 || Boolean(guest.is_family || (guest.family_name && !guest.name));
  const partyBadge = isFamily ? `Family Invitation · ${partySize} Persons` : `Personal Invitation · ${partySize} Person`;

  const brideName = clean(wedding.bride_name) || 'Pari';
  const groomName = clean(wedding.groom_name) || 'Param';
  const bridePhoto = safeImg(wedding.bride_photo) || getStoredPhoto('bride_photo') || './assets/template-06-bride.webp';
  const groomPhoto = safeImg(wedding.groom_photo) || getStoredPhoto('groom_photo') || './assets/template-06-groom.webp';
  const brideAddr = clean(wedding.bride_address) || clean(wedding.bride_city) || 'Ancestral Heritage, West Bengal';
  const groomAddr = clean(wedding.groom_address) || clean(wedding.groom_city) || 'Ancestral Heritage, West Bengal';

  const brideFather = clean(wedding.bride_father) || getFatherOnly(wedding.bride_parents, 'Kalam');
  const groomFather = clean(wedding.groom_father) || getFatherOnly(wedding.groom_parents, 'Abdul');

  const weddingDateStr = formatWeddingDate(wedding.date);
  const venueName = clean(wedding.venue_name) || clean(wedding.banquet_name) || 'Royal Palace Banquet';
  const venueAddr = clean(wedding.venue_address) || clean(wedding.location) || 'Riverfront Promenade, Heritage Boulevard';
  const banquetPhoto = safeImg(wedding.venue_photo) || safeImg(wedding.banquet_photo) || getStoredPhoto('venue_photo') || './assets/template-14-page.webp';

  const mapLink = safeUrl(wedding.map_url) || `https://maps.google.com/?q=${encodeURIComponent(`${venueName}, ${venueAddr}`)}`;
  const calLink = makeCalendarLink({
    title: `Wedding of ${groomName} & ${brideName}`,
    description: `You are cordially invited to celebrate the auspicious wedding of ${groomName} and ${brideName}.`,
    location: `${venueName}, ${venueAddr}`,
    startDate: wedding.date,
    startTime: wedding.time
  });

  const rawEvents = Array.isArray(events) && events.length ? events : [
    { event_name: 'Ceremony 1 · Gaye Holud', event_date: '2026-11-20', event_time: '10:00 AM', venue: venueName },
    { event_name: 'Ceremony 2 · Sangeet & Mehendi', event_date: '2026-11-24', event_time: '6:30 PM', venue: venueName },
    { event_name: 'Ceremony 3 · Shubho Bibaho', event_date: wedding.date || '2026-11-28', event_time: wedding.time || '7:00 PM', venue: venueName },
    { event_name: 'Ceremony 4 · Grand Reception', event_date: '2026-11-30', event_time: '7:30 PM', venue: venueName }
  ];

  // Geometries for 1024 x 1536 artwork
  const W0 = 1024, H0 = 1536;
  const pctW = x => `${(x / W0 * 100).toFixed(2)}%`;
  const pctH = y => `${(y / H0 * 100).toFixed(2)}%`;
  const LAMPS = [
    [175, 645, 300],
    [850, 645, 300],
    [22, 1052, 160],
    [998, 1052, 160],
    [98, 1078, 130],
    [925, 1078, 130]
  ];

  return `
<style>
/* ==========================================================================
   TEMPLATE 14 STYLES (Royal Palace 3D Grand Door Suite)
   ========================================================================== */
:root {
  --t14-landing: url('./assets/template-14-cover.webp');
  --t14-page: url('./assets/template-14-page.webp');
  --t14-border: url('./assets/template-14-border.svg');
  --t14-navy: #050a1a;
  --t14-gold-start: #fffbe8;
  --t14-gold-mid: #ffe9a6;
  --t14-gold-end: #f0c35c;
  --t14-crimson: #7a1426;
  --t14-dark-wine: #320912;
}

#t14-stage * {
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  -webkit-user-select: none;
}

#t14-stage {
  position: relative;
  overflow: hidden;
  container-type: size;
  height: 100dvh;
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  background: var(--t14-navy);
  font-family: 'Cormorant Garamond', Georgia, serif;
}

/* ==========================================================================
   ACT I: 3D PALACE DOOR INTRO (Screen 0)
   ========================================================================== */
.t14-intro {
  position: absolute;
  inset: 0;
  z-index: 50;
  opacity: 0;
  perspective: 120cqw;
  transition: opacity 0.6s ease;
  touch-action: none;
}
.t14-intro.ready {
  opacity: 1;
}
.t14-intro > * {
  position: absolute;
  inset: 0;
}

.t14-frame-wrap {
  position: absolute;
  inset: 0;
  background: var(--t14-landing) 0 0/100% 100% no-repeat;
  transition: opacity 3.6s linear;
}
.t14-frame-wrap.f {
  opacity: 0;
}

.t14-leaf {
  position: absolute;
  inset: 0;
  background: var(--t14-landing) 0 0/100% 100% no-repeat;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  transition: transform 7s cubic-bezier(0.42, 0.05, 0.4, 1), filter 7s linear, opacity 1.2s ease;
  will-change: transform;
}
.t14-leaf.o {
  filter: brightness(0.3);
}
.t14-leaf-l {
  transform-origin: 24.2% 50%;
}
.t14-leaf-r {
  transform-origin: 75.8% 50%;
}
.t14-leaf-l.o {
  transform: rotateY(100deg);
}
.t14-leaf-r.o {
  transform: rotateY(-100deg);
}
.t14-leaf.x {
  opacity: 0;
}

/* 6 Glowing sequential lamps */
.t14-glow {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 225, 150, 0.95) 0%, rgba(255, 160, 50, 0.55) 28%, rgba(255, 110, 20, 0.18) 52%, transparent 70%);
  mix-blend-mode: screen;
  opacity: 0;
  pointer-events: none;
}
.t14-glow.on {
  animation: t14LampIn 1.4s ease-out forwards, t14LampFlick 1.6s 1.4s infinite alternate;
}
@keyframes t14LampIn {
  to { opacity: 0.85; }
}
@keyframes t14LampFlick {
  from { opacity: 0.85; transform: scale(0.98); }
  to { opacity: 0.55; transform: scale(1.02); }
}

/* Intro Text Container inside central arch */
#t14-intro-text-box {
  position: absolute;
  left: 29.3%;
  top: 49.5%;
  right: auto;
  bottom: auto;
  width: 41.4%;
  height: 29.6%;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  transition: opacity 0.8s ease;
}
#t14-intro-text-box.h {
  opacity: 0;
}
.t14-tin {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}
.t14-ln {
  width: max-content;
  max-width: 100%;
  text-align: center;
  line-height: 1.12;
  white-space: nowrap;
}
.t14-sm {
  font-family: 'Cinzel', serif;
  font-weight: 600;
  letter-spacing: 0.2em;
  color: #f0cf85;
  margin: 0.5em 0 0.3em;
  text-shadow: 0 0.1em 0.3em #2a0309;
}
.t14-wl {
  font-family: 'Cinzel', serif;
  font-weight: 700;
  letter-spacing: 0.18em;
  background: linear-gradient(180deg, #fff2b8 0%, #e0aa3c 55%, #b27a1c 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  filter: drop-shadow(0 0.06em 0.1em #2a0309);
}
.t14-gr {
  font-family: 'Great Vibes', cursive;
  color: #ffe9b0;
  text-shadow: 0 0.06em 0.12em #3a0510, 0 0 0.4em rgba(255, 200, 90, 0.45);
}
.t14-gu {
  font-family: 'Cormorant Garamond', serif;
  font-weight: 700;
  color: #ffffff;
  text-shadow: 0 0.06em 0.15em #2a0309;
  margin: 0.1em 0;
}
.t14-pe {
  font-family: 'Cormorant Garamond', serif;
  font-weight: 700;
  color: #ffd9c0;
  text-shadow: 0 0.06em 0.15em #2a0309;
}
.t14-op {
  pointer-events: auto;
  cursor: pointer;
  border: 0;
  margin-top: 0.5em;
  font: 700 3.8cqw 'Cinzel', serif;
  letter-spacing: 0.2em;
  text-indent: 0.2em;
  color: #ffe29a;
  background: linear-gradient(180deg, #9a1629 0%, #4d0612 100%);
  padding: 0.45em 1.5em 0.45em 1.7em;
  border-radius: 99px;
  box-shadow: 0 0 0 0.1em #e8c56a, 0 0 0.9em rgba(255, 200, 90, 0.5);
  animation: t14Pulse 1.8s infinite;
}
@keyframes t14Pulse {
  50% { box-shadow: 0 0 0 0.1em #ffe08a, 0 0 2.2em rgba(255, 210, 100, 0.95); }
}

.t14-skip-intro {
  pointer-events: auto;
  cursor: pointer;
  margin-top: 0.4em;
  background: none;
  border: none;
  font: 600 2.2cqw 'Cinzel', serif;
  letter-spacing: 0.18em;
  color: #eed69d;
  text-shadow: 0 0.1em 0.25em rgba(0, 0, 0, 0.9);
  text-decoration: underline;
  text-underline-offset: 0.2em;
  opacity: 0.85;
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.t14-skip-intro:active {
  opacity: 1;
  transform: scale(0.96);
}

/* Carpet Tap Hotspot */
#t14-carpet-tap {
  pointer-events: auto;
  cursor: pointer;
  left: 50%;
  top: 90.8%;
  right: auto;
  bottom: auto;
  transform: translateX(-50%);
  width: max-content;
  height: max-content;
  padding: 0.5cqw 3.5cqw 0.7cqw;
  border-radius: 99px;
  background: linear-gradient(180deg, #7a0f20 0%, #4a0612 100%);
  color: #ffd66e;
  font: italic 700 3.4cqw 'Cormorant Garamond', serif;
  box-shadow: 0 0 0 0.3cqw #d9ad4a, 0 0 3cqw rgba(255, 190, 80, 0.5);
  animation: t14Pulse 2s infinite;
  white-space: nowrap;
  transition: opacity 0.6s ease;
}
#t14-carpet-tap.h {
  opacity: 0;
  pointer-events: none;
}

/* Fireworks Canvas */
#t14-fireworks {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 55;
  mix-blend-mode: screen;
  pointer-events: none;
  display: none;
}

/* ==========================================================================
   PAGES CONTAINER & SCREENS
   ========================================================================== */
.t14-pages {
  position: absolute;
  inset: 0;
  overflow: hidden;
  scroll-snap-type: y mandatory;
  overscroll-behavior: contain;
  scroll-behavior: smooth;
}
.t14-pages.u {
  overflow-y: auto;
  scrollbar-width: none;
}
.t14-pages.u::-webkit-scrollbar {
  display: none;
}

.t14-page {
  position: relative;
  height: 100cqh;
  min-height: 100cqh;
  scroll-snap-align: start;
  scroll-snap-stop: always;
  overflow: hidden;
}

/* ==========================================================================
   SCREEN 1 (2nd Image): ROYAL COUPLE & LINEAGE (Palace Backdrop)
   ========================================================================== */
.t14-page-couple {
  background: #0b1740;
  position: relative;
  overflow: hidden;
}
.t14-bg {
  position: absolute;
  inset: 0;
  background: var(--t14-page) center/cover no-repeat;
  transform-origin: 50% 46%;
  transform: scale(1);
  transition: transform 5s ease-out;
}
.t14-bg.d {
  transform: scale(1.2);
}

/* Frosted glass veil on Screen 1 */
.t14-board {
  position: absolute;
  left: 7.5%;
  right: 7.5%;
  top: 14%;
  bottom: 15%;
  border-radius: 4cqw;
  -webkit-backdrop-filter: blur(13px) saturate(1.1);
  backdrop-filter: blur(13px) saturate(1.1);
  background: linear-gradient(160deg, rgba(255, 250, 238, 0.62), rgba(255, 240, 214, 0.46));
  box-shadow: inset 0 0 0 0.35cqw rgba(214, 170, 70, 0.8), inset 0 0 0 0.9cqw rgba(255, 255, 255, 0.22), 0 3cqw 8cqw rgba(60, 20, 0, 0.35);
  opacity: 0;
  transition: opacity 1.4s ease;
  pointer-events: none;
  z-index: 1;
}
.t14-board.on {
  opacity: 1;
}

.t14-cb {
  position: absolute;
  left: 10%;
  width: 80%;
  top: 15%;
  bottom: 16%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-evenly;
  color: #1a1004;
  font-weight: 700;
  z-index: 2;
  text-align: center;
  padding: 1cqw 2cqw;
}
.t14-it {
  opacity: 0;
  transform: translateY(2cqw);
  transition: opacity 0.9s ease, transform 0.9s ease;
}
.t14-cb.on .t14-it {
  opacity: 1;
  transform: none;
}

.t14-hd {
  text-align: center;
  margin-bottom: 1cqw;
}
.t14-shloka {
  font-family: 'Cinzel', serif;
  font-size: 2.8cqw;
  font-weight: 700;
  letter-spacing: 0.16em;
  color: #801428;
  margin-bottom: 0.4cqw;
  text-shadow: 0 0 1.2cqw rgba(255, 248, 236, 0.95);
}
.t14-eyebrow {
  font: 700 3.2cqw 'Cinzel', serif;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: #4a3006;
  padding-left: 0.28em;
  text-shadow: 0 0 1.5cqw rgba(255, 248, 236, 0.9);
}
.t14-kicker {
  font-family: 'Cormorant Garamond', serif;
  font-size: 3.4cqw;
  font-style: italic;
  font-weight: 600;
  color: #63430c;
  margin-top: 0.3cqw;
  text-shadow: 0 0 1.2cqw rgba(255, 248, 236, 0.9);
}
.t14-hero-title {
  font-family: 'Cinzel', serif;
  font-size: 3.4cqw;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #801428;
  margin-top: 0.4cqw;
  padding-left: 0.2em;
  text-shadow: 0 0 1.5cqw rgba(255, 248, 236, 0.95);
}
.t14-gold-line {
  display: block;
  width: 32cqw;
  height: 0.5cqw;
  margin: 1.4cqw auto 0;
  background: linear-gradient(90deg, transparent, #b8862b, #f3d98b, #b8862b, transparent);
  border-radius: 1cqw;
}

/* Couple Columns Grid (Left Bride, Right Groom) */
.t14-row {
  display: flex;
  width: 100%;
  justify-content: space-between;
  align-items: flex-start;
  margin: 0.6cqw 0;
}
.t14-col {
  width: 44%;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
.t14-amp {
  width: 10%;
  text-align: center;
  font: 400 9cqw 'Great Vibes', cursive;
  color: #801428;
  margin-top: 6cqw;
  line-height: 1;
}

.t14-ph {
  width: 22cqw;
  height: 22cqw;
  border-radius: 50%;
  padding: 0.9cqw;
  background: conic-gradient(#b8862b, #f7e08f, #b8862b, #f7e08f, #b8862b);
  box-shadow: 0 1cqw 3cqw rgba(60, 30, 0, 0.35);
  margin-bottom: 1.2cqw;
}
.t14-pi {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
  background: #f6e6c0;
  display: flex;
  align-items: center;
  justify-content: center;
  font: 400 11cqw 'Great Vibes', cursive;
  color: #0b1740;
}
.t14-pi img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.t14-role {
  font: 700 2.4cqw 'Cinzel', serif;
  letter-spacing: 0.22em;
  color: #801428;
  padding-left: 0.22em;
  margin-top: 0.6cqw;
  text-transform: uppercase;
}
.t14-nm {
  width: max-content;
  max-width: 100%;
  font-family: 'Great Vibes', cursive;
  font-weight: 700;
  font-size: 7.2cqw;
  color: #0b1740;
  line-height: 1.1;
  white-space: nowrap;
  margin-top: 0.3cqw;
  text-shadow: 0 0 1.2cqw rgba(255, 248, 236, 0.95);
}
.t14-lb {
  font: 700 2.4cqw 'Cinzel', serif;
  letter-spacing: 0.18em;
  color: #4a3006;
  margin-top: 0.8cqw;
  text-transform: lowercase;
}
.t14-fa {
  font-weight: 700;
  font-size: 3.8cqw;
  color: #1a1004;
  line-height: 1.15;
  margin-top: 0.3cqw;
  text-shadow: 0 0 1.2cqw rgba(255, 248, 236, 0.95);
}
.t14-ad {
  font-weight: 700;
  font-size: 3cqw;
  color: #38240f;
  line-height: 1.22;
  margin-top: 0.6cqw;
  text-shadow: 0 0 1.2cqw rgba(255, 248, 236, 0.95);
}

/* Footer Tagline on Screen 1 */
.t14-p1-footer {
  margin-top: 0.6cqw;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.t14-ornament-icon {
  font-size: 3.4cqw;
  color: #801428;
  margin-bottom: 0.3cqw;
}
.t14-tagline {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 3.4cqw;
  font-style: italic;
  font-weight: 600;
  color: #4a3006;
  line-height: 1.35;
  margin: 0;
  text-shadow: 0 0 1.2cqw rgba(255, 248, 236, 0.95);
}
.t14-scroll-cue {
  font-family: 'Cinzel', serif;
  font-size: 2.2cqw;
  font-weight: 700;
  letter-spacing: 0.24em;
  color: #801428;
  margin-top: 1.2cqw;
  animation: t14Float 2s ease-in-out infinite;
}
@keyframes t14Float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(3px); }
}

/* ==========================================================================
   FRAMED SCREENS: 2, 3, 4, 5 (template-14-border.svg)
   ========================================================================== */
.t14-page-framed {
  background: radial-gradient(120% 90% at 50% 45%, #fff7e4 0%, #f8e9c8 60%, #ecd39c 100%);
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  align-items: center;
  padding-top: calc(16px + 2cqw);
  padding-bottom: calc(72px + env(safe-area-inset-bottom, 16px));
  padding-left: 17.5cqw;
  padding-right: 17.5cqw;
  text-align: center;
  overflow-x: hidden;
}

/* Mirrored side pillar borders */
.t14-page-framed i {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 16.1cqw;
  background: var(--t14-border) 0 0/100% 100% no-repeat;
  pointer-events: none;
  z-index: 2;
}
.t14-page-framed .t14-border-l,
.t14-page-framed i:nth-of-type(1) {
  left: 0 !important;
  right: auto !important;
}
.t14-page-framed .t14-border-r,
.t14-page-framed i:nth-of-type(2) {
  right: 0 !important;
  left: auto !important;
  transform: scaleX(-1);
}

.t14-framed-content {
  position: relative;
  z-index: 3;
  width: 100%;
  height: 100%;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  align-items: center;
}

.t14-sec-kicker {
  font-family: 'Cinzel', serif;
  font-size: 2.6cqw;
  font-weight: 700;
  letter-spacing: 0.22em;
  color: #801428;
  text-transform: uppercase;
}
.t14-sec-title {
  font-family: 'Cinzel', serif;
  font-size: 4cqw;
  font-weight: 700;
  letter-spacing: 0.16em;
  color: #1a0b02;
  margin-top: 0.4cqw;
  text-transform: uppercase;
}
.t14-sec-subtitle {
  font-family: 'Cormorant Garamond', serif;
  font-size: 3.2cqw;
  font-style: italic;
  font-weight: 600;
  color: #553508;
  margin-top: 0.5cqw;
  line-height: 1.3;
}

/* ==========================================================================
   SCREEN 2: AUSPICIOUS WEDDING MUHURAT (Scratch & Reveal + Countdown)
   ========================================================================== */
.t14-scratch-card {
  position: relative;
  width: 100%;
  max-width: 62cqw;
  margin: 0.8cqw auto 0.4cqw;
  border-radius: 2.5cqw;
  padding: 0.6cqw;
  background: conic-gradient(from 180deg, #b8860b, #ffe082, #d4af37, #fff3c4, #aa7c11, #ffd54f, #b8860b);
  box-shadow: 0 1.2cqw 3cqw rgba(80, 40, 10, 0.25);
}
.t14-scratch-box {
  position: relative;
  border-radius: 2.1cqw;
  background: #fffdf7;
  overflow: hidden;
  min-height: 18cqw;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2.2cqw 2cqw;
}
.t14-scratch-underlay {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}
.t14-muhurat-shloka {
  font-family: 'Cinzel', serif;
  font-size: 2.2cqw;
  font-weight: 700;
  letter-spacing: 0.16em;
  color: #801428;
  margin-bottom: 0.5cqw;
}
.t14-muhurat-date {
  font-family: 'Cinzel', serif;
  font-size: 4cqw;
  font-weight: 700;
  color: #1a0b02;
  letter-spacing: 0.08em;
  line-height: 1.2;
}
.t14-muhurat-time {
  font-family: 'Cormorant Garamond', serif;
  font-size: 3.4cqw;
  font-weight: 700;
  color: #801428;
  margin-top: 0.5cqw;
}
.t14-muhurat-badge {
  display: inline-block;
  margin-top: 0.8cqw;
  padding: 0.3cqw 2cqw;
  border-radius: 99px;
  background: #fdf3dc;
  border: 0.2cqw solid #e0b44a;
  font-family: 'Cinzel', serif;
  font-size: 2cqw;
  font-weight: 700;
  letter-spacing: 0.14em;
  color: #6d4107;
}

.t14-scratch-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
  cursor: grab;
  touch-action: none;
  transition: opacity 0.6s ease;
}
.t14-scratch-canvas.revealed {
  opacity: 0;
  pointer-events: none;
}

/* 4-Box Countdown Timer */
.t14-countdown-wrap {
  display: flex;
  gap: 1.8cqw;
  justify-content: center;
  align-items: center;
  margin: 0.8cqw auto 0.4cqw;
  width: 100%;
  max-width: 62cqw;
}
.t14-cd-box {
  flex: 1;
  background: linear-gradient(180deg, #fffcf5 0%, #faecd0 100%);
  border: 0.25cqw solid #d4af37;
  border-radius: 2cqw;
  padding: 1.4cqw 0.8cqw;
  box-shadow: 0 0.8cqw 2cqw rgba(70, 30, 10, 0.16);
  display: flex;
  flex-direction: column;
  align-items: center;
}
.t14-cd-num {
  font-family: 'Cinzel', serif;
  font-size: 5cqw;
  font-weight: 700;
  color: #7a1220;
  line-height: 1;
}
.t14-cd-lbl {
  font-family: 'Cinzel', serif;
  font-size: 1.9cqw;
  font-weight: 700;
  letter-spacing: 0.18em;
  color: #553508;
  margin-top: 0.4cqw;
  text-transform: uppercase;
}

/* Calendar Button */
.t14-btn-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 1.5cqw;
  padding: 1.8cqw 5cqw;
  border-radius: 99px;
  background: linear-gradient(180deg, #8c1729 0%, #540816 100%);
  border: 0.3cqw solid #e5b95a;
  box-shadow: 0 1cqw 2.5cqw rgba(84, 8, 22, 0.4), inset 0 0.2cqw 0.5cqw rgba(255, 230, 160, 0.4);
  font-family: 'Cinzel', serif;
  font-size: 2.7cqw;
  font-weight: 700;
  letter-spacing: 0.18em;
  color: #fff6d9;
  text-decoration: none;
  cursor: pointer;
  transition: transform 0.2s ease, filter 0.2s ease;
}
.t14-btn-action:active {
  transform: scale(0.96);
  filter: brightness(0.92);
}

/* ==========================================================================
   SCREEN 3: WEDDING PROGRAMME (Ceremonies with Images)
   ========================================================================== */
.t14-events-list {
  display: flex;
  flex-direction: column;
  gap: 1.4cqw;
  width: 100%;
  max-width: 62cqw;
  margin: 0.8cqw auto 0.4cqw;
}
.t14-event-card {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, rgba(255, 253, 247, 0.96) 0%, rgba(250, 238, 214, 0.92) 100%);
  border: 0.25cqw solid #d4af37;
  border-radius: 2.2cqw;
  padding: 1.2cqw 1.6cqw;
  box-shadow: 0 0.8cqw 2cqw rgba(60, 24, 8, 0.15);
  gap: 2cqw;
  text-align: left;
}
.t14-ev-thumb {
  width: 14cqw;
  height: 14cqw;
  border-radius: 50%;
  padding: 0.5cqw;
  background: conic-gradient(#b8860b, #ffe082, #d4af37, #ffe082, #b8860b);
  flex-shrink: 0;
  overflow: hidden;
}
.t14-ev-thumb img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  display: block;
}
.t14-ev-info {
  flex: 1;
  min-width: 0;
}
.t14-ev-ribbon {
  font-family: 'Cinzel', serif;
  font-size: 2.1cqw;
  font-weight: 700;
  letter-spacing: 0.16em;
  color: #8c1729;
  text-transform: uppercase;
}
.t14-ev-name {
  font-family: 'Cinzel', serif;
  font-size: 3.2cqw;
  font-weight: 700;
  color: #1a0b02;
  margin-top: 0.2cqw;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.t14-ev-venue {
  font-family: 'Cormorant Garamond', serif;
  font-size: 2.8cqw;
  color: #553508;
  margin-top: 0.2cqw;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.t14-ev-badge {
  font-family: 'Cinzel', serif;
  font-size: 2cqw;
  font-weight: 700;
  color: #8c1729;
  letter-spacing: 0.12em;
  padding: 0.3cqw 1cqw;
  border: 0.15cqw solid #e0b44a;
  border-radius: 99px;
  background: #fff8e8;
  flex-shrink: 0;
}

/* ==========================================================================
   SCREEN 4: BANQUET & VENUE (With Image)
   ========================================================================== */
.t14-venue-card {
  width: 100%;
  max-width: 62cqw;
  background: linear-gradient(180deg, #fffdf8 0%, #faecd0 100%);
  border: 0.3cqw solid #d4af37;
  border-radius: 2.5cqw;
  padding: 1.5cqw;
  box-shadow: 0 1.2cqw 3cqw rgba(70, 30, 10, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0.8cqw auto 0.4cqw;
}
.t14-venue-hero {
  width: 100%;
  height: 28cqw;
  border-radius: 1.8cqw;
  overflow: hidden;
  position: relative;
  box-shadow: inset 0 0 2cqw rgba(0, 0, 0, 0.3);
  border: 0.2cqw solid #e0b44a;
}
.t14-venue-hero img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.t14-venue-name {
  font-family: 'Cinzel', serif;
  font-size: 4cqw;
  font-weight: 700;
  color: #1a0b02;
  margin-top: 1.2cqw;
  letter-spacing: 0.12em;
}
.t14-venue-addr {
  font-family: 'Cormorant Garamond', serif;
  font-size: 3.3cqw;
  font-weight: 600;
  color: #553508;
  margin-top: 0.6cqw;
  line-height: 1.3;
}

/* ==========================================================================
   SCREEN 5: CLOSING BLESSINGS & ROYAL RSVP SUITE
   ========================================================================== */
.t14-guest-card {
  width: 100%;
  max-width: 62cqw;
  background: linear-gradient(180deg, #fffdfa 0%, #f7ecd6 100%);
  border: 0.3cqw solid #d4af37;
  border-radius: 2.5cqw;
  padding: 2.4cqw 2cqw;
  box-shadow: 0 1.2cqw 3cqw rgba(70, 30, 10, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0.8cqw auto 0.4cqw;
}
.t14-guest-kicker {
  font-family: 'Cinzel', serif;
  font-size: 2.4cqw;
  font-weight: 700;
  letter-spacing: 0.24em;
  color: #801428;
  text-transform: uppercase;
}
.t14-guest-name {
  font-family: 'Cinzel', serif;
  font-size: 5.2cqw;
  font-weight: 700;
  color: #1a0b02;
  margin-top: 0.6cqw;
}
.t14-guest-badge {
  font-family: 'Cormorant Garamond', serif;
  font-size: 3.4cqw;
  font-style: italic;
  font-weight: 600;
  color: #553508;
  margin-top: 0.6cqw;
}

.t14-closing-text {
  margin: 1.2cqw 0 0.8cqw;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4cqw;
}
.t14-closing-line1 {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 3.8cqw;
  font-style: italic;
  font-weight: 600;
  color: #4a3006;
}
.t14-closing-line2 {
  font-family: 'Cinzel', serif;
  font-size: 4cqw;
  font-weight: 700;
  letter-spacing: 0.16em;
  color: #801428;
}

.t14-btn-rsvp {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 1.5cqw;
  width: 100%;
  max-width: 58cqw;
  padding: 2cqw 4cqw;
  border-radius: 99px;
  background: linear-gradient(180deg, #8c1729 0%, #540816 100%);
  border: 0.3cqw solid #e5b95a;
  box-shadow: 0 1cqw 2.5cqw rgba(84, 8, 22, 0.4), inset 0 0.2cqw 0.5cqw rgba(255, 230, 160, 0.4);
  font-family: 'Cinzel', serif;
  font-size: 3cqw;
  font-weight: 700;
  letter-spacing: 0.2em;
  color: #fff6d9;
  cursor: pointer;
  margin-top: 1cqw;
  transition: transform 0.2s ease, filter 0.2s ease;
}
.t14-btn-rsvp:active {
  transform: scale(0.96);
  filter: brightness(0.92);
}

.t14-btn-replay {
  background: none;
  border: 0.2cqw solid #c9a44b;
  border-radius: 99px;
  padding: 1cqw 3cqw;
  font-family: 'Cinzel', serif;
  font-size: 2.2cqw;
  font-weight: 700;
  letter-spacing: 0.18em;
  color: #6d4107;
  cursor: pointer;
  margin-top: 1.2cqw;
  transition: transform 0.2s ease;
}
.t14-btn-replay:active {
  transform: scale(0.95);
}
</style>

<div id="t14-stage">
  <!-- Screen 0: 3D Palace Grand Door Intro -->
  <div class="t14-intro" id="t14-intro">
    <div class="t14-frame-wrap" id="t14-frame">
      ${LAMPS.map(([cx, cy, s], i) => `
        <div class="t14-glow" id="t14-glow-${i}" style="left: ${pctW(cx - s/2)}; top: ${pctH(cy - s/2)}; width: ${pctW(s)}; height: ${pctH(s)};"></div>
      `).join('')}
    </div>
    <div class="t14-leaf t14-leaf-l" id="t14-leaf-l"></div>
    <div class="t14-leaf t14-leaf-r" id="t14-leaf-r"></div>
    
    <div id="t14-intro-text-box">
      <div class="t14-tin" id="t14-tin">
        <div class="t14-ln t14-wl" style="font-size: 5.4cqw;">WELCOME</div>
        <div class="t14-ln t14-sm" style="font-size: 2.3cqw;">A CELEBRATION OF LOVE</div>
        <div class="t14-ln t14-gr" style="font-size: 7.6cqw;">${esc(groomName)}</div>
        <div class="t14-ln t14-gr" style="font-size: 7.6cqw;">&amp; ${esc(brideName)}</div>
        <div class="t14-ln t14-sm" style="font-size: 2.3cqw;">CORDIALLY INVITED</div>
        <div class="t14-ln t14-gu" style="font-size: 6.6cqw;">${esc(gName)}</div>
        <div class="t14-ln t14-pe" style="font-size: 4.9cqw;">${esc(partyBadge)}</div>
        <button class="t14-ln t14-op" id="t14-hit-open" type="button">OPEN</button>
        <button class="t14-skip-intro" id="t14-skip-btn" type="button">SKIP INTRO</button>
      </div>
    </div>
    
    <div id="t14-carpet-tap">✦ Tap to open the invitation ✦</div>
  </div>

  <!-- Realtime Canvas Fireworks -->
  <canvas id="t14-fireworks"></canvas>

  <!-- Screens Container -->
  <div class="t14-pages" id="t14-pages">
    <!-- Screen 1 (2nd Image): Royal Couple & Lineage -->
    <section class="t14-page t14-page-couple" id="t14-screen-1">
      <div class="t14-bg" id="t14-bg"></div>
      <div class="t14-board" id="t14-board"></div>
      <div class="t14-cb" id="t14-cb">
        <div class="t14-hd t14-it">
          <div class="t14-shloka">॥ শ্রী শ্রী প্রজাপতয়ে নমঃ ॥</div>
          <div class="t14-eyebrow">Two Hearts · One Destiny</div>
          <div class="t14-kicker">Together with their Families</div>
          <div class="t14-hero-title">The Journey of Love &amp; Togetherness</div>
          <i class="t14-gold-line"></i>
        </div>

        <div class="t14-row t14-it">
          <!-- Left: Bride -->
          <div class="t14-col">
            <div class="t14-ph">
              <div class="t14-pi">
                ${bridePhoto ? `<img src="${bridePhoto}" alt="${esc(brideName)}" onerror="this.remove();">` : (brideName.charAt(0) || '♥')}
              </div>
            </div>
            <div class="t14-role">BRIDE</div>
            <div class="t14-nm">${esc(brideName)}</div>
            <div class="t14-lb">d/o</div>
            <div class="t14-fa">${esc(brideFather)}</div>
            <div class="t14-ad">${formatAddress(brideAddr)}</div>
          </div>

          <div class="t14-amp">&amp;</div>

          <!-- Right: Groom -->
          <div class="t14-col">
            <div class="t14-ph">
              <div class="t14-pi">
                ${groomPhoto ? `<img src="${groomPhoto}" alt="${esc(groomName)}" onerror="this.remove();">` : (groomName.charAt(0) || '♥')}
              </div>
            </div>
            <div class="t14-role">GROOM</div>
            <div class="t14-nm">${esc(groomName)}</div>
            <div class="t14-lb">s/o</div>
            <div class="t14-fa">${esc(groomFather)}</div>
            <div class="t14-ad">${formatAddress(groomAddr)}</div>
          </div>
        </div>

        <div class="t14-p1-footer t14-it">
          <div class="t14-ornament-icon">❖</div>
          <p class="t14-tagline">Two hearts, two families,<br>one beautiful beginning.</p>
          <div class="t14-scroll-cue">✦ SCROLL FOR SACRED MUHURAT ✦</div>
        </div>
      </div>
    </section>

    <!-- Screen 2 (3rd Image): Auspicious Wedding Muhurat -->
    <section class="t14-page t14-page-framed" id="dates-section" data-screen="2">
      <i class="t14-border-l" aria-hidden="true"></i>
      <i class="t14-border-r" aria-hidden="true"></i>
      <div class="t14-framed-content">
        <div>
          <div class="t14-sec-kicker">Auspicious Wedding Muhurat</div>
          <div class="t14-sec-title">The Sacred Wedding Date</div>
          <div class="t14-sec-subtitle">Scratch below to reveal our sacred wedding date, followed by live countdown &amp; calendar</div>
        </div>

        <!-- Scratch Card -->
        <div class="t14-scratch-card" id="t14-scratch-card">
          <div class="t14-scratch-box">
            <div class="t14-scratch-underlay">
              <div class="t14-muhurat-shloka">॥ শুভ বিবাহ লগ্ন ॥</div>
              <div class="t14-muhurat-date">${esc(weddingDateStr)}</div>
              <div class="t14-muhurat-time">Auspicious Lagna: ${esc(wedding.time || '07:30 PM')} Onwards</div>
              <div class="t14-muhurat-badge">✨ Scratch Completed!</div>
            </div>
            <canvas class="t14-scratch-canvas" id="t14-scratch-canvas"></canvas>
          </div>
        </div>

        <!-- 4-Box Countdown Timer -->
        <div class="t14-countdown-wrap" id="t14-countdown" data-date="${esc(wedding.date || '2026-11-28')}">
          <div class="t14-cd-box"><span class="t14-cd-num" id="t14-cd-days">00</span><span class="t14-cd-lbl">Days</span></div>
          <div class="t14-cd-box"><span class="t14-cd-num" id="t14-cd-hours">00</span><span class="t14-cd-lbl">Hours</span></div>
          <div class="t14-cd-box"><span class="t14-cd-num" id="t14-cd-mins">00</span><span class="t14-cd-lbl">Mins</span></div>
          <div class="t14-cd-box"><span class="t14-cd-num" id="t14-cd-secs">00</span><span class="t14-cd-lbl">Secs</span></div>
        </div>

        <!-- Save Date to Google Calendar -->
        <a class="t14-btn-action" href="${calLink}" target="_blank" rel="noopener noreferrer">
          <span>📅</span><span>SAVE DATE TO CALENDAR</span>
        </a>
      </div>
    </section>

    <!-- Screen 3 (4th Image): Wedding Programme -->
    <section class="t14-page t14-page-framed" id="events-section" data-screen="3">
      <i class="t14-border-l" aria-hidden="true"></i>
      <i class="t14-border-r" aria-hidden="true"></i>
      <div class="t14-framed-content">
        <div>
          <div class="t14-sec-kicker">Auspicious Ceremonies</div>
          <div class="t14-sec-title">Wedding Programme</div>
          <div class="t14-sec-subtitle">Every ritual marked with timeless tradition &amp; joy</div>
        </div>

        <div class="t14-events-list">
          ${rawEvents.slice(0, 4).map(ev => `
            <div class="t14-event-card">
              <div class="t14-ev-thumb">
                <img src="${getEventPhoto(ev)}" alt="${esc(ev.event_name || 'Ceremony')}">
              </div>
              <div class="t14-ev-info">
                <div class="t14-ev-ribbon">${formatRibbonDate(ev.event_date, ev.event_time)}</div>
                <div class="t14-ev-name">${esc(ev.event_name || ev.name || 'Sacred Ritual')}</div>
                <div class="t14-ev-venue">📍 ${esc(ev.venue || venueName)}</div>
              </div>
              <div class="t14-ev-badge">RSVP →</div>
            </div>
          `).join('')}
        </div>

        <div class="t14-sec-subtitle">Your gracious presence completes our happiness</div>
      </div>
    </section>

    <!-- Screen 4 (5th Image): Banquet & Venue -->
    <section class="t14-page t14-page-framed" id="map-section" data-screen="4">
      <i class="t14-border-l" aria-hidden="true"></i>
      <i class="t14-border-r" aria-hidden="true"></i>
      <div class="t14-framed-content">
        <div>
          <div class="t14-sec-kicker">Celebration Details</div>
          <div class="t14-sec-title">Banquet &amp; Venue</div>
          <div class="t14-sec-subtitle">Join us where sacred vows turn into a lifetime of bliss</div>
        </div>

        <div class="t14-venue-card">
          <div class="t14-venue-hero">
            <img src="${banquetPhoto}" alt="${esc(venueName)}">
          </div>
          <div class="t14-venue-name">${esc(venueName)}</div>
          <div class="t14-venue-addr">📍 ${esc(venueAddr)}</div>
        </div>

        <a class="t14-btn-action" href="${mapLink}" target="_blank" rel="noopener noreferrer">
          <span>📍</span><span>GET DIRECTIONS ON GOOGLE MAPS</span>
        </a>
      </div>
    </section>

    <!-- Screen 5: Closing Blessing & Royal RSVP Suite -->
    <section class="t14-page t14-page-framed" id="rsvp-section" data-screen="5">
      <i class="t14-border-l" aria-hidden="true"></i>
      <i class="t14-border-r" aria-hidden="true"></i>
      <div class="t14-framed-content">
        <div class="t14-guest-card">
          <div class="t14-guest-kicker">FAMILY INVITATION BOARD</div>
          <div class="t14-guest-name">${esc(gName)}</div>
          <div class="t14-guest-badge">Cordially inviting you and your family (${esc(partyBadge)})</div>
        </div>

        <button class="t14-btn-rsvp" id="t14-open-rsvp-btn" type="button">
          <span>✉️</span><span>OPEN ROYAL RSVP MODAL</span>
        </button>

        <div class="t14-closing-text">
          <div class="t14-closing-line1">With love, affection, and best wishes,</div>
          <div class="t14-closing-line2">The ${esc(brideName)} &amp; ${esc(groomName)} Families</div>
        </div>

        <button class="t14-btn-replay" id="t14-replay-bottom-btn" type="button">
          ✨ REPLAY ENTRANCE &amp; LIGHTS
        </button>
      </div>
    </section>
  </div>
</div>
`;
}

/* ==========================================================================
   INITIALIZATION & INTERACTION CONTROLLER
   ========================================================================== */
export function initTemplate14(container) {
  if (!container) return () => {};
  const stage = container.querySelector('#t14-stage') || container;
  const intro = stage.querySelector('#t14-intro');
  const leafL = stage.querySelector('#t14-leaf-l');
  const leafR = stage.querySelector('#t14-leaf-r');
  const frame = stage.querySelector('#t14-frame');
  const board = stage.querySelector('#t14-board');
  const cb = stage.querySelector('#t14-cb');
  const bg = stage.querySelector('#t14-bg');
  const tx = stage.querySelector('#t14-intro-text-box');
  const carpetTap = stage.querySelector('#t14-carpet-tap');
  const openBtn = stage.querySelector('#t14-hit-open');
  const skipBtn = stage.querySelector('#t14-skip-btn');
  const fireworksCanvas = stage.querySelector('#t14-fireworks');
  const pagesEl = stage.querySelector('#t14-pages');
  const pCouple = stage.querySelector('#t14-screen-1');
  const bottomReplayBtn = stage.querySelector('#t14-replay-bottom-btn');
  const openRsvpBtn = stage.querySelector('#t14-open-rsvp-btn');
  const glows = Array.from(stage.querySelectorAll('.t14-glow') || []);

  /* 1. Geometry Setup (1024 x 1536 Artwork) */
  const W0 = 1024, H0 = 1536;
  const LEAF = [[512, 300], [445, 318], [430, 430], [390, 500], [330, 560], [262, 600], [248, 680], [248, 1335], [512, 1335]];
  const pc = ([x, y]) => `${(x / W0 * 100).toFixed(2)}% ${(y / H0 * 100).toFixed(2)}%`;
  const RL = LEAF.map(([x, y]) => [W0 - x, y]);

  if (leafL && leafL.style) leafL.style.clipPath = `polygon(${LEAF.map(pc).join(',')})`;
  if (leafR && leafR.style) leafR.style.clipPath = `polygon(${RL.map(pc).join(',')})`;

  const hole = [...LEAF, ...RL.slice().reverse()].map(([x, y]) => [512 + (x - 512) * 0.992, 820 + (y - 820) * 0.992]);
  if (frame && frame.style) {
    frame.style.clipPath = `polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${hole.map(pc).join(',')}, ${pc(hole[0])}, 0 0)`;
  }

  /* 2. Web Audio Synthesis for Sparklers & Crackers */
  let audioCtx = null;
  function playPalaceAudio() {
    try {
      const win = typeof window !== 'undefined' ? window : null;
      if (!win) return;
      const AudioContextClass = win.AudioContext || win.webkitAudioContext;
      if (!AudioContextClass) return;
      if (!audioCtx) audioCtx = new AudioContextClass();
      if (audioCtx.state === 'suspended') audioCtx.resume();

      // Soft crackle burst
      const bufferSize = audioCtx.sampleRate * 2.2;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (Math.random() < 0.08 ? white * 0.45 : white * 0.04);
      }
      const noise = audioCtx.createBufferSource();
      noise.buffer = buffer;
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 3200;
      filter.Q.value = 1.2;

      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.01, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.18, audioCtx.currentTime + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 2.1);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);
      noise.start();

      // Golden chime
      const osc = audioCtx.createOscillator();
      const oscGain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.9); // A5
      oscGain.gain.setValueAtTime(0.001, audioCtx.currentTime);
      oscGain.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.1);
      oscGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.8);
      osc.connect(oscGain);
      oscGain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 1.9);
    } catch (_) {}
  }

  /* 3. Realtime HTML5 Canvas Fireworks */
  let fxRunning = false;
  let fxAnimId = null;

  function runFireworks() {
    if (!fireworksCanvas || typeof fireworksCanvas.getContext !== 'function') return;
    const ctx = fireworksCanvas.getContext('2d');
    if (!ctx) return;

    const win = typeof window !== 'undefined' ? window : null;
    const d = Math.min((win && win.devicePixelRatio) || 1, 2);
    const w = stage.clientWidth || 400;
    const h = stage.clientHeight || 700;
    fireworksCanvas.width = Math.round(w * d);
    fireworksCanvas.height = Math.round(h * d);
    fireworksCanvas.style.display = 'block';

    const S = w * d / 100;
    const t0 = (win && win.performance && win.performance.now) ? win.performance.now() : Date.now();
    let P = [];
    let K = [];
    let F = [];
    let nx = 300;
    let last = t0;
    const C = ['#ffd36b', '#ff3b3b', '#ff7eb6', '#4aa8ff', '#ffffff', '#46e08a', '#ff9a2e'];
    const r = (a, b) => a + Math.random() * (b - a);
    const pk = () => C[(r(0, C.length) | 0)];
    const add = o => { if (P.length < 2200) P.push(o); };

    function burst(px, py) {
      F.push({ x: px, y: py, l: 1 });
      const m = (r(70, 120) | 0);
      const a = pk();
      const b = Math.random() < 0.4 ? pk() : a;
      const tw = Math.random() < 0.4;
      const sp = r(14, 28);
      for (let i = 0; i < m; i++) {
        const an = r(0, 6.283);
        const s = sp * Math.sqrt(Math.random() + 0.05);
        add({
          x: px, y: py,
          vx: Math.cos(an) * s,
          vy: Math.sin(an) * s,
          l: 1, dc: r(0.5, 0.9),
          c: i % 2 ? a : b,
          g: 14, tw, f: 0.985
        });
      }
    }

    fxRunning = true;
    function fr(now) {
      if (!fxRunning) return;
      const t = now - t0;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      if (ctx.clearRect) ctx.clearRect(0, 0, fireworksCanvas.width, fireworksCanvas.height);
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round';

      if (t < 8600) {
        [20, 35, 50, 65, 80].forEach(px => {
          for (let i = 0; i < 5; i++) {
            const an = -1.5708 + r(-0.85, 0.85);
            const s = r(14, 40);
            add({
              x: px + r(-0.5, 0.5), y: 132,
              vx: Math.cos(an) * s, vy: Math.sin(an) * s,
              l: 1, dc: r(1.6, 3),
              c: ['#ffd36b', '#ffffff', '#ff9a2e', '#ffe9a8'][(r(0, 4) | 0)],
              g: 45, f: 0.97, sp: 1
            });
          }
        });
      }

      if (t < 8000 && t >= nx) {
        K.push({ x: r(15, 85), y: 150, vx: r(-3, 3), vy: -r(75, 100) });
        nx += r(400, 900);
      }

      K = K.filter(k => {
        k.x += k.vx * dt;
        k.y += k.vy * dt;
        k.vy += 40 * dt;
        add({ x: k.x, y: k.y, vx: r(-2, 2), vy: r(2, 8), l: 0.7, dc: 2.5, c: '#ffcf7a', g: 0, f: 1, sp: 1 });
        if (ctx.beginPath) {
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(k.x * S, k.y * S, 0.5 * S, 0, 6.3);
          ctx.fill();
        }
        if (k.vy > -8) {
          burst(k.x, k.y);
          return false;
        }
        return true;
      });

      P = P.filter(p => {
        const q = Math.pow(p.f, dt * 60);
        p.vx *= q;
        p.vy = p.vy * q + p.g * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.l -= p.dc * dt;
        if (p.l <= 0) return false;
        ctx.globalAlpha = p.l * (p.tw && Math.random() < 0.4 ? 0.3 : 1);
        ctx.strokeStyle = p.c;
        ctx.lineWidth = (p.sp ? 0.45 : 0.6) * S;
        if (ctx.beginPath && ctx.moveTo && ctx.lineTo && ctx.stroke) {
          ctx.beginPath();
          ctx.moveTo((p.x - p.vx * 0.035) * S, (p.y - p.vy * 0.035) * S);
          ctx.lineTo(p.x * S, p.y * S);
          ctx.stroke();
        }
        return true;
      });

      F = F.filter(f => {
        f.l -= dt * 5;
        if (f.l <= 0) return false;
        if (ctx.createRadialGradient && ctx.fillRect) {
          const g = ctx.createRadialGradient(f.x * S, f.y * S, 0, f.x * S, f.y * S, 7 * S);
          g.addColorStop(0, `rgba(255,240,200,${0.45 * f.l})`);
          g.addColorStop(1, 'rgba(255,200,120,0)');
          ctx.globalAlpha = 1;
          ctx.fillStyle = g;
          ctx.fillRect((f.x - 7) * S, (f.y - 7) * S, 14 * S, 14 * S);
        }
        return true;
      });

      if (t > 9800) {
        fxRunning = false;
        fireworksCanvas.style.display = 'none';
        return;
      }
      if (typeof requestAnimationFrame === 'function') {
        fxAnimId = requestAnimationFrame(fr);
      }
    }

    if (typeof requestAnimationFrame === 'function') {
      fxAnimId = requestAnimationFrame(fr);
    }
  }

  function stopFireworks() {
    fxRunning = false;
    if (fxAnimId && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(fxAnimId);
      fxAnimId = null;
    }
    if (fireworksCanvas) fireworksCanvas.style.display = 'none';
  }

  /* 4. Timeline Orchestration */
  let timers = [];
  let busy = false;
  let isDone = false;
  const T = (ms, fn) => {
    const id = setTimeout(fn, ms);
    timers.push(id);
    return id;
  };

  function startSequence() {
    if (busy || isDone) return;
    busy = true;

    if (carpetTap) {
      carpetTap.classList.add('h');
      carpetTap.style.pointerEvents = 'none';
    }
    if (openBtn) openBtn.style.pointerEvents = 'none';
    if (skipBtn) skipBtn.style.pointerEvents = 'none';

    // 1. Lanterns light up sequentially
    glows.forEach((g, i) => T(i * 420, () => g.classList.add('on')));

    // 2. Door leaves swing open & fireworks begin at 3200ms
    T(3200, () => {
      if (leafL) leafL.classList.add('o');
      if (leafR) leafR.classList.add('o');
      if (tx) tx.classList.add('h');
      if (bg) bg.classList.add('d');
      runFireworks();
      playPalaceAudio();
    });

    // 3. Frame fades out at 4600ms
    T(4600, () => {
      if (frame) frame.classList.add('f');
    });

    // 4. Door leaves fully vanish at 8400ms
    T(8400, () => {
      if (leafL) leafL.classList.add('x');
      if (leafR) leafR.classList.add('x');
    });

    // 5. Board and couple info show up with transition at 9000ms
    T(9000, () => {
      if (board) board.classList.add('on');
      if (cb) cb.classList.add('on');
    });

    // 6. Intro removed from flow at 10800ms, enable smooth vertical scrolling
    T(10800, () => {
      isDone = true;
      busy = false;
      if (intro) intro.style.display = 'none';
      if (pagesEl) pagesEl.classList.add('u');
      if (pCouple && typeof pCouple.scrollIntoView === 'function') {
        pCouple.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      const win = typeof window !== 'undefined' ? window : null;
      const doc = typeof document !== 'undefined' ? document : null;
      if (doc && doc.body) doc.body.classList.add('invitation-unveiled');
      if (win) {
        win._invitationUnveiled = true;
        if (typeof win.__updateRoyalDockVisibility === 'function') {
          win.__updateRoyalDockVisibility();
        }
        if (typeof win.dispatchEvent === 'function') {
          win.dispatchEvent(new CustomEvent('invitation-unveiled'));
        }
      }
    });
  }

  function skipIntro() {
    timers.forEach(clearTimeout);
    timers = [];
    stopFireworks();
    isDone = true;
    busy = false;

    glows.forEach(g => g.classList.add('on'));
    if (leafL) { leafL.classList.add('o', 'x'); }
    if (leafR) { leafR.classList.add('o', 'x'); }
    if (frame) frame.classList.add('f');
    if (tx) tx.classList.add('h');
    if (carpetTap) carpetTap.classList.add('h');
    if (board) board.classList.add('on');
    if (cb) cb.classList.add('on');
    if (bg) bg.classList.add('d');

    if (intro) intro.style.display = 'none';
    if (pagesEl) pagesEl.classList.add('u');
    if (pCouple && typeof pCouple.scrollIntoView === 'function') {
      pCouple.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    const win = typeof window !== 'undefined' ? window : null;
    const doc = typeof document !== 'undefined' ? document : null;
    if (doc && doc.body) doc.body.classList.add('invitation-unveiled');
    if (win) {
      win._invitationUnveiled = true;
      if (typeof win.__updateRoyalDockVisibility === 'function') {
        win.__updateRoyalDockVisibility();
      }
      if (typeof win.dispatchEvent === 'function') {
        win.dispatchEvent(new CustomEvent('invitation-unveiled'));
      }
    }
  }

  function replayAll() {
    timers.forEach(clearTimeout);
    timers = [];
    stopFireworks();
    busy = false;
    isDone = false;

    if (pagesEl) {
      pagesEl.classList.remove('u');
      pagesEl.scrollTop = 0;
    }
    glows.forEach(g => g.classList.remove('on'));
    if (leafL) { leafL.classList.remove('o', 'x'); }
    if (leafR) { leafR.classList.remove('o', 'x'); }
    if (frame) frame.classList.remove('f');
    if (tx) tx.classList.remove('h');
    if (board) board.classList.remove('on');
    if (cb) cb.classList.remove('on');
    if (bg) bg.classList.remove('d');

    if (carpetTap) {
      carpetTap.classList.remove('h');
      carpetTap.style.pointerEvents = 'auto';
    }
    if (openBtn) openBtn.style.pointerEvents = 'auto';
    if (skipBtn) skipBtn.style.pointerEvents = 'auto';

    if (intro) {
      intro.style.display = 'block';
      intro.classList.add('ready');
    }
    const win = typeof window !== 'undefined' ? window : null;
    const doc = typeof document !== 'undefined' ? document : null;
    if (doc && doc.body) doc.body.classList.remove('invitation-unveiled');
    if (win) {
      win._invitationUnveiled = false;
      if (typeof win.__updateRoyalDockVisibility === 'function') {
        win.__updateRoyalDockVisibility();
      }
    }
  }

  if (carpetTap) carpetTap.addEventListener('click', startSequence);
  if (openBtn) openBtn.addEventListener('click', startSequence);
  if (skipBtn) skipBtn.addEventListener('click', skipIntro);
  if (bottomReplayBtn) bottomReplayBtn.addEventListener('click', replayAll);

  // Ready intro reveal
  if (intro) {
    intro.classList.add('ready');
  }

  /* 5. Gold Scratch Card Canvas Controller */
  const scratchCanvas = stage.querySelector('#t14-scratch-canvas');
  let scratchDone = false;
  let isScratching = false;

  function initScratchCard() {
    if (!scratchCanvas || typeof scratchCanvas.getContext !== 'function') return;
    const sctx = scratchCanvas.getContext('2d');
    if (!sctx) return;

    const rect = scratchCanvas.getBoundingClientRect ? scratchCanvas.getBoundingClientRect() : { width: 300, height: 120 };
    const w = rect.width || 300;
    const h = rect.height || 120;
    scratchCanvas.width = Math.round(w);
    scratchCanvas.height = Math.round(h);

    if (sctx.createLinearGradient && sctx.fillRect) {
      const grad = sctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#caa23f');
      grad.addColorStop(0.3, '#f5e49c');
      grad.addColorStop(0.55, '#c59a35');
      grad.addColorStop(0.85, '#faeab0');
      grad.addColorStop(1, '#a67c1e');
      sctx.fillStyle = grad;
      sctx.fillRect(0, 0, w, h);

      if (sctx.fillText) {
        sctx.fillStyle = '#4a2c04';
        sctx.font = 'bold 14px "Cinzel", serif';
        sctx.textAlign = 'center';
        sctx.textBaseline = 'middle';
        sctx.fillText('✦ SCRATCH TO REVEAL DATE ✦', w / 2, h / 2);
      }
    }

    function checkScratch() {
      if (scratchDone) return;
      try {
        if (!sctx.getImageData) return;
        const imgData = sctx.getImageData(0, 0, scratchCanvas.width, scratchCanvas.height);
        const data = imgData.data;
        let clearCount = 0;
        const total = data.length / 4;
        for (let i = 3; i < data.length; i += 16) {
          if (data[i] === 0) clearCount += 4;
        }
        if (clearCount / total > 0.42) {
          scratchDone = true;
          scratchCanvas.classList.add('revealed');
        }
      } catch (_) {}
    }

    function eraseAt(clientX, clientY) {
      if (!scratchCanvas.getBoundingClientRect) return;
      const b = scratchCanvas.getBoundingClientRect();
      const x = clientX - b.left;
      const y = clientY - b.top;
      sctx.globalCompositeOperation = 'destination-out';
      if (sctx.beginPath && sctx.arc && sctx.fill) {
        sctx.beginPath();
        sctx.arc(x, y, 22, 0, Math.PI * 2);
        sctx.fill();
      }
      checkScratch();
    }

    scratchCanvas.addEventListener('mousedown', e => { isScratching = true; eraseAt(e.clientX, e.clientY); });
    scratchCanvas.addEventListener('mousemove', e => { if (isScratching) eraseAt(e.clientX, e.clientY); });
    scratchCanvas.addEventListener('mouseup', () => { isScratching = false; });
    scratchCanvas.addEventListener('mouseleave', () => { isScratching = false; });

    scratchCanvas.addEventListener('touchstart', e => {
      isScratching = true;
      if (e.touches && e.touches[0]) eraseAt(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
    scratchCanvas.addEventListener('touchmove', e => {
      if (isScratching && e.touches && e.touches[0]) eraseAt(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
    scratchCanvas.addEventListener('touchend', () => { isScratching = false; });
  }
  initScratchCard();

  /* 6. Live Countdown Timer */
  const cdWrap = stage.querySelector('#t14-countdown');
  const dEl = stage.querySelector('#t14-cd-days');
  const hEl = stage.querySelector('#t14-cd-hours');
  const mEl = stage.querySelector('#t14-cd-mins');
  const sEl = stage.querySelector('#t14-cd-secs');

  let cdInterval = null;
  if (cdWrap && dEl && hEl && mEl && sEl) {
    const rawDate = cdWrap.getAttribute('data-date') || '2026-11-28';
    const target = new Date(`${rawDate}T19:00:00`).getTime();

    function updateCd() {
      const now = Date.now();
      const diff = Math.max(0, target - now);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / (1000 * 60)) % 60);
      const secs = Math.floor((diff / 1000) % 60);

      dEl.textContent = String(days).padStart(2, '0');
      hEl.textContent = String(hours).padStart(2, '0');
      mEl.textContent = String(mins).padStart(2, '0');
      sEl.textContent = String(secs).padStart(2, '0');
    }
    updateCd();
    cdInterval = setInterval(updateCd, 1000);
  }

  /* 7. Open Royal RSVP Trigger */
  if (openRsvpBtn) {
    openRsvpBtn.addEventListener('click', () => {
      const dockBtn = document.querySelector('.bottom-dock__btn[data-action="rsvp"]') || document.querySelector('[data-action="rsvp"]');
      if (dockBtn && typeof dockBtn.click === 'function') {
        dockBtn.click();
      } else {
        const modal = document.querySelector('.rsvp-modal') || document.querySelector('#rsvp-modal');
        if (modal && modal.classList) modal.classList.add('is-open');
      }
    });
  }

  /* Cleanup Callback */
  return function cleanup() {
    timers.forEach(clearTimeout);
    timers = [];
    stopFireworks();
    if (cdInterval) clearInterval(cdInterval);
    if (audioCtx && audioCtx.state !== 'closed') {
      try { audioCtx.close(); } catch { /* ignore */ }
    }
  };
}

export function mount(root, options = {}) {
  return initTemplate14(root, options);
}
