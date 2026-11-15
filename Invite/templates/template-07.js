/* ==========================================================================
   AARAV & ZOYA / PURUSHOTTAM & SANJUKTA — Royal Ivory & Gold Wedding Suite (Template 07)
   Master-Level Royal Indian Wedding Invitation Crafted with Editorial Precision:
   - Act I: Royal Sliding Double Doors Entry Gate:
     - Starting unlit (nocturnal lights-off) with dark royal palace gates and starry sky.
     - Swaying illuminated brass lantern with radial light halo.
     - "A CELEBRATION OF LOVE" + dynamic couple names in royal typography.
     - Guest welcome card: "Cordially Invited", Guest Name, "Family Invitation · X Persons".
     - Prominent "✨ OPEN" button with glowing pulse ("✦ Tap to open the invitation ✦").
   - Act II: Lights On & Phuljhari / Crackers pyrotechnics:
     - On tap, lights softly turn on illuminating the golden palace doors!
     - Web Audio API crackle sounds + HTML5 canvas fireworks/sparkler burst.
     - Double palace doors physically slide open slowly ("dhire dhire" over 2.6s) to the sides!
   - Act III: Grand 2nd Screen Hero Stage revealed behind the parting doors:
     - Grand Floral & Golden Lantern Archway (`template-07-arch.webp`) framing a glowing
       spotlight couple portrait inside the palace doorway.
     - Auspicious Invocation ("|| শ্রী শ্রী প্রজাপতয়ে নমঃ ||" / Arabic / Vedic) with Lotus Flourish.
     - Couple names in majestic royal Cinzel typography with parent blessing & invitation copy.
     - Hero Royal Guest Box ("Cordially Invited", Guest Name, "Family Invitation · X Persons").
     - Animated royal procession frieze (horses, carts, palanquin, elephants).
   - Rich Background:
     - Master-level ultra-subtle Royal Mughal Jali Lattice watermark pattern.
     - Ambient golden lighting vignettes and layered antique pearl-ivory paper texture.
     - Royal gold corner arabesques and embossed double-hairline borders on all cards.
   - Complete Template-06 Feature Suite:
     - Sacred Story & Journey section with 3 numbered zigzag chapters & golden medallions.
     - Save the Date & Live Countdown card with complete 7-day calendar grid and Google Calendar sync.
     - Auspicious Rituals Timeline with authentic photography, time pills, venue, dress codes, and RSVP.
     - Interactive Scratch & Reveal Surprise Card with secret couple message.
     - Moments of Love Polaroid photo gallery with lightbox zoom.
     - Royal Palace Venue Showcase with arched photo, address, valet notes, and Google Maps navigation.
     - Royal Letter RSVP envelope with stamp & postmark + Royal RSVP Pop-Up Modal dialog.
     - Royal Finale ("Forever Begins", family signature, procession frieze).
     - Global 4-Tab Floating Bottom Dock starts hidden on 1st screen and smoothly slides up on 2nd screen.

   Contract:
     export default function render({ guest, wedding, events }) -> html string
     export function mount(root, { guest, wedding, events }) -> cleanup()
   ========================================================================== */

/* ---------- Helpers ---------- */
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ESC[c]);
const clean = v => String(v ?? '').trim();
const safeUrl = u => (/^https?:\/\//i.test(clean(u)) ? esc(clean(u)) : '');
const safeImg = u => {
  const s = clean(u);
  if (!s) return '';
  if (/^https?:\/\/[^\s'"<>]+$/i.test(s)) return s;
  if (/^blob:[^\s'"<>]+$/i.test(s)) return s;
  if (/^\.?\/?assets\/[^\s'"<>]+$/i.test(s)) return s;
  if (/^[a-z0-9_-]+\.(jpg|jpeg|png|webp|svg)$/i.test(s)) return `./assets/${s}`;
  if (s.startsWith('data:image/') && s.includes(';base64,')) {
    if (!/[\s'"<>]/.test(s.slice(0, 50))) return s;
  }
  return '';
};
const getStoredPhoto = k => {
  try {
    if (typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function') {
      const v = localStorage.getItem(k);
      if (v) return v;
    }
    if (typeof sessionStorage !== 'undefined' && typeof sessionStorage.getItem === 'function') {
      const v = sessionStorage.getItem(k);
      if (v) return v;
    }
  } catch { return ''; }
  return '';
};
const lines = s => String(s ?? '').split(/[;\n]/).map(x => x.trim()).filter(Boolean);
const pad = n => String(n).padStart(2, '0');

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const ORD = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven'];
const FONT_HREF = 'https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Cinzel:wght@500;600;700;800&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=Galada&family=Hind+Siliguri:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Tiro+Bangla:ital@0;1&display=swap';

function dparts(v) {
  const raw = clean(v);
  let m = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:$|[T\s])/), y, mo, d;
  if (m) [y, mo, d] = [+m[1], +m[2], +m[3]];
  else if ((m = raw.match(/^(\d{1,2})[\s/-]+([A-Za-z]{3,9})[\s/-]+(\d{4})$/))) {
    mo = MONTHS.findIndex(n => n.slice(0, 3).toLowerCase() === m[2].slice(0, 3).toLowerCase()) + 1;
    [y, d] = [+m[3], +m[1]];
  } else if ((m = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/))) {
    [y, mo, d] = [+m[3], +m[2], +m[1]];
  } else return null;
  if (!mo) return null;
  const t = new Date(Date.UTC(y, mo - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === mo - 1 && t.getUTCDate() === d ? { y, mo, d } : null;
}
const weekday = p => DAYS[new Date(Date.UTC(p.y, p.mo - 1, p.d)).getUTCDay()];

function fmtTime(v) {
  const raw = clean(v);
  if (!raw) return '';
  if (/T/.test(raw)) {
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' }).replace(/\b(am|pm)\b/i, s => s.toUpperCase());
  }
  const m = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*([AaPp][Mm])?$/);
  if (m) {
    let h = +m[1];
    const mer = m[3] ? m[3].toUpperCase() : (h >= 12 ? 'PM' : 'AM');
    if (!m[3]) h = h % 12 || 12;
    return `${h}:${m[2]} ${mer}`;
  }
  return raw;
}

function parseWhen(dv, tv, offset = '+05:30') {
  const d = dparts(dv);
  if (!d) return null;
  const rt = clean(tv);
  const t = rt.match(/^(\d{1,2})(?::([0-5]\d))?(?::[0-5]\d)?\s*([AaPp][Mm])?$/);
  if (rt && !t) return null;
  let h = t ? +t[1] : 0;
  const mi = t ? +(t[2] || 0) : 0;
  const mer = t && t[3] ? t[3].toUpperCase() : '';
  if (mer === 'PM' && h !== 12) h += 12;
  if (mer === 'AM' && h === 12) h = 0;
  if (h > 23) return null;
  const ts = Date.parse(`${d.y}-${pad(d.mo)}-${pad(d.d)}T${pad(h)}:${pad(mi)}:00${offset}`);
  return Number.isNaN(ts) ? null : ts;
}

/* ---------- Content & Icon Helpers ---------- */
const KINDS = [
  { re: /gaye\s*holud/i, icon: 'flower', asset: 'template-06-gaye-holud.jpg', dress: 'Yellow & Marigold', c: '#f4c542' },
  { re: /biye|shubho\s*bibaho/i, icon: 'kalash', asset: 'template-06-shubho-bibaho.jpg', dress: 'Red, White & Gold', c: '#b5121b' },
  { re: /bou\s*bhat|boubhat|bhaat/i, icon: 'feast', asset: 'template-06-boubhat.jpg', dress: 'Banarasi & Dhuti Elegance', c: '#8e2a45' },
  { re: /ashirbad|aashirbad/i, icon: 'garland', asset: 'template-06-ashirbad.jpg', dress: 'Traditional Silk', c: '#d8b56e' },
  { re: /haldi|ubtan|pithi/i, icon: 'flower', asset: 'template-06-haldi.jpg', dress: 'Yellow & Marigold', c: '#f4c542' },
  { re: /phere|saat\s*paak|sampradan|sindoor|vivah|wedding|ceremony|kanyadan/i, icon: 'kalash', asset: 'template-06-phere.jpg', dress: 'Red, White & Gold', c: '#b5121b' },
  { re: /reception|dinner|bhoj|feast/i, icon: 'feast', asset: 'template-06-reception.jpg', dress: 'Banarasi & Formal Elegance', c: '#8e2a45' },
  { re: /mehendi|mehndi|henna/i, icon: 'leaf', asset: 'template-06-mehendi.jpg', dress: 'Green & Pastels', c: '#3f8f3a' },
  { re: /sangeet|cocktail|music|dhak|dandiya|garba/i, icon: 'music', asset: 'template-06-sangeet.jpg', dress: 'Festive & Colourful', c: '#7a2a6a' },
  { re: /milaad|milad|nikah/i, icon: 'lamp', asset: 'template-06-milad-sharif.jpg', dress: 'Traditional Formal', c: '#2e7d32' },
  { re: /walima/i, icon: 'feast', asset: 'template-06-boubhat.jpg', dress: 'Royal Reception Elegance', c: '#8e2a45' },
  { re: /baraat|bor\s*boron|boron/i, icon: 'lamp', asset: 'template-06-baraat.jpg', dress: 'Royal Festive', c: '#c8281e' },
  { re: /jaimala|varmala|mala\s*badal/i, icon: 'garland', asset: 'template-06-jaimala.jpg', dress: 'Traditional Silk', c: '#d8b56e' }
];
const DEFAULT_KIND = { icon: 'flower', asset: 'template-06-phere.jpg', dress: 'Traditional Festive', c: '#d4af37' };
const kindOf = name => KINDS.find(k => k.re.test(name)) || DEFAULT_KIND;

const DEFAULT_STORY = [
  { title: 'How We Met', text: 'One unexpected hello became a thousand conversations, shared dreams, and a friendship that felt like home.' },
  { title: 'The Promise', text: 'With happy tears and hearts full of hope, we chose each other — and all the beautiful tomorrows still to come.' },
  { title: 'The Big Day', text: 'Now, surrounded by the people we love, we cannot wait to celebrate the beginning of our forever with you.' }
];

/* ---------- Scaled Vector Frieze & Flourishes ---------- */
const spokes = [0, 45, 90, 135].map(a => `<path d="M-26 0H26" stroke="#8a5a12" stroke-width="2.4" transform="rotate(${a})"/>`).join('');

const man = (x, s = 1, o = {}) => `<g transform="translate(${x} ${o.y ?? 172}) scale(${s * (o.flip ? -1 : 1)} ${s})">
<ellipse cx="0" cy="-94" rx="13" ry="6.5" fill="${o.turban || '#881A2B'}"/><path d="M-9-96C-8-110 8-110 9-96Z" fill="${o.turban || '#63101D'}"/>
<circle cx="0" cy="-84" r="9.5" fill="#e6a56d"/><path d="M-5-85h2.4M2.6-85H5" stroke="#2b1a17" stroke-width="1.4" stroke-linecap="round"/><path d="M-4-80Q0-78 4-80" stroke="#2b1a17" stroke-width="1.2" fill="none"/>
<path d="M-13-73L13-73L17-30L-17-30Z" fill="${o.shirt || '#C69C47'}"/><path d="M-13-73L-8-30M13-73L8-30" stroke="#967128" stroke-width="1.4"/>
${o.torso ? '' : '<path d="M-17-34H17L21 0H-21Z" fill="#FFFDF7"/><path d="M-21-5H21" stroke="#881A2B" stroke-width="3"/><path d="M-15 0h11v-4h-11zM4 0h11v-4H4z" fill="#e6a56d"/>'}
${o.prop || ''}</g>`;
const SPEAR = '<path d="M21-6V-128" stroke="#6b3a1e" stroke-width="3"/><path d="M21-128l-5 13h10z" fill="#bfc3c8"/><path d="M13-62L21-60" stroke="#e6a56d" stroke-width="5" stroke-linecap="round"/>';
const STICK = '<path d="M20 0L24-104" stroke="#6b3a1e" stroke-width="3.5"/><path d="M13-62L22-60" stroke="#e6a56d" stroke-width="5" stroke-linecap="round"/>';
const HORN = '<path d="M7-84L56-100Q66-102 70-92L60-82Q52-84 7-80Z" fill="#e8b02a" stroke="#a97a12" stroke-width="1.2"/><path d="M12-62L-4-78" stroke="#e6a56d" stroke-width="5" stroke-linecap="round"/>';
const horse = (x, s = 1) => `<g transform="translate(${x} 172) scale(${s})">
<path d="M6-56C-12-52-14-30-8-14" stroke="#881A2B" stroke-width="7" fill="none" stroke-linecap="round"/>
<rect x="16" y="-34" width="9" height="34" rx="3" fill="#881A2B"/><rect x="30" y="-34" width="9" height="34" rx="3" fill="#63101D"/><rect x="70" y="-34" width="9" height="34" rx="3" fill="#881A2B"/><rect x="84" y="-34" width="9" height="34" rx="3" fill="#63101D"/>
<path d="M16 0h9v-5h-9zM30 0h9v-5h-9zM70 0h9v-5h-9zM84 0h9v-5h-9z" fill="#3a1a10"/>
<ellipse cx="55" cy="-50" rx="46" ry="23" fill="#881A2B"/><path d="M84-62L106-98L120-93L104-52Z" fill="#881A2B"/><path d="M100-98L108-111L114-96Z" fill="#63101D"/>
<ellipse cx="122" cy="-91" rx="14" ry="8" transform="rotate(28 122 -91)" fill="#881A2B"/><circle cx="124" cy="-95" r="1.7" fill="#1a0f0a"/>
<path d="M86-62C94-78 100-86 104-98" stroke="#4a0812" stroke-width="5" fill="none"/>
<rect x="40" y="-67" width="40" height="22" rx="4" fill="#C69C47"/><path d="M40-56H80" stroke="#881A2B" stroke-width="3"/><path d="M44-48h32" stroke="#881A2B" stroke-width="1.5" stroke-dasharray="3 3"/>
<path d="M88-70L112-97M98-58L121-87" stroke="#fff" stroke-width="2" opacity=".85"/></g>`;
const cart = (x, s = 1, inner = '') => `<g transform="translate(${x} 172) scale(${s})">
<path d="M-26-44H4" stroke="#7a4a22" stroke-width="5"/><rect x="0" y="-52" width="116" height="9" rx="2" fill="#a8621f"/>${inner}
${[28, 92].map(cx => `<g transform="translate(${cx} -26)"><circle r="26" fill="#C69C47" stroke="#8a5a12" stroke-width="4"/><circle r="5" fill="#8a5a12"/>${spokes}</g>`).join('')}</g>`;
const DOLI = '<rect x="12" y="-100" width="84" height="48" rx="3" fill="#881A2B"/><path d="M10-100Q54-128 98-100Z" fill="#63101D"/><path d="M26-52V-88Q54-104 82-88V-52Z" fill="#3D0912"/><circle cx="54" cy="-74" r="8" fill="#e6a56d"/><path d="M42-62Q54-52 66-62V-52H42Z" fill="#C69C47"/><path d="M45-80Q54-94 63-80Z" fill="#881A2B"/><path d="M10-100H98" stroke="#E5C16C" stroke-width="3"/><circle cx="54" cy="-116" r="3" fill="#E5C16C"/>';
const elephant = (x, s = 1) => `<g transform="translate(${x} 172) scale(${s})">
<rect x="22" y="-52" width="26" height="52" rx="8" fill="#7e4527"/><rect x="60" y="-52" width="26" height="52" rx="8" fill="#6d3b20"/><rect x="116" y="-52" width="26" height="52" rx="8" fill="#7e4527"/><rect x="150" y="-52" width="26" height="52" rx="8" fill="#6d3b20"/>
<path d="M26 0h18M64 0h18M120 0h18M154 0h18" stroke="#f1e6cf" stroke-width="3" stroke-linecap="round"/>
<rect x="8" y="-124" width="160" height="88" rx="42" fill="#8f4f2c"/><circle cx="178" cy="-98" r="34" fill="#8f4f2c"/>
<path d="M198-84C216-70 216-30 200-12C193-5 184-10 191-19C202-35 200-62 188-72Z" fill="#8f4f2c"/>
<ellipse cx="152" cy="-92" rx="16" ry="26" fill="#7e4527"/><path d="M188-66C200-60 208-64 212-72" stroke="#f6efdc" stroke-width="6" fill="none" stroke-linecap="round"/><circle cx="188" cy="-108" r="2.4" fill="#1a0f0a"/>
<path d="M20-124Q88-152 156-124L150-68Q88-84 26-68Z" fill="#881A2B"/><path d="M20-124Q88-152 156-124" stroke="#E5C16C" stroke-width="5" fill="none"/><path d="M30-78Q88-92 146-78" stroke="#E5C16C" stroke-width="3" stroke-dasharray="4 5" fill="none"/>
<path d="M170-124Q178-138 188-124" stroke="#E5C16C" stroke-width="4" fill="none"/>
${man(0, .78, { torso: true, y: 0, prop: '' }).replace('translate(0 0)', 'translate(88 -118)')}</g>`;
const FRIEZE = `<g id="t07-fz">${horse(4, .95)}${cart(124, .95, DOLI)}${man(300, 1, { prop: SPEAR })}${elephant(340, .9)}${man(570, 1, { prop: STICK })}${man(624, 1, { prop: STICK, flip: true })}${horse(700, .95)}${cart(820, .95)}${man(890, .92, { y: 172 - 50 * .95, prop: HORN })}${man(1010, 1, { prop: SPEAR })}${man(1066, 1, { prop: STICK, flip: true })}
<g fill="#C69C47" opacity=".9">${[[270, 168], [560, 170], [1130, 168], [1170, 160]].map(([x, y]) => `<path transform="translate(${x} ${y})" d="M0 0Q4-8 8 0Q4 6 0 0Z"/>`).join('')}</g></g>`;

const DEFS = `<svg class="t07-defs" width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>
<linearGradient id="t07-gold-grad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F2DDA4"/><stop offset=".45" stop-color="#C69C47"/><stop offset="1" stop-color="#967128"/></linearGradient>
<linearGradient id="t07-maroon-grad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#881A2B"/><stop offset=".6" stop-color="#63101D"/><stop offset="1" stop-color="#3D0912"/></linearGradient>
${FRIEZE}</defs></svg>`;

/* Authentic Royal Lotus Flourish Divider */
const LOTUS_DIVIDER_SVG = `<svg class="t07-lotus-flourish" viewBox="0 0 240 44" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M120 4c-5 12-14 20-22 22 10 1 17-6 22-18 5 12 12 19 22 18-8-2-17-10-22-22z" fill="#C69C47" stroke="none"/>
  <path d="M120 16c-3 8-9 13-15 14 7 1 11-4 15-11 4 7 8 12 15 11-6-1-12-6-15-14z" fill="#881A2B" stroke="none"/>
  <circle cx="120" cy="33" r="3" fill="#C69C47"/>
  <circle cx="120" cy="40" r="1.5" fill="#C69C47"/>
  <path d="M96 26C80 26 65 14 50 20c-12 5-18 16-32 16M144 26c16 0 31-12 46-6 12 5 18 16 32 16" stroke="#C69C47" stroke-width="1.4" stroke-linecap="round"/>
  <circle cx="18" cy="36" r="2.5" fill="#C69C47"/>
  <circle cx="222" cy="36" r="2.5" fill="#C69C47"/>
  <circle cx="6" cy="36" r="1.5" fill="#C69C47"/>
  <circle cx="234" cy="36" r="1.5" fill="#C69C47"/>
</svg>`;

/* Authentic Bengali / Royal Alpona Divider */
const ALPONA = `<svg class="t07-alp" viewBox="0 0 340 40" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
<g fill="none" stroke="#C69C47" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <path d="M170 8C160 16 160 28 170 34C180 28 180 16 170 8Z"/>
  <path d="M170 34C156 32 148 24 150 14C160 15 168 22 170 34"/>
  <path d="M170 34C184 32 192 24 190 14C180 15 172 22 170 34"/>
  <path d="M142 24C126 24 118 14 104 16C92 18 88 28 78 26C70 24 70 18 62 18H12"/>
  <path d="M198 24C214 24 222 14 236 16C248 18 252 28 262 26C270 24 270 18 278 18H328"/>
  <circle cx="8" cy="18" r="2.5"/>
  <circle cx="332" cy="18" r="2.5"/>
  <path d="M112 16C110 9 116 5 122 7M228 16C230 9 224 5 218 7"/>
</g></svg>`;

/* Stamp & Postmark */
function stampSvg(en) {
  const W = 62, H = 74, r = 2.7, gap = 7.4;
  let holes = '';
  for (let x = gap / 2; x < W; x += gap) holes += `<circle cx="${x}" cy="0" r="${r}"/><circle cx="${x}" cy="${H}" r="${r}"/>`;
  for (let y = gap / 2; y < H; y += gap) holes += `<circle cx="0" cy="${y}" r="${r}"/><circle cx="${W}" cy="${y}" r="${r}"/>`;
  return `<svg class="t07-stamp" viewBox="-3 -3 ${W + 6} ${H + 6}" aria-label="${esc(en)}" role="img"><defs><mask id="t07-stm"><rect x="-3" y="-3" width="${W + 6}" height="${H + 6}" fill="#fff"/><g fill="#000">${holes}</g></mask></defs>
  <rect x="0" y="0" width="${W}" height="${H}" fill="#881A2B" mask="url(#t07-stm)"/><rect x="7" y="7" width="${W - 14}" height="${H - 14}" rx="1.5" fill="none" stroke="rgba(242,221,164,.65)" stroke-width=".8"/>
  <path d="M14 16Q31 8 48 16" stroke="rgba(242,221,164,.5)" stroke-width=".8" fill="none"/>
  <text x="31" y="44" class="t07-st">${esc(en)}</text>
  <path d="M20 56H42" stroke="rgba(242,221,164,.6)" stroke-width=".8"/><circle cx="31" cy="62" r="1.6" fill="rgba(242,221,164,.75)"/></svg>`;
}
function postmark(city, date) {
  const txt = `${city} ✦ ${date} ✦`;
  return `<svg class="t07-postmark" viewBox="0 0 80 80" aria-hidden="true" focusable="false"><defs><path id="t07-pm" d="M40 40m-27 0a27 27 0 1 1 54 0a27 27 0 1 1-54 0"/></defs><g fill="none" stroke="#881A2B" stroke-width="1.2"><circle cx="40" cy="40" r="35"/><circle cx="40" cy="40" r="20"/></g><text font-size="7.6" font-weight="600" letter-spacing="1.2" fill="#881A2B" font-family="'Cinzel',serif"><textPath href="#t07-pm">${esc(txt.toUpperCase())}</textPath></text><path d="M30 40h20M32 44h16" stroke="#881A2B" stroke-width="1.2"/></svg>`;
}

const CHECK_SVG = '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7"/></svg>';
const WHATSAPP_SVG = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M3.5 20.5l1.3-4.3A8.5 8.5 0 1 1 8 19.3z" stroke-linejoin="round"/><path d="M9 8.5c.2 3 3 5.8 6 6l1.2-1.4-2-1-.9.8c-.9-.4-1.7-1.2-2.1-2.1l.8-.9-1-2z" fill="currentColor" stroke="none"/></svg>';

/* ---------- Complete Master Stylesheet ---------- */
const STYLE = `
.t07-root, .t07-root *, .t07-root *:before, .t07-root *:after { box-sizing: border-box; }
.t07-root {
  --ivory: #FFFDF9;
  --ivory-warm: #FAF4E8;
  --ivory-soft: #F5ECE0;
  --maroon: #881A2B;
  --maroon-dark: #63101D;
  --maroon-deep: #3D0912;
  --gold: #C69C47;
  --gold-bright: #E5C16C;
  --gold-light: #F2DDA4;
  --gold-dark: #967128;
  --ink: #2C1017;
  --muted: #6B4E54;
  --f-title: "Cinzel", Georgia, serif;
  --f-head: "Cormorant Garamond", "Tiro Bangla", Georgia, serif;
  --f-body: "Plus Jakarta Sans", "Hind Siliguri", system-ui, sans-serif;
  --ease: cubic-bezier(0.22, 1, 0.36, 1);
  position: relative;
  width: 100%;
  min-height: 100vh;
  overflow-x: hidden;
  color: var(--ink);
  font: 500 16.5px/1.7 var(--f-body);
  -webkit-font-smoothing: antialiased;
  background-color: var(--ivory);
  background-image:
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cpath d='M40 0 L80 40 L40 80 L0 40 Z' fill='none' stroke='%23C69C47' stroke-width='0.8' stroke-opacity='0.08'/%3E%3Ccircle cx='40' cy='40' r='14' fill='none' stroke='%23C69C47' stroke-width='0.8' stroke-opacity='0.06'/%3E%3Cpath d='M40 16 C30 26 30 54 40 64 C50 54 50 26 40 16 Z' fill='none' stroke='%23C69C47' stroke-width='0.6' stroke-opacity='0.07'/%3E%3Cpath d='M16 40 C26 30 54 30 64 40 C54 50 26 50 16 40 Z' fill='none' stroke='%23C69C47' stroke-width='0.6' stroke-opacity='0.07'/%3E%3Ccircle cx='0' cy='0' r='8' fill='none' stroke='%23C69C47' stroke-width='0.6' stroke-opacity='0.05'/%3E%3Ccircle cx='80' cy='0' r='8' fill='none' stroke='%23C69C47' stroke-width='0.6' stroke-opacity='0.05'/%3E%3Ccircle cx='0' cy='80' r='8' fill='none' stroke='%23C69C47' stroke-width='0.6' stroke-opacity='0.05'/%3E%3Ccircle cx='80' cy='80' r='8' fill='none' stroke='%23C69C47' stroke-width='0.6' stroke-opacity='0.05'/%3E%3C/svg%3E"),
    radial-gradient(ellipse 80% 40% at 50% 0%, rgba(226, 188, 104, 0.18) 0%, transparent 70%),
    radial-gradient(circle at 10% 30%, rgba(136, 26, 43, 0.04) 0%, transparent 50%),
    radial-gradient(circle at 90% 70%, rgba(198, 156, 71, 0.06) 0%, transparent 50%),
    linear-gradient(180deg, #FFFDF9 0%, #FAF4E8 50%, #FFFDF9 100%);
  padding-bottom: 120px;
}
.t07-root h1, .t07-root h2, .t07-root h3, .t07-root p, .t07-root figure { margin-top: 0; }
.t07-root img { display: block; max-width: 100%; }
.t07-root button { font: inherit; color: inherit; cursor: pointer; }
.t07-root a { color: inherit; }
.t07-root [hidden] { display: none !important; }

/* Progress bar */
.t07-progress {
  position: fixed; top: 0; left: 0; height: 3.5px; width: 100%; z-index: 998;
  transform-origin: left; transform: scaleX(0);
  background: linear-gradient(90deg, var(--gold-bright), var(--maroon), var(--gold));
}
.t07-wrap { position: relative; width: 100%; max-width: 1040px; margin: 0 auto; padding: 0 24px; }
.t07-root section { position: relative; padding: 84px 0; }

.t07-eyebrow {
  font: 700 11.5px var(--f-title); letter-spacing: 0.28em; text-transform: uppercase;
  color: var(--gold-dark); margin-bottom: 8px; text-align: center;
}
.t07-head { text-align: center; margin-bottom: 40px; position: relative; z-index: 2; }
.t07-head h2 {
  font: 700 clamp(30px, 6.5vw, 48px)/1.15 var(--f-title); color: var(--maroon);
  margin: 0 0 10px; letter-spacing: 0.02em;
}
.t07-head p { max-width: 540px; margin: 0 auto; color: var(--muted); font-size: 17px; }

/* Flourish Dividers */
.t07-lotus-flourish, .t07-alp {
  display: block; width: min(280px, 75%); height: auto; margin: 14px auto 0;
  color: var(--gold); opacity: 0.95;
}

/* ==========================================================================
   ACT I: ROYAL SLIDING DOUBLE DOORS GATE (PHYSICALLY SEEN OPENING "DHIRE DHIRE")
   ========================================================================== */
.t07-entry {
  position: fixed !important; inset: 0 !important; width: 100% !important;
  height: 100vh !important; height: 100svh !important; z-index: 990 !important;
  overflow: hidden !important; background: #0c0205 !important;
  display: flex !important; align-items: center !important; justify-content: center !important;
  transition: opacity 0.8s ease, visibility 0.8s ease, background 0.6s ease;
}
.t07-entry.t07-open {
  pointer-events: none !important;
  background: transparent !important;
}
.t07-entry.t07-doors-cleared {
  display: none !important; pointer-events: none !important;
}

.t07-doors-portal {
  position: absolute; inset: 0; width: 100%; height: 100%;
  overflow: hidden; z-index: 2; pointer-events: none;
}
.t07-cur {
  position: absolute; top: 0; bottom: 0; width: 50.1%; height: 100%;
  overflow: hidden; transition: transform 2.6s cubic-bezier(0.65, 0, 0.25, 1);
  will-change: transform; z-index: 2; pointer-events: auto;
}
.t07-cur.t07-cl {
  left: 0; border-right: 2px solid rgba(229, 193, 108, 0.9);
  box-shadow: 4px 0 28px rgba(0, 0, 0, 0.75);
}
.t07-cur.t07-cr {
  right: 0; border-left: 2px solid rgba(229, 193, 108, 0.9);
  box-shadow: -4px 0 28px rgba(0, 0, 0, 0.75);
}

.t07-door-panel {
  position: absolute; top: 0; height: 100%; width: 200%;
  display: flex; align-items: center; justify-content: center;
}
.t07-door-left { left: 0; }
.t07-door-right { left: -100%; }

.t07-door {
  width: 100%; height: 100%; object-fit: cover; object-position: center;
  display: block; transition: filter 0.9s cubic-bezier(0.2, 0.8, 0.2, 1);
}

/* Initial Lights Off: Dark, nocturnal palace gate at night */
.t07-unlit .t07-door {
  filter: brightness(0.24) contrast(1.22) saturate(0.6);
}
.t07-unlit .t07-doors-portal:after {
  content: ''; position: absolute; inset: 0;
  background: radial-gradient(circle at 50% 50%, rgba(20, 4, 8, 0.45) 0%, rgba(10, 2, 4, 0.92) 100%);
  pointer-events: none; transition: opacity 1.0s ease; z-index: 3;
}

/* Lights On: Radiant golden illumination across the doors */
.t07-lit .t07-door {
  filter: brightness(1.15) contrast(1.08) saturate(1.12) drop-shadow(0 0 32px rgba(229, 193, 108, 0.75));
}
.t07-lit .t07-doors-portal:after {
  opacity: 0;
}

/* Double Doors Sliding Open Slowly to Left & Right ("dhire dhire") */
.t07-open .t07-cl {
  transform: translateX(-104%) skewX(-1.5deg);
}
.t07-open .t07-cr {
  transform: translateX(104%) skewX(1.5deg);
}
.t07-open .t07-doors-portal {
  pointer-events: none;
}

/* Center Gate Welcome Card (Sits on top of the closed doors) */
.t07-gate-in {
  position: absolute; inset: 0; z-index: 10;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: clamp(10px, 2vh, 24px) 16px; overflow-y: auto; touch-action: pan-y;
  transition: opacity 0.6s ease, transform 0.6s ease; pointer-events: auto; text-align: center;
}
.t07-open .t07-gate-in {
  opacity: 0; transform: scale(1.06); pointer-events: none;
}

.t07-lantern-wrap {
  display: flex; flex-direction: column; align-items: center; cursor: pointer;
  outline: none; user-select: none; margin-bottom: 1.25rem;
}
@keyframes t07Sway {
  0%, 100% { transform: rotate(-3.5deg); }
  50% { transform: rotate(3.5deg); }
}
.t07-lantern-sway {
  transform-origin: top center; animation: t07Sway 3.6s ease-in-out infinite;
}
@keyframes t07HaloPulse {
  0%, 100% { transform: scale(1); opacity: 0.7; }
  50% { transform: scale(1.18); opacity: 1; }
}
.t07-lantern-halo { animation: t07HaloPulse 2.6s ease-in-out infinite; }

@keyframes t07Twinkle {
  0%, 100% { opacity: 0.2; transform: scale(0.85); }
  50% { opacity: 0.95; transform: scale(1.25); }
}
.t07-star-dot {
  position: absolute; border-radius: 50%; background: #F2DDA4;
  animation: t07Twinkle var(--dur, 3s) ease-in-out infinite;
  animation-delay: var(--delay, 0s);
}

@keyframes t07BtnPulse {
  0%, 100% { transform: scale(1); box-shadow: 0 8px 30px rgba(198,156,71,0.4), 0 0 20px rgba(136,26,43,0.6); }
  50% { transform: scale(1.03); box-shadow: 0 12px 38px rgba(198,156,71,0.6), 0 0 28px rgba(136,26,43,0.85); }
}
.t07-open-btn {
  animation: t07BtnPulse 2.8s ease-in-out infinite;
}
.t07-open-btn:hover { transform: scale(1.05) translateY(-2px) !important; }

/* ==========================================================================
   ACT II: 2ND SCREEN HERO STAGE (REVEALED BEHIND OPENING DOORS)
   ========================================================================== */
.t07-hero {
  position: relative; width: 100%; min-height: 100vh;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  text-align: center; padding: clamp(32px, 5vh, 60px) 16px clamp(90px, 12vh, 130px);
  overflow: hidden;
}
.t07-hero-arch-container {
  position: relative; width: 100%; max-width: min(580px, 92vw); max-height: min(68vh, 540px);
  margin: 0 auto; aspect-ratio: 958/1024; display: flex; align-items: center; justify-content: center;
}
.t07-hero-arch-img {
  position: relative; z-index: 10; width: 100%; height: 100%;
  object-fit: contain; pointer-events: none; user-select: none;
  filter: drop-shadow(0 16px 36px rgba(136,26,43,0.22));
}

/* Spotlight Couple Portrait framed inside Open Arch Portal */
.t07-portal-couple-frame {
  position: absolute; left: 30%; right: 30%; top: 38%; bottom: 12%;
  z-index: 5; border-radius: 120px 120px 18px 18px; overflow: hidden;
  box-shadow: inset 0 0 30px rgba(136,26,43,0.35), 0 12px 28px rgba(0,0,0,0.25);
  background: radial-gradient(ellipse at 50% 50%, #FFFDF7 40%, #FBF0DF 100%);
  display: flex; align-items: center; justify-content: center;
  border: 2px solid rgba(198,156,71,0.65);
}
.t07-portal-couple-img {
  width: 100%; height: 100%; object-fit: cover; object-position: center 15%;
  display: block; transition: transform 0.6s var(--ease);
}
.t07-hero-arch-container:hover .t07-portal-couple-img {
  transform: scale(1.04);
}

/* Hero Typography Block */
.t07-hero-content {
  position: relative; z-index: 15; width: 100%; max-width: 680px; margin: -16px auto 0;
  display: flex; flex-direction: column; align-items: center; text-align: center; gap: 8px;
}
.t07-hero-names {
  font: 700 clamp(32px, 6.5vw, 54px)/1.1 var(--f-title); color: var(--maroon);
  margin: 4px 0 2px; letter-spacing: 0.04em;
  text-shadow: 0 1.5px 0 rgba(255,255,255,0.85);
}
.t07-hero-names i {
  display: inline-block; font: italic 400 0.72em var(--f-head); color: var(--gold);
  margin: 0 8px;
}
.t07-hero-parents {
  font: 500 clamp(12px, 1.8vw, 15px) var(--f-head); color: var(--muted);
  margin: 0; letter-spacing: 0.02em;
}
.t07-hero-copy {
  max-width: 520px; margin: 6px auto 0;
  font: italic 500 clamp(15px, 2.2vw, 18px)/1.5 var(--f-head); color: var(--muted);
}

/* Hero Guest Box */
.t07-hero-guest-box {
  width: 100%; max-width: 420px; margin: 16px auto 0;
  padding: 14px 22px; border-radius: 20px;
  background: linear-gradient(180deg, rgba(255,253,249,0.96), rgba(251,245,232,0.96));
  border: 1.5px solid rgba(198,156,71,0.75);
  box-shadow: 0 8px 24px rgba(136,26,43,0.1), inset 0 1px 0 rgba(255,255,255,0.95);
  text-align: center;
}
.t07-hero-guest-sal {
  display: block; font: 700 11px var(--f-title); letter-spacing: 0.25em;
  text-transform: uppercase; color: var(--gold-dark); margin-bottom: 3px;
}
.t07-hero-guest-name {
  font: 700 clamp(20px, 3.8vw, 26px)/1.2 var(--f-title); color: var(--maroon);
  margin: 0 0 4px;
}
.t07-hero-guest-pill {
  display: inline-block; padding: 3px 16px; border-radius: 16px;
  background: rgba(198,156,71,0.2); border: 1px solid rgba(198,156,71,0.55);
  font: 600 12px var(--f-body); color: #5C4116;
}

/* Frieze animation */
.t07-frieze {
  position: absolute; left: 0; right: 0; bottom: 0; height: clamp(48px, 6.5vh, 72px);
  overflow: hidden; z-index: 3; pointer-events: none;
}
.t07-fz-track {
  display: flex; height: 100%; width: max-content; animation: t07March 70s linear infinite;
}
.t07-fz-track svg { flex: 0 0 auto; height: 100%; width: auto; aspect-ratio: 1200/190; }
@keyframes t07March { from { transform: translate3d(-50%,0,0); } to { transform: translate3d(0,0,0); } }

/* Story / Journey Section */
section[data-sec="story"] {
  background: radial-gradient(ellipse 70% 30% at 50% 0%, rgba(255,255,255,0.8), transparent 70%),
              linear-gradient(180deg, var(--ivory), var(--ivory-warm) 50%, var(--ivory));
  padding: 80px 0;
}
.t07-poem {
  max-width: 660px; margin: 0 auto 44px; padding: 28px 24px; text-align: center;
  border-radius: 24px; background: linear-gradient(180deg, rgba(255,253,249,0.96), rgba(251,245,232,0.94));
  border: 1.5px solid rgba(198,156,71,0.6); box-shadow: 0 16px 36px rgba(136,26,43,0.08);
}
.t07-poem p {
  margin: 0; font: italic 600 clamp(18px, 3.2vw, 23px)/1.65 var(--f-head); color: var(--maroon);
}
.t07-poem small {
  display: block; margin-top: 10px; font: 700 12px var(--f-title);
  letter-spacing: 0.24em; color: var(--gold-dark); text-transform: uppercase;
}

.t07-chap {
  display: grid; grid-template-columns: clamp(100px, 26vw, 160px) 1fr;
  gap: clamp(16px, 4vw, 36px); align-items: center; text-align: left;
  max-width: 680px; margin: 0 auto 44px;
}
.t07-chap:last-child { margin-bottom: 0; }
.t07-chap.t07-chap-rev {
  grid-template-columns: 1fr clamp(100px, 26vw, 160px); text-align: right;
}
.t07-chap.t07-chap-rev .t07-medal { order: 2; justify-self: end; }
.t07-chap.t07-chap-rev .t07-chap-txt { order: 1; text-align: right; align-items: flex-end; }

.t07-medal {
  position: relative; width: 100%; max-width: 160px; aspect-ratio: 1/1;
  border-radius: 50%; padding: 6px;
  background: conic-gradient(from 0deg, var(--gold), #FFF0AA, var(--gold), #FAE6AA, var(--gold));
  box-shadow: 0 12px 30px rgba(136,26,43,0.18), 0 0 0 3px rgba(198,156,71,0.4);
  flex-shrink: 0;
}
.t07-medal > div {
  position: relative; width: 100%; height: 100%; border-radius: 50%;
  overflow: hidden; border: 3px solid #FFFDF7; background: #F8EEDC;
}
.t07-medal img { width: 100%; height: 100%; object-fit: cover; object-position: center 15%; }
.t07-num {
  font: 700 clamp(32px, 6.5vw, 48px)/1 var(--f-title); color: transparent;
  -webkit-text-stroke: 1.3px var(--gold-dark); margin-bottom: 2px; display: inline-block;
}
.t07-chap h3 {
  font: 700 clamp(19px, 3.6vw, 26px)/1.2 var(--f-title); color: var(--maroon); margin: 0 0 6px;
}
.t07-chap p {
  margin: 0; color: var(--muted); font: 500 clamp(14px, 2.2vw, 16px)/1.55 var(--f-head); max-width: 440px;
}

/* Save the Date Section */
.t07-sec-date {
  background: radial-gradient(ellipse 70% 30% at 50% 0%, rgba(255,255,255,0.7), transparent 70%),
              linear-gradient(180deg, var(--ivory), var(--ivory-warm) 50%, var(--ivory));
  padding: 70px 0 90px;
}
.t07-datecard {
  position: relative; max-width: 540px; margin: 0 auto; padding: 40px 24px 34px;
  border-radius: 28px; background: linear-gradient(180deg, #FFFDF9, #FBF4E7);
  border: 1.5px solid rgba(198,156,71,0.65);
  box-shadow: 0 22px 50px rgba(136,26,43,0.12), 0 0 0 6px rgba(255,253,249,0.8);
  text-align: center;
}
.t07-cal-m {
  font: 700 clamp(24px, 5.5vw, 34px) var(--f-title); color: var(--maroon);
  letter-spacing: 0.08em; text-transform: uppercase;
}
.t07-cal-y { font: italic 600 22px var(--f-head); color: var(--gold-dark); margin-top: -2px; }
.t07-cal-grid {
  display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px;
  max-width: 340px; margin: 22px auto 0; font: 600 15px var(--f-title);
}
.t07-cal-h { font: 700 12px var(--f-body); color: var(--muted); padding: 4px 0; }
.t07-cal-d {
  aspect-ratio: 1; display: grid; place-items: center; border-radius: 50%;
  color: var(--ink); transition: background 0.2s;
}
.t07-cal-on {
  background: var(--maroon) !important; color: #fff !important;
  box-shadow: 0 4px 14px rgba(136,26,43,0.35);
}
.t07-cal-dot { position: relative; }
.t07-cal-dot:after {
  content: ""; position: absolute; bottom: 3px; left: 50%; width: 4px; height: 4px;
  border-radius: 50%; background: var(--gold-dark); transform: translateX(-50%);
}
.t07-cal-time { margin: 26px 0 0; font: italic 600 19px var(--f-head); color: var(--maroon); }

.t07-cd { display: flex; justify-content: center; gap: 8px; margin: 20px 0 0; }
.t07-cd div {
  min-width: 66px; padding: 10px 6px 8px; border: 1.8px solid rgba(198,156,71,0.65);
  border-radius: 18px; background: rgba(255,253,249,0.9); overflow: hidden;
}
.t07-cd b {
  display: block; font: 700 28px/1.1 var(--f-title); color: var(--maroon);
  font-variant-numeric: tabular-nums;
}
.t07-cd small {
  font: 700 11px var(--f-body); letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--muted);
}
.t07-btn-gcal {
  display: inline-flex; align-items: center; justify-content: center; gap: 10px;
  padding: 12px 28px; font-size: clamp(14px, 2.5vw, 16px); font-weight: 700;
  border-radius: 999px; background: linear-gradient(135deg, var(--maroon), var(--maroon-dark));
  color: #FFFDF7 !important; box-shadow: 0 8px 24px rgba(136,26,43,0.35), 0 0 0 2px rgba(198,156,71,0.4);
  transition: transform 0.25s ease, box-shadow 0.25s ease; text-decoration: none; margin-top: 22px;
}
.t07-btn-gcal:hover {
  transform: translateY(-2px); box-shadow: 0 12px 28px rgba(136,26,43,0.45);
}

/* Auspicious Rituals Timeline */
.t07-sec-ev {
  background: radial-gradient(ellipse 60% 20% at 70% 10%, rgba(255,255,255,0.7), transparent 70%),
              linear-gradient(180deg, var(--ivory-warm), #F5E8D2 60%, var(--ivory-warm));
}
.t07-day {
  display: block; margin: 34px 0 16px; font: 700 15px var(--f-title);
  letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold-dark); text-align: center;
}
.t07-day:first-of-type { margin-top: 0; }
.t07-evs { display: grid; gap: 24px; }
.t07-evcard {
  border-radius: 22px; overflow: hidden; background: linear-gradient(180deg, #FFFDF9, #FBF4E7);
  border: 1px solid rgba(198,156,71,0.55); box-shadow: 0 16px 36px rgba(136,26,43,0.08);
  transition: transform 0.4s var(--ease), box-shadow 0.4s;
}
.t07-evcard:hover { transform: translateY(-3px); box-shadow: 0 22px 46px rgba(136,26,43,0.14); }
.t07-evimg {
  height: clamp(220px, 42vw, 300px); overflow: hidden; position: relative;
  background: linear-gradient(135deg, #FCF2E3, #F5DED0);
}
.t07-evimg img {
  width: 100%; height: 100%; object-fit: cover; object-position: center 15%;
  transition: transform 1.2s var(--ease);
}
.t07-evcard:hover .t07-evimg img { transform: scale(1.05); }
.t07-evtop { display: flex; align-items: center; gap: 16px; padding: 18px 20px 0; }
.t07-evdate {
  flex: 0 0 auto; width: 64px; padding: 8px 0 6px; text-align: center;
  border-radius: 14px; background: var(--maroon); color: #fff;
  box-shadow: 0 6px 14px rgba(136,26,43,0.28);
}
.t07-evdate b { display: block; font: 700 24px/1 var(--f-title); }
.t07-evdate small { font: 600 11px var(--f-body); letter-spacing: 0.08em; text-transform: uppercase; }
.t07-evtop h3 {
  font: 700 clamp(21px, 5vw, 27px)/1.2 var(--f-title); color: var(--maroon); margin: 0;
}
.t07-evb { padding: 12px 20px 20px; }
.t07-meta { font: 600 16px var(--f-head); color: var(--ink); margin: 4px 0; }
.t07-meta b { color: var(--maroon); margin-right: 8px; font-weight: 700; }
.t07-desc { font-size: 16px; color: var(--muted); margin: 8px 0 12px; }
.t07-dress {
  display: inline-flex; align-items: center; gap: 9px; padding: 6px 16px 6px 10px;
  border-radius: 30px; border: 1.6px solid rgba(198,156,71,0.5);
  background: rgba(255,253,249,0.85); font: 600 14px var(--f-head);
}
.t07-sw { width: 16px; height: 16px; border-radius: 50%; border: 1px solid rgba(0,0,0,0.25); }

/* Scratch & Reveal Surprise Card */
.t07-sec-reveal {
  background: linear-gradient(180deg, var(--ivory), #FEF5ED 50%, var(--ivory)); padding: 84px 0;
}
.t07-scratch-card {
  position: relative; width: 100%; max-width: 440px; margin: 0 auto; min-height: 220px;
  border-radius: 24px; border: 1.5px solid rgba(198,156,71,0.6);
  box-shadow: 0 20px 48px rgba(136,26,43,0.12), 0 0 0 5px rgba(255,253,249,0.8);
  overflow: hidden; background: linear-gradient(180deg, #FFFDF9, #FFF8EE);
}
.t07-scratch-secret {
  position: absolute; inset: 0; display: flex; flex-direction: column;
  align-items: center; justify-content: center; padding: 26px 20px; text-align: center;
  background: radial-gradient(ellipse at 50% 50%, #FFFAF2 40%, #FBF0DF 100%);
}
.t07-scratch-canvas {
  position: absolute; inset: 0; width: 100%; height: 100%; z-index: 3;
  touch-action: none; cursor: crosshair; transition: opacity 0.6s ease;
}
.t07-scratch-overlay {
  position: absolute; inset: 0; z-index: 4; display: grid; place-items: center;
  background: linear-gradient(135deg, rgba(136,26,43,0.95), rgba(99,16,29,0.96));
  color: #fff; pointer-events: none; transition: opacity 0.5s ease;
}
.t07-scratch-card.t07-active .t07-scratch-overlay { opacity: 0; }
.t07-scratch-card.t07-cleared .t07-scratch-canvas { opacity: 0; pointer-events: none; }

/* Moments of Love Gallery */
.t07-flow {
  display: flex; gap: 16px; overflow-x: auto; scroll-snap-type: x mandatory;
  padding: 20px 24px 30px; scrollbar-width: none; -webkit-overflow-scrolling: touch;
}
.t07-flow::-webkit-scrollbar { display: none; }
.t07-flow figure {
  flex: 0 0 min(68vw, 290px); aspect-ratio: 3/4; margin: 0; position: relative;
  padding: 10px 10px 32px; scroll-snap-align: center; cursor: zoom-in;
  background: #FFFDF9; border: 1px solid rgba(198,156,71,0.6); border-radius: 6px;
  box-shadow: 0 16px 36px rgba(136,26,43,0.12); transition: transform 0.4s var(--ease);
}
.t07-flow figure:nth-child(odd) { transform: rotate(-1.4deg); }
.t07-flow figure:nth-child(even) { transform: rotate(1.2deg); }
.t07-flow figure:hover { transform: rotate(0) translateY(-6px); }
.t07-flow figure:before {
  content: ""; position: absolute; top: -10px; left: 50%; width: 70px; height: 22px;
  transform: translateX(-50%) rotate(-3deg);
  background: repeating-linear-gradient(45deg, rgba(198,156,71,0.75) 0 6px, rgba(242,221,164,0.75) 6px 12px);
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
}
.t07-flow img { width: 100%; height: 100%; object-fit: cover; object-position: center 15%; }
.t07-lb {
  position: fixed; inset: 0; z-index: 9999; display: grid; place-items: center;
  padding: 20px; background: rgba(30,8,13,0.92); cursor: zoom-out;
}
.t07-lb img { max-width: min(94vw, 900px); max-height: 88vh; border-radius: 8px; }

/* Royal Palace Venue */
.t07-venue-grid {
  display: grid; gap: 24px; max-width: 900px; margin: 0 auto;
}
@media (min-width: 820px) {
  .t07-venue-grid { grid-template-columns: 1fr 1fr; align-items: center; }
}
.t07-venue-photo {
  position: relative; height: clamp(240px, 50vw, 360px); margin: 0;
  border-radius: 200px 200px 22px 22px; overflow: hidden;
  border: 1.5px solid var(--gold); box-shadow: 0 24px 56px rgba(136,26,43,0.18);
}
.t07-venue-photo img { width: 100%; height: 100%; object-fit: cover; object-position: center 30%; }
.t07-vcard {
  padding: 32px 24px; text-align: center; border-radius: 26px;
  background: linear-gradient(180deg, #FFFDF9, #FBF4E7); border: 1px solid rgba(198,156,71,0.6);
  box-shadow: 0 20px 48px rgba(136,26,43,0.1);
}
.t07-vcard h3 {
  font: 700 clamp(24px, 5.5vw, 32px)/1.2 var(--f-title); color: var(--maroon); margin: 4px 0 8px;
}
.t07-vcard p { font-size: 16.5px; color: var(--muted); margin: 0 0 20px; }

/* RSVP Section & Ornate Letter */
.t07-sec-rsvp {
  background: radial-gradient(ellipse at 50% 50%, rgba(198,156,71,0.08), transparent 70%),
              linear-gradient(180deg, var(--ivory-warm), #F5E8D2);
  padding-bottom: 70px;
}
.t07-rsvp-launch-btn {
  display: inline-flex; align-items: center; gap: 16px; min-height: 68px; padding: 12px 32px;
  border-radius: 38px; background: linear-gradient(135deg, var(--maroon), var(--maroon-dark));
  color: #fff; border: 2px solid var(--gold); box-shadow: 0 16px 36px rgba(136,26,43,0.35);
  cursor: pointer; transition: transform 0.3s var(--ease), box-shadow 0.3s var(--ease);
}
.t07-rsvp-launch-btn:hover {
  transform: translateY(-3px); box-shadow: 0 22px 48px rgba(136,26,43,0.45);
}

/* Royal RSVP Modal Dialog */
.t07-rsvp-modal {
  position: fixed; inset: 0; width: 100vw; height: 100vh; max-width: 100vw; max-height: 100vh;
  margin: 0; padding: 20px 14px; border: 0; background: rgba(28, 8, 13, 0.88);
  backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); z-index: 99999;
}
.t07-rsvp-modal:not([open]) { display: none; }
.t07-rsvp-modal[open] { display: grid; place-items: center; }
.t07-modal-card {
  position: relative; width: 100%; max-width: 480px; max-height: 92vh; overflow-y: auto;
  padding: 32px 24px 28px; border-radius: 28px; background: linear-gradient(180deg, #FFFDF9, #FBF4E7);
  border: 1.8px solid var(--gold); box-shadow: 0 30px 70px rgba(0,0,0,0.6);
}
.t07-modal-close {
  position: absolute; top: 16px; right: 18px; width: 38px; height: 38px; border-radius: 50%;
  border: 1px solid rgba(198,156,71,0.6); background: #FFFDF9; color: var(--ink);
  font-size: 18px; font-weight: 700; cursor: pointer; display: grid; place-items: center;
}
.t07-modal-close:hover { background: var(--maroon); color: #fff; }

.t07-rsvp {
  position: relative; max-width: 440px; margin: 0 auto; padding: 36px 22px 22px;
  border-radius: 30px; background: linear-gradient(180deg, #FFFDF9, #FBF4E7);
  border: 1px solid rgba(198,156,71,0.6); box-shadow: 0 24px 50px rgba(136,26,43,0.18);
}
.t07-stamp {
  position: absolute; top: -22px; right: 14px; width: 66px; height: auto;
  transform: rotate(6deg); filter: drop-shadow(0 6px 8px rgba(0,0,0,0.25)); z-index: 3;
}
.t07-st { font: 700 20px "Cinzel", serif; fill: #FFFDF9; text-anchor: middle; }
.t07-postmark {
  position: absolute; top: -10px; right: 62px; width: 78px; height: 78px;
  transform: rotate(-14deg); opacity: 0.45; z-index: 2; pointer-events: none;
}

.t07-lab { display: block; font: 600 18px var(--f-head); color: var(--ink); margin: 0 0 8px; }
.t07-fld { margin: 0 0 20px; position: relative; }
.t07-input {
  width: 100%; height: 52px; border-radius: 16px; border: 1.8px solid rgba(198,156,71,0.6);
  background: rgba(255,253,249,0.9); padding: 0 16px; font: 500 18px var(--f-body);
  color: var(--ink); outline: none; transition: border-color 0.3s, box-shadow 0.3s;
}
textarea.t07-input { height: 100px; padding: 12px 16px; resize: none; line-height: 1.5; }
.t07-input:focus { border-color: var(--maroon); box-shadow: 0 0 0 4px rgba(136,26,43,0.15); }
.t07-input-readonly { background: #F3EAE0 !important; cursor: not-allowed; }

.t07-opt {
  display: flex; align-items: center; gap: 12px; width: 100%; min-height: 50px;
  margin: 0 0 10px; padding: 0 16px; border-radius: 16px;
  border: 1.8px solid rgba(198,156,71,0.6); background: rgba(255,253,249,0.9);
  font: 700 18px var(--f-head); color: var(--ink); text-align: left;
}
.t07-rd {
  flex: 0 0 auto; width: 26px; height: 26px; border-radius: 50%;
  border: 2px solid rgba(198,156,71,0.6); display: grid; place-items: center;
}
.t07-rd svg { opacity: 0; transform: scale(0.4); transition: all 0.25s var(--ease); }
.t07-opt[aria-pressed="true"] {
  background: var(--maroon); border-color: var(--maroon); color: #fff;
}
.t07-opt[aria-pressed="true"] .t07-rd { background: #fff; border-color: #fff; color: var(--maroon); }
.t07-opt[aria-pressed="true"] .t07-rd svg, .t07-chip[aria-pressed="true"] .t07-rd svg { opacity: 1; transform: none; }

.t07-chips-row { display: flex; flex-wrap: wrap; gap: 8px; }
.t07-chip {
  flex: 1 1 auto; display: inline-flex; align-items: center; gap: 8px; min-height: 42px;
  padding: 0 14px 0 8px; border-radius: 24px; border: 1.6px solid rgba(198,156,71,0.6);
  background: transparent; font: 700 16px var(--f-head); color: var(--ink);
}
.t07-chip .t07-rd { width: 22px; height: 22px; }
.t07-chip[aria-pressed="true"] {
  border-color: var(--maroon); background: rgba(136,26,43,0.1);
}
.t07-chip[aria-pressed="true"] .t07-rd { background: var(--maroon); border-color: var(--maroon); color: #fff; }

.t07-send {
  display: flex; align-items: center; justify-content: center; gap: 10px;
  width: 100%; height: 54px; margin-top: 6px; border: 0; border-radius: 30px;
  background: var(--maroon); color: #fff; font: 700 18px var(--f-title);
  box-shadow: 0 14px 26px rgba(136,26,43,0.35); transition: transform 0.3s var(--ease);
}
.t07-send:hover { transform: translateY(-2px); }

/* Finale */
.t07-end {
  position: relative; text-align: center; padding: 70px 22px 140px;
  background: linear-gradient(180deg, #F5E8D2, var(--ivory) 40%); overflow: hidden;
}
.t07-end h2 {
  font: 700 clamp(36px, 7vw, 60px)/1.15 var(--f-title); color: var(--maroon); margin: 0;
}
.t07-end p {
  font: 700 13px var(--f-title); letter-spacing: 0.22em; color: var(--gold-dark);
  margin: 10px 0 0; text-transform: uppercase;
}

/* Golden Pulse Highlight for Dates section */
@keyframes t07DatesHighlight {
  0% { box-shadow: 0 0 0 0 rgba(198,156,71,0.65); }
  50% { box-shadow: 0 0 0 16px rgba(198,156,71,0); border-color: #C69C47; }
  100% { box-shadow: 0 0 0 0 rgba(198,156,71,0); }
}
.t07-dates-highlight-pulse {
  animation: t07DatesHighlight 1.6s ease-out 2;
}
`;

/* ---------- Render Function ---------- */
export default function render({ guest = {}, wedding = {}, events = [] } = {}) {
  const w = wedding || {};
  const g = guest || {};
  const assetBase = clean(w.asset_base) || './assets/';

  const storedBride = getStoredPhoto('wedding-bride-photo') || getStoredPhoto('wedding_bride_photo') || getStoredPhoto('onboard-bride-photo');
  const storedGroom = getStoredPhoto('wedding-groom-photo') || getStoredPhoto('wedding_groom_photo') || getStoredPhoto('onboard-groom-photo');
  const storedCouple = getStoredPhoto('wedding-couple-photo') || getStoredPhoto('wedding_couple_photo') || getStoredPhoto('onboard-couple-photo');
  const storedVenue = getStoredPhoto('wedding-venue-photo') || getStoredPhoto('wedding_venue_photo') || getStoredPhoto('onboard-venue-photo') || getStoredPhoto('venue_photo') || getStoredPhoto('banquet_photo');

  const rawBride = clean(w.bride_name) || 'Sanjukta';
  const rawGroom = clean(w.groom_name) || 'Purushottam';
  const brideFirst = clean(w.name_order) === 'bride_first';
  const [fName, sName] = brideFirst ? [rawBride, rawGroom] : [rawGroom, rawBride];

  const rawGuestName = clean(g.name || g.guest_name || g.family_name) || 'Respected Guest';
  const rawPersons = g.persons ?? g.guest_count ?? g.family_members ?? g.party_size ?? g.passes;
  const isExplicitPerson = g.with_family === false || String(g.category || '').toLowerCase() === 'person';
  const isExplicitFamily = g.with_family === true || String(g.category || '').toLowerCase() === 'family' || Boolean(g.is_family) || Boolean(g.family_name && !g.name) || /family/i.test(rawGuestName);

  const guestPersons = Math.max(1, parseInt(rawPersons ?? (isExplicitFamily ? 4 : 1), 10) || (isExplicitFamily ? 4 : 1));
  const hasFamily = !isExplicitPerson && (isExplicitFamily || (guestPersons > 1 && g.with_family !== false));

  const hasFamilyInName = /family/i.test(rawGuestName);
  const guestName = hasFamily && !hasFamilyInName ? `${rawGuestName} & Family` : rawGuestName;

  const guestBadgeText = hasFamily
    ? (guestPersons > 1 ? `Family Invitation · ${guestPersons} Persons` : 'Family Invitation')
    : (guestPersons > 1 ? `Personal Invitation · ${guestPersons} Persons` : 'Personal Invitation · 1 Person');

  // Invocation
  const rawInvoc = clean(w.invocation) || '|| শ্রী শ্রী প্রজাপতয়ে নমঃ ||';
  const isArabicInvoc = /[\u0600-\u06FF]/.test(rawInvoc);
  const invocSub = clean(w.invocation_sub) || 'WITH THE BLESSINGS OF ALMIGHTY & ELDERS';

  // Palace Venue
  const venueTitleText = clean(w.venue) || clean(w.venue_title) || clean(w.hall) || clean(w.banquet) || 'The Royal Heritage Banquet Palace';
  const venueAddress = clean(w.address) || clean(w.city) || '14 Palace Courtyard Road, Alipore, Kolkata — 700027';
  const venueComment = clean(w.comment && w.comment !== clean(w.venue) ? w.comment : (clean(w.venue_comment) || clean(w.note) || 'Gate No. 2 • Complimentary Royal Valet Parking Available for All Guests'));
  const mapUrl = safeUrl(w.map_url) || (venueTitleText ? esc(`https://maps.google.com/?q=${encodeURIComponent(venueTitleText + ', ' + venueAddress)}`) : '');

  // Wedding Date & Time
  const day = dparts(w.date);
  const dateStr = day ? `${pad(day.d)} ${MONTHS[day.mo - 1]} ${day.y}` : '20 – 28 November 2026';
  const timeFormatted = fmtTime(w.time) || '7:00 PM onwards';
  const dayName = day ? weekday(day) : 'Friday';
  const offset = clean(w.timezone_offset) || '+05:30';
  const whenTs = parseWhen(w.date, w.time, offset) || Date.now() + 86400000 * 7;

  // Google Calendar URL
  const calDates = whenTs ? `${new Date(whenTs).toISOString().replace(/[-:]|\.\d{3}/g, '')}/${new Date(whenTs + 4 * 3600000).toISOString().replace(/[-:]|\.\d{3}/g, '')}` : '20261128T133000Z/20261128T173000Z';
  const calUrl = esc(`https://calendar.google.com/calendar/render?${new URLSearchParams({
    action: 'TEMPLATE',
    text: `Wedding of ${fName} & ${sName}`,
    dates: calDates,
    details: `Wedding Celebrations of ${fName} & ${sName}. Venue: ${venueTitleText}, ${venueAddress}`,
    location: `${venueTitleText}, ${venueAddress}`
  })}`);

  // Parents & Copy
  const brideParents = clean(w.bride_parents);
  const groomParents = clean(w.groom_parents);
  const inviteText = clean(w.invite_text) || 'Request the pleasure of your company as they begin their sacred journey together.';
  const poem = clean(w.poem) || 'Two souls united by destiny, blessed with eternal love, walking seven sacred steps toward a lifetime of happiness.';
  const families = clean(w.families) || `The ${rawBride.split(/\s+/).pop() || 'Bride'} & ${rawGroom.split(/\s+/).pop() || 'Groom'} Families`;

  // Photos & Assets
  const heroCoupleImg = safeImg(w.couple_photo) || safeImg(w.hero_image) || safeImg(storedCouple) || `${assetBase}template-06-couple.webp`;
  const brideImg = safeImg(w.bride_photo) || safeImg(storedBride) || `${assetBase}template-06-bride.webp`;
  const groomImg = safeImg(w.groom_photo) || safeImg(storedGroom) || `${assetBase}template-06-groom.webp`;
  const venueImg = safeImg(w.venue_photo) || safeImg(storedVenue) || `${assetBase}template-06-palace.jpg`;
  const archImg = './assets/template-07-arch.webp';
  const doorClosedImg = './assets/template-07-gate-closed.webp';

  // Events
  const defaultEvents = [
    { event_name: 'Grand Reception', event_date: clean(w.date) || '2026-11-20', event_time: '19:00', venue: venueTitleText, description: 'Royal feast, musical celebration, and heartfelt blessings.' },
    { event_name: 'Gaye Holud', event_date: clean(w.date) || '2026-11-28', event_time: '10:30', venue: 'Marigold Courtyard', description: 'Traditional turmeric ceremony, alpana, laughter and music.' },
    { event_name: 'Mehdi & Sangeet', event_date: clean(w.date) || '2026-11-28', event_time: '15:30', venue: 'Gulab Mahal', description: 'Henna artistry, festive folk dance, and royal cocktails.' },
    { event_name: 'Biye / Shubho Bibaho', event_date: clean(w.date) || '2026-11-28', event_time: '20:00', venue: venueTitleText, description: 'Sacred Vedic wedding rituals, saat paak, and kanyadan vows.' }
  ];
  const evs = (Array.isArray(events) && events.length) ? events : defaultEvents;

  // Group events
  const stamp = e => parseWhen(e.event_date, e.event_time, offset) ?? (dparts(e.event_date) ? Date.UTC(dparts(e.event_date).y, dparts(e.event_date).mo - 1, dparts(e.event_date).d) : Infinity);
  const sortedEvs = [...evs].sort((a, b) => stamp(a) - stamp(b));
  const groups = [];
  sortedEvs.forEach(e => {
    const p = dparts(e.event_date);
    const key = p ? `${p.y}-${p.mo}-${p.d}` : 'tbd';
    let gGroup = groups.find(x => x.key === key);
    if (!gGroup) groups.push(gGroup = { key, p, items: [] });
    gGroup.items.push(e);
  });

  const eventsHtml = groups.map((gGroup, gi) => {
    const dayLabel = gGroup.p
      ? `Day ${ORD[gi] || gi + 1} · ${DAYS[new Date(Date.UTC(gGroup.p.y, gGroup.p.mo - 1, gGroup.p.d)).getUTCDay()]}, ${pad(gGroup.p.d)} ${MONTHS[gGroup.p.mo - 1].slice(0, 3)} ${gGroup.p.y}`
      : `Day ${ORD[gi] || gi + 1}`;
    const cards = gGroup.items.map(e => {
      const eName = clean(e.event_name || e.name || e.title || 'Celebration');
      const k = kindOf(eName);
      const eImg = safeImg(e.image) || safeImg(e.event_image) || (k.asset ? `${assetBase}${k.asset}` : '');
      const eLoc = clean(e.venue || e.address || venueTitleText);
      const eTime = fmtTime(e.event_time) || timeFormatted;
      const p = dparts(e.event_date);
      const dress = clean(e.dress_code) || k.dress;
      const color = /^#[0-9a-f]{3,8}$/i.test(clean(e.dress_color)) ? clean(e.dress_color) : k.c;
      const desc = clean(e.description || e.comment || e.note || '');

      return `
        <article class="t07-evcard">
          ${eImg ? `<div class="t07-evimg"><img src="${esc(eImg)}" alt="${esc(eName)}" loading="lazy" decoding="async"></div>` : ''}
          <div class="t07-evtop">
            ${p ? `<div class="t07-evdate"><b>${p.d}</b><small>${esc(MONTHS[p.mo - 1].slice(0, 3))}</small></div>` : ''}
            <div><h3 class="font-cinzel">${esc(eName)}</h3></div>
          </div>
          <div class="t07-evb">
            ${eTime ? `<div class="t07-meta"><b>◷</b>${esc(eTime)}</div>` : ''}
            ${eLoc ? `<div class="t07-meta"><b>⌖</b>${esc(eLoc)}</div>` : ''}
            ${desc ? `<p class="t07-desc">${esc(desc)}</p>` : ''}
            ${dress ? `<div class="t07-dress"><span class="t07-sw" style="background:${color}"></span>Attire: ${esc(dress)}</div>` : ''}
            <div style="margin-top:14px;padding-top:10px;border-top:1px solid rgba(198,156,71,0.3);display:flex;justify-content:space-between;align-items:center;font-size:12px">
              <span style="color:var(--muted)">Bless with Presence</span>
              <button type="button" data-open-rsvp style="background:none;border:none;cursor:pointer;font-weight:700;color:var(--maroon);font-family:'Cinzel',serif;font-size:11px">
                RSVP →
              </button>
            </div>
          </div>
        </article>
      `;
    }).join('');
    return `<span class="t07-day">${esc(dayLabel)}</span><div class="t07-evs">${cards}</div>`;
  }).join('');

  // Calendar Grid
  let calHtml = '';
  if (day) {
    const first = new Date(Date.UTC(day.y, day.mo - 1, 1)).getUTCDay();
    const dim = new Date(Date.UTC(day.y, day.mo, 0)).getUTCDate();
    const dots = new Set(evs.map(e => dparts(e.event_date)).filter(p => p && p.y === day.y && p.mo === day.mo).map(p => p.d));
    const head = ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(h => `<span class="t07-cal-h">${h}</span>`).join('');
    let cells = '';
    for (let i = 0; i < first; i++) cells += '<span></span>';
    for (let d = 1; d <= dim; d++) {
      cells += d === day.d
        ? `<span class="t07-cal-d t07-cal-on" aria-label="Wedding day"><b>${d}</b></span>`
        : `<span class="t07-cal-d${dots.has(d) ? ' t07-cal-dot' : ''}">${d}</span>`;
    }
    calHtml = `<div class="t07-cal-grid" role="img" aria-label="${esc(MONTHS[day.mo - 1])} ${day.y}">${head}${cells}</div>`;
  }

  // RSVP Ceremony selection chips
  const seenFns = new Set();
  const fchips = sortedEvs.filter(e => {
    const n = clean(e.event_name || e.name || 'Ceremony');
    if (seenFns.has(n)) return false;
    seenFns.add(n); return true;
  }).map(e => {
    const n = clean(e.event_name || e.name);
    return `<button type="button" class="t07-chip" data-fn="${esc(n)}" aria-pressed="true"><span class="t07-rd">${CHECK_SVG}</span><span>${esc(n)}</span></button>`;
  }).join('');

  // Story & Moments vignettes
  const storyVignettes = [heroCoupleImg, `${assetBase}template-06-jaimala.jpg`, `${assetBase}template-06-phere.jpg`];
  const galleryItems = [heroCoupleImg, brideImg, groomImg, venueImg];
  const stampEl = stampSvg(`${fName.charAt(0)}&${sName.charAt(0)}`);
  const postEl = postmark(clean(w.city) || 'Kolkata', dateStr.replace(/\s+/g, '.'));
  const FRIEZE_USE = n => `<svg viewBox="0 0 1200 190" preserveAspectRatio="xMinYMax meet" aria-hidden="true" focusable="false"><use href="#t07-fz"/></svg>`.repeat(n);
  const frieze = `<div class="t07-frieze" aria-hidden="true"><div class="t07-fz-track">${FRIEZE_USE(8)}</div></div>`;

  return `
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${FONT_HREF}" rel="stylesheet" data-t07-fonts>
<style>${STYLE}</style>

<div class="t07-root" data-template="template-07" data-when="${esc(String(whenTs))}">
  ${DEFS}
  <div class="t07-progress" aria-hidden="true"></div>

  <!-- HTML5 Canvas for Phuljhari & Fireworks (Pointer events explicitly none) -->
  <canvas id="t07FxCanvas" style="position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:995"></canvas>

  <!-- =======================================================================
       ACT I: ROYAL SLIDING DOUBLE DOORS GATE (OPENING PHYSICALLY "DHIRE DHIRE")
       Starting unlit with dark palace gates & starry sky.
       Double doors physically slide open to the sides upon tapping OPEN!
  ======================================================================== -->
  <div id="t07LightsOffOverlay" class="t07-entry t07-unlit t07-lights-off" role="dialog" aria-label="Welcome Ceremony">
    
    <!-- Physical Double Sliding Palace Doors Portal (Left & Right halves) -->
    <div class="t07-doors-portal" aria-label="Open Palace Doors">
      <div class="t07-cur t07-cl" aria-hidden="true">
        <div class="t07-door-panel t07-door-left">
          <img class="t07-door t07-door-l" src="${doorClosedImg}" alt="Left Palace Door" loading="eager" decoding="async">
        </div>
      </div>
      <div class="t07-cur t07-cr" aria-hidden="true">
        <div class="t07-door-panel t07-door-right">
          <img class="t07-door t07-door-r" src="${doorClosedImg}" alt="Right Palace Door" loading="eager" decoding="async">
        </div>
      </div>
    </div>

    <!-- Twinkling stars container in the nocturnal night sky -->
    <div id="t07StarsContainer" style="position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:4"></div>

    <!-- Center Gate Card assembly (Sits in front of closed palace doors) -->
    <div class="t07-gate-in">
      
      <!-- 1. Kicker Title -->
      <p style="font-family:'Cinzel',serif;letter-spacing:0.32em;text-transform:uppercase;color:#E5C16C;font-size:clamp(10px, 1.6vw, 13px);font-weight:700;margin:0 0 0.5rem;text-shadow:0 2px 8px rgba(0,0,0,0.8)">
        A CELEBRATION OF LOVE
      </p>

      <!-- 2. Variable Couple Names -->
      <h1 style="font-family:'Cinzel',serif;font-size:clamp(26px, 5.5vw, 44px);font-weight:800;letter-spacing:0.04em;color:#FFFDF7;line-height:1.15;margin:0 0 1rem;filter:drop-shadow(0 2px 14px rgba(198,156,71,0.5))">
        ${esc(fName)} <span style="font-family:'Cormorant Garamond',serif;font-style:italic;font-weight:400;color:#C69C47;font-size:0.85em">&amp;</span> ${esc(sName)}
      </h1>

      <!-- 3. Hanging Swaying Brass Lantern Trigger Assembly -->
      <div
        id="t07LanternTrigger"
        class="t07-lantern-wrap"
        role="button"
        tabindex="0"
        onclick="window.__t07Ignite &amp;&amp; window.__t07Ignite()"
        aria-label="Tap Lantern to Light Up &amp; Open">

        <!-- Vertical Gold Chain -->
        <div style="width:2px;height:44px;background:linear-gradient(to bottom, transparent, #C69C47, #F2DDA4)"></div>

        <!-- Swaying Lantern Assembly -->
        <div class="t07-lantern-sway" style="position:relative;display:flex;flex-direction:column;align-items:center">
          <div class="t07-lantern-halo" style="position:absolute;inset:-36px;border-radius:9999px;background:radial-gradient(circle,rgba(242,221,164,0.48) 0%,rgba(198,156,71,0.18) 48%,transparent 72%);pointer-events:none"></div>

          <!-- Ornate Brass Lantern SVG -->
          <svg style="width:100px;height:135px;filter:drop-shadow(0 0 28px rgba(242,221,164,0.85));transition:transform 0.3s" viewBox="0 0 120 160" fill="none">
            <circle cx="60" cy="12" r="6" stroke="#E5C16C" stroke-width="2.5"/>
            <path d="M44 34 C44 20, 76 20, 76 34 Z" fill="#967128" stroke="#F2DDA4" stroke-width="1.5"/>
            <rect x="38" y="34" width="44" height="7" rx="3.5" fill="#C69C47" stroke="#F2DDA4" stroke-width="1.2"/>
            <path d="M40 41 L80 41 L88 76 L76 116 L44 116 L32 76 Z" fill="url(#t07LanternFlame)" stroke="#E5C16C" stroke-width="2.5"/>
            <path d="M60 41 L60 116 M48 41 L44 76 L50 116 M72 41 L76 76 L70 116" stroke="#967128" stroke-width="1.5" opacity="0.75"/>
            <ellipse cx="60" cy="78" rx="11" ry="18" fill="#FFFDF7" opacity="0.95"/>
            <rect x="42" y="116" width="36" height="7" rx="3" fill="#C69C47" stroke="#F2DDA4" stroke-width="1.2"/>
            <path d="M48 123 L72 123 L60 144 Z" fill="#967128" stroke="#E5C16C" stroke-width="1.5"/>
            <circle cx="60" cy="148" r="3.5" fill="#F2DDA4"/>
            <defs>
              <radialGradient id="t07LanternFlame" cx="50%" cy="50%" r="55%">
                <stop offset="0%" stop-color="#FFFDF7"/>
                <stop offset="45%" stop-color="#F2DDA4"/>
                <stop offset="85%" stop-color="#C69C47"/>
                <stop offset="100%" stop-color="#881A2B"/>
              </radialGradient>
            </defs>
          </svg>
        </div>
      </div>

      <!-- 4. Guest Welcome Card -->
      <div style="background:rgba(20,4,8,0.78);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1.5px solid rgba(229,193,108,0.65);border-radius:20px;padding:0.85rem 1.75rem;margin-bottom:1.25rem;width:100%;max-width:360px;box-shadow:0 8px 30px rgba(0,0,0,0.85)">
        <p style="font-family:'Cinzel',serif;font-size:10px;font-weight:700;letter-spacing:0.25em;text-transform:uppercase;color:#F2DDA4;margin:0 0 4px">
          Cordially Invited
        </p>
        <p style="font-family:'Cormorant Garamond',serif;font-size:clamp(19px, 3.8vw, 25px);font-weight:700;color:#FFFDF7;margin:0 0 2px;letter-spacing:0.02em">
          ${esc(guestName)}
        </p>
        <p style="font-family:'Plus Jakarta Sans',sans-serif;font-size:12px;font-weight:600;color:#E5C16C;margin:0">
          ${esc(guestBadgeText)}
        </p>
      </div>

      <!-- 5. Grand "OPEN" Button -->
      <button
        type="button"
        id="t07IgniteBtn"
        class="t07-open-btn"
        onclick="window.__t07Ignite &amp;&amp; window.__t07Ignite()"
        aria-label="Open the wedding invitation"
        style="display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:0.75rem 2.75rem;border-radius:9999px;border:1.5px solid #E5C16C;background:linear-gradient(135deg, #881A2B, #63101D);color:#FFFDF7;font-family:'Cinzel',serif;font-size:14px;font-weight:700;letter-spacing:0.25em;text-transform:uppercase;box-shadow:0 8px 30px rgba(198,156,71,0.4), 0 0 20px rgba(136,26,43,0.6);cursor:pointer;outline:none">
        <span style="font-size:16px">✨</span>
        <span style="letter-spacing:0.25em">OPEN</span>
      </button>

      <!-- 6. Subtitle Prompt -->
      <p style="font-family:'Cormorant Garamond',serif;margin-top:0.75rem;font-style:italic;font-size:14.5px;color:rgba(242,221,164,0.95);letter-spacing:0.05em;text-shadow:0 1px 4px rgba(0,0,0,0.8)">
        ✦ Tap to open the invitation ✦
      </p>

      <!-- 7. Skip Intro Link -->
      <button
        type="button"
        id="t07SkipBtn"
        onclick="window.__t07Skip &amp;&amp; window.__t07Skip()"
        style="margin-top:1.25rem;background:none;border:none;cursor:pointer;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.45);text-decoration:underline;text-underline-offset:4px;padding:4px 8px">
        Skip Intro
      </button>

    </div>
  </div>

  <main>
    <!-- =====================================================================
         ACT II: HERO STAGE (2ND SCREEN)
         Grand Floral Palace Archway framing Spotlight Couple Portrait
    ====================================================================== -->
    <header class="t07-hero" data-hero>
      <!-- Top Auspicious Invocation -->
      <div style="margin-bottom:12px;text-align:center">
        <div style="width:min(200px, 45vw);margin:0 auto 6px;color:#C69C47">${LOTUS_DIVIDER_SVG}</div>
        <div class="${isArabicInvoc ? 'font-arabic' : 'font-serif'}" style="font-size:clamp(16px, 2.5vw, 22px);font-weight:600;color:#881A2B;letter-spacing:0.04em" ${isArabicInvoc ? 'dir="rtl"' : ''}>
          ${esc(rawInvoc)}
        </div>
        <p style="font-family:'Cinzel',serif;font-size:10px;font-weight:700;letter-spacing:0.28em;text-transform:uppercase;color:#967128;margin:3px 0 0">
          ${esc(invocSub)}
        </p>
      </div>

      <!-- Grand Floral & Golden Lantern Archway Centerpiece -->
      <div class="t07-hero-arch-container">
        <!-- Spotlight Couple Portrait framed inside Open Archway Portal -->
        <div class="t07-portal-couple-frame" aria-label="Couple portrait">
          <img class="t07-portal-couple-img" src="${esc(heroCoupleImg)}" alt="${esc(`${fName} & ${sName}`)}" loading="eager" decoding="async">
        </div>

        <!-- Archway Artwork Overlay -->
        <picture>
          <source srcset="${archImg}" type="image/webp">
          <img
            class="t07-hero-arch-img"
            src="./assets/template-07-arch.png"
            onerror="this.src='${archImg}'; this.onerror=null;"
            alt="Royal Floral and Golden Lantern Archway"
            loading="eager"
            decoding="async">
        </picture>
      </div>

      <!-- Hero Calligraphy & Couple Presentation -->
      <div class="t07-hero-content">
        <p style="font-family:'Cinzel',serif;font-size:clamp(10px, 1.4vw, 12px);font-weight:700;letter-spacing:0.28em;text-transform:uppercase;color:#967128;margin:0">
          The Wedding Celebration of
        </p>
        <h1 class="t07-hero-names">
          ${esc(fName)} <i>&amp;</i> ${esc(sName)}
        </h1>
        ${(brideParents || groomParents) ? `
          <p class="t07-hero-parents">
            ${brideParents ? `Daughter of ${esc(brideParents)}` : ''} ${(brideParents && groomParents) ? '•' : ''} ${groomParents ? `Son of ${esc(groomParents)}` : ''}
          </p>
        ` : ''}
        <p class="t07-hero-copy">
          ${esc(inviteText)}
        </p>

        <!-- Hero Royal Person & Family Invited Box -->
        <div class="t07-hero-guest-box">
          <span class="t07-hero-guest-sal">Cordially Invited</span>
          <h2 class="t07-hero-guest-name">${esc(guestName)}</h2>
          <span class="t07-hero-guest-pill">${esc(guestBadgeText)}</span>
        </div>
      </div>

      ${frieze}
    </header>

    <!-- =====================================================================
         SECTION 1: SACRED STORY & JOURNEY
    ====================================================================== -->
    <section data-sec="story">
      <div class="t07-wrap">
        <div class="t07-poem">
          <p>"${esc(poem)}"</p>
          <small>${esc(families)}</small>
        </div>
        <div class="t07-head">
          <div class="t07-eyebrow">A Little Bit of Forever</div>
          <h2>Our Journey</h2>
          <p>Every love story is sacred. Ours is a collection of cherished moments that brought us together.</p>
          ${LOTUS_DIVIDER_SVG}
        </div>
        ${DEFAULT_STORY.map((s, i) => `
          <article class="t07-chap ${i % 2 === 1 ? 't07-chap-rev' : ''}">
            <div class="t07-medal">
              <div><img src="${esc(storyVignettes[i] || storyVignettes[0])}" alt="${esc(s.title)}" loading="lazy" decoding="async"></div>
            </div>
            <div class="t07-chap-txt">
              <span class="t07-num" aria-hidden="true">${pad(i + 1)}</span>
              <h3>${esc(s.title)}</h3>
              <p>${esc(s.text)}</p>
            </div>
          </article>
        `).join('')}
      </div>
    </section>

    <!-- =====================================================================
         SECTION 2: SAVE THE DATE & LIVE COUNTDOWN
    ====================================================================== -->
    <section class="t07-sec-date events-section" data-sec="date" id="dates-section">
      <div class="t07-wrap">
        <div class="t07-head">
          <div class="t07-eyebrow">Mark Your Calendar</div>
          <h2>Save the Date</h2>
          ${ALPONA}
        </div>
        <div class="t07-datecard" id="datesSection">
          ${day ? `
            <div class="t07-cal-m">${esc(MONTHS[day.mo - 1])}</div>
            <div class="t07-cal-y">${day.y}</div>
            ${calHtml}
          ` : `<div class="t07-cal-m">To Be Announced</div>`}
          <p class="t07-cal-time">${esc(dayName)} · ${esc(timeFormatted)}</p>
          
          <!-- Live Countdown Timer -->
          <div class="t07-cd" role="timer">
            <div><b id="t07CdDays">--</b><small>Days</small></div>
            <div><b id="t07CdHours">--</b><small>Hours</small></div>
            <div><b id="t07CdMins">--</b><small>Min</small></div>
            <div><b id="t07CdSecs">--</b><small>Sec</small></div>
          </div>

          <div style="display:flex;justify-content:center">
            <a class="t07-btn-gcal" href="${calUrl}" target="_blank" rel="noopener noreferrer" aria-label="Save to Google Calendar">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
                <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zM7 11h5v5H7v-5z"/>
              </svg>
              <span>Save to Google Calendar</span>
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- =====================================================================
         SECTION 3: AUSPICIOUS RITUALS & CELEBRATIONS TIMELINE
    ====================================================================== -->
    <section class="t07-sec-ev" data-sec="events">
      <div class="t07-wrap">
        <div class="t07-head">
          <div class="t07-eyebrow">The Festivities</div>
          <h2>Rituals &amp; Celebrations</h2>
          <p>Sacred rituals, heartfelt laughter, music and eternal memories. We would be delighted to have you with us.</p>
          ${LOTUS_DIVIDER_SVG}
        </div>
        ${eventsHtml}
      </div>
    </section>

    <!-- =====================================================================
         SECTION 4: INTERACTIVE SCRATCH & REVEAL SURPRISE CARD
    ====================================================================== -->
    <section class="t07-sec-reveal" data-sec="reveal">
      <div class="t07-wrap">
        <div class="t07-head">
          <div class="t07-eyebrow">A Surprise For You</div>
          <h2>Special Message</h2>
          <p>A heartfelt secret blessing for you from the couple</p>
          ${ALPONA}
        </div>
        <div class="t07-scratch-card" data-scratch>
          <div class="t07-scratch-secret">
            <span style="color:#C69C47;font-size:14px;letter-spacing:6px;margin-bottom:8px">✦ ✦ ✦</span>
            <p style="font-family:'Cormorant Garamond',serif;font-style:italic;font-weight:600;font-size:clamp(16px, 3.8vw, 20px);line-height:1.55;color:#881A2B;margin:0 0 10px">
              We are truly blessed to have you in our lives. Your love and blessings mean the world to us as we begin this sacred journey together. See you at the celebration!
            </p>
            <div style="font-size:13px;color:#967128;text-transform:uppercase;letter-spacing:0.08em;font-weight:600">
              <span>With all our love &amp; reverence</span>
              <b style="display:block;font-family:'Cinzel',serif;font-size:18px;color:#2C1017;text-transform:none;margin-top:2px">${esc(`${fName} & ${sName}`)}</b>
            </div>
          </div>
          <canvas class="t07-scratch-canvas" aria-label="Scratch card"></canvas>
          <div class="t07-scratch-overlay" data-scratch-cover>
            <div style="text-align:center;padding:16px 20px">
              <span style="font-size:24px;color:#E5C16C;display:block;margin-bottom:6px">✦</span>
              <b style="font-family:'Cinzel',serif;font-size:18px;letter-spacing:0.04em">Tap or Scratch to Reveal</b>
              <small style="display:block;font-size:12px;opacity:0.85;margin-top:4px">✦ Reveal our secret blessing ✦</small>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- =====================================================================
         SECTION 5: MOMENTS OF LOVE GALLERY
    ====================================================================== -->
    <section data-sec="gallery" style="padding-top:20px">
      <div class="t07-wrap">
        <div class="t07-head" style="margin-bottom:8px">
          <div class="t07-eyebrow">Glimpses Of Us</div>
          <h2>Moments of Love</h2>
          ${LOTUS_DIVIDER_SVG}
        </div>
      </div>
      <div class="t07-flow">
        ${galleryItems.map((gImg, i) => `
          <figure data-lb="${esc(gImg)}">
            <img src="${esc(gImg)}" alt="Moment ${i + 1}" loading="lazy" decoding="async">
          </figure>
        `).join('')}
      </div>
    </section>

    <!-- =====================================================================
         SECTION 6: ROYAL PALACE VENUE & DIRECTIONS
    ====================================================================== -->
    <section class="venue-section" data-sec="venue" id="map-section">
      <div class="t07-wrap">
        <div class="t07-head">
          <div class="t07-eyebrow">Join Us</div>
          <h2>The Destination</h2>
          <p>A serene setting for a celebration close to our hearts.</p>
          ${ALPONA}
        </div>
        <div class="t07-venue-grid" id="venueSection">
          <figure class="t07-venue-photo">
            <img src="${esc(venueImg)}" alt="${esc(venueTitleText)}" loading="lazy" decoding="async">
          </figure>
          <div class="t07-vcard">
            <div class="t07-eyebrow">The Wedding Destination</div>
            <h3>${esc(venueTitleText)}</h3>
            <p>${esc(venueAddress)}<br><small style="font-style:italic;color:#881A2B">${esc(venueComment)}</small></p>
            <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:10px">
              ${mapUrl ? `<a class="t07-btn-gcal" style="margin-top:0" href="${mapUrl}" target="_blank" rel="noopener noreferrer">⌖ &nbsp;Get Directions</a>` : ''}
              <button type="button" id="t07BanquetMapBtn" class="t07-btn-gcal" style="margin-top:0;background:rgba(255,253,249,0.9);color:#881A2B !important;border:1.6px solid #C69C47;box-shadow:none">
                ✦ &nbsp;View Banquet Map
              </button>
            </div>
            <div style="display:grid;gap:8px;margin-top:18px;text-align:left;font-size:14px">
              <div style="padding:10px 14px;border-radius:14px;background:rgba(198,156,71,0.12);border:1px solid rgba(198,156,71,0.3)">
                ✈ &nbsp;<b>Travel:</b> Direct access from Airport &amp; Central Railway Station.
              </div>
              <div style="padding:10px 14px;border-radius:14px;background:rgba(198,156,71,0.12);border:1px solid rgba(198,156,71,0.3)">
                ⌂ &nbsp;<b>Stay &amp; Valet:</b> Dedicated valet parking at Gate 2 with luxury guest suites.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- =====================================================================
         SECTION 7: KINDLY RSVP SUITE & MODAL
    ====================================================================== -->
    <section class="t07-sec-rsvp" data-sec="rsvp">
      <div class="t07-wrap">
        <div class="t07-head">
          <div class="t07-eyebrow">Your Presence Is Our Present</div>
          <h2>Kindly RSVP</h2>
          <p>Please let us know if you will be celebrating with us by filling in your response below.</p>
        </div>
        <div style="display:flex;justify-content:center;margin:28px 0 10px">
          <button type="button" class="t07-rsvp-launch-btn" id="open-rsvp-modal-btn" data-open-rsvp aria-haspopup="dialog">
            <span style="font-size:28px">💌</span>
            <span style="display:flex;flex-direction:column;text-align:left">
              <span style="font-family:'Cinzel',serif;font-size:20px;font-weight:700">Respond to Invitation · RSVP</span>
              <span style="font-size:13px;color:#F2DDA4;opacity:0.9">${esc(guestName)} · Click to RSVP &amp; choose ceremonies</span>
            </span>
            <span style="font-size:20px;color:#E5C16C;margin-left:6px">➔</span>
          </button>
        </div>
      </div>

      <!-- Royal RSVP Modal Dialog -->
      <dialog id="t07-rsvp-dialog" class="t07-rsvp-modal" aria-labelledby="t07-rsvp-modal-title">
        <div class="t07-modal-card">
          <button type="button" class="t07-modal-close" id="close-t07-rsvp-modal-btn" aria-label="Close RSVP form">&times;</button>
          <div style="text-align:center;margin-bottom:20px">
            <div class="t07-eyebrow">Will You Join Us?</div>
            <h3 id="t07-rsvp-modal-title" style="font-family:'Cinzel',serif;font-size:24px;font-weight:700;color:#881A2B;margin:4px 0 6px">Kindly RSVP</h3>
            <p style="font-size:14px;color:var(--muted);margin:0">Kindly confirm your presence to help us celebrate together.</p>
          </div>
          <form class="t07-rsvp" id="t07RsvpForm" novalidate>
            ${postEl}${stampEl}

            <!-- 1. Guest Name (read-only auto-filled) -->
            <div class="t07-fld">
              <label class="t07-lab" for="t07-guest-name">Guest Name</label>
              <input class="t07-input t07-input-readonly" id="t07-guest-name" name="name" type="text" value="${esc(guestName)}" readonly disabled>
            </div>

            <!-- 2. Response Toggle -->
            <div class="t07-fld" role="group" aria-label="Your Response">
              <label class="t07-lab">Your Response</label>
              <button type="button" class="t07-opt" data-att="yes" aria-pressed="true"><span class="t07-rd">${CHECK_SVG}</span><span>Gladly Accepting</span></button>
              <button type="button" class="t07-opt" data-att="no" aria-pressed="false" style="margin-bottom:0"><span class="t07-rd">${CHECK_SVG}</span><span>Unable to Attend</span></button>
            </div>

            <!-- Conditional Details (shown when Gladly Accepting) -->
            <div id="t07AcceptDetails">
              <!-- 3. Category & Guest Count -->
              <div class="t07-fld">
                <label class="t07-lab" for="t07-category">Category</label>
                <select class="t07-input" id="t07-category" name="category">
                  <option value="Family" ${hasFamily ? 'selected' : ''}>Family Invitation</option>
                  <option value="Person" ${!hasFamily ? 'selected' : ''}>Person Invitation</option>
                </select>
              </div>

              <div class="t07-fld" id="t07GuestCountWrap">
                <label class="t07-lab" for="t07-guest-count">Number of Guests Attending</label>
                <select class="t07-input" id="t07-guest-count" name="guest_count">
                  <option value="1" ${guestPersons === 1 ? 'selected' : ''}>1 Person</option>
                  <option value="2" ${guestPersons === 2 ? 'selected' : ''}>2 Persons</option>
                  <option value="3" ${guestPersons === 3 ? 'selected' : ''}>3 Persons</option>
                  <option value="4" ${guestPersons === 4 ? 'selected' : ''}>4 Persons</option>
                  <option value="5" ${guestPersons >= 5 ? 'selected' : ''}>5 Persons</option>
                </select>
              </div>

              <!-- 4. Phone / WhatsApp -->
              <div class="t07-fld">
                <label class="t07-lab" for="t07-phone">Phone / WhatsApp</label>
                <input class="t07-input" id="t07-phone" name="phone" type="tel" placeholder="e.g. 9876543210" value="${esc(g.phone || '')}">
              </div>

              <!-- 5. Ceremony Selection Pills -->
              ${fchips ? `
                <div class="t07-fld">
                  <label class="t07-lab">Ceremonies Attending</label>
                  <div class="t07-chips-row">${fchips}</div>
                </div>
              ` : ''}

              <!-- 6. Note for Couple -->
              <div class="t07-fld">
                <label class="t07-lab" for="t07-note">Note for Couple &amp; Family (Optional)</label>
                <textarea class="t07-input" id="t07-note" name="note" placeholder="Heartfelt wishes or blessings for the couple..."></textarea>
              </div>
            </div>

            <button class="t07-send" type="submit">${WHATSAPP_SVG}<span>Save &amp; Send RSVP on WhatsApp</span></button>
            <p style="text-align:center;font-size:12px;color:var(--muted);margin:12px 0 0">WhatsApp opens with your reply pre-filled. Just press send.</p>
          </form>
        </div>
      </dialog>
    </section>

    <!-- =====================================================================
         ACT III: ROYAL FINALE
    ====================================================================== -->
    <footer class="t07-end">
      <div class="t07-eyebrow">Forever Begins</div>
      <h2>${esc(`${fName} & ${sName}`)}</h2>
      ${LOTUS_DIVIDER_SVG}
      <p>With Love &amp; Blessings</p>
      <p style="color:var(--maroon)">${esc(families)}</p>
      <p style="margin-top:14px;font-size:13px;letter-spacing:0.12em">${esc(dateStr)} • ${esc(venueAddress)}</p>
      ${frieze}
    </footer>
  </main>
</div>
`;
}

/* ---------- Mount Function ---------- */
export function mount(root, { guest = {}, wedding = {}, events = [] } = {}) {
  const doc = typeof document !== 'undefined' ? document : null;
  const win = typeof window !== 'undefined' ? window : null;
  const host = root?.querySelector ? (root.querySelector('.t07-root') || root) : root;
  if (!host) return () => {};

  const byId = id => (host.querySelector ? host.querySelector('#' + id) : null) || (doc?.getElementById ? doc.getElementById(id) : null);
  const byQuery = sel => (host.querySelector ? host.querySelector(sel) : null) || (doc?.querySelector ? doc.querySelector(sel) : null);
  const byQueryAll = sel => (host.querySelectorAll ? Array.from(host.querySelectorAll(sel)) : []) || (doc?.querySelectorAll ? Array.from(doc.querySelectorAll(sel)) : []);

  const timers = [];
  const addTimer = (fn, ms) => {
    if (!win) return null;
    const tid = win.setTimeout(fn, ms);
    timers.push(tid);
    return tid;
  };

  const listeners = [];
  const addEvt = (el, evt, fn, opt) => {
    if (el && typeof el.addEventListener === 'function') {
      el.addEventListener(evt, fn, opt);
      listeners.push(() => el.removeEventListener(evt, fn, opt));
    }
  };

  // Scroll Progress
  const progressBar = byQuery('.t07-progress');
  const onScroll = () => {
    if (!win || !doc || !progressBar) return;
    const h = doc.documentElement.scrollHeight - win.innerHeight;
    if (h > 0) {
      const p = Math.min(1, Math.max(0, win.scrollY / h));
      progressBar.style.transform = `scaleX(${p})`;
    }
  };
  addEvt(win, 'scroll', onScroll, { passive: true });

  // 1. Pyrotechnics & Web Audio Sound Synthesizer
  let audioCtx = null;
  const playCrackleSound = () => {
    if (!win) return;
    try {
      const AudioContext = win.AudioContext || win.webkitAudioContext;
      if (!AudioContext) return;
      if (!audioCtx) audioCtx = new AudioContext();
      if (audioCtx.state === 'suspended') audioCtx.resume();

      // Burst 1: Crisp sparkler sizzle
      const bufferSize = audioCtx.sampleRate * 0.45;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.28));
      }
      const whiteNoise = audioCtx.createBufferSource();
      whiteNoise.buffer = buffer;
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2800, audioCtx.currentTime);
      filter.Q.setValueAtTime(3.5, audioCtx.currentTime);
      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.28, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.45);
      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);
      whiteNoise.start();

      // Burst 2: Low ceremonial bass boom
      const osc = audioCtx.createOscillator();
      const oscGain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(36, audioCtx.currentTime + 0.55);
      oscGain.gain.setValueAtTime(0.35, audioCtx.currentTime);
      oscGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.55);
      osc.connect(oscGain);
      oscGain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.55);
    } catch { /* AudioContext requires gesture */ }
  };

  // Sparkler / Fireworks Canvas Pyrotechnics
  const canvas = byId('t07FxCanvas');
  let animId = null;
  let particles = [];
  const triggerPyrotechnics = () => {
    if (!canvas || !win) return;
    const ctx = canvas.getContext ? canvas.getContext('2d') : null;
    if (!ctx) return;

    canvas.width = win.innerWidth;
    canvas.height = win.innerHeight;
    particles = [];

    const colors = ['#FFE082', '#FFD54F', '#FFCA28', '#FFB300', '#FF8F00', '#FF5722', '#FFFFFF'];
    const originX = canvas.width / 2;
    const originY = canvas.height * 0.45;

    for (let i = 0; i < 90; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8.5 + 2.5;
      particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        radius: Math.random() * 3.5 + 1.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        decay: Math.random() * 0.018 + 0.012,
        gravity: 0.16
      });
    }

    const renderParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      for (const p of particles) {
        if (p.alpha <= 0) continue;
        alive = true;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.alpha -= p.decay;
        if (p.alpha > 0) {
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fillStyle = p.color;
          ctx.shadowBlur = 10;
          ctx.shadowColor = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
      if (alive) {
        animId = win.requestAnimationFrame(renderParticles);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
    renderParticles();
  };

  // Twinkling stars generator for Act I
  const starsContainer = byId('t07StarsContainer');
  if (starsContainer) {
    for (let i = 0; i < 40; i++) {
      const star = doc?.createElement ? doc.createElement('div') : null;
      if (star) {
        star.className = 't07-star-dot';
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        const size = Math.random() * 3.5 + 1.2;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.setProperty('--dur', `${Math.random() * 3.5 + 2}s`);
        star.style.setProperty('--delay', `${Math.random() * 3}s`);
        starsContainer.appendChild(star);
      }
    }
  }

  // =========================================================================
  // ACT I -> ACT II: ROYAL SLIDING DOUBLE DOORS OPENING ("DHIRE DHIRE")
  // =========================================================================
  let isOpened = false;
  const openDoorsSlowly = () => {
    if (isOpened) return;
    isOpened = true;

    const overlay = byId('t07LightsOffOverlay');
    if (!overlay) return;

    // 1. Lights turn on! Palace doors illuminate with radiant warmth
    overlay.classList.remove('t07-unlit');
    overlay.classList.add('t07-lit', 'is-lit');

    // 2. Sound effect & Festive Fireworks burst
    playCrackleSound();
    triggerPyrotechnics();

    // 3. Double Doors physically slide open slowly to the sides ("dhire dhire") after 600ms
    addTimer(() => {
      overlay.classList.add('t07-open', 't07-door-open');
    }, 600);

    // 4. Dispatch global event so 4-tab floating bottom dock smoothly slides up at 2.6s!
    addTimer(() => {
      if (win) {
        win.dispatchEvent(new CustomEvent('invitation-unveiled'));
        if (doc?.body) doc.body.classList.add('invitation-unveiled');
        if (typeof win.__updateRoyalDockVisibility === 'function') {
          win.__updateRoyalDockVisibility();
        }
      }
    }, 2600);

    // 5. Fade out overlay and remove after doors fully open (3.0s) so all main stage elements are clickable
    addTimer(() => {
      overlay.style.transition = 'opacity 0.6s ease';
      overlay.style.opacity = '0';
      overlay.style.pointerEvents = 'none';
      addTimer(() => {
        overlay.classList.add('t07-doors-cleared');
        overlay.style.display = 'none';
      }, 600);
    }, 3000);
  };

  // Wire ignition helpers
  if (win) {
    win.__t07Ignite = openDoorsSlowly;
    win.__t07Skip = openDoorsSlowly;
  }
  const igniteBtn = byId('t07IgniteBtn');
  const lanternTrigger = byId('t07LanternTrigger');
  const skipBtn = byId('t07SkipBtn');
  if (igniteBtn) addEvt(igniteBtn, 'click', openDoorsSlowly);
  if (lanternTrigger) addEvt(lanternTrigger, 'click', openDoorsSlowly);
  if (skipBtn) addEvt(skipBtn, 'click', openDoorsSlowly);

  const overlayEl = byId('t07LightsOffOverlay');
  if (overlayEl) {
    addEvt(overlayEl, 'click', e => {
      if (e.target.closest('#t07IgniteBtn, #t07LanternTrigger, #t07SkipBtn')) return;
      openDoorsSlowly();
    });
  }

  // 2. Live Countdown Timer
  const daysEl = byId('t07CdDays');
  const hoursEl = byId('t07CdHours');
  const minsEl = byId('t07CdMins');
  const secsEl = byId('t07CdSecs');
  const rawWhen = host.dataset ? host.dataset.when : null;
  const targetTime = Number(rawWhen) || (Date.now() + 86400000 * 7);

  const updateCountdown = () => {
    if (!daysEl || !hoursEl || !minsEl || !secsEl) return;
    const now = Date.now();
    const diff = targetTime - now;
    if (diff <= 0) {
      daysEl.textContent = '00';
      hoursEl.textContent = '00';
      minsEl.textContent = '00';
      secsEl.textContent = '00';
      return;
    }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);

    daysEl.textContent = pad(d);
    hoursEl.textContent = pad(h);
    minsEl.textContent = pad(m);
    secsEl.textContent = pad(s);
  };
  updateCountdown();
  let cdInterval = null;
  if (win) {
    cdInterval = win.setInterval(updateCountdown, 1000);
  }

  // 3. Scratch & Reveal Card
  const scratchWrap = byQuery('[data-scratch]');
  if (scratchWrap) {
    const sCanvas = scratchWrap.querySelector('canvas');
    const sCover = scratchWrap.querySelector('[data-scratch-cover]');
    if (sCanvas && win) {
      const sCtx = sCanvas.getContext ? sCanvas.getContext('2d') : null;
      let scratched = false;
      const initScratch = () => {
        const rect = scratchWrap.getBoundingClientRect();
        sCanvas.width = rect.width || 440;
        sCanvas.height = rect.height || 220;
        if (sCtx) {
          sCtx.fillStyle = '#C69C47';
          sCtx.fillRect(0, 0, sCanvas.width, sCanvas.height);
          // Gold foil pattern
          sCtx.fillStyle = 'rgba(255,255,255,0.2)';
          for (let i = 0; i < 300; i++) {
            sCtx.fillRect(Math.random() * sCanvas.width, Math.random() * sCanvas.height, 2, 2);
          }
        }
      };
      initScratch();

      const clearScratch = () => {
        if (scratched) return;
        scratched = true;
        scratchWrap.classList.add('t07-cleared');
        if (sCover) sCover.style.display = 'none';
        if (sCanvas) sCanvas.style.display = 'none';
        if (typeof window !== 'undefined' && window.RoyalScratchCracker) {
          const rect = scratchWrap.getBoundingClientRect ? scratchWrap.getBoundingClientRect() : null;
          const cx = rect ? rect.left + rect.width / 2 : null;
          const cy = rect ? rect.top + rect.height / 2 : null;
          window.RoyalScratchCracker.triggerFirecrackerCelebration(cx, cy);
        }
      };

      const scratchPoint = (x, y) => {
        if (!sCtx) return;
        scratchWrap.classList.add('t07-active');
        sCtx.globalCompositeOperation = 'destination-out';
        sCtx.beginPath();
        sCtx.arc(x, y, 28, 0, Math.PI * 2);
        sCtx.fill();
        if (typeof window !== 'undefined' && window.RoyalScratchCracker) {
          const rect = sCanvas.getBoundingClientRect ? sCanvas.getBoundingClientRect() : { left: 0, top: 0 };
          window.RoyalScratchCracker.emitPhuljhariSparks(rect.left + x, rect.top + y, 8);
        }
      };

      let isDrawing = false;
      addEvt(sCanvas, 'mousedown', e => { isDrawing = true; scratchPoint(e.offsetX, e.offsetY); });
      addEvt(sCanvas, 'mousemove', e => { if (isDrawing) scratchPoint(e.offsetX, e.offsetY); });
      addEvt(win, 'mouseup', () => { isDrawing = false; });
      addEvt(sCanvas, 'click', clearScratch);

      addEvt(sCanvas, 'touchstart', e => {
        isDrawing = true;
        const b = sCanvas.getBoundingClientRect();
        const t = e.touches[0];
        scratchPoint(t.clientX - b.left, t.clientY - b.top);
      }, { passive: true });
      addEvt(sCanvas, 'touchmove', e => {
        if (!isDrawing) return;
        const b = sCanvas.getBoundingClientRect();
        const t = e.touches[0];
        scratchPoint(t.clientX - b.left, t.clientY - b.top);
      }, { passive: true });
    }
  }

  // 4. Moments Gallery Lightbox
  const figures = byQueryAll('.t07-flow figure');
  figures.forEach(fig => {
    addEvt(fig, 'click', () => {
      const src = fig.dataset ? fig.dataset.lb : null;
      if (!src || !doc) return;
      const lb = doc.createElement('div');
      lb.className = 't07-lb';
      lb.innerHTML = `<img src="${esc(src)}" alt="Moment Zoom">`;
      doc.body.appendChild(lb);
      const closeLb = () => lb.remove();
      lb.addEventListener('click', closeLb);
    });
  });

  // 5. Royal RSVP Modal Dialog
  const rsvpDialog = byId('t07-rsvp-dialog');
  const openRsvpBtns = byQueryAll('[data-open-rsvp]');
  const closeRsvpBtn = byId('close-t07-rsvp-modal-btn');

  const openRsvp = () => {
    if (rsvpDialog) {
      if (typeof rsvpDialog.showModal === 'function') {
        try { rsvpDialog.showModal(); } catch { rsvpDialog.setAttribute('open', ''); }
      } else {
        rsvpDialog.setAttribute('open', '');
      }
    }
  };
  const closeRsvp = () => {
    if (rsvpDialog) {
      if (typeof rsvpDialog.close === 'function') {
        try { rsvpDialog.close(); } catch { rsvpDialog.removeAttribute('open'); }
      } else {
        rsvpDialog.removeAttribute('open');
      }
    }
  };

  openRsvpBtns.forEach(btn => addEvt(btn, 'click', openRsvp));
  if (closeRsvpBtn) addEvt(closeRsvpBtn, 'click', closeRsvp);
  if (rsvpDialog) {
    addEvt(rsvpDialog, 'click', e => {
      if (e.target === rsvpDialog) closeRsvp();
    });
  }

  // Attendance Toggle (Gladly Accepting / Unable to Attend)
  const attBtns = byQueryAll('.t07-opt[data-att]');
  const acceptDetails = byId('t07AcceptDetails');
  attBtns.forEach(btn => {
    addEvt(btn, 'click', () => {
      attBtns.forEach(b => b.setAttribute('aria-pressed', 'false'));
      btn.setAttribute('aria-pressed', 'true');
      const isYes = btn.dataset.att === 'yes';
      if (acceptDetails) {
        acceptDetails.style.display = isYes ? 'block' : 'none';
      }
    });
  });

  // Ceremony Pills Multi-Select
  const ceremonyChips = byQueryAll('.t07-chip');
  ceremonyChips.forEach(chip => {
    addEvt(chip, 'click', () => {
      const curr = chip.getAttribute('aria-pressed') === 'true';
      chip.setAttribute('aria-pressed', String(!curr));
    });
  });

  // Banquet Map Button
  const banquetMapBtn = byId('t07BanquetMapBtn');
  if (banquetMapBtn) {
    addEvt(banquetMapBtn, 'click', () => {
      const globalDockMap = doc?.getElementById ? doc.getElementById('royalDockMap') : null;
      if (globalDockMap) {
        globalDockMap.click();
      } else {
        const venueSec = byId('venueSection') || byId('map-section');
        if (venueSec && typeof venueSec.scrollIntoView === 'function') {
          venueSec.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  }

  // WhatsApp RSVP Form Submission
  const rsvpForm = byId('t07RsvpForm');
  if (rsvpForm) {
    addEvt(rsvpForm, 'submit', e => {
      e.preventDefault();
      const guestNameVal = clean(byId('t07-guest-name')?.value) || 'Respected Guest';
      const isAttending = byQuery('.t07-opt[data-att="yes"]')?.getAttribute('aria-pressed') === 'true';
      const category = byId('t07-category')?.value || 'Family';
      const guestCount = byId('t07-guest-count')?.value || '4';
      const phone = clean(byId('t07-phone')?.value);
      const note = clean(byId('t07-note')?.value);

      const selectedFns = byQueryAll('.t07-chip[aria-pressed="true"]').map(c => c.dataset.fn).filter(Boolean);

      let msg = `*RSVP for Wedding Celebrations*\n`;
      msg += `Guest: ${guestNameVal}\n`;
      msg += `Status: ${isAttending ? 'Gladly Accepting ✅' : 'Unable to Attend ❌'}\n`;
      if (isAttending) {
        msg += `Category: ${category}\n`;
        msg += `Guests Attending: ${guestCount}\n`;
        if (selectedFns.length) msg += `Ceremonies: ${selectedFns.join(', ')}\n`;
        if (phone) msg += `Phone: ${phone}\n`;
      }
      if (note) msg += `Note: ${note}\n`;

      const rsvpPhone = clean(wedding.rsvp_number || wedding.phone || wedding.whatsapp) || '919477929927';
      const digits = rsvpPhone.replace(/\D/g, '') || '919477929927';
      const waNumber = digits.length === 10 ? `91${digits}` : digits;

      const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`;
      if (win) win.open(waUrl, '_blank');
      closeRsvp();
    });
  }

  // Cleanup
  return () => {
    timers.forEach(t => win && win.clearTimeout(t));
    if (cdInterval && win) win.clearInterval(cdInterval);
    if (animId && win) win.cancelAnimationFrame(animId);
    listeners.forEach(f => f());
    if (win) {
      delete win.__t07Ignite;
      delete win.__t07Skip;
    }
  };
}
