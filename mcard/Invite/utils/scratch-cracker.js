/**
 * ============================================================================
 * scratch-cracker.js — Realtime Phuljhari (Sparkler) & Firecracker Engine
 * ============================================================================
 * Features:
 * - Realtime dynamic Phuljhari sparks emitting from the scratch position as you scratch
 * - Synthesized Web Audio API sparkler crackle & firecracker burst sound (100% offline)
 * - Celebratory firecracker & fireworks shell bursts upon scratch card reveal
 * - Universal auto-attachment across all invitation templates
 * - Highly optimized 60fps canvas particle system with auto-sleeping animation loop
 * ============================================================================
 */

let canvas = null;
let ctx = null;
let animId = null;
let particles = [];
let rockets = [];
let audioCtx = null;
let lastCrackleTime = 0;

/**
 * Ensure the full-screen transparent overlay canvas exists
 */
function getOverlayCanvas() {
  if (typeof document === 'undefined') return null;
  if (!canvas || !canvas.isConnected) {
    canvas = document.querySelector('.royal-scratch-cracker-canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.className = 'royal-scratch-cracker-canvas';
      canvas.setAttribute('aria-hidden', 'true');
      canvas.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:99999;mix-blend-mode:screen;';
      document.body.appendChild(canvas);
    }
    ctx = canvas.getContext('2d');
    resizeCanvas();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', resizeCanvas, { passive: true });
    }
  }
  return canvas;
}

function resizeCanvas() {
  if (!canvas) return;
  const win = typeof window !== 'undefined' ? window : null;
  const dpr = Math.min((win && win.devicePixelRatio) || 1, 2);
  const w = (win && win.innerWidth) || (document.documentElement && document.documentElement.clientWidth) || 400;
  const h = (win && win.innerHeight) || (document.documentElement && document.documentElement.clientHeight) || 800;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  if (ctx && ctx.scale) {
    // Reset transform & scale to DPR
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
}

/**
 * Synthesize sparkler crackle / firecracker burst sounds via Web Audio API
 */
function getAudioContext() {
  try {
    const win = typeof window !== 'undefined' ? window : null;
    if (!win) return null;
    const AudioContextClass = win.AudioContext || win.webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioCtx) audioCtx = new AudioContextClass();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch (_) {
    return null;
  }
}

export function playPhuljhariCrackle() {
  const now = Date.now();
  if (now - lastCrackleTime < 55) return; // Throttle to prevent audio buffer saturation
  lastCrackleTime = now;

  const actx = getAudioContext();
  if (!actx) return;

  try {
    const bufferSize = Math.floor(actx.sampleRate * 0.08); // 80ms micro-burst
    const buffer = actx.createBuffer(1, bufferSize, actx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      // Crackling impulses mimicking burning iron / magnesium sparkler filings
      data[i] = Math.random() < 0.12 ? (Math.random() * 2 - 1) * 0.35 : (Math.random() * 2 - 1) * 0.02;
    }
    const noise = actx.createBufferSource();
    noise.buffer = buffer;

    const filter = actx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(3600 + (Math.random() * 1200 - 600), actx.currentTime);
    filter.Q.value = 2.2;

    const gain = actx.createGain();
    gain.gain.setValueAtTime(0.08, actx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.078);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(actx.destination);
    noise.start();
  } catch (_) {}
}

export function playFirecrackerBurstSound() {
  const actx = getAudioContext();
  if (!actx) return;

  try {
    // 1. Cracker boom pop
    const dur = 0.5;
    const bufferSize = Math.floor(actx.sampleRate * dur);
    const buffer = actx.createBuffer(1, bufferSize, actx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const decay = Math.exp(-i / (actx.sampleRate * 0.08));
      data[i] = (Math.random() * 2 - 1) * decay;
    }
    const noise = actx.createBufferSource();
    noise.buffer = buffer;

    const filter = actx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, actx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, actx.currentTime + dur);

    const gain = actx.createGain();
    gain.gain.setValueAtTime(0.25, actx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(actx.destination);
    noise.start();

    // 2. High golden sparkle chime
    const osc = actx.createOscillator();
    const oscGain = actx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, actx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1760, actx.currentTime + 0.35);
    oscGain.gain.setValueAtTime(0.09, actx.currentTime);
    oscGain.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.6);
    osc.connect(oscGain);
    oscGain.connect(actx.destination);
    osc.start();
    osc.stop(actx.currentTime + 0.65);
  } catch (_) {}
}

/**
 * Emit bright Phuljhari sparks at (clientX, clientY)
 */
export function emitPhuljhariSparks(clientX, clientY, count = 7, options = {}) {
  getOverlayCanvas();
  playPhuljhariCrackle();

  const colors = options.colors || [
    '#ffffff', '#fff9d6', '#ffe082', '#ffd54f', '#ffb300', '#ff9100', '#ff5722'
  ];

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2.5 + Math.random() * 5.5;
    const color = colors[Math.floor(Math.random() * colors.length)];
    particles.push({
      x: clientX + (Math.random() * 6 - 3),
      y: clientY + (Math.random() * 6 - 3),
      prevX: clientX,
      prevY: clientY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - (1.2 + Math.random() * 2), // upward bias
      color,
      size: 1.5 + Math.random() * 2.2,
      life: 1.0,
      decay: 0.025 + Math.random() * 0.035,
      gravity: 0.18,
      drag: 0.94,
      isSparkler: true
    });
  }

  ensureAnimationLoop();
}

/**
 * Trigger full celebratory firecracker & fireworks burst
 */
export function triggerFirecrackerCelebration(originX, originY) {
  getOverlayCanvas();
  playFirecrackerBurstSound();

  const win = typeof window !== 'undefined' ? window : null;
  const screenW = (win && win.innerWidth) || 400;
  const screenH = (win && win.innerHeight) || 700;

  const cx = originX != null ? originX : screenW / 2;
  const cy = originY != null ? originY : screenH * 0.45;

  const palettes = [
    ['#ffd700', '#ffeb3b', '#fff9c4', '#ffffff'], // Royal Gold
    ['#ff1744', '#ff5252', '#ff8a80', '#ffffff'], // Crimson Ruby
    ['#00e5ff', '#18ffff', '#84ffff', '#ffffff'], // Cyan Sapphire
    ['#76ff03', '#b2ff59', '#ccff90', '#ffffff'], // Emerald
    ['#e040fb', '#ea80fc', '#ffd700', '#ffffff']  // Royal Violet
  ];

  // 1. Immediate radial shell explosion (80-120 multi-color stars)
  const starCount = 90;
  const pal = palettes[Math.floor(Math.random() * palettes.length)];
  for (let i = 0; i < starCount; i++) {
    const angle = (i / starCount) * Math.PI * 2 + (Math.random() * 0.2 - 0.1);
    const speed = 3 + Math.random() * 8.5;
    const color = pal[Math.floor(Math.random() * pal.length)];
    particles.push({
      x: cx,
      y: cy,
      prevX: cx,
      prevY: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color,
      size: 2 + Math.random() * 2.5,
      life: 1.0,
      decay: 0.016 + Math.random() * 0.02,
      gravity: 0.14,
      drag: 0.96,
      twinkle: Math.random() < 0.4,
      isShell: true
    });
  }

  // 2. Twin rising rockets from bottom left & right that burst after 400ms
  [cx - 80, cx + 80].forEach((rx, idx) => {
    rockets.push({
      x: Math.max(20, Math.min(screenW - 20, rx)),
      y: Math.min(screenH - 40, cy + 180),
      targetY: cy - (20 + Math.random() * 60),
      vx: (Math.random() - 0.5) * 1.5,
      vy: -(11 + Math.random() * 3),
      color: pal[idx % pal.length],
      burstPalette: palettes[(idx + 1) % palettes.length]
    });
  });

  // 3. Dense golden phuljhari fountains around the card perimeter
  for (let s = 0; s < 50; s++) {
    const px = cx + (Math.random() * 160 - 80);
    const py = cy + (Math.random() * 60 - 30);
    const angle = -Math.PI / 2 + (Math.random() * 1.4 - 0.7);
    const speed = 4 + Math.random() * 7;
    particles.push({
      x: px,
      y: py,
      prevX: px,
      prevY: py,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: '#ffd54f',
      size: 1.8 + Math.random() * 2,
      life: 1.0,
      decay: 0.03 + Math.random() * 0.03,
      gravity: 0.22,
      drag: 0.95,
      isSparkler: true
    });
  }

  ensureAnimationLoop();
}

function ensureAnimationLoop() {
  if (animId) return;
  if (typeof requestAnimationFrame !== 'function') return;

  function loop() {
    if (!ctx || !canvas) {
      animId = null;
      return;
    }

    const win = typeof window !== 'undefined' ? window : null;
    const w = (win && win.innerWidth) || 400;
    const h = (win && win.innerHeight) || 800;

    if (ctx.clearRect) {
      ctx.clearRect(0, 0, w, h);
    }
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';

    // 1. Update & draw rising rockets
    rockets = rockets.filter(r => {
      r.x += r.vx;
      r.y += r.vy;
      r.vy += 0.16; // gravity slowing rocket ascent

      // Emit rocket trail phuljhari sparks
      for (let i = 0; i < 2; i++) {
        particles.push({
          x: r.x + (Math.random() * 3 - 1.5),
          y: r.y + (Math.random() * 3 - 1.5),
          prevX: r.x,
          prevY: r.y,
          vx: (Math.random() - 0.5) * 1.8,
          vy: 2 + Math.random() * 3,
          color: '#ffe082',
          size: 1.5,
          life: 0.7,
          decay: 0.06,
          gravity: 0.1,
          drag: 0.96,
          isSparkler: true
        });
      }

      if (ctx.beginPath && ctx.arc && ctx.fill) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(r.x, r.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      if (r.y <= r.targetY || r.vy >= 0) {
        // Rocket explodes into starburst
        playFirecrackerBurstSound();
        const bPal = r.burstPalette || ['#ffd700', '#ffffff'];
        const numStars = 60;
        for (let i = 0; i < numStars; i++) {
          const an = (i / numStars) * Math.PI * 2 + (Math.random() * 0.2 - 0.1);
          const sp = 2.5 + Math.random() * 6.5;
          particles.push({
            x: r.x,
            y: r.y,
            prevX: r.x,
            prevY: r.y,
            vx: Math.cos(an) * sp,
            vy: Math.sin(an) * sp,
            color: bPal[Math.floor(Math.random() * bPal.length)],
            size: 2 + Math.random() * 2,
            life: 1.0,
            decay: 0.02 + Math.random() * 0.025,
            gravity: 0.15,
            drag: 0.95,
            twinkle: true,
            isShell: true
          });
        }
        return false;
      }
      return true;
    });

    // 2. Update & draw sparks / stars
    particles = particles.filter(p => {
      p.prevX = p.x;
      p.prevY = p.y;
      p.vx *= p.drag;
      p.vy = p.vy * p.drag + p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;

      if (p.life <= 0) return false;

      const alpha = Math.max(0, Math.min(1, p.life * (p.twinkle && Math.random() < 0.35 ? 0.4 : 1)));
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = p.size;

      if (ctx.beginPath && ctx.moveTo && ctx.lineTo && ctx.stroke) {
        ctx.beginPath();
        ctx.moveTo(p.prevX, p.prevY);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }

      return true;
    });

    if (particles.length > 0 || rockets.length > 0) {
      animId = requestAnimationFrame(loop);
    } else {
      animId = null;
      if (ctx.clearRect) ctx.clearRect(0, 0, w, h);
    }
  }

  animId = requestAnimationFrame(loop);
}

/**
 * Universal scratch card detector and cracker/phuljhari attacher
 * Automatically scans any root element and wires up real-time phuljhari and reveal firecrackers.
 */
export function initUniversalScratchCracker(root = (typeof document !== 'undefined' ? document : null)) {
  if (!root || typeof root.querySelectorAll !== 'function') return () => {};

  const cleanups = [];
  const handled = new WeakSet();

  function attachToCanvas(scratchCanvas) {
    if (!scratchCanvas || handled.has(scratchCanvas)) return;
    handled.add(scratchCanvas);

    let isScratching = false;
    let hasBurstCelebration = false;

    function getCoords(e) {
      if (!scratchCanvas.getBoundingClientRect) return { x: 0, y: 0 };
      const touch = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]);
      const clientX = touch ? touch.clientX : e.clientX;
      const clientY = touch ? touch.clientY : e.clientY;
      return { x: clientX, y: clientY };
    }

    function onStart(e) {
      isScratching = true;
      const { x, y } = getCoords(e);
      emitPhuljhariSparks(x, y, 9);
    }

    function onMove(e) {
      if (!isScratching) return;
      const { x, y } = getCoords(e);
      emitPhuljhariSparks(x, y, 7);
    }

    function onEnd() {
      isScratching = false;
    }

    function checkRevealed() {
      if (hasBurstCelebration) return;
      const rect = scratchCanvas.getBoundingClientRect ? scratchCanvas.getBoundingClientRect() : null;
      const cx = rect ? rect.left + rect.width / 2 : null;
      const cy = rect ? rect.top + rect.height / 2 : null;

      const isHidden = (scratchCanvas.style && (scratchCanvas.style.display === 'none' || scratchCanvas.style.opacity === '0'))
        || scratchCanvas.classList.contains('revealed')
        || scratchCanvas.classList.contains('t9-cleared')
        || scratchCanvas.classList.contains('t07-cleared')
        || (scratchCanvas.parentElement && (
          scratchCanvas.parentElement.classList.contains('revealed') ||
          scratchCanvas.parentElement.classList.contains('t9-cleared') ||
          scratchCanvas.parentElement.classList.contains('t07-cleared')
        ));

      if (isHidden) {
        hasBurstCelebration = true;
        triggerFirecrackerCelebration(cx, cy);
      }
    }

    // Touch & pointer events for smooth mobile and desktop scratching
    scratchCanvas.addEventListener('mousedown', onStart);
    scratchCanvas.addEventListener('mousemove', onMove);
    const win = typeof window !== 'undefined' ? window : null;
    if (win) {
      win.addEventListener('mouseup', onEnd);
    }

    scratchCanvas.addEventListener('touchstart', onStart, { passive: true });
    scratchCanvas.addEventListener('touchmove', onMove, { passive: true });
    scratchCanvas.addEventListener('touchend', onEnd, { passive: true });
    scratchCanvas.addEventListener('touchcancel', onEnd, { passive: true });

    // MutationObserver to detect when template code hides or marks canvas as revealed
    let observer = null;
    if (typeof MutationObserver !== 'undefined') {
      observer = new MutationObserver(checkRevealed);
      observer.observe(scratchCanvas, { attributes: true, attributeFilter: ['class', 'style'] });
      if (scratchCanvas.parentElement) {
        observer.observe(scratchCanvas.parentElement, { attributes: true, attributeFilter: ['class', 'style'] });
      }
    }

    // Also poll check for canvas changes during user interaction
    const pollId = setInterval(checkRevealed, 300);

    cleanups.push(() => {
      scratchCanvas.removeEventListener('mousedown', onStart);
      scratchCanvas.removeEventListener('mousemove', onMove);
      if (win) {
        win.removeEventListener('mouseup', onEnd);
      }
      scratchCanvas.removeEventListener('touchstart', onStart);
      scratchCanvas.removeEventListener('touchmove', onMove);
      scratchCanvas.removeEventListener('touchend', onEnd);
      scratchCanvas.removeEventListener('touchcancel', onEnd);
      if (observer) observer.disconnect();
      clearInterval(pollId);
    });
  }

  // Scan for scratch canvases
  const selector = [
    'canvas.t9-scratch-canvas',
    'canvas.t07-scratch-canvas',
    'canvas.t11-scratch-canvas',
    'canvas.t12-scratch-canvas',
    'canvas.t13-scratch-canvas',
    'canvas.t14-scratch-canvas',
    '.t04-scratch-box canvas',
    '.t05-scratch canvas',
    'canvas[id*="scratch"]',
    'canvas[class*="scratch"]',
    'canvas[aria-label*="Scratch" i]'
  ].join(',');

  const canvases = Array.from(root.querySelectorAll(selector) || []);
  canvases.forEach(attachToCanvas);

  // Also hook into any fallback "Reveal Date" / "Scratch Now" buttons
  const btnSelector = '[data-reveal], [id*="scratch-btn"], [id*="scratch-fallback"], .t05-sbtn, .t13-scratch-fallback-btn';
  const buttons = Array.from(root.querySelectorAll(btnSelector) || []);
  buttons.forEach(btn => {
    const onClick = () => {
      const rect = btn.getBoundingClientRect ? btn.getBoundingClientRect() : null;
      const cx = rect ? rect.left + rect.width / 2 : null;
      const cy = rect ? rect.top + rect.height / 2 : null;
      triggerFirecrackerCelebration(cx, cy);
    };
    btn.addEventListener('click', onClick);
    cleanups.push(() => btn.removeEventListener('click', onClick));
  });

  return function cleanup() {
    cleanups.forEach(fn => fn());
  };
}

if (typeof window !== 'undefined') {
  window.RoyalScratchCracker = {
    emitPhuljhariSparks,
    playPhuljhariCrackle,
    playFirecrackerBurstSound,
    triggerFirecrackerCelebration,
    initUniversalScratchCracker
  };
}
