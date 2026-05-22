// === SCROLL PROGRESS BAR ===
function computeScrollPercent(scrollY, maxScroll) {
  return (Math.min(scrollY, maxScroll) / maxScroll) * 100;
}

window.addEventListener('scroll', () => {
  const bar = document.getElementById('scroll-progress');
  if (!bar) return;
  const maxScroll = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  if (maxScroll > 0) {
    bar.style.width = computeScrollPercent(window.scrollY, maxScroll) + '%';
  }
});

// === BACK TO TOP ===
function computeBackToTopVisibility(scrollY) {
  return scrollY > 400;
}

const backToTopBtn = document.getElementById('back-to-top');

if (backToTopBtn) {
  window.addEventListener('scroll', () => {
    if (computeBackToTopVisibility(window.scrollY)) {
      backToTopBtn.classList.add('visible');
    } else {
      backToTopBtn.classList.remove('visible');
    }
  });

  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// === TYPING ANIMATION ===
let typingSession = 0;

function simulateTypingCycle(roles) {
  return roles.slice();
}

function initTypingAnimator(roles, typeSpeed, deleteSpeed, pauseMs) {
  const el = document.getElementById('typing-text');
  if (!el || !roles || roles.length === 0) return;

  const session = ++typingSession;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    el.textContent = roles[0];
    return;
  }

  let currentRoleIndex = 0;
  let currentCharIndex = 0;
  let isDeleting = false;

  function tick() {
    if (session !== typingSession) return;

    const currentRole = roles[currentRoleIndex];

    if (!isDeleting) {
      currentCharIndex++;
      el.textContent = currentRole.slice(0, currentCharIndex);

      if (currentCharIndex === currentRole.length) {
        isDeleting = true;
        setTimeout(tick, pauseMs);
        return;
      }
      setTimeout(tick, typeSpeed);
    } else {
      currentCharIndex--;
      el.textContent = currentRole.slice(0, currentCharIndex);

      if (currentCharIndex === 0) {
        isDeleting = false;
        currentRoleIndex = (currentRoleIndex + 1) % roles.length;
        setTimeout(tick, typeSpeed);
        return;
      }
      setTimeout(tick, deleteSpeed);
    }
  }

  setTimeout(tick, pauseMs);
}

// === FADE-IN ON SCROLL ===
let fadeObserver = null;

function initFadeIn() {
  if (fadeObserver) fadeObserver.disconnect();
  fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.1 });
  document.querySelectorAll('.fade-in').forEach(el => fadeObserver.observe(el));
}

// === DARK MODE ===
const html = document.documentElement;

function setTheme(dark) {
  html.setAttribute('data-theme', dark ? 'dark' : 'light');
  localStorage.setItem('theme', dark ? 'dark' : 'light');

  const sun = document.getElementById('icon-sun');
  const moon = document.getElementById('icon-moon');
  if (sun) sun.style.display = dark ? 'block' : 'none';
  if (moon) moon.style.display = dark ? 'none' : 'block';
}

const savedTheme = localStorage.getItem('theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
setTheme(savedTheme ? savedTheme === 'dark' : prefersDark);

document.addEventListener('click', (e) => {
  if (e.target.closest('#themeToggle')) {
    setTheme(html.getAttribute('data-theme') !== 'dark');
  }
});

// === HERO CANVAS ===
let heroCleanup = null;

function initHeroCanvas() {
  if (heroCleanup) heroCleanup();

  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  const hero = document.getElementById('hero');

  function applyStaticFallback() {
    canvas.remove();
    if (hero) {
      hero.style.background =
        'linear-gradient(135deg, var(--accent-light) 0%, var(--bg) 60%)';
    }
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    applyStaticFallback();
    return;
  }

  const ctx = canvas.getContext('2d');
  if (ctx === null) {
    applyStaticFallback();
    return;
  }

  let canvasWidth = 0;
  let canvasHeight = 0;
  const particles = [];

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const nextWidth = rect.width;
    const nextHeight = rect.height;
    const dpr = window.devicePixelRatio || 1;
    const scaleX = canvasWidth > 0 ? nextWidth / canvasWidth : 1;
    const scaleY = canvasHeight > 0 ? nextHeight / canvasHeight : 1;

    canvasWidth = nextWidth;
    canvasHeight = nextHeight;
    canvas.width = Math.round(nextWidth * dpr);
    canvas.height = Math.round(nextHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    particles.forEach((p) => {
      p.x *= scaleX;
      p.y *= scaleY;
    });
  }

  function getThemeColor(prop) {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(prop)
      .trim();
  }

  const PARTICLE_COUNT = 40;

  function createParticle() {
    return {
      x: Math.random() * canvasWidth,
      y: Math.random() * canvasHeight,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      radius: Math.random() * 2 + 1,
      opacity: Math.random() * 0.35 + 0.1,
    };
  }

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(createParticle());
  }

  let animFrameId = null;

  function draw() {
    const w = canvasWidth;
    const h = canvasHeight;

    ctx.clearRect(0, 0, w, h);

    const particleColor = getThemeColor('--particle-color');

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < -p.radius) p.x = w + p.radius;
      if (p.x > w + p.radius) p.x = -p.radius;
      if (p.y < -p.radius) p.y = h + p.radius;
      if (p.y > h + p.radius) p.y = -p.radius;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = particleColor;
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    animFrameId = requestAnimationFrame(draw);
  }

  draw();

  const heroObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (!animFrameId) draw();
        } else if (animFrameId) {
          cancelAnimationFrame(animFrameId);
          animFrameId = null;
        }
      });
    },
    { threshold: 0 }
  );
  if (hero) heroObserver.observe(hero);

  heroCleanup = () => {
    if (animFrameId) cancelAnimationFrame(animFrameId);
    window.removeEventListener('resize', resizeCanvas);
    heroObserver.disconnect();
    heroCleanup = null;
  };
}

// === FILTER CONTROLLER ===
function applyFilter(filter, cards) {
  return cards.map(card => ({
    tags: card.tags,
    visible: filter === 'all' || card.tags.includes(filter),
  }));
}

function applyFilterToDOM(filter) {
  const projectCards = document.querySelectorAll('.project-card');
  const filterBtns = document.querySelectorAll('.filter-btn');
  if (!projectCards.length) return;

  const cardData = Array.from(projectCards).map(el => ({
    el,
    tags: (el.dataset.tags || '').split(',').map(t => t.trim()).filter(Boolean),
  }));
  const results = applyFilter(filter, cardData);
  cardData.forEach((card, i) => {
    card.el.classList.toggle('hidden', !results[i].visible);
  });
  filterBtns.forEach(btn => {
    const isActive = btn.dataset.filter === filter;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', String(isActive));
  });
}

function initFilterController() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn');
    if (!btn || !document.contains(btn)) return;
    applyFilterToDOM(btn.dataset.filter);
  });
}

// === CARD EXPANDER ===
function toggleCard(state) {
  const expanded = !state.expanded;
  return { expanded, ariaExpanded: String(expanded) };
}

document.addEventListener('click', (e) => {
  const card = e.target.closest('.project-card');
  if (!card || !document.querySelector('.projects-grid')?.contains(card)) return;

  const currentExpanded = card.dataset.expanded === 'true';
  const newState = toggleCard({ expanded: currentExpanded, ariaExpanded: String(currentExpanded) });

  card.dataset.expanded = String(newState.expanded);
  const btn = card.querySelector('.card-toggle');
  if (btn) {
    btn.setAttribute('aria-expanded', newState.ariaExpanded);
    btn.textContent = newState.expanded ? 'Details ▴' : 'Details ▾';
  }

  if (newState.expanded) {
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
});

// === SOUND TOGGLE (persistent across in-site navigation) ===
const cozyTrack = document.getElementById('background-music');
let soundEnabled = false;
let audioReady = false;

function persistSoundState(enabled) {
  localStorage.setItem('soundEnabled', String(enabled));
}

function syncSoundUIFromTrack() {
  const btn = document.getElementById('sound-toggle');
  const iconOn = document.getElementById('icon-sound-on');
  const iconOff = document.getElementById('icon-sound-off');
  if (!btn || !cozyTrack) return;

  soundEnabled = !cozyTrack.paused && !cozyTrack.ended;

  if (iconOn) iconOn.style.display = soundEnabled ? 'block' : 'none';
  if (iconOff) iconOff.style.display = soundEnabled ? 'none' : 'block';
  btn.classList.toggle('sound-muted', !soundEnabled);
  btn.setAttribute('aria-label', soundEnabled ? 'Pause background music' : 'Play background music');
  btn.setAttribute('aria-pressed', String(soundEnabled));
}

function initSoundToggle() {
  if (!cozyTrack) return;

  cozyTrack.loop = true;
  cozyTrack.volume = 0.32;

  cozyTrack.addEventListener('canplaythrough', () => {
    audioReady = true;
    const btn = document.getElementById('sound-toggle');
    if (btn) btn.removeAttribute('title');
  });

  cozyTrack.addEventListener('error', () => {
    audioReady = false;
    const btn = document.getElementById('sound-toggle');
    if (btn) {
      btn.setAttribute('title', 'Could not load cozy-loop.mp3. Check assets/audio/cozy-loop.mp3.');
    }
  });

  cozyTrack.load();
  syncSoundUIFromTrack();

  document.addEventListener('click', async (e) => {
    if (!e.target.closest('#sound-toggle')) return;

    if (soundEnabled) {
      cozyTrack.pause();
      soundEnabled = false;
      persistSoundState(false);
      syncSoundUIFromTrack();
      return;
    }

    try {
      if (!audioReady) cozyTrack.load();
      await cozyTrack.play();
      soundEnabled = true;
      persistSoundState(true);
      syncSoundUIFromTrack();
      document.getElementById('sound-toggle')?.removeAttribute('title');
    } catch (_) {
      cozyTrack.pause();
      soundEnabled = false;
      persistSoundState(false);
      syncSoundUIFromTrack();
      const btn = document.getElementById('sound-toggle');
      if (btn) {
        btn.setAttribute('title', 'Playback blocked. Click again after interacting with the page, or use a local server (not file://).');
      }
    }
  });
}

initSoundToggle();

// === CUSTOM CURSOR ===
function initCustomCursor() {
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) return;

  const cursor = document.getElementById('custom-cursor');
  if (!cursor) return;

  let targetX = -100, targetY = -100;
  let currentX = -100, currentY = -100;

  document.addEventListener('mousemove', (e) => {
    targetX = e.clientX;
    targetY = e.clientY;
  });

  function lerp(a, b, t) { return a + (b - a) * t; }

  function animate() {
    currentX = lerp(currentX, targetX, 0.18);
    currentY = lerp(currentY, targetY, 0.18);
    cursor.style.transform = `translate(${currentX - 5}px, ${currentY - 5}px)`;
    requestAnimationFrame(animate);
  }

  animate();

  document.addEventListener('mouseover', (e) => {
    if (e.target.closest('a, button')) {
      cursor.classList.add('cursor-hover');
    }
  });

  document.addEventListener('mouseout', (e) => {
    if (e.target.closest('a, button')) {
      cursor.classList.remove('cursor-hover');
    }
  });
}

initCustomCursor();

// === PAGE MODULES (re-run after in-site page swap) ===
function getPageKey(pathname) {
  const file = pathname.split('/').pop() || '';
  return file === 'blogs.html' ? 'blogs' : 'home';
}

function updateNavActive() {
  const page = getPageKey(location.pathname);
  document.querySelectorAll('.nav-links a').forEach((a) => {
    a.classList.remove('is-active');
    a.removeAttribute('aria-current');
  });
  if (page === 'blogs') {
    const blogsLink = document.querySelector('.nav-links a[href*="blogs"]');
    if (blogsLink) {
      blogsLink.classList.add('is-active');
      blogsLink.setAttribute('aria-current', 'page');
    }
  }
}

function initPageModules() {
  typingSession++;
  initFadeIn();
  initHeroCanvas();

  if (document.getElementById('typing-text')) {
    initTypingAnimator(
      ['Android Developer - Learning', 'Cloud Engineer', 'Python Developer', 'Data Analyst', 'Data Scientist'],
      100,
      60,
      1800
    );
  }

  if (document.querySelector('.project-card')) {
    applyFilterToDOM('all');
  }

  updateNavActive();
  syncSoundUIFromTrack();
  setTheme(html.getAttribute('data-theme') === 'dark');
}

initFilterController();
initPageModules();

// === SPA NAVIGATION (keeps audio playing between home ↔ blogs) ===
function shouldSwapPage(url) {
  return getPageKey(location.pathname) !== getPageKey(url.pathname);
}

function fetchPageUrl(url) {
  const dir = location.pathname.substring(0, location.pathname.lastIndexOf('/') + 1);
  return dir + (getPageKey(url.pathname) === 'blogs' ? 'blogs.html' : 'index.html');
}

async function navigateToPage(url, { historyMode = 'push' } = {}) {
  const fetchPath = fetchPageUrl(url);
  const res = await fetch(fetchPath);
  if (!res.ok) {
    window.location.href = url.href;
    return;
  }

  const html = await res.text();
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const newNav = doc.querySelector('nav');
  const newMain = doc.querySelector('main');
  const skipLink = doc.querySelector('.skip-to-main');

  if (!newMain) {
    window.location.href = url.href;
    return;
  }

  const nav = document.querySelector('nav');
  const main = document.querySelector('main');
  const skip = document.querySelector('.skip-to-main');

  if (newNav && nav) nav.innerHTML = newNav.innerHTML;
  if (main) main.replaceWith(newMain);
  if (skipLink && skip) {
    skip.href = skipLink.getAttribute('href');
    skip.textContent = skipLink.textContent;
  }

  document.title = doc.title;
  document.body.dataset.page = getPageKey(url.pathname);

  const stateUrl = url.pathname + url.search + url.hash;
  if (historyMode === 'push') {
    history.pushState({ spa: true }, '', stateUrl);
  } else if (historyMode === 'replace') {
    history.replaceState({ spa: true }, '', stateUrl);
  }

  initPageModules();

  if (url.hash) {
    const target = document.querySelector(url.hash);
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  } else {
    window.scrollTo(0, 0);
  }
}

document.addEventListener('click', (e) => {
  const link = e.target.closest('a');
  if (!link) return;
  if (link.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

  const href = link.getAttribute('href');
  if (!href || href.startsWith('mailto:') || href.startsWith('tel:')) return;

  let url;
  try {
    url = new URL(href, window.location.href);
  } catch (_) {
    return;
  }

  if (url.origin !== window.location.origin) return;

  if (!shouldSwapPage(url)) return;

  e.preventDefault();
  navigateToPage(url);
});

window.addEventListener('popstate', () => {
  navigateToPage(new URL(window.location.href), { historyMode: 'none' });
});

document.body.dataset.page = getPageKey(location.pathname);
