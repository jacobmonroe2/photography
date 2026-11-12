/* Jacob Monroe — site behaviour
   Everything you're likely to edit lives in CONFIG, FILMS and RATES below. */

const CONFIG = {
  instagram: 'jacobbb_photos',
  // Booking email. Leave '' to hide the "Email request" button.
  email: '',
  // Deposit links. Paste any you use; empty ones stay hidden.
  pay: {
    stripe: '',   // Stripe Payment Link, e.g. https://buy.stripe.com/...
    cashapp: '',  // cashtag without the $, e.g. yourtag
    venmo: '',    // username without the @
    zelle: '',    // the phone or email people should send to
  },
};

// Order = order on the page. Films with a clip play in the hero.
// Add clip: 'videos/name.mp4' to a film and that clip plays behind its title in the hero.
// "cat" is the filter each film sits under.
const FILMS = [
  { id: 'aL7wgQuylRU', title: 'Tokyo, Alone, 48 Hours', cat: 'Travel', clip: 'videos/tokyo-loop.mp4', poster: 'videos/tokyo-loop.jpg' },
  { id: 'i8h8nZefrug', title: "Jump Before You're Ready", cat: 'Stories' },
  { id: '5AHqe6npfI8', title: 'First Month of 2025 at Howard', cat: 'Campus' },
  { id: 'hUPejNX5N6I', title: '6 Days in Maui', cat: 'Travel' },
  { id: 'zlS2zQFXQ2c', title: 'Who You Keep Is Who You Become', cat: 'Stories' },
  { id: 'WFHMotmZO9Q', title: 'sophomore.mp4', cat: 'Campus' },
  { id: 'WrS8kGgV26c', title: 'A Day in SF', cat: 'Travel' },
  { id: 'JFMi3UOYPPc', title: 'Thanksgiving in ATL', cat: 'Travel' },
];

const RATES = {
  services: {
    video: { label: 'Shoot + edit', rate: 90, min: 2, hours: 'Time on site' },
    // Editing only: the client supplies footage. Flat add-ons don't apply; rush does.
    edit:  { label: 'Editing only', rate: 50, min: 1, hours: 'Editing time', noAddons: true },
  },
  addons: {
    reel: { label: 'Extra vertical reel', price: 45 },
    long: { label: 'Long-form edit (2–4 min)', price: 150 },
    raw:  { label: 'All raw footage', price: 40 },
  },
  rush: 0.25,      // 48-hour delivery, added to the total
  student: 0.15,   // Howard students and student orgs
  deposit: 0.30,
  maxHours: 10,
};

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const money = (n) => '$' + Math.round(n).toLocaleString('en-US');
const thumb = (id) => `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;

/* ---------- Modal (films + photos) ---------- */
const modal = (() => {
  const el = document.createElement('div');
  el.className = 'modal';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.innerHTML = '<button class="x" aria-label="Close">&times;</button><div class="stage"></div>';
  document.body.appendChild(el);
  const stage = $('.stage', el);
  let last = null;

  const close = () => {
    el.classList.remove('open');
    stage.innerHTML = '';
    document.body.style.overflow = '';
    if (last) last.focus();
  };
  const open = (html, label) => {
    last = document.activeElement;
    stage.innerHTML = html;
    el.setAttribute('aria-label', label);
    el.classList.add('open');
    document.body.style.overflow = 'hidden';
    $('.x', el).focus();
  };
  el.addEventListener('click', (e) => { if (e.target === el || e.target.closest('.x')) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && el.classList.contains('open')) close(); });

  return {
    film(f) {
      open(
        `<div class="video"><iframe src="https://www.youtube-nocookie.com/embed/${f.id}?autoplay=1&rel=0"
           title="${f.title}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
           referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>
         <div class="bar mono"><span>${f.title}</span>
           <a href="https://www.youtube.com/watch?v=${f.id}" target="_blank" rel="noopener">Watch on YouTube ↗</a></div>`,
        f.title
      );
    },
    clip(src, title, shape) {
      open(
        `<div class="player ${shape}"><video src="${src}" controls autoplay playsinline></video></div>
         <div class="bar mono"><span>${title}</span></div>`,
        title
      );
    },
    photo(src, caption) {
      open(`<img src="${src}" alt="${caption}"><div class="bar mono"><span>${caption}</span></div>`, caption || 'Photo');
    },
  };
})();

/* ---------- Films ---------- */
function initFilms() {
  /* Hero slider */
  const slides = $('#slides');
  if (slides) {
    // Only films with a video clip appear in the hero. One clip = no slideshow.
    const withClips = FILMS.filter((f) => f.clip);
    const set = withClips.length ? withClips : FILMS.slice(0, 1);
    const solo = set.length < 2;
    const dots = $('#dots');
    let at = 0, timer = null;
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

    set.forEach((f, i) => {
      const b = document.createElement('button');
      b.className = 'slide';
      b.setAttribute('aria-label', `Play ${f.title}`);
      b.innerHTML =
        `<img src="${f.poster || thumb(f.id)}" alt="" ${i ? 'loading="lazy"' : ''}>
         ${f.clip ? `<video muted loop playsinline preload="${i ? 'none' : 'auto'}" src="${f.clip}"></video>` : ''}
         <span class="body"><span class="tag">${i === 0 ? 'Latest film' : f.cat}</span>
         <span class="title">${f.title}</span>
         <span class="go"><i></i>Play film</span></span>`;
      b.addEventListener('click', () => modal.film(f));
      slides.appendChild(b);

      const d = document.createElement('button');
      d.setAttribute('aria-label', `Show ${f.title}`);
      d.addEventListener('click', () => { show(i); restart(); });
      dots.appendChild(d);
    });

    const show = (n) => {
      at = (n + set.length) % set.length;
      $$('.slide', slides).forEach((s, i) => {
        s.classList.toggle('on', i === at); s.tabIndex = i === at ? 0 : -1;
        const v = $('video', s);
        if (v) { if (i === at && !still) v.play().catch(() => {}); else v.pause(); }
      });
      $$('button', dots).forEach((d, i) => d.setAttribute('aria-current', i === at));
      $('#count').textContent = `${String(at + 1).padStart(2, '0')} / ${String(set.length).padStart(2, '0')}`;
    };
    const restart = () => {
      clearTimeout(timer);
      if (still || solo) return;
      // A slide with a clip stays up for the length of the clip
      const v = $('video', $$('.slide', slides)[at]);
      const hold = v && isFinite(v.duration) && v.duration > 0 ? v.duration * 1000 : (v ? 14000 : 6000);
      timer = setTimeout(() => { if (!$('.modal.open')) show(at + 1); restart(); }, hold);
    };
    const hero = $('.hero');
    hero.addEventListener('mouseenter', () => clearTimeout(timer));
    hero.addEventListener('mouseleave', restart);
    show(0);
    restart();
    if (solo) { dots.hidden = true; $('#count').hidden = true; }
  }

  /* Grid with filters */
  const grid = $('#film-grid');
  if (!grid) return;
  const cats = ['All', ...new Set(FILMS.map((f) => f.cat))];
  const filters = $('#filters');
  let active = 'All';

  const draw = () => {
    grid.innerHTML = '';
    FILMS.filter((f) => active === 'All' || f.cat === active).forEach((f) => {
      const b = document.createElement('button');
      b.className = 'film';
      b.setAttribute('aria-label', `Play ${f.title}`);
      b.innerHTML =
        `<div class="thumb"><img loading="lazy" src="${thumb(f.id)}" alt=""></div>
         <div class="meta"><div><b>${f.title}</b><span>${f.cat}</span></div><span class="arrow">↘</span></div>`;
      b.addEventListener('click', () => modal.film(f));
      grid.appendChild(b);
    });
    $$('button', filters).forEach((b) => b.setAttribute('aria-pressed', b.dataset.cat === active));
  };
  cats.forEach((c) => {
    const n = c === 'All' ? FILMS.length : FILMS.filter((f) => f.cat === c).length;
    const b = document.createElement('button');
    b.dataset.cat = c;
    b.innerHTML = `${c}<sup>${n}</sup>`;
    b.addEventListener('click', () => { active = c; draw(); });
    filters.appendChild(b);
  });
  draw();
}

/* ---------- Client work ----------
   Clips live in videos/web as <file>.mp4 with a <file>.jpg poster.
   shape: 'wide' for landscape projects, 'tall' for vertical ones.
   A clip with no title is shown without a caption. */
const WORK = [
  {
    name: 'notapregame',
    role: 'Event recaps',
    note: 'Recaps from the notapregame private DJ mixers.',
    shape: 'wide',
    clips: [
      { file: 'notapregame-unido-2', title: 'Unido 2: Drunk in Love' },
      { file: 'notapregame-1' },
      { file: 'notapregame-2' },
    ],
  },
  {
    name: 'We Just Chattin',
    role: 'Videographer and editor',
    note: 'Short-form campus interviews for a student-run platform at Howard University.',
    shape: 'tall',
    clips: [
      { file: 'wjc-state-of-the-party', title: 'With State of the Party' },
      { file: 'wjc-college', title: 'Is college still worth it?' },
      { file: 'wjc-gen-z', title: 'Is Gen Z lazy?' },
      { file: 'wjc-what-people-think', title: 'Do you care what people think?' },
      { file: 'wjc-sports-betting', title: 'Is sports betting bad?' },
      { file: 'wjc-online-activism', title: 'Is online activism real activism?' },
    ],
  },
  {
    name: 'Why Not You',
    role: 'Documentary',
    note: 'A documentary on Gavin Pennington, behind the scenes of his clothing brand The Illest Club.',
    shape: 'wide',
    clips: [
      { file: 'whynotyou-trailer', title: 'Trailer' },
      { file: 'whynotyou-paris-1', title: 'Paris, teaser' },
      { file: 'whynotyou-paris-rue-barbette', title: 'Paris, Rue Barbette' },
      { file: 'whynotyou-paris-night', title: 'Paris, at night' },
      { file: 'whynotyou-atlanta-opening', title: 'Atlanta, opening' },
      { file: 'whynotyou-atlanta-shoot', title: 'Atlanta, the shoot' },
    ],
  },
  {
    name: 'Event promos',
    role: 'Promo videos',
    note: 'Promo videos for parties and events.',
    shape: 'wide',
    clips: [
      { file: 'promo-country-club-chaos', title: 'Country Club Chaos' },
      { file: 'promo-back-to-the-2000s', title: 'Back to the 2000s' },
      { file: 'promo-new-york', title: 'New York City' },
    ],
  },
];

function initWork() {
  const root = $('#work-list');
  if (!root) return;
  const canHover = matchMedia('(hover: hover) and (pointer: fine)').matches;

  WORK.forEach((p) => {
    const block = document.createElement('article');
    block.className = `project ${p.shape}`;
    block.innerHTML =
      `<header><div><span class="mono muted">${p.role}</span><h3>${p.name}</h3></div><p>${p.note}</p></header>
       <div class="clips"></div>`;
    const row = $('.clips', block);

    p.clips.forEach((c) => {
      const src = `videos/web/${c.file}.mp4`;
      const b = document.createElement('button');
      b.className = 'clip';
      const full = c.title ? `${p.name} — ${c.title}` : p.name;
      b.setAttribute('aria-label', `Play ${full}`);
      b.innerHTML =
        `<span class="frame"><img loading="lazy" src="videos/web/${c.file}.jpg" alt="">
         <video muted loop playsinline preload="none" src="${src}"></video></span>
         ${c.title ? `<span class="cap">${c.title}</span>` : ''}`;
      const v = $('video', b);
      if (canHover) {
        // Silent preview while the mouse is over the tile
        b.addEventListener('mouseenter', () => { b.classList.add('live'); v.play().catch(() => {}); });
        b.addEventListener('mouseleave', () => { b.classList.remove('live'); v.pause(); });
      }
      b.addEventListener('click', () => { v.pause(); modal.clip(src, full, p.shape); });
      row.appendChild(b);
    });
    root.appendChild(block);
  });
}

/* ---------- Photo lightbox (gallery pages) ---------- */
function initShots() {
  $$('.shot').forEach((s) => {
    s.addEventListener('click', () => {
      const img = $('img', s);
      modal.photo(img.src, img.alt);
    });
  });
}

/* ---------- Estimator ---------- */
function initEstimator() {
  const root = $('#estimator');
  if (!root) return;

  const state = { service: 'video', hours: 2, addons: new Set(), rush: false, student: false };

  const calc = () => {
    const s = RATES.services[state.service];
    const lines = [{ label: `${s.label} · ${state.hours} hr × ${money(s.rate)}`, amount: s.rate * state.hours }];
    state.addons.forEach((k) => lines.push({ label: RATES.addons[k].label, amount: RATES.addons[k].price }));
    let total = lines.reduce((a, l) => a + l.amount, 0);
    if (state.student) {
      const d = total * RATES.student;
      lines.push({ label: `Howard rate −${RATES.student * 100}%`, amount: -d });
      total -= d;
    }
    if (state.rush) {
      const r = total * RATES.rush;
      lines.push({ label: `48-hour rush +${RATES.rush * 100}%`, amount: r });
      total += r;
    }
    total = Math.round(total);
    return { lines, total, deposit: Math.round(total * RATES.deposit) };
  };

  const render = () => {
    const s = RATES.services[state.service];
    if (state.hours < s.min) state.hours = s.min;
    if (s.noAddons) state.addons.clear();
    $$('[data-addon]', root).forEach((b) => { b.hidden = !!s.noAddons; });
    $('#hours-label').textContent = s.hours;

    $$('[data-service]', root).forEach((b) => b.setAttribute('aria-checked', b.dataset.service === state.service));
    $$('[data-addon]', root).forEach((b) => b.setAttribute('aria-pressed', state.addons.has(b.dataset.addon)));
    $('[data-toggle="rush"]', root).setAttribute('aria-pressed', state.rush);
    $('[data-toggle="student"]', root).setAttribute('aria-pressed', state.student);
    $('#hours').textContent = `${state.hours} ${state.hours === 1 ? 'hour' : 'hours'}`;
    $('#hours-less').disabled = state.hours <= s.min;
    $('#hours-more').disabled = state.hours >= RATES.maxHours;
    $('#hours-min').textContent = `${s.min}-hour minimum`;

    const { lines, total, deposit } = calc();
    $('#slip-lines').innerHTML = lines
      .map((l) => `<div class="row${l.amount < 0 ? ' minus' : ''}"><dt>${l.label}</dt><span class="lead"></span><dd>${l.amount < 0 ? '−' : ''}${money(Math.abs(l.amount))}</dd></div>`)
      .join('');
    $('#slip-total').textContent = money(total);
    $('#mini-total').textContent = money(total);
    $('#slip-deposit').textContent = money(deposit);
  };

  root.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.service) state.service = b.dataset.service;
    else if (b.dataset.addon) state.addons.has(b.dataset.addon) ? state.addons.delete(b.dataset.addon) : state.addons.add(b.dataset.addon);
    else if (b.dataset.toggle) state[b.dataset.toggle] = !state[b.dataset.toggle];
    else if (b.id === 'hours-less') state.hours -= 1;
    else if (b.id === 'hours-more') state.hours += 1;
    else return;
    render();
  });

  /* Request summary */
  const summary = () => {
    const { lines, total, deposit } = calc();
    const field = (label, id) => { const v = $(id).value.trim(); return v ? `${label}: ${v}` : null; };
    return [
      'Booking request — Jacob Monroe',
      field('Name', '#f-name'),
      field('Date', '#f-date'),
      field('Where', '#f-where'),
      field('Details', '#f-notes'),
      '',
      ...lines.map((l) => `${l.label}: ${l.amount < 0 ? '-' : ''}${money(Math.abs(l.amount))}`),
      `Estimate: ${money(total)}  (deposit ${money(deposit)})`,
    ].filter((x) => x !== null).join('\n');
  };
  const toast = (m) => { $('#toast').textContent = m; };

  $('#send-dm').addEventListener('click', async () => {
    const text = summary();
    try {
      await navigator.clipboard.writeText(text);
      toast('Request copied. Paste it into the DM.');
    } catch {
      toast('Could not copy automatically. Screenshot the estimate instead.');
    }
    window.open(`https://ig.me/m/${CONFIG.instagram}`, '_blank', 'noopener');
  });

  const mail = $('#send-email');
  if (CONFIG.email) {
    mail.hidden = false;
    mail.addEventListener('click', () => {
      location.href = `mailto:${CONFIG.email}?subject=${encodeURIComponent('Booking request')}&body=${encodeURIComponent(summary())}`;
    });
  }

  /* Deposit links: only the ones filled in above are shown */
  const p = CONFIG.pay;
  const links = [
    p.stripe && ['Card', p.stripe],
    p.cashapp && ['Cash App', `https://cash.app/$${p.cashapp}`],
    p.venmo && ['Venmo', `https://venmo.com/u/${p.venmo}`],
  ].filter(Boolean);
  if (links.length || p.zelle) {
    $('#pay').hidden = false;
    $('#pay-links').innerHTML =
      links.map(([l, u]) => `<a class="chip" href="${u}" target="_blank" rel="noopener">${l} ↗</a>`).join('') +
      (p.zelle ? `<span class="chip">Zelle · ${p.zelle}</span>` : '');
  }

  render();
}

/* ---------- Reveal on scroll ---------- */
function initReveal() {
  const els = $$('.reveal');
  if (!('IntersectionObserver' in window)) return els.forEach((e) => e.classList.add('in'));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -8% 0px' });
  els.forEach((e) => io.observe(e));
}

/* ---------- Cursor ----------
   An amber cross that follows the mouse and turns 45 degrees over anything
   clickable. Mouse only; touch is untouched. */
function initCursor() {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const el = document.createElement('div');
  el.className = 'cursor';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<span></span>';
  document.body.appendChild(el);
  const root = document.documentElement;
  root.classList.add('has-cursor');

  let x = 0, y = 0, tx = 0, ty = 0, started = false;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const setState = (t) => {
    let state = '';
    if (t.closest('input, textarea, select, .modal .video')) state = 'off';
    else if (t.closest('a, button')) state = 'link';
    el.dataset.state = state;
    root.classList.toggle('cursor-off', state === 'off');
  };

  document.addEventListener('mousemove', (e) => {
    tx = e.clientX; ty = e.clientY;
    if (!started) { started = true; x = tx; y = ty; el.classList.add('on'); }
    setState(e.target);
  });
  document.addEventListener('mousedown', () => el.classList.add('down'));
  document.addEventListener('mouseup', () => el.classList.remove('down'));
  document.documentElement.addEventListener('mouseleave', () => el.classList.remove('on'));
  document.documentElement.addEventListener('mouseenter', () => { if (started) el.classList.add('on'); });

  const tick = () => {
    const k = still ? 1 : 0.28;
    x += (tx - x) * k; y += (ty - y) * k;
    el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

initFilms();initWork();
initShots();
initEstimator();
initReveal();
initCursor();
