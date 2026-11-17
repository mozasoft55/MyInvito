import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { computeStats, buildGuestStates } from '../dashboard/rsvp-stats.js';
import { AudioController } from '../token-engine/AudioController.js';

class MockSessionStorage {
  constructor() {
    this.store = new Map();
  }
  getItem(key) {
    return this.store.get(key) || null;
  }
  setItem(key, value) {
    this.store.set(key, String(value));
  }
  removeItem(key) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}

test('Music Auto-Resume Bug Fix: Music does not auto-resume once muted by user', () => {
  const indexHtml = fs.readFileSync('index.html', 'utf8');

  // Verify sessionStorage user mute persistence exists in index.html
  assert.ok(indexHtml.includes('guest_music_muted'), 'index.html must check and set guest_music_muted');
  assert.ok(indexHtml.includes('isUserMuted'), 'index.html must maintain isUserMuted variable');

  // Verify startMusic guards against playback when isUserMuted is true
  assert.ok(
    /function startMusic\s*\(\s*force\s*=\s*false\s*\)\s*\{[^}]*isUserMuted/.test(indexHtml),
    'startMusic must guard against playback when isUserMuted'
  );

  // Verify unveilInvitation checks !isUserMuted before starting music
  assert.ok(
    /function unveilInvitation\(\)\s*\{[\s\S]*?!isMusicPlaying\s*&&\s*!isUserMuted/.test(indexHtml),
    'unveilInvitation must check !isUserMuted before startMusic'
  );

  // Verify handleAudioTabShow checks !isUserMuted before restoring playback
  assert.ok(
    /function handleAudioTabShow\(\)\s*\{[\s\S]*?!isUserMuted/.test(indexHtml),
    'handleAudioTabShow must check !isUserMuted before startMusic'
  );

  // Verify btnMusic click toggles isUserMuted and sessionStorage
  assert.ok(
    indexHtml.includes("sessionStorage.setItem('guest_music_muted', 'true')"),
    'btnMusic must set guest_music_muted on pause'
  );
  assert.ok(
    indexHtml.includes("sessionStorage.removeItem('guest_music_muted')"),
    'btnMusic must remove guest_music_muted on manual play'
  );
});

test('AudioController respects isUserMuted and does not auto-resume on window focus', async () => {
  global.sessionStorage = new MockSessionStorage();
  sessionStorage.setItem('guest_music_muted', 'true');

  const controller = new AudioController({
    audioSrc: './invitation.mp3',
    autoRender: false
  });

  assert.equal(controller.isUserMuted, true, 'Controller must initialize isUserMuted from sessionStorage');

  // Attempting unforced play must return false
  const played = await controller.play(false);
  assert.equal(played, false, 'play(false) must not play when muted');
  assert.equal(controller.isPlaying, false);

  // Focus event must NOT resume playback
  controller._wasPlayingBeforeHide = true;
  controller._handleWindowFocus();
  assert.equal(controller.isPlaying, false, 'Window focus must not resume music when isUserMuted');

  // User explicitly clicks unmute (toggle)
  controller.isUserMuted = false;
  sessionStorage.removeItem('guest_music_muted');
  assert.equal(sessionStorage.getItem('guest_music_muted'), null);

  controller.destroy();
  delete global.sessionStorage;
});

test('Personal Invite Edit Count Bug Fix: Editing Personal Invitation from 1 to 3 updates dashboard count and state', () => {
  const initialGuests = [
    {
      id: 'g-101',
      guest_name: 'Rahul Sharma',
      family_members: 1,
      persons: 1,
      phone: '9876543210',
      category: 'Person',
      city_address: 'Kolkata',
      with_family: false,
      invite_code: 'RAHUL01'
    },
    {
      id: 'g-102',
      guest_name: 'Priya Sen',
      family_members: 1,
      persons: 1,
      phone: '9876543211',
      category: 'Person',
      city_address: 'Howrah',
      with_family: false,
      invite_code: 'PRIYA01'
    }
  ];

  // 1. Initial computeStats with 2 single guests
  const initialStats = computeStats({ guests: initialGuests });
  assert.equal(initialStats.invitations, 2);
  assert.equal(initialStats.invitedPeople, 2);
  assert.equal(initialStats.totalPersonal, 2);
  assert.equal(initialStats.totalFamilies, 0);

  // 2. Simulate editing Rahul Sharma from 1 to 3 guests under a Personal Invite
  const updatedGuests = [...initialGuests];
  const editIndex = updatedGuests.findIndex(g => g.id === 'g-101');
  assert.ok(editIndex !== -1);

  const editedPeopleCount = 3;
  updatedGuests[editIndex] = {
    ...updatedGuests[editIndex],
    family_members: editedPeopleCount,
    persons: editedPeopleCount,
    with_family: false, // remains Personal invite
    category: 'Person',
    _userEdited: true
  };

  const updatedStats = computeStats({ guests: updatedGuests });

  // Verify updated count in stats
  assert.equal(updatedStats.invitations, 2);
  assert.equal(updatedStats.invitedPeople, 4, 'Invited people must increase from 2 to 4 (1 + 3)');
  assert.equal(updatedStats.totalPersonal, 2, 'Must remain 2 Personal Invites');
  assert.equal(updatedStats.personalSeats, 4, 'Total personal seats must be 4');
  assert.equal(updatedStats.totalFamilies, 0);

  // Verify guest state row
  const rahulState = updatedStats.states.find(s => s.guest.id === 'g-101');
  assert.equal(rahulState.invitedPeople, 3, 'Rahul state must reflect 3 invited people');
  assert.equal(rahulState.isFamily, false, 'Rahul state must remain Personal invite');
});

test('Family Invitation Button & Counting: Family Invitations count separately by Family instead of individual person', () => {
  const mixedGuests = [
    {
      id: 'g-201',
      guest_name: 'Gupta Family',
      family_members: 4,
      persons: 4,
      category: 'Family',
      with_family: true,
      invite_code: 'GUPTA01',
      rsvp_status_manual: 'attending'
    },
    {
      id: 'g-202',
      guest_name: 'Khan Family',
      family_members: 5,
      persons: 5,
      category: 'Family',
      with_family: true,
      invite_code: 'KHAN01',
      rsvp_status_manual: 'maybe'
    },
    {
      id: 'g-203',
      guest_name: 'Amit Verma',
      family_members: 1,
      persons: 1,
      category: 'Person',
      with_family: false,
      invite_code: 'AMIT01',
      rsvp_status_manual: 'attending'
    }
  ];

  const stats = computeStats({ guests: mixedGuests, goal: 20 });

  // Separate Family counting metrics
  assert.equal(stats.totalFamilies, 2, 'Must count 2 distinct Family Invitations');
  assert.equal(stats.confirmedFamilies, 1, 'Gupta Family is confirmed attending');
  assert.equal(stats.tentativeFamilies, 1, 'Khan Family is tentative (maybe)');
  assert.equal(stats.familySeats, 9, 'Total family headcount is 4 + 5 = 9');
  assert.equal(stats.familySeatsAttending, 4, 'Gupta Family has 4 attending seats');

  // Separate Personal counting metrics
  assert.equal(stats.totalPersonal, 1, 'Must count 1 Personal Invite');
  assert.equal(stats.confirmedPersonal, 1, 'Amit Verma is confirmed attending');
  assert.equal(stats.personalSeats, 1, 'Personal seats is 1');

  // Total summary checks
  assert.equal(stats.invitations, 3, 'Total invitations is 3 (2 families + 1 personal)');
  assert.equal(stats.invitedPeople, 10, 'Total headcount is 4 + 5 + 1 = 10');
  assert.equal(stats.people.attending, 5, '5 people attending (4 family + 1 personal)');
});

test('Dashboard HTML contains separate buttons for Personal and Family invitations', () => {
  const dashHtml = fs.readFileSync('dashboard/index.html', 'utf8');

  // Check buttons in guest list header
  assert.ok(dashHtml.includes('id="open-add-personal"'), 'Must have button to add personal invite');
  assert.ok(dashHtml.includes('id="open-add-family"'), 'Must have button to add family invitation');
  assert.ok(dashHtml.includes('Personal Invite'), 'Button text must indicate Personal Invite');
  assert.ok(dashHtml.includes('Family Invitation'), 'Button text must indicate Family Invitation');

  // Check invitation type selector inside guest modal
  assert.ok(dashHtml.includes('name="invite_type"'), 'Modal must have invite_type selector');
  assert.ok(dashHtml.includes('value="personal"'), 'Modal must have personal option');
  assert.ok(dashHtml.includes('value="family"'), 'Modal must have family option');
});

test('guest-list.html supports Family vs Personal invitation selection with appropriate member counts', () => {
  const guestListHtml = fs.readFileSync('guest-list.html', 'utf8');

  assert.ok(guestListHtml.includes('id="guest-type"'), 'guest-list.html must have guest-type selector');
  assert.ok(guestListHtml.includes('value="family"'), 'guest-list.html must have family option');
  assert.ok(guestListHtml.includes('value="personal"'), 'guest-list.html must have personal option');
  assert.ok(!guestListHtml.includes('family_members: 1,\n        category: \'Family\''), 'Must not hardcode family_members to 1 for families');
});

test('Mobile Dashboard Optimization: Filter pills single-line horizontal scroll, side-by-side top buttons, and compact guest cards', () => {
  const css = fs.readFileSync('dashboard/style.css', 'utf8');
  const appJs = fs.readFileSync('dashboard/app.js', 'utf8');

  // 1. Filter pills: single-line horizontal scrollable bar
  assert.ok(css.includes('.chips{display:flex;flex-wrap:nowrap;overflow-x:auto'), 'Chips must be flex nowrap and overflow-x: auto on mobile');
  assert.ok(css.includes('.chips::-webkit-scrollbar{display:none}'), 'Scrollbar must be hidden on mobile chips');
  assert.ok(css.includes('.chip{flex-shrink:0;white-space:nowrap}'), 'Chips must not shrink or wrap on mobile');

  // 2. Top buttons & copy: side-by-side buttons and hidden scroll table hint
  assert.ok(css.includes('.scroll-table-hint{display:none!important}'), 'Scroll table hint must be hidden on mobile');
  assert.ok(appJs.includes('<span class="scroll-table-hint"> · Scroll table to view all</span>'), 'app.js must wrap scroll hint in class');
  assert.ok(css.includes('.head-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;width:100%}'), 'Head actions must be 2-column grid on mobile');
  assert.ok(css.includes('.head-actions #open-add-family{grid-column:1;grid-row:1'), '+ Family Invitation must be on row 1 col 1');
  assert.ok(css.includes('.head-actions #open-add-personal{grid-column:2;grid-row:1'), '+ Personal Invite must be on row 1 col 2 side-by-side');

  // 3. Guest cards: Name & Number top-left, Status top-right, Phone + People count middle, WhatsApp + ... menu bottom
  assert.ok(css.includes('grid-template-areas:"topleft topright" "middle middle" "actions actions"'), 'Guest cards must use grid layout with designated zones');
  assert.ok(css.includes('.guest-table td.g-name{grid-area:topleft'), 'g-name must map to topleft');
  assert.ok(css.includes('.guest-table td.g-status{grid-area:topright'), 'g-status must map to topright');
  assert.ok(css.includes('.guest-table td.g-people{grid-area:middle'), 'g-people must map to middle');
  assert.ok(css.includes('.guest-table td.g-actions{grid-area:actions'), 'g-actions must map to bottom actions');
  assert.ok(css.includes('.guest-table td.g-idx{display:none!important}'), 'Desktop index column must be hidden on mobile');

  // 4. Verify app.js markup structure for guestRow
  assert.ok(appJs.includes('g-card-top-left'), 'app.js must include g-card-top-left');
  assert.ok(appJs.includes('g-card-num'), 'app.js must include g-card-num');
  assert.ok(appJs.includes('g-status-wrap'), 'app.js must include g-status-wrap');
  assert.ok(appJs.includes('g-mobile-mid'), 'app.js must include g-mobile-mid');
  assert.ok(appJs.includes('g-mid-phone'), 'app.js must include g-mid-phone');
  assert.ok(appJs.includes('g-mid-people'), 'app.js must include g-mid-people');
});
