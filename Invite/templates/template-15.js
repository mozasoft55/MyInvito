/* ==========================================================================
   TEMPLATE 15 — CUSTOMER CUSTOM BACKGROUND WEDDING INVITATION
   Premium, cinematic, mobile-first digital wedding invitation suite.
   Uses customer's 2 custom-uploaded background images:
   - Image 1 (IMG_LANDING): Front cover background (--t15-landing)
   - Image 2 (IMG_PAGE): Couple details background (--t15-page)
   - Default Ornamental Border: Thin mirrored side flourish (--t15-border)
   - Circular Bride & Groom photos from existing onboarding photo uploads.
   ========================================================================== */

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ESC[c]);
const clean = v => String(v ?? '').trim();
const safeUrl = u => (/^https?:\/\//i.test(clean(u)) ? esc(clean(u)) : '');
const safeImg = u => {
  const s = clean(u);
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  if (/^blob:/i.test(s)) return s;
  if (s.startsWith('data:image/')) return s;
  if (/^\.?\/?assets\//i.test(s)) return s;
  if (/^[a-z0-9_\-\/.]+\.(jpg|jpeg|png|webp|svg|gif|avif)$/i.test(s)) {
    return s.startsWith('.') || s.startsWith('/') ? s : `./assets/${s}`;
  }
  return s;
};

const getStoredPhoto = (...keys) => {
  try {
    for (const k of keys) {
      if (!k) continue;
      if (typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function') {
        const v = localStorage.getItem(k);
        if (v && v.trim()) return v.trim();
      }
      if (typeof sessionStorage !== 'undefined' && typeof sessionStorage.getItem === 'function') {
        const v = sessionStorage.getItem(k);
        if (v && v.trim()) return v.trim();
      }
    }
  } catch { return ''; }
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

export default function renderTemplate15(invitation = {}) {
  const wedding = invitation.wedding || {};
  const guest = invitation.guest || {};
  const events = invitation.events || wedding.events || [];
  const orderRef = wedding.order_reference || wedding.ref || '';

  // Couple names & order
  const groomName = clean(wedding.groom_name) || 'Groom';
  const brideName = clean(wedding.bride_name) || 'Bride';
  const isBrideFirst = wedding.name_order === 'bride_first';
  const primaryName = isBrideFirst ? brideName : groomName;
  const secondaryName = isBrideFirst ? groomName : brideName;

  // Guest & Party count
  const isFamily = Boolean(guest.with_family || (guest.persons && guest.persons > 1) || String(guest.category || '').toLowerCase() === 'family');
  const guestName = clean(guest.name || guest.guest_name) || (isFamily ? 'Respected Family' : 'Respected Guest');
  const personCount = Number(guest.persons || guest.family_members || 1);
  const personLabel = isFamily ? 'Family Invitation' : `${personCount} ${personCount === 1 ? 'Person' : 'Persons'}`;

  // Bride & Groom Photos (strictly from existing onboarding fields)
  const bridePhoto = safeImg(wedding.bride_photo
    || wedding.bride_photo_url
    || wedding.bride_image
    || wedding.photo_bride
    || wedding.image2
    || (orderRef ? getStoredPhoto(`wedding_bride_photo_${orderRef}`) : '')
    || (orderRef ? getStoredPhoto(`template_photo_template-15_bride`) : ''));

  const groomPhoto = safeImg(wedding.groom_photo
    || wedding.groom_photo_url
    || wedding.groom_image
    || wedding.photo_groom
    || wedding.image1
    || (orderRef ? getStoredPhoto(`wedding_groom_photo_${orderRef}`) : '')
    || (orderRef ? getStoredPhoto(`template_photo_template-15_groom`) : ''));

  // Background Images (Customer Uploaded Images 1 & 2)
  const landingBg = safeImg(wedding.landing_background
    || wedding.landingBackground
    || (orderRef ? getStoredPhoto(`wedding_landing_background_${orderRef}`) : '')
    || getStoredPhoto('template_photo_template-15_landing')
    || './assets/template-15-cover.webp');

  const pageBg = safeImg(wedding.page_background
    || wedding.pageBackground
    || (orderRef ? getStoredPhoto(`wedding_page_background_${orderRef}`) : '')
    || getStoredPhoto('template_photo_template-15_page')
    || './assets/template-15-page.webp');

  const borderAsset = './assets/template-15-border.svg';

  // Parents (Father only under D/O and S/O)
  const brideFather = clean(wedding.bride_father || wedding.bride_parents || '');
  const groomFather = clean(wedding.groom_father || wedding.groom_parents || '');

  // Addresses
  const brideAddress = clean(wedding.bride_address || '');
  const groomAddress = clean(wedding.groom_address || '');

  // Date, Time, Muhurat, Title
  const ceremonyTitle = clean(wedding.ceremony_title || wedding.title || 'THE WEDDING INVITATION');
  const weddingDateStr = formatWeddingDate(wedding.date || wedding.event_date);
  const rawDateIso = clean(wedding.date || wedding.event_date || '2026-11-28');
  const rawTimeStr = clean(wedding.time || wedding.ceremony_time || '19:00');

  // Venue & Map
  const venueName = clean(wedding.venue_name || wedding.venue || wedding.venue_title || wedding.banquet_name || 'Wedding Celebration Venue');
  const venueLocation = clean(wedding.venue_title || 'Banquet & Lawn');
  const venueAddress = clean(wedding.venue_address || wedding.address || wedding.city || '');
  const venueImage = safeImg(wedding.venue_photo || wedding.venue_image || wedding.banquet_photo || wedding.image4 || '');
  const mapLink = safeUrl(wedding.map_url)
    || (venueName || venueAddress ? `https://maps.google.com/?q=${encodeURIComponent([venueName, venueAddress].filter(Boolean).join(', '))}` : '');

  // Programme events normalization
  const eventList = (Array.isArray(events) && events.length ? events : [
    { event_name: 'Shubho Bibaho', event_date: rawDateIso, event_time: '7:00 PM', venue: venueName },
    { event_name: 'Royal Reception', event_date: rawDateIso, event_time: '7:30 PM', venue: venueName }
  ]);

  return `
<!-- TEMPLATE 15: CUSTOMER CUSTOM BACKGROUND SUITE -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cormorant+Garamond:ital,wght@0,500;0,700;1,700&family=Great+Vibes&display=swap" rel="stylesheet">

<style>
:root {
  --t15-maroon: #5a1020;
  --t15-maroon-dark: #3a0a14;
  --t15-gold: #c9a45c;
  --t15-gold-light: #f3d9a0;
  --t15-gold-gradient: linear-gradient(135deg, #c9a45c 0%, #fae6b8 50%, #9e7932 100%);
  --t15-ivory: #fbf5eb;
  --t15-landing: url('${landingBg}');
  --t15-page: url('${pageBg}');
  --t15-border: url('${borderAsset}');
}

* { box-sizing: border-box; margin: 0; padding: 0; }
html, body {
  height: 100%;
  background: #070b17;
  overflow: hidden;
  font-family: 'Cormorant Garamond', Georgia, serif;
  color: var(--t15-maroon);
}

.t15-stage {
  height: min(100dvh, 150vw);
  width: min(66.667dvh, 100vw);
  container-type: size;
  overflow-y: auto;
  overflow-x: hidden;
  scroll-snap-type: y mandatory;
  position: relative;
  scrollbar-width: none;
  padding: env(safe-area-inset-top) 0 env(safe-area-inset-bottom);
  margin: 0 auto;
  box-shadow: 0 0 60px rgba(0, 0, 0, 0.85);
  background: #000;
}
.t15-stage::-webkit-scrollbar { display: none; }

.t15-section {
  height: 100cqh;
  scroll-snap-align: start;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  perspective: 140cqw;
}

.t15-paper {
  background: #f6ecd9 radial-gradient(circle at 50% 30%, #fffaf0, #efe0c4);
}
.t15-paper::before, .t15-paper::after {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  width: 17cqw;
  background: var(--t15-border) center/100% 100% no-repeat;
  pointer-events: none;
  opacity: 0.95;
  z-index: 2;
}
.t15-paper::before { left: 0; }
.t15-paper::after { right: 0; transform: scaleX(-1); }

.t15-bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: var(--fx, 50%) var(--fy, 50%);
  background-repeat: no-repeat;
  transition: transform 1.2s ease;
}

.t15-cinzel {
  font-family: 'Cinzel', Georgia, serif;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}
.t15-script {
  font-family: 'Great Vibes', cursive;
}
.t15-ab {
  position: absolute;
  transform: translate(-50%, -50%);
  text-align: center;
  white-space: nowrap;
}

h2.t15-h2 {
  font: 600 4.6cqw 'Cinzel', Georgia, serif;
  letter-spacing: 0.15em;
  position: relative;
  z-index: 3;
  color: #50101e;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.6);
}
.t15-sub {
  font-style: italic;
  font-weight: 700;
  font-size: 3.5cqw;
  margin: 1cqw 8cqw;
  position: relative;
  z-index: 3;
  color: #7a1a2e;
}

/* PAGE 1: FRONT COVER */
#t15-p1 {
  background: #110408;
}
#t15-glow {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0;
  transition: opacity 1.2s ease;
  z-index: 2;
}
#t15-fx {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 4;
}

.t15-open-btn {
  font: 600 3.6cqw 'Cinzel', Georgia, serif;
  letter-spacing: 0.28em;
  padding: 2.2cqw 7.5cqw;
  border: 0.4cqw solid var(--t15-gold);
  background: linear-gradient(135deg, #7a1a2e 0%, var(--t15-maroon) 100%);
  color: #f3d9a0;
  border-radius: 99cqw;
  box-shadow: 0 1cqw 3cqw rgba(0, 0, 0, 0.6), inset 0 0 1cqw rgba(243, 217, 160, 0.3);
  cursor: pointer;
  z-index: 6;
  transition: transform 0.2s, box-shadow 0.2s;
  animation: t15Pulse 2.4s infinite ease-in-out;
}
.t15-open-btn:active {
  transform: translate(-50%, -50%) scale(0.96);
}

@keyframes t15Pulse {
  0%, 100% { box-shadow: 0 1cqw 3cqw rgba(0, 0, 0, 0.6), 0 0 0 0 rgba(201, 164, 92, 0.5); }
  50% { box-shadow: 0 1.5cqw 4.5cqw rgba(0, 0, 0, 0.75), 0 0 0 1.5cqw rgba(201, 164, 92, 0); }
}

.t15-door {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 50%;
  background: var(--t15-landing) no-repeat;
  background-size: 200% 100%;
  z-index: 5;
  transition: transform 1.8s cubic-bezier(0.6, 0.05, 0.3, 1);
  box-shadow: 0 0 6cqw rgba(0, 0, 0, 0.85);
}
.t15-dl { left: 0; transform-origin: left; }
.t15-dr { right: 0; background-position: 100% 0; transform-origin: right; }
.t15-opened .t15-dl { transform: rotateY(-105deg); }
.t15-opened .t15-dr { transform: rotateY(105deg); }

/* PAGE 2: COUPLE DETAILS */
#t15-p2 {
  background: #19050d;
}
.t15-board {
  position: relative;
  z-index: 3;
  background: rgba(255, 250, 240, 0.82);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  border: 0.35cqw solid var(--t15-gold);
  border-radius: 3.5cqw;
  padding: 4.5cqw 3.5cqw;
  width: 88cqw;
  margin-top: 1cqw;
  box-shadow: 0 2cqw 6cqw rgba(0, 0, 0, 0.5), inset 0 0 2cqw rgba(255, 255, 255, 0.5);
}
.t15-cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3cqw;
  margin-top: 3.5cqw;
}
.t15-col {
  min-width: 0;
  font-size: 3.2cqw;
}
.t15-col .t15-role {
  font: 600 2.8cqw 'Cinzel', Georgia, serif;
  letter-spacing: 0.22em;
  color: #7a1a2e;
}
.t15-ring {
  width: 26cqw;
  height: 26cqw;
  margin: 1.8cqw auto;
  border-radius: 50%;
  padding: 0.9cqw;
  background: conic-gradient(#8a6a2a, #f3d9a0, #8a6a2a, #e8c77a, #8a6a2a);
  box-shadow: 0 1cqw 3cqw rgba(0, 0, 0, 0.4), inset 0 0 1cqw rgba(255, 255, 255, 0.5);
}
.t15-ring-inner {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #e9dcc3 center/cover no-repeat;
  display: grid;
  place-items: center;
  font: 600 10cqw 'Cinzel', Georgia, serif;
  color: var(--t15-maroon);
  overflow: hidden;
}
.t15-nm {
  font-size: 7cqw;
  line-height: 1.25;
  white-space: nowrap;
  color: #50101e;
}
.t15-col small {
  display: block;
  opacity: 0.88;
  line-height: 1.3;
}
.t15-col .t15-kin-label {
  font-weight: 700;
  color: #8c6a22;
  margin-top: 1cqw;
}

/* PAGE 3: WEDDING DATE REVEAL */
.t15-reveal-box {
  position: relative;
  width: 78cqw;
  height: 34cqw;
  margin: 3.5cqw 0 2cqw;
  z-index: 3;
  border-radius: 2.5cqw;
  overflow: hidden;
  background: #fffaf0;
  border: 0.35cqw solid var(--t15-gold);
  display: grid;
  place-items: center;
  box-shadow: 0 1cqw 3cqw rgba(0, 0, 0, 0.12);
}
#t15-sc {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  touch-action: none;
  transition: opacity 1s ease;
  z-index: 4;
}
#t15-cd {
  display: flex;
  gap: 3.2cqw;
  z-index: 3;
  margin: 2cqw 0;
}
#t15-cd b {
  display: block;
  font: 600 7cqw 'Cinzel', Georgia, serif;
  color: #5a1020;
}
#t15-cd span {
  font: 2.6cqw 'Cinzel', Georgia, serif;
  letter-spacing: 0.15em;
  color: #8c6a22;
}
.t15-btn {
  font: 600 3cqw 'Cinzel', Georgia, serif;
  letter-spacing: 0.16em;
  padding: 2.2cqw 5.5cqw;
  border-radius: 99cqw;
  border: 0.3cqw solid var(--t15-gold);
  background: var(--t15-maroon);
  color: #f3d9a0;
  cursor: pointer;
  z-index: 3;
  text-decoration: none;
  display: inline-block;
  margin: 1.5cqw;
  box-shadow: 0 1cqw 3cqw rgba(0, 0, 0, 0.25);
  transition: transform 0.2s, background 0.2s;
}
.t15-btn:active {
  transform: scale(0.96);
}

/* PAGE 4: WEDDING PROGRAMME */
#t15-ev {
  display: flex;
  flex-direction: column;
  gap: 2.8cqw;
  width: 70cqw;
  max-height: 75cqh;
  overflow-y: auto;
  z-index: 3;
  padding: 1cqw;
  scrollbar-width: none;
}
#t15-ev::-webkit-scrollbar { display: none; }
.t15-card {
  display: flex;
  gap: 3cqw;
  align-items: center;
  text-align: left;
  background: #fffaf0;
  border: 0.3cqw solid var(--t15-gold);
  border-radius: 2.5cqw;
  padding: 2.5cqw;
  box-shadow: 0 1.5cqw 4cqw rgba(0, 0, 0, 0.12);
  opacity: 0;
  transform: rotateX(45deg) translateZ(-10cqw);
  transform-origin: top;
  transition: all 0.85s cubic-bezier(0.2, 0.9, 0.3, 1.2);
}
.t15-card.in {
  opacity: 1;
  transform: none;
}
.t15-card .t15-im {
  flex: 0 0 17cqw;
  height: 17cqw;
  border-radius: 2cqw;
  background: linear-gradient(135deg, #7a1a2e, #c9a45c) center/cover;
  display: grid;
  place-items: center;
  color: #f3d9a0;
  font: 7cqw 'Great Vibes';
  overflow: hidden;
}
.t15-card .t15-t {
  font: 600 3.8cqw 'Cinzel', Georgia, serif;
  color: #50101e;
}
.t15-card p {
  font-size: 3.2cqw;
  line-height: 1.25;
  color: #664a50;
}

/* PAGE 5: BANQUET & CLOSING */
.t15-venue {
  z-index: 3;
  width: 72cqw;
  font-size: 3.6cqw;
}
.t15-venue .t15-vi {
  height: 30cqw;
  border-radius: 2cqw;
  margin: 2.5cqw 0;
  background: linear-gradient(135deg, #7a1a2e, #c9a45c) center/cover no-repeat;
  border: 0.3cqw solid var(--t15-gold);
  box-shadow: 0 1cqw 3cqw rgba(0, 0, 0, 0.15);
}
#t15-pet {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 4;
}

@media (prefers-reduced-motion: reduce) {
  * { transition-duration: 0.01s !important; animation: none !important; }
}
</style>

<main class="t15-stage" id="t15-stage">
  <!-- PAGE 1: FRONT COVER BACKGROUND -->
  <section class="t15-section" id="t15-p1">
    <div class="t15-bg" id="t15-b1" style="background-image: var(--t15-landing);"></div>
    <div id="t15-glow"></div>
    <canvas id="t15-fx"></canvas>
    <div class="t15-ab t15-cinzel" id="t15-t-title">${esc(ceremonyTitle)}</div>
    <div class="t15-ab t15-script" id="t15-t-groom">${esc(primaryName)}</div>
    <div class="t15-ab t15-script" id="t15-t-amp">&amp;</div>
    <div class="t15-ab t15-script" id="t15-t-bride">${esc(secondaryName)}</div>
    <div class="t15-ab t15-cinzel" id="t15-t-inv">Cordially invites the presence of</div>
    <div class="t15-ab" id="t15-t-guest" style="font-weight:700;">${esc(guestName)}</div>
    <div class="t15-ab t15-cinzel" id="t15-t-pers">${esc(personLabel)}</div>
    <button class="t15-ab t15-open-btn" id="t15-open" type="button" aria-label="Open Invitation">OPEN</button>
  </section>

  <!-- PAGE 2: COUPLE DETAILS OVER IMAGE 2 -->
  <section class="t15-section" id="t15-p2">
    <div class="t15-bg" id="t15-b2" style="background-image: var(--t15-page);"></div>
    <div class="t15-board" id="t15-board">
      <h2 class="t15-h2">Two Hearts · One Destiny</h2>
      <div class="t15-sub">Together with their Families</div>
      <div class="t15-sub" style="font-size:3cqw;font-weight:500;margin-top:0.5cqw;">The Journey of Love &amp; Togetherness</div>
      <div class="t15-cols">
        <!-- Bride / Column 1 -->
        <div class="t15-col" id="t15-col-first">
          <div class="t15-role t15-cinzel">${isBrideFirst ? 'Bride' : 'Groom'}</div>
          <div class="t15-ring">
            <div class="t15-ring-inner" style="${(isBrideFirst ? bridePhoto : groomPhoto) ? `background-image:url('${esc(isBrideFirst ? bridePhoto : groomPhoto)}');` : ''}">
              ${!(isBrideFirst ? bridePhoto : groomPhoto) ? esc((isBrideFirst ? brideName : groomName).charAt(0)) : ''}
            </div>
          </div>
          <div class="t15-nm t15-script" id="t15-first-nm">${esc(isBrideFirst ? brideName : groomName)}</div>
          ${(isBrideFirst ? brideFather : groomFather) ? `
            <small class="t15-cinzel t15-kin-label">${isBrideFirst ? 'D/O' : 'S/O'}</small>
            <small>${esc(isBrideFirst ? brideFather : groomFather)}</small>
          ` : ''}
          ${(isBrideFirst ? brideAddress : groomAddress) ? `
            <small style="margin-top:1cqw;color:#50101e;">${esc(isBrideFirst ? brideAddress : groomAddress)}</small>
          ` : ''}
        </div>

        <!-- Groom / Column 2 -->
        <div class="t15-col" id="t15-col-second">
          <div class="t15-role t15-cinzel">${isBrideFirst ? 'Groom' : 'Bride'}</div>
          <div class="t15-ring">
            <div class="t15-ring-inner" style="${(isBrideFirst ? groomPhoto : bridePhoto) ? `background-image:url('${esc(isBrideFirst ? groomPhoto : bridePhoto)}');` : ''}">
              ${!(isBrideFirst ? groomPhoto : bridePhoto) ? esc((isBrideFirst ? groomName : brideName).charAt(0)) : ''}
            </div>
          </div>
          <div class="t15-nm t15-script" id="t15-second-nm">${esc(isBrideFirst ? groomName : brideName)}</div>
          ${(isBrideFirst ? groomFather : brideFather) ? `
            <small class="t15-cinzel t15-kin-label">${isBrideFirst ? 'S/O' : 'D/O'}</small>
            <small>${esc(isBrideFirst ? groomFather : brideFather)}</small>
          ` : ''}
          ${(isBrideFirst ? groomAddress : brideAddress) ? `
            <small style="margin-top:1cqw;color:#50101e;">${esc(isBrideFirst ? groomAddress : brideAddress)}</small>
          ` : ''}
        </div>
      </div>
      <div class="t15-sub" style="margin-top:3.5cqw;font-size:3.3cqw;">
        &ldquo;Two hearts, two families,<br>one beautiful beginning.&rdquo;
      </div>
    </div>
  </section>

  <!-- PAGE 3: WEDDING DATE REVEAL & COUNTDOWN -->
  <section class="t15-section t15-paper" id="t15-p3">
    <h2 class="t15-h2">Auspicious Wedding Muhurat</h2>
    <div class="t15-sub">The Sacred Wedding Date</div>
    <div class="t15-sub" style="font-weight:500;font-size:3cqw;">Scratch below to reveal our sacred wedding date, followed by live countdown &amp; calendar.</div>
    <div class="t15-reveal-box">
      <div class="t15-script" id="t15-wd" style="font-size:7cqw;color:#50101e;padding:2cqw;">${esc(weddingDateStr)}</div>
      <canvas id="t15-sc"></canvas>
    </div>
    <div id="t15-cd">
      <div><b id="t15-cd-d">--</b><span>Days</span></div>
      <div><b id="t15-cd-h">--</b><span>Hours</span></div>
      <div><b id="t15-cd-m">--</b><span>Mins</span></div>
      <div><b id="t15-cd-s">--</b><span>Secs</span></div>
    </div>
    <button class="t15-btn" id="t15-save" type="button">📅 SAVE TO CALENDAR</button>
  </section>

  <!-- PAGE 4: WEDDING PROGRAMME -->
  <section class="t15-section t15-paper" id="t15-p4">
    <h2 class="t15-h2">Wedding Programme</h2>
    <div class="t15-sub" style="font-weight:500;font-size:3cqw;">Sacred Ceremonies &amp; Timings</div>
    <div id="t15-ev" style="margin-top:2cqw;">
      ${eventList.map((ev, i) => {
        const evName = clean(ev.event_name || ev.name || `Ceremony ${i + 1}`);
        const evDate = clean(ev.event_date || ev.date || weddingDateStr);
        const evTime = clean(ev.event_time || ev.time || '');
        const evVenue = clean(ev.venue || venueName);
        const evImg = safeImg(ev.image || ev.event_image || '');
        return `
          <div class="t15-card" style="transition-delay:${i * 0.12}s;">
            <div class="t15-im" ${evImg ? `style="background-image:url('${esc(evImg)}');"` : ''}>
              ${!evImg ? esc(evName.charAt(0) || '✦') : ''}
            </div>
            <div>
              <div class="t15-t">${esc(evName)}</div>
              <p>📅 ${esc(evDate)}${evTime ? ` · ⏰ ${esc(evTime)}` : ''}</p>
              ${evVenue ? `<p>📍 ${esc(evVenue)}</p>` : ''}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  </section>

  <!-- PAGE 5: BANQUET & CLOSING -->
  <section class="t15-section t15-paper" id="t15-p5">
    <canvas id="t15-pet"></canvas>
    <h2 class="t15-h2">Banquet &amp; Location</h2>
    <div class="t15-venue" id="t15-venue">
      ${venueLocation ? `<div class="t15-cinzel" style="font-size:3.2cqw;color:#8c6a22;margin-bottom:0.5cqw;">${esc(venueLocation)}</div>` : ''}
      <div class="t15-cinzel" style="font-size:4.6cqw;font-weight:700;color:#50101e;">${esc(venueName)}</div>
      ${venueAddress ? `<p style="margin:1.5cqw 0;font-size:3.4cqw;color:#502132;">${esc(venueAddress)}</p>` : ''}
      ${venueImage ? `<div class="t15-vi" style="background-image:url('${esc(venueImage)}');"></div>` : ''}
      ${mapLink ? `
        <a class="t15-btn" href="${mapLink}" target="_blank" rel="noopener noreferrer">
          📍 VIEW ON GOOGLE MAPS
        </a>
      ` : ''}
    </div>
    <div class="t15-sub t15-script" style="font-size:5.8cqw;font-weight:400;margin-top:3cqw;z-index:3;" id="t15-close">
      With love, affection, and best wishes,<br>
      The ${esc(groomName)} &amp; ${esc(brideName)} Families
    </div>
  </section>
</main>
`;
}

export function mount(root, options = {}) {
  if (typeof window === 'undefined' || !root) {
    return () => {};
  }
  const wedding = options.wedding || {};
  const guest = options.guest || {};
  const orderRef = wedding.order_reference || wedding.ref || '';

  const groomName = clean(wedding.groom_name) || 'Groom';
  const brideName = clean(wedding.bride_name) || 'Bride';
  const isBrideFirst = wedding.name_order === 'bride_first';
  const primaryName = isBrideFirst ? brideName : groomName;
  const secondaryName = isBrideFirst ? groomName : brideName;

  const isFamily = Boolean(guest.with_family || (guest.persons && guest.persons > 1) || String(guest.category || '').toLowerCase() === 'family');
  const guestName = clean(guest.name || guest.guest_name) || (isFamily ? 'Respected Family' : 'Respected Guest');
  const personCount = Number(guest.persons || guest.family_members || 1);
  const personLabel = isFamily ? 'Family Invitation' : `${personCount} ${personCount === 1 ? 'Person' : 'Persons'}`;

  // Configurable layout coordinates
  const L = Object.assign({
    title: [50, 14, 75],
    groom: [50, 30, 75],
    amp: [50, 38, 12],
    bride: [50, 46, 75],
    inv: [50, 58, 75],
    guest: [50, 66, 75],
    pers: [50, 72, 65],
    open: [50, 84, 0],
    lamps: [],
    doors: false,
    focal: [50, 50]
  }, window.T15_LAYOUT || {}, wedding.t15_layout || {});

  function el(id) { return root.querySelector('#' + id); }

  function place(id, key, txt, fs) {
    const e = el(id);
    if (!e) return;
    const p = L[key] || [50, 50, 70];
    e.textContent = txt;
    if (!txt) { e.hidden = true; return; }
    e.style.left = p[0] + '%';
    e.style.top = p[1] + '%';
    e.style.color = (key === 'groom' || key === 'bride') ? '#5a1020' : '#7a1a2e';
    e.style.fontSize = fs + 'cqw';
    const parentW = e.parentElement ? e.parentElement.clientWidth : 400;
    const targetW = (p[2] * parentW) / 100;
    let s = fs;
    while (e.scrollWidth > targetW && s > 1.5) {
      s -= 0.3;
      e.style.fontSize = s + 'cqw';
    }
  }

  function layoutCover() {
    place('t15-t-title', 'title', 'WELCOME · A CELEBRATION OF LOVE', 3.6);
    place('t15-t-groom', 'groom', primaryName, 11);
    place('t15-t-amp', 'amp', '&', 8);
    place('t15-t-bride', 'bride', secondaryName, 11);
    place('t15-t-inv', 'inv', 'CORDIALLY INVITED', 3.4);
    place('t15-t-guest', 'guest', guestName, 7);
    place('t15-t-pers', 'pers', personLabel, 3.4);

    const o = el('t15-open');
    if (o) {
      o.style.left = L.open[0] + '%';
      o.style.top = L.open[1] + '%';
    }
  }

  layoutCover();
  window.addEventListener('resize', layoutCover);

  // Sparkles on Page 1
  const fx = el('t15-fx');
  let fc = fx ? fx.getContext('2d') : null;
  let sp = [];
  let fxOn = false;
  let animId = null;

  function sizeCanvas(c) {
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = c.clientWidth * dpr;
    c.height = c.clientHeight * dpr;
  }

  function spark() {
    if (!fxOn || !fc) return;
    sizeCanvas(fx);
    fc.clearRect(0, 0, fx.width, fx.height);
    const dpr = window.devicePixelRatio || 1;
    if (sp.length < 50) {
      const a = L.lamps.length ? L.lamps[Math.floor(Math.random() * L.lamps.length)] : [Math.random() * 100, Math.random() * 100];
      sp.push({
        x: (a[0] / 100) * fx.width,
        y: (a[1] / 100) * fx.height,
        vx: (Math.random() - 0.5) * 2 * dpr,
        vy: (-Math.random() * 2 - 0.5) * dpr,
        l: 1
      });
    }
    sp = sp.filter(s => {
      s.x += s.vx;
      s.y += s.vy;
      s.vy += 0.03 * dpr;
      s.l -= 0.014;
      fc.fillStyle = 'rgba(255,214,120,' + Math.max(s.l, 0) + ')';
      fc.beginPath();
      fc.arc(s.x, s.y, 2 * dpr * s.l, 0, Math.PI * 2);
      fc.fill();
      return s.l > 0;
    });
    animId = requestAnimationFrame(spark);
  }

  // Open Button Handler
  const openBtn = el('t15-open');
  if (openBtn) {
    openBtn.onclick = function() {
      this.disabled = true;
      this.style.opacity = '0';
      const g = el('t15-glow');
      if (g) {
        g.style.background = L.lamps.map(a => `radial-gradient(circle at ${a[0]}% ${a[1]}%, rgba(255,190,90,0.6), transparent 20%)`).join(',') || 'radial-gradient(circle at 50% 50%, rgba(255,190,90,0.5), transparent 40%)';
        g.style.opacity = '1';
      }
      fxOn = true;
      spark();
      const p1 = el('t15-p1');
      if (L.doors && p1) {
        const dl = document.createElement('div'); dl.className = 't15-door t15-dl';
        const dr = document.createElement('div'); dr.className = 't15-door t15-dr';
        p1.appendChild(dl);
        p1.appendChild(dr);
        requestAnimationFrame(() => p1.classList.add('t15-opened'));
      }
      setTimeout(() => {
        const p2 = el('t15-p2');
        if (p2) p2.scrollIntoView({ behavior: 'smooth' });
        setTimeout(() => { fxOn = false; }, 1400);
      }, L.doors ? 1600 : 900);
    };
  }

  // Page 3: Scratch Canvas & Countdown
  const sc = el('t15-sc');
  const scx = sc ? sc.getContext('2d') : null;
  let done = false;
  let scratchMoves = 0;
  let isDown = false;

  function paintScratch() {
    if (!sc || !scx) return;
    sizeCanvas(sc);
    const grad = scx.createLinearGradient(0, 0, sc.width, sc.height);
    grad.addColorStop(0, '#8a6a2a');
    grad.addColorStop(0.5, '#f3d9a0');
    grad.addColorStop(1, '#8a6a2a');
    scx.fillStyle = grad;
    scx.fillRect(0, 0, sc.width, sc.height);
    scx.fillStyle = '#5a1020';
    scx.font = `600 ${Math.round(sc.height * 0.17)}px 'Cinzel', Georgia, serif`;
    scx.textAlign = 'center';
    scx.textBaseline = 'middle';
    scx.fillText('SCRATCH HERE', sc.width / 2, sc.height / 2);
  }

  function scr(e) {
    if (done || !sc || !scx) return;
    const r = sc.getBoundingClientRect();
    const k = sc.width / r.width;
    scx.globalCompositeOperation = 'destination-out';
    scx.beginPath();
    scx.arc((e.clientX - r.left) * k, (e.clientY - r.top) * k, sc.height * 0.14, 0, Math.PI * 2);
    scx.fill();
    if (++scratchMoves % 7 === 0) {
      try {
        const d = scx.getImageData(0, 0, sc.width, sc.height).data;
        let cleared = 0;
        let total = 0;
        for (let i = 3; i < d.length; i += 160) {
          total++;
          if (!d[i]) cleared++;
        }
        if (cleared / total > 0.45) finishScratch();
      } catch (_) {
        finishScratch();
      }
    }
  }

  function finishScratch() {
    if (done) return;
    done = true;
    if (sc) {
      sc.style.opacity = '0';
      sc.style.pointerEvents = 'none';
    }
    const saveBtn = el('t15-save');
    if (saveBtn) saveBtn.hidden = false;
    burstStars();
  }

  function burstStars() {
    const p3 = el('t15-p3');
    const box = p3 ? p3.querySelector('.t15-reveal-box') : null;
    if (!box) return;
    for (let i = 0; i < 18; i++) {
      const s = document.createElement('i');
      s.style.cssText = 'position:absolute;left:50%;top:50%;width:1.4cqw;height:1.4cqw;background:#f3d9a0;border-radius:50%;z-index:5;pointer-events:none;';
      box.appendChild(s);
      const angle = (Math.PI * 2 * i) / 18;
      const dist = 15 + Math.random() * 25;
      const tx = Math.cos(angle) * dist;
      const ty = Math.sin(angle) * dist;
      s.animate([
        { transform: 'translate(0, 0) scale(1)', opacity: 1 },
        { transform: `translate(${tx}cqw, ${ty}cqw) scale(0)`, opacity: 0 }
      ], {
        duration: 1100 + Math.random() * 400,
        easing: 'cubic-bezier(0.2, 0.8, 0.4, 1)'
      }).onfinish = () => s.remove();
    }
  }

  if (sc) {
    paintScratch();
    sc.addEventListener('pointerdown', e => {
      isDown = true;
      try { sc.setPointerCapture(e.pointerId); } catch (_) {}
      scr(e);
    });
    sc.addEventListener('pointermove', e => { if (isDown) scr(e); });
    sc.addEventListener('pointerup', () => { isDown = false; });
    sc.addEventListener('pointercancel', () => { isDown = false; });
  }

  // Countdown Timer
  const rawDateStr = clean(wedding.date || wedding.event_date || '2026-11-28');
  const rawTime = clean(wedding.time || wedding.ceremony_time || '19:00');
  let targetDate = new Date(`${rawDateStr}T${rawTime}:00`);
  if (isNaN(targetDate.getTime())) targetDate = new Date(`${rawDateStr}`);
  let cdInterval = null;

  function updateCountdown() {
    const diff = Math.max(0, targetDate.getTime() - Date.now());
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diff / (1000 * 60)) % 60);
    const secs = Math.floor((diff / 1000) % 60);

    const dEl = el('t15-cd-d');
    const hEl = el('t15-cd-h');
    const mEl = el('t15-cd-m');
    const sEl = el('t15-cd-s');

    if (dEl) dEl.textContent = String(days).padStart(2, '0');
    if (hEl) hEl.textContent = String(hours).padStart(2, '0');
    if (mEl) mEl.textContent = String(mins).padStart(2, '0');
    if (sEl) sEl.textContent = String(secs).padStart(2, '0');
  }

  updateCountdown();
  cdInterval = setInterval(updateCountdown, 1000);

  // Save to Calendar (.ics download)
  const saveBtn = el('t15-save');
  if (saveBtn) {
    saveBtn.onclick = function() {
      const pad = n => String(n).padStart(2, '0');
      const d = isNaN(targetDate.getTime()) ? new Date('2026-11-28T19:00:00') : targetDate;
      const endD = new Date(d.getTime() + 4 * 60 * 60 * 1000);
      const f = dt => dt.getUTCFullYear() + pad(dt.getUTCMonth() + 1) + pad(dt.getUTCDate()) + 'T' + pad(dt.getUTCHours()) + pad(dt.getUTCMinutes()) + '00Z';
      const venueAddr = clean(wedding.venue_address || wedding.address || wedding.venue || '');
      const icsData = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//PrimeEcard//Wedding Invitation//EN',
        'BEGIN:VEVENT',
        `DTSTART:${f(d)}`,
        `DTEND:${f(endD)}`,
        `SUMMARY:Wedding of ${groomName} & ${brideName}`,
        `DESCRIPTION:Auspicious wedding ceremony of ${groomName} and ${brideName}.`,
        `LOCATION:${venueAddr}`,
        'END:VEVENT',
        'END:VCALENDAR'
      ].join('\r\n');

      const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Wedding-${groomName}-${brideName}.ics`;
      link.click();
      URL.revokeObjectURL(link.href);
    };
  }

  // Page 4: Intersection Observer for Event Cards
  const cards = root.querySelectorAll('.t15-card');
  const cardObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        cards.forEach(c => c.classList.add('in'));
      }
    });
  }, { threshold: 0.35 });

  const p4 = el('t15-p4');
  if (p4) cardObserver.observe(p4);

  // Page 5: Falling Flower Petals Canvas
  const petCanvas = el('t15-pet');
  let petCtx = petCanvas ? petCanvas.getContext('2d') : null;
  let petals = [];
  let isPetalActive = false;
  let petAnimId = null;

  function fallPetals() {
    if (!isPetalActive || !petCtx) return;
    sizeCanvas(petCanvas);
    petCtx.clearRect(0, 0, petCanvas.width, petCanvas.height);
    const dpr = window.devicePixelRatio || 1;
    if (petals.length < 24) {
      petals.push({
        x: Math.random() * petCanvas.width,
        y: -20,
        r: Math.random() * 6,
        s: (1.2 + Math.random() * 1.5) * dpr,
        w: Math.random() * 6
      });
    }
    petals = petals.filter(p => {
      p.y += p.s;
      p.r += 0.035;
      p.x += Math.sin(p.y / 35 + p.w) * 0.9 * dpr;
      petCtx.save();
      petCtx.translate(p.x, p.y);
      petCtx.rotate(p.r);
      petCtx.fillStyle = 'rgba(190, 50, 80, 0.72)';
      petCtx.beginPath();
      petCtx.ellipse(0, 0, 7.5 * dpr, 3.8 * dpr, 0, 0, Math.PI * 2);
      petCtx.fill();
      petCtx.restore();
      return p.y < petCanvas.height + 25;
    });
    petAnimId = requestAnimationFrame(fallPetals);
  }

  const p5 = el('t15-p5');
  const petObserver = new IntersectionObserver(entries => {
    const isVis = entries[0] && entries[0].isIntersecting;
    if (isVis && !isPetalActive && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      isPetalActive = true;
      fallPetals();
    } else if (!isVis) {
      isPetalActive = false;
      if (petAnimId) cancelAnimationFrame(petAnimId);
    }
  }, { threshold: 0.35 });

  if (p5) petObserver.observe(p5);

  // Cleanup Function
  return function cleanup() {
    window.removeEventListener('resize', layoutCover);
    if (animId) cancelAnimationFrame(animId);
    if (petAnimId) cancelAnimationFrame(petAnimId);
    if (cdInterval) clearInterval(cdInterval);
    cardObserver.disconnect();
    petObserver.disconnect();
  };
}

export const initTemplate15 = mount;
