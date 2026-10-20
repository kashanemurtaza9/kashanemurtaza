
(function () {
  'use strict';

  /* One interface everywhere: below 820px the whole page is scaled down instead of re-flowed. */
  var LAYOUT_MIN = 820;
  function fitLayout() {
    var w = window.innerWidth || document.documentElement.clientWidth, el = document.documentElement;
    var z = w < LAYOUT_MIN ? w / LAYOUT_MIN : 1;
    el.style.zoom = z === 1 ? '' : String(z);
    el.classList.toggle('mobile', z < 1);
    el.style.setProperty('--vw', (w / z / 100) + 'px');
    el.style.setProperty('--vh', ((window.innerHeight || 800) / z / 100) + 'px');
    fitServices(z, w);
  }
  function fitServices(z, w) {
    var sv = document.getElementById('services');
    if (!sv) return;
    if (z < 1) {
      sv.style.zoom = String(1 / z);
      sv.style.setProperty('--vw', (w / 100) + 'px');
      sv.classList.add('narrow');
    } else {
      /* Desktop uses the same stacked phone layout and type sizes as mobile. */
      sv.style.zoom = '';
      sv.style.setProperty('--vw', '3.9px');
      sv.classList.add('narrow');
    }
  }
  fitLayout();
  window.addEventListener('resize', fitLayout);

  /* Motion is on by default. The Motion button in the top bar turns it off, and that choice is remembered. */
  var motionPref = null;
  var REDUCED = false;
  document.documentElement.classList.toggle('reduce-motion', REDUCED);
  var CATS = ['Business Management', 'Marketing and Growth', 'AI Videos & Creative', 'Research'];
  var AI_CAT = 'AI Videos & Creative';
  var CAT_MAP = { 'Operations & Management': 'Business Management', 'Marketing & Growth': 'Marketing and Growth', 'AI Video & Creative': 'AI Videos & Creative' };
  function normCats() {
    ensureProfile();
    (state.projects || []).forEach(function (x) {
      if (CAT_MAP[x.category]) x.category = CAT_MAP[x.category];
      if (CATS.indexOf(x.category) < 0) x.category = CATS[0];
    });
  }
  var CAPS = [
    ['Operations Management & Workflow Automation', 'Business operations and the workflows behind them: coordinating processes, keeping order flow efficient, and supporting fulfilment and customers day to day.', ['Order management', 'Fulfilment and dispatch', 'Tracking', 'Returns and cancellations', 'Inventory coordination', 'Customer support']],
    ['Social Media Strategy & Meta Ads', 'Social content, campaign planning and paid advertising, with performance tracked and measured against ROAS.', ['Social media content', 'Campaign planning', 'Meta Ads', 'ROAS and measurement']],
    ['AI Content Creation & Prompt Engineering', 'AI-assisted video concepts, advertisements and visual campaigns. The focus is storytelling, visual consistency and creative direction for commercial use, not a list of tools.', ['Video concepts', 'Advertisements', 'Prompt design', 'Visual consistency']],
    ['Content Research & Product Research', 'Research that feeds content planning, product selection, market understanding and positioning, so business decisions rest on more than instinct.', ['Content planning', 'Product selection', 'Market understanding', 'Positioning']],
    ['AI Tool Integration', 'Applying AI tools to practical workflows and digital projects, including AI-assisted website development as a supporting skill.', ['Workflow use cases', 'Digital projects', 'AI-assisted web builds']]
  ];

  var ICONS = {
    up: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 17 17 7M8 7h9v9"/></svg>',
    down: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 7l10 10M17 8v9H8"/></svg>',
    sun: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    moon: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>',
    plus: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 5v14M5 12h14"/></svg>',
    edit: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 20h4L19 9l-4-4L4 16v4z"/></svg>',
    trash: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
    arrowUp: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
    arrowDown: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 5v14M6 13l6 6 6-6"/></svg>',
    star: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8 6.6 19.7l1.1-6.1L3.2 9.4l6.1-.8z"/></svg>',
    close: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    copy: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="9" y="9" width="11" height="11"/><path d="M5 15V5h10"/></svg>'
  };

  function $(s, r) { return (r || document).querySelector(s); }
  function h(tag, props) {
    var el = document.createElement(tag);
    if (props) {
      Object.keys(props).forEach(function (k) {
        var v = props[k];
        if (v == null || v === false) return;
        if (k === 'class') el.className = v;
        else if (k === 'text') el.textContent = v;
        else if (k === 'html') el.innerHTML = v;
        else if (k === 'value') el.value = v;
        else if (k === 'checked') el.checked = !!v;
        else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
        else el.setAttribute(k, v === true ? '' : v);
      });
    }
    for (var i = 2; i < arguments.length; i++) append(el, arguments[i]);
    return el;
  }
  function append(el, kid) {
    if (kid == null || kid === false) return;
    if (Array.isArray(kid)) { kid.forEach(function (k) { append(el, k); }); return; }
    el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  function icon(n) { return h('span', { class: 'ic', html: ICONS[n], 'aria-hidden': 'true' }); }
  function uid() { return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function hashStr(s) { var x = 7; for (var i = 0; i < s.length; i++) x = (x * 31 + s.charCodeAt(i)) >>> 0; return x; }
  function safeUrl(u) {
    u = (u || '').trim();
    if (!u) return '';
    if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
    try { var x = new URL(u); return (x.protocol === 'http:' || x.protocol === 'https:') ? x.href : ''; } catch (e) { return ''; }
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  /* Media values are either a /media/... path shipped with the site or an https URL. */
  function blobSrc(v) {
    v = (v || '').trim();
    return /^(https:\/\/[^\s"'<>]+|\/media\/[A-Za-z0-9._\-\/]+)$/i.test(v) ? v : '';
  }
  function resumeHref(v) { v = (v || '').trim(); return /^(https:\/\/[^\s"'<>]+|\/media\/[A-Za-z0-9._\-\/]+)$/i.test(v) ? v : ''; }
  function imgSrc(v) { return (typeof v === 'string' && (v.indexOf('data:image/') === 0 || /^(https:\/\/[^\s"'<>]+|\/media\/[A-Za-z0-9._\-\/]+)$/i.test(v))) ? v : ''; }
  /* Checks a pasted video link. Returns an error message, or '' when it can be used. */
  function checkVideoUrl(v) {
    v = (v || '').trim();
    if (!v) return '';
    var u;
    try { u = new URL(v); } catch (e) { return 'That is not a valid link. Paste the full address starting with https://'; }
    if (u.protocol !== 'https:') return 'The link must start with https://';
    if (/(^|\.)(youtube\.com|youtu\.be|vimeo\.com|instagram\.com|tiktok\.com|facebook\.com|fb\.watch|x\.com|twitter\.com)$/i.test(u.hostname) || (/(^|\.)drive\.google\.com$/i.test(u.hostname)))
      return 'That is a link to a web page, not to a video file. Paste a direct link to the .mp4 or .webm file.';
    return '';
  }
  var PROFILE_DEFAULTS = {
    aboutHeading: 'About me',
    contactEyebrow: "Let's work together",
    contactHeadA: 'Have a project',
    contactHeadEm: 'in mind?',
    contactText: "Whether you need creative content, smarter workflows, research support, or a more effective digital marketing approach, let's discuss how I can help.",
    contactButton: 'Email Kashan',
    scrollLabel: 'Scroll to explore',
    navServices: 'What I do',
    navProjects: 'Projects',
    navAbout: 'About me',
    navExperience: 'Experience',
    servicesHeadA: 'What I',
    servicesHeadEm: 'do',
    servicesTag: 'Five areas, one way of working'
  };
  function ensureProfile() {
    var p = state.profile;
    Object.keys(PROFILE_DEFAULTS).forEach(function (k) { if (typeof p[k] !== 'string') p[k] = PROFILE_DEFAULTS[k]; });
    if (!Array.isArray(p.caps)) p.caps = CAPS.map(function (c) { return { title: c[0], text: c[1], keywords: c[2].join(', ') }; });
  }

  /* State */
  var BOOT = window.__PF_BOOT || {};
  var state = BOOT.state;
  var contentVersion = BOOT.version || 0;   /* version of the saved content in the database (0 = nothing saved yet) */
  var bootPath = (location.pathname || '/').replace(/\/+$/, '');
  var app = $('#app');
  var canEdit = false;
  var dirty = false;
  var publishing = false;
  var view = (bootPath === '/admin') ? 'dash' : 'site';
  var authInfo = { authConfigured: true };
  var loginError = '';
  var adminPending = (bootPath === '/admin');
  var tab = 'projects';
  var filter = 'All';
  var editor = null;
  var confirmId = null;
  var draftOffer = null;
  var overlayEl = null;

  function store(kind, k, v) {
    try {
      var s = kind === 'local' ? localStorage : sessionStorage;
      if (v === undefined) return s.getItem(k);
      if (v === null) s.removeItem(k); else s.setItem(k, v);
    } catch (e) {}
    return null;
  }
  var savedTheme = store('local', 'pf-theme');
  if (savedTheme === 'light' || savedTheme === 'dark') document.documentElement.setAttribute('data-theme', savedTheme);

  function effectiveTheme() {
    var t = document.documentElement.getAttribute('data-theme');
    if (t) return t;
    return window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  function themeButton() {
    var b = h('button', { class: 'round', type: 'button', 'aria-label': 'Switch colour theme', title: 'Switch colour theme' });
    function paint() { b.innerHTML = ICONS[effectiveTheme() === 'dark' ? 'sun' : 'moon']; }
    b.addEventListener('click', function () {
      var next = effectiveTheme() === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      store('local', 'pf-theme', next);
      paint();
      if (window.gsap && !REDUCED) window.gsap.fromTo(b, { rotate: -120, scale: 0.8 }, { rotate: 0, scale: 1, duration: 0.6, ease: 'back.out(1.6)' });
    });
    paint();
    return b;
  }

  function motionButton() {
    var lbl = h('span', { class: 'lbl', text: REDUCED ? 'Motion off' : 'Motion on' });
    return h('button', { class: 'motion-btn mono', type: 'button', 'aria-pressed': String(!REDUCED), title: 'Turn page animations on or off', onclick: function () {
      REDUCED = !REDUCED;
      store('local', 'pf-motion', REDUCED ? 'off' : 'on');
      motionPref = REDUCED ? 'off' : 'on';
      document.documentElement.classList.toggle('reduce-motion', REDUCED);
      window.scrollTo(0, 0);
      render('full');
    } }, h('span', { class: 'dot' }), lbl);
  }

  function toast(msg) {
    var old = $('.toast'); if (old) old.remove();
    var t = h('div', { class: 'toast', role: 'status', text: msg });
    document.body.append(t);
    setTimeout(function () { t.remove(); }, 3800);
  }

  function applyCover(el, p) {
    if (imgSrc(p.cover)) {
      el.style.backgroundImage = 'url("' + p.cover + '")';
      return;
    }
    var n = hashStr(p.id || p.title || 'x');
    var from = n % 360, x = 30 + (n >> 3) % 40, y = 30 + (n >> 5) % 40;
    el.style.backgroundImage = 'radial-gradient(circle at 30% 20%, rgba(255,255,255,.35), transparent 40%), conic-gradient(from ' + from + 'deg at ' + x + '% ' + y + '%, #040705, #e8dcc0, #0c4a35, #1fb980, #040705 55%, #f3ead6, #0a0f0c, #040705)';
  }

  function persistDraft() { if (canEdit && dirty) store('session', 'pf-draft', JSON.stringify(state)); }
  function markDirty() { dirty = true; persistDraft(); updateBar(); }

  /* Site */
  function navBar(mode) {
    var dock = h('div', { class: 'dock' }, themeButton());
    if (canEdit && mode === 'site') {
      dock.append(h('button', { class: 'btn ghost small', type: 'button', onclick: function () { go('dash'); } }, 'Dashboard'));
    }
    var frag = document.createDocumentFragment();
    frag.append(h('header', { class: 'nav' + (mode === 'site' ? ' over' : '') }, h('div', { class: 'wrap nav-in' },
      h('nav', { class: 'links', 'aria-label': 'Main' },
        h('a', { href: '#services', text: state.profile.navServices }),
        h('a', { href: '#about', text: state.profile.navAbout }),
        h('a', { href: '#experience', text: state.profile.navExperience }),
        h('a', { href: '#contact', text: state.profile.navContact || 'Contact' })))), dock);
    return frag;
  }

  /* Card previews: hover (mouse), keyboard focus, or, on touch screens, being near the middle of the screen. */
  var previewObservers = [];
  function clearPreviews() { previewObservers.forEach(function (o) { o.disconnect(); }); previewObservers = []; }

  function projectCard(p) {
    var vsrc = blobSrc(p.video);
    var cover = h('div', { class: 'cover' }, h('span', { class: 'cover-tag mono', text: p.video ? p.category + ' / Video' : p.category }));
    applyCover(cover, p);
    var vid = null;
    if (vsrc) {
      vid = h('video', { loop: true, playsinline: true, preload: 'none', 'aria-hidden': 'true', tabindex: '-1' });
      vid.muted = true;
      cover.insertBefore(vid, cover.firstChild);
    }
    var title = h('h3', { class: 'card-title' }, h('button', { type: 'button', onclick: function (e) { openProject(p, e.currentTarget); }, text: p.title }));
    var card = h('article', { class: 'card' },
      cover,
      h('div', { class: 'card-meta mono' }, h('span', { text: [p.category, p.year].filter(Boolean).join(' / ') })),
      title,
      p.summary ? h('p', { text: p.summary }) : null);
    if (vid) {
      var start = function () {
        if (REDUCED) return;
        if (!vid.getAttribute('src')) vid.setAttribute('src', vsrc);
        vid.muted = true;
        var pr = vid.play();
        if (pr && pr.catch) pr.catch(function () {});
      };
      var stop = function () {
        card.classList.remove('is-playing');
        vid.pause();
        try { vid.currentTime = 0; } catch (e) {}
      };
      vid.addEventListener('playing', function () { card.classList.add('is-playing'); });
      card.addEventListener('pointerenter', function (e) { if (e.pointerType !== 'touch') start(); });
      card.addEventListener('pointerleave', function (e) { if (e.pointerType !== 'touch') stop(); });
      card.addEventListener('focusin', function (e) { if (e.target.matches && e.target.matches(':focus-visible')) start(); });
      card.addEventListener('focusout', stop);
      if (window.matchMedia && matchMedia('(hover: none)').matches && 'IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (es) {
          es.forEach(function (en) { if (en.isIntersecting) start(); else stop(); });
        }, { rootMargin: '-38% 0px -38% 0px' });
        io.observe(card);
        previewObservers.push(io);
      }
    }
    return card;
  }

  function published() {
    var all = state.projects.filter(function (x) { return x.status === 'published'; });
    return all.filter(function (x) { return x.featured; }).concat(all.filter(function (x) { return !x.featured; }));
  }

  function workBody() {
    var shown;
    if (filter === 'All') {
      var pubAll = published();
      shown = CATS.map(function (c) { return pubAll.filter(function (x) { return x.category === c; })[0]; }).filter(Boolean);
    } else shown = published().filter(function (x) { return x.category === filter; });
    return h('div', { id: 'work-body' }, shown.length
      ? h('div', { class: 'grid' }, shown.map(projectCard))
      : h('p', { class: 'empty', text: canEdit ? 'No published projects here yet. Open the dashboard to add one.' : 'Projects are on their way. Check back soon.' }));
  }

  function animateCards(node) {
    if (!window.gsap || REDUCED) return;
    var g = window.gsap;
    node.querySelectorAll('.card').forEach(function (el, i) {
      g.fromTo(el.querySelector('.cover'), { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1, delay: i * 0.08, ease: 'power4.out', clearProps: 'clipPath' });
      g.from(el.querySelectorAll(':scope > .card-meta, :scope > .card-title, :scope > p, :scope > .card-cta'), { y: 24, duration: 0.8, stagger: 0.06, delay: 0.2 + i * 0.08, ease: 'power3.out' });
    });
  }

  function renderSite() {
    var p = state.profile;
    var pub = published();
    var cats = ['All'].concat(CATS.filter(function (c) { return pub.some(function (x) { return x.category === c; }); }));
    if (cats.indexOf(filter) < 0) filter = 'All';

    var chips = h('div', { class: 'chips', role: 'group', 'aria-label': 'Filter projects by category' });
    cats.forEach(function (c) {
      chips.append(h('button', { class: 'chip', type: 'button', 'aria-pressed': String(c === filter), text: c, onclick: function () {
        filter = c;
        chips.querySelectorAll('.chip').forEach(function (b) { b.setAttribute('aria-pressed', String(b.textContent === c)); });
        clearPreviews(); var nb = workBody(); $('#work-body').replaceWith(nb);
        if (cardSetup && window.ScrollTrigger) cardSetup(nb); else animateCards(nb);
        if (window.ScrollTrigger) window.ScrollTrigger.refresh();
      } }));
    });

    var videoSrc = blobSrc(p.heroVideo);
    var heroBg = null;
    var heroToggle = null;
    if (videoSrc) {
      var vid = h('video', { src: videoSrc, loop: true, playsinline: true, preload: 'auto', poster: imgSrc(p.heroPoster) ? p.heroPoster : null, 'aria-hidden': 'true', tabindex: '-1' });
      vid.muted = true;
      var heroPlay = motionPref !== 'off';
      var userPaused = !heroPlay;
      var playHero = function () {
        if (!heroPlay || userPaused) return;
        var pr = vid.play();
        if (pr && pr.catch) pr.catch(function () {});
      };
      if (heroPlay) {
        vid.autoplay = true;
        vid.addEventListener('canplay', playHero, { once: true });
        vid.addEventListener('loadeddata', playHero, { once: true });
        ['pointerdown', 'touchstart', 'keydown', 'wheel'].forEach(function (ev) { window.addEventListener(ev, playHero, { once: true, passive: true }); });
      }
      /* Keep the sculpture looping, and pause it while the hero is off screen to save battery. */
      vid.addEventListener('ended', function () { vid.currentTime = 0; playHero(); });
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (es) {
          es.forEach(function (en) { if (en.isIntersecting) playHero(); else vid.pause(); });
        }).observe(vid);
      }
      var bgBox = h('div', { class: 'hero-bg', 'aria-hidden': 'true' }, vid);
      if (imgSrc(p.heroPoster)) bgBox.style.backgroundImage = 'url("' + p.heroPoster + '")';
      heroBg = [bgBox, h('div', { class: 'hero-shade', 'aria-hidden': 'true' })];
      var tgLbl = h('span', { class: 'lbl', text: userPaused ? 'Video paused' : 'Video playing' });
      heroToggle = h('button', { class: 'hero-toggle mono', type: 'button', 'aria-pressed': String(!userPaused), title: 'Pause or play the background video', onclick: function () {
        userPaused = !userPaused;
        if (userPaused) vid.pause(); else { heroPlay = true; playHero(); }
        heroToggle.setAttribute('aria-pressed', String(!userPaused));
        tgLbl.textContent = userPaused ? 'Video paused' : 'Video playing';
      } }, h('span', { class: 'dot' }), tgLbl);
    }

    var emailBlock = [];
    if (p.email) {
      emailBlock.push(h('a', { class: 'btn hero-cta', href: 'mailto:' + p.email }, p.contactButton || 'Email', icon('up')));
    }
    var contactLinks = h('div', { class: 'row' },
      p.fiverr && safeUrl(p.fiverr) ? h('a', { class: 'btn ghost small', href: safeUrl(p.fiverr), target: '_blank', rel: 'noopener noreferrer' }, 'Fiverr', icon('up')) : null,
      safeUrl(p.linkedin || 'https://www.linkedin.com/in/kashanemurtaza') ? h('a', { class: 'btn hero-cta', href: safeUrl(p.linkedin || 'https://www.linkedin.com/in/kashanemurtaza'), target: '_blank', rel: 'noopener noreferrer' }, 'LinkedIn', icon('up')) : null);

    var photoSrc = imgSrc(p.photo) ? p.photo : '';
    var photoEl = photoSrc
      ? h('div', { class: 'about-photo' }, h('img', { src: photoSrc, alt: 'Portrait of ' + p.name, width: '900', height: '900', decoding: 'async' }))
      : h('div', { class: 'about-photo is-empty', 'aria-hidden': 'true' }, h('span', { class: 'ph-k', text: 'K.' }));
    var ctaHref = p.email ? 'mailto:' + p.email : '#contact';

    var frag = document.createDocumentFragment();
    var MARQ = ['Research', 'Marketing', 'Operations', 'AI Content', 'Product', 'Workflow'];
    function marqGroup() { return h('div', { class: 'marquee-group' }, MARQ.concat(MARQ).map(function (w, i) { return h('span', { class: i % 2 ? '' : 'on', text: w + ' /' }); })); }
    frag.append(
      navBar('site'),
      h('main', { class: 'wrap', id: 'home' },
        h('section', { class: 'hero' + (videoSrc ? ' has-video' : ''), 'aria-label': 'Introduction' },
          heroBg,
          h('div', { class: 'hero-grid', 'aria-hidden': 'true' }),
          h('div', { class: 'chrome-wrap', 'aria-hidden': 'true' }, h('div', { class: 'chrome' }), h('div', { class: 'chrome-inner' })),
          h('div', { class: 'hero-copy' },
            h('p', { class: 'eyebrow mono' }, h('b', { text: p.name }), h('span', { text: '/' }), h('span', { text: p.title })),
            h('h1', { class: 'display' }, h('span', null, h('span', { class: 'ln', text: p.headlineA })), h('span', null, h('span', { class: 'ln', text: p.headlineB })), h('span', null, h('span', { class: 'ln' }, h('em', { text: p.headlineEm })))),
            h('p', { class: 'lede', text: p.intro }),
            (p.heroButton === undefined ? 'Explore Projects' : p.heroButton) ? h('div', { class: 'actions' }, h('a', { class: 'btn hero-cta', href: '#work' }, (p.heroButton === undefined ? 'Explore Projects' : p.heroButton), icon('down'))) : null),
          h('div', { class: 'hero-meta mono' },
            h('span', { text: p.location }),
            heroToggle,
            h('a', { class: 'scroll-cue', href: '#services' }, p.scrollLabel, icon('down')))),

        h('div', { class: 'marquee', 'aria-hidden': 'true' }, h('div', { class: 'marquee-track' }, marqGroup(), marqGroup())),

        h('section', { class: 'section', id: 'services' },
          h('div', { class: 'section-head' }, h('h2', { class: 'title' }, p.servicesHeadA + ' ', p.servicesHeadEm ? h('em', { text: p.servicesHeadEm }) : null), p.servicesTag ? h('span', { class: 'mono', text: p.servicesTag }) : null),
          h('div', null, p.caps.map(function (c) {
            var kws = (c.keywords || '').split(',').map(function (k) { return k.trim(); }).filter(Boolean);
            return h('div', { class: 'cap' },
              h('h3', { text: c.title }),
              h('div', null, h('p', { text: c.text }), kws.length ? h('div', { class: 'kw mono' }, kws.map(function (k) { return h('span', { text: k }); })) : null));
          }))),

        h('section', { class: 'section', id: 'work' },
          h('div', { class: 'section-head' }, h('h2', { class: 'title' }, 'Projects'), cats.length > 2 ? chips : null),
          workBody()),

        h('section', { class: 'section band invert', id: 'about' },
          h('div', { class: 'section-head' }, h('h2', { class: 'title' }, p.aboutHeading || 'About me')),
          h('div', { class: 'about' },
            h('div', { class: 'about-copy' },
              h('h3', { class: 'about-name', text: p.fullName || p.name }),
              p.tagline ? h('div', { class: 'about-tag mono', text: p.tagline }) : null,
              p.about.split(/\n\s*\n/).map(function (t) {
                var w = t.trim().split(/\s+/), lines = [];
                for (var i = 0; i < w.length; i += 11) lines.push(w.slice(i, i + 11).join(' '));
                return h('p', null, lines.map(function (l) { return h('span', { class: 'l9', text: l }); }));
              }),
              p.skills ? h('div', { class: 'about-skills' }, h('b', { text: 'Skills: ' }), p.skills) : null,
              resumeHref(p.resumeUrl) ? h('a', { class: 'about-cta', href: resumeHref(p.resumeUrl), download: '', target: '_blank', rel: 'noopener' }, p.resumeLabel || 'Download resume', icon('down')) : null),
            h('div', { class: 'about-side' },
              photoEl,
              (!photoSrc && canEdit) ? h('p', { class: 'photo-hint', text: 'Only you see this note: add your photo in Dashboard, About me.' }) : null)),
          (p.experience && p.experience.length) ? h('div', { class: 'xp-wrap', id: 'experience' },
            h('span', { class: 'xp-label mono', text: 'Experience' }),
            h('div', { class: 'xp' }, p.experience.map(function (x) {
              return h('div', null, h('span', { class: 'when mono', text: x.period }), h('b', { text: x.org }), h('small', { text: x.role }));
            }))) : null),

        h('section', { class: 'section', id: 'contact' },
          h('div', { class: 'contact-grid' },
            h('div', null,
              h('span', { class: 'mono muted', text: p.contactEyebrow }),
              h('h2', { class: 'big' }, p.contactHeadA + (p.contactHeadEm ? ' ' : ''), p.contactHeadEm ? h('em', { text: p.contactHeadEm }) : null),
              p.contactText ? h('p', { class: 'lede', text: p.contactText }) : null),
            h('div', { class: 'contact-actions' },
              emailBlock,
              p.email ? null : h('p', { class: 'muted', text: canEdit ? "Add your email in Dashboard, Let's work together." : 'Contact details will be added soon.' }),
              contactLinks))),

        h('footer', { class: 'foot mono' }, h('span', { text: '© ' + new Date().getFullYear() + ' ' + p.name }), h('span', { text: p.location }), h('a', { href: '#home', text: 'Back to top' }))));
    return frag;
  }

  function copyText(text) {
    try {
      navigator.clipboard.writeText(text).then(function () { toast('Email copied'); }, function () { fallbackCopy(); });
    } catch (e) { fallbackCopy(); }
  }
  function fallbackCopy() {
    var a = $('.email-big');
    if (a) { var r = document.createRange(); r.selectNodeContents(a); var s = getSelection(); s.removeAllRanges(); s.addRange(r); }
    toast('Press Ctrl+C or Cmd+C to copy');
  }

  /* Project detail */
  function openProject(p, trigger) {
    if (overlayEl) { overlayEl.remove(); overlayEl = null; }
    var url = safeUrl(p.url);
    var vsrc = blobSrc(p.video);
    var media;
    if (vsrc) {
      media = h('video', { class: 'sheet-video', src: vsrc + '#t=0.1', controls: true, muted: true, playsinline: true, preload: 'metadata', poster: imgSrc(p.cover) ? p.cover : null });
    } else {
      media = h('div', { class: 'cover' }); applyCover(media, p);
    }
    var closeBtn = h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Close project', onclick: closeProject }, icon('close'));
    function caseSlug(t) { return String(t || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'project'; }
    var sheet = h('div', { class: 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': p.title },
      h('div', { class: 'sheet-top' },
        h('div', null, h('div', { class: 'mono muted', text: [p.category, p.year].filter(Boolean).join(' / ') }), h('h3', { text: p.title })),
        closeBtn),
      h('div', { class: 'sheet-body' },
        h('div', { class: 'sheet-media' }, media),
        h('div', { class: 'sheet-info' },
          p.summary ? h('p', { text: p.summary }) : null,
          (p.details || '').split(/\n\s*\n/).filter(Boolean).map(function (t) { return h('p', { class: 'muted', text: t }); }),
          h('dl', { class: 'mono' },
            p.role ? h('div', null, h('dt', { text: 'Role' }), h('dd', { text: p.role })) : null,
            p.year ? h('div', null, h('dt', { text: 'Period' }), h('dd', { text: p.year })) : null,
            h('div', null, h('dt', { text: 'Area' }), h('dd', { text: p.category }))),
          p.tags && p.tags.length ? h('div', { class: 'tags' }, p.tags.map(function (t) { return h('span', { class: 'tag', text: t }); })) : null,
          h('div', { class: 'actions' },
            h('a', { class: 'btn ghost', href: '/work/' + caseSlug(p.title) }, 'Read case study', icon('up')),
            url ? h('a', { class: 'btn', href: url, target: '_blank', rel: 'noopener noreferrer' }, 'Visit website', icon('up')) : null))));
    overlayEl = h('div', { class: 'overlay', onclick: function (e) { if (e.target === overlayEl) closeProject(); } }, sheet);
    overlayEl._trigger = trigger;
    document.body.append(overlayEl);
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
    if (window.gsap && !REDUCED) {
      window.gsap.from(overlayEl, { opacity: 0, duration: 0.25 });
      window.gsap.from(sheet, { y: 56, duration: 0.65, ease: 'power3.out' });
      window.gsap.from(sheet.children, { y: 18, duration: 0.6, stagger: 0.05, delay: 0.1, ease: 'power3.out' });
    }
  }
  function closeProject() {
    if (!overlayEl) return;
    var el = overlayEl, t = el._trigger;
    overlayEl = null;
    var v = $('video', el); if (v) v.pause();
    document.body.style.overflow = '';
    function fin() { el.remove(); if (t && t.focus) t.focus(); }
    if (window.gsap && !REDUCED) window.gsap.to(el, { opacity: 0, duration: 0.22, onComplete: fin });
    else fin();
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeProject(); });

  /* Dashboard */
  function stats() {
    var pr = state.projects;
    return {
      total: pr.length,
      pub: pr.filter(function (x) { return x.status === 'published'; }).length,
      draft: pr.filter(function (x) { return x.status !== 'published'; }).length,
      video: pr.filter(function (x) { return x.video; }).length
    };
  }
  function missingList() {
    var p = state.profile, m = [];
    if (!p.heroVideo) m.push('hero video');
    if (!p.photo) m.push('About photo');
    if (!p.fiverr) m.push('Fiverr link');
    if (!p.linkedin) m.push('LinkedIn link');
    var z = state.projects.filter(function (x) { return /zlenso/i.test(x.title); })[0];
    if (z && !z.url) m.push('Zlenso website');
    var nv = state.projects.filter(function (x) { return x.category === AI_CAT && !x.video; }).length;
    if (nv) m.push(nv + ' project videos');
    return m;
  }

  function updateBar() {
    var m = $('#bar-msg'), b = $('#publish-btn');
    if (m) {
      m.dataset.state = dirty ? 'dirty' : 'clean';
      m.textContent = publishing ? 'Publishing' : dirty ? 'Unpublished changes. Visitors still see the last published version.' : 'All changes are live.';
    }
    if (b) b.disabled = !dirty || publishing;
  }

  function errMessage(e) {
    var c = e && e.code;
    if (c === 'conflict') return 'The content was changed somewhere else since you opened this page. Reload to see the latest version. Your edits are kept as a draft.';
    if (c === 'unauthorized') return 'Your session has expired. Log in again. Your edits are kept as a draft.';
    if (c === 'db_not_configured') return 'The database is not connected yet. Set DATABASE_URL on the server (see README).';
    if (c === 'too_large') return 'The content is too large. Use smaller cover images and try again.';
    if (c === 'invalid') return (e && e.message) || 'Some content is not valid.';
    return 'Could not publish. Try again in a moment.';
  }

  function api(method, url, body) {
    return fetch(url, {
      method: method, credentials: 'same-origin',
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) throw { code: j.code || ('http_' + r.status), message: j.message, status: r.status };
        return j;
      });
    });
  }

  function doPublish() {
    if (publishing || !dirty) return;
    publishing = true; updateBar();
    persistDraft();
    api('PUT', '/api/content', { state: state, baseVersion: contentVersion }).then(function (r) {
      contentVersion = r.version;
      publishing = false; dirty = false; store('session', 'pf-draft', null);
      updateBar();
      toast('Published. The live site now shows these changes.');
    }).catch(function (e) {
      publishing = false; updateBar();
      if (e && e.status === 401) { canEdit = false; loginError = 'Your session expired. Log in again to publish.'; view = 'login'; render('full'); return; }
      if (e && e.code === 'conflict') {
        if (window.confirm('The saved copy on the server is different from what you have open (maybe it was edited in another tab or device).\n\nReplace it with what you see now?')) {
          api('GET', '/api/content').then(function (cur) {
            if ((cur.version || 0) === contentVersion) { toast('Could not save. Please try Publish again in a minute.'); return; }
            contentVersion = cur.version || 0; doPublish();
          })
            .catch(function () { toast('Could not reach the server. Try again in a moment.'); });
        } else {
          toast('Not published. Reload the page to see the saved copy (your edits are kept as a draft).');
        }
        return;
      }
      toast(errMessage(e));
    });
  }

  function doLogout() {
    api('POST', '/api/auth/logout', {}).catch(function () {}).then(function () {
      canEdit = false; view = 'site'; history.replaceState(null, '', '/');
      store('session', 'pf-draft', null);
      render('full');
    });
  }

  function renderLogin() {
    var err = h('p', { class: 'err', role: 'alert', text: loginError || '' });
    var pw = h('input', { type: 'password', id: 'l-pw', autocomplete: 'current-password', required: true, maxlength: '200' });
    var btn = h('button', { class: 'btn', type: 'submit' }, 'Log in');
    var form = h('form', { class: 'form', novalidate: true, style: 'max-width:460px;margin:12vh auto 0', onsubmit: function (e) {
      e.preventDefault();
      if (!pw.value) { err.textContent = 'Enter the admin password.'; return; }
      btn.disabled = true; err.textContent = '';
      api('POST', '/api/auth/login', { password: pw.value }).then(function () { return boot(); }).then(function () {
        loginError = ''; view = 'dash'; history.replaceState(null, '', '/admin'); render('full');
      }).catch(function (x) {
        btn.disabled = false; pw.value = '';
        err.textContent = x && x.code === 'rate_limited' ? 'Too many attempts. Try again in a few minutes.'
          : x && x.code === 'auth_not_configured' ? 'Admin login is not set up on the server yet (ADMIN_PASSWORD_HASH and SESSION_SECRET). See the README.'
          : 'That password is not right.';
        pw.focus();
      });
    } },
      h('div', { class: 'field full' }, h('span', { class: 'mono', text: 'Admin login' }),
        h('h1', { style: 'margin:6px 0 0;font:600 26px/1.1 var(--f-display);letter-spacing:-0.03em', text: 'Dashboard' })),
      authInfo.authConfigured === false ? h('p', { class: 'err full', text: 'Admin login is not configured on the server yet. Set ADMIN_PASSWORD_HASH and SESSION_SECRET (see README).' }) : null,
      field('l-pw', 'Password', pw),
      h('div', { class: 'full' }, err),
      h('div', { class: 'form-actions full' }, btn,
        h('a', { class: 'btn ghost', href: '/', onclick: function (e) { e.preventDefault(); view = 'site'; history.replaceState(null, '', '/'); render('full'); } }, 'Back to site')));
    return h('div', { class: 'dash wrap' }, form);
  }

  function go(v) { view = v; try { history.replaceState(null, '', v === 'dash' ? '/admin' : '/'); } catch (e) {} window.scrollTo(0, 0); render('full'); }

  function statTile(label, value) { return h('div', { class: 'tile' }, h('b', { text: String(value) }), h('span', { class: 'mono', text: label })); }

  function renderDash() {
    var s = stats();
    var miss = missingList();
    var root = h('div', { class: 'dash wrap' },
      h('div', { class: 'dash-head' },
        h('div', { class: 'left' }, h('a', { class: 'brand', href: '#', onclick: function (e) { e.preventDefault(); go('site'); }, 'aria-label': 'Back to site' }, 'K', h('span', { text: '.' })), h('h1', { text: 'Dashboard' })),
        h('div', { class: 'nav-right' }, h('button', { class: 'btn ghost small', type: 'button', onclick: function () { go('site'); } }, 'View site', icon('up')), h('button', { class: 'btn ghost small', type: 'button', onclick: doLogout }, 'Log out'), themeButton())),
      h('div', { class: 'bar' },
        h('span', { class: 'bar-msg', id: 'bar-msg', role: 'status' }),
        h('button', { class: 'btn', id: 'publish-btn', type: 'button', onclick: doPublish }, 'Publish changes')),
      draftOffer ? h('div', { class: 'note' }, h('span', { text: 'Unpublished edits from an earlier session were found in this browser.' }),
        h('span', { class: 'row-actions' },
          h('button', { class: 'btn small', type: 'button', onclick: function () { state = draftOffer; draftOffer = null; dirty = true; render(); } }, 'Restore edits'),
          h('button', { class: 'btn ghost small', type: 'button', onclick: function () { draftOffer = null; store('session', 'pf-draft', null); render(); } }, 'Discard'))) : null,
      miss.length ? h('div', { class: 'note' }, h('span', { text: 'Still to add: ' + miss.join(', ') + '.' })) : null,
      h('div', { class: 'tiles' }, statTile('Projects', s.total), statTile('Published', s.pub), statTile('Drafts', s.draft), statTile('With video', s.video)),
      h('div', { class: 'tabs', role: 'tablist' },
        ['projects', 'nav', 'hero', 'services', 'about', 'contact'].map(function (t) {
          return h('button', { class: 'tab', type: 'button', role: 'tab', 'aria-selected': String(tab === t), text: { projects: 'Projects', nav: 'Task bar', hero: 'Hero', services: 'What I do', about: 'About me', contact: "Let's work together" }[t], onclick: function () { tab = t; render(); } });
        })),
      tab === 'projects' ? projectsPanel() : profilePanel(tab));
    return root;
  }

  function projectsPanel() {
    var list = state.projects;
    var panel = h('div', { role: 'tabpanel' },
      h('div', { class: 'panel-head' }, h('h2', { text: 'Your projects' }),
        h('button', { class: 'btn small', type: 'button', onclick: function () { editor = blankProject(); render(); setTimeout(function () { var f = $('#f-title'); if (f) f.focus(); }, 0); } }, icon('plus'), 'Add project')));
    if (editor) panel.append(editorForm());
    if (!list.length) panel.append(h('p', { class: 'empty', text: 'No projects yet. Add your first one.' }));
    list.forEach(function (p, i) { panel.append(projectRow(p, i)); });
    return panel;
  }

  function projectRow(p, i) {
    var thumb = h('div', { class: 'thumb' }); applyCover(thumb, p);
    var live = p.status === 'published';
    var star = h('button', { class: 'icon-btn' + (p.featured ? ' on' : ''), type: 'button', 'aria-pressed': String(!!p.featured), 'aria-label': 'Pin ' + p.title + ' to the front', title: 'Pinned projects appear first on the site', onclick: function () { p.featured = !p.featured; markDirty(); render(); } }, icon('star'));
    var del = confirmId === p.id
      ? h('button', { class: 'icon-btn danger', type: 'button', onclick: function () { state.projects = state.projects.filter(function (x) { return x.id !== p.id; }); confirmId = null; markDirty(); render(); } }, 'Confirm delete')
      : h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Delete ' + p.title, title: 'Delete', onclick: function () { confirmId = p.id; render(); setTimeout(function () { if (confirmId === p.id) { confirmId = null; if (view === 'dash') render(); } }, 5000); } }, icon('trash'));
    return h('div', { class: 'prow' },
      thumb,
      h('div', { class: 'row-info' }, h('strong', { text: p.title || 'Untitled' }),
        h('span', { class: 'line' }, h('span', { class: 'mono muted', text: [p.category, p.year].filter(Boolean).join(' / ') }), p.video ? h('span', { class: 'tag-ex', text: 'Video' }) : (p.category === AI_CAT ? h('span', { class: 'tag-ex', text: 'No video yet' }) : null))),
      h('div', { class: 'pill-cell' }, h('span', { class: 'pill ' + (live ? 'ok' : 'warn') }, h('i'), live ? 'Published' : 'Draft')),
      h('div', { class: 'row-actions' },
        star,
        h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Move ' + p.title + ' up', disabled: i === 0, onclick: function () { swap(i, i - 1); } }, icon('arrowUp')),
        h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Move ' + p.title + ' down', disabled: i === state.projects.length - 1, onclick: function () { swap(i, i + 1); } }, icon('arrowDown')),
        h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Edit ' + p.title, title: 'Edit', onclick: function () { editor = clone(p); editor.tagsText = (p.tags || []).join(', '); editor.isNew = false; render(); var f = $('#f-title'); if (f) f.scrollIntoView({ block: 'center' }); } }, icon('edit')),
        del));
  }
  function swap(a, b) { var l = state.projects; var t = l[a]; l[a] = l[b]; l[b] = t; markDirty(); render(); }

  function blankProject() {
    return { id: uid(), title: '', category: CATS[0], year: '', role: '', summary: '', details: '', tags: [], tagsText: '', url: '', cover: '', video: '', status: 'published', featured: false, isNew: true };
  }

  function field(id, label, control, hint, full) {
    return h('div', { class: 'field' + (full ? ' full' : '') }, h('label', { for: id, class: 'mono', text: label }), control, hint ? h('small', { text: hint }) : null);
  }
  function bind(el, key, obj) { el.addEventListener('input', function () { obj[key] = el.value; }); return el; }

  function editorForm() {
    var d = editor;
    var errBox = h('span', { class: 'err', id: 'f-err', role: 'alert' });
    var vErr = h('span', { class: 'err', role: 'alert' });
    var thumb = h('div', { class: 'thumb' }); applyCover(thumb, d);
    var fileIn = h('input', { type: 'file', id: 'f-cover', accept: 'image/png,image/jpeg,image/webp,image/gif', onchange: function () {
      var f = fileIn.files && fileIn.files[0]; if (!f) return;
      fileToCover(f).then(function (data) { d.cover = data; applyCover(thumb, d); errBox.textContent = ''; }, function () { errBox.textContent = 'That file could not be read as an image. Use a PNG, JPG, WebP or GIF.'; });
    } });
    var wasFile = /^[0-9a-f]{32}$/.test(d.video || '');
    var vStatus = h('small', { text: wasFile ? 'This project uses a video file uploaded earlier. Paste a link to replace it.' : d.video ? 'Video link set.' : 'No video yet.' });
    var vIn = h('input', { type: 'url', id: 'f-video', value: wasFile ? '' : (d.video || ''), placeholder: 'https://example.com/video.mp4', autocomplete: 'off' });
    vIn.addEventListener('input', function () {
      var m = checkVideoUrl(vIn.value);
      vErr.textContent = m;
      if (!m) { d.video = vIn.value.trim(); vStatus.textContent = d.video ? 'Video link set. Save the project to keep it.' : 'No video yet.'; }
    });
    var catSel = h('select', { id: 'f-cat' }, CATS.map(function (c) { return h('option', { value: c, text: c }); }));
    catSel.value = d.category; catSel.addEventListener('change', function () { d.category = catSel.value; });
    var statSel = h('select', { id: 'f-status' }, h('option', { value: 'published', text: 'Published (visible on the site)' }), h('option', { value: 'draft', text: 'Draft (hidden from visitors)' }));
    statSel.value = d.status; statSel.addEventListener('change', function () { d.status = statSel.value; });
    var feat = h('input', { type: 'checkbox', id: 'f-feat', checked: d.featured, onchange: function (e) { d.featured = e.target.checked; } });

    return h('form', { class: 'form', novalidate: true, onsubmit: function (e) { e.preventDefault(); saveProject(errBox); } },
      field('f-title', 'Title', bind(h('input', { type: 'text', id: 'f-title', value: d.title, maxlength: '90', autocomplete: 'off' }), 'title', d), null, true),
      field('f-cat', 'Category', catSel),
      field('f-year', 'Year or period', bind(h('input', { type: 'text', id: 'f-year', value: d.year, maxlength: '12' }), 'year', d)),
      field('f-role', 'Your role', bind(h('input', { type: 'text', id: 'f-role', value: d.role, maxlength: '90' }), 'role', d)),
      field('f-url', 'Website link', bind(h('input', { type: 'url', id: 'f-url', value: d.url, placeholder: 'https://', autocomplete: 'off' }), 'url', d), 'Optional. Adds a Visit website button.'),
      field('f-sum', 'Short summary', bind(h('textarea', { id: 'f-sum', value: d.summary, maxlength: '200', rows: '3' }), 'summary', d), 'Shown on the card. Up to 200 characters.', true),
      field('f-det', 'Full description', bind(h('textarea', { id: 'f-det', value: d.details, rows: '6' }), 'details', d), 'Shown when a visitor opens the project. Leave a blank line between paragraphs.', true),
      field('f-tags', 'Tags', bind(h('input', { type: 'text', id: 'f-tags', value: d.tagsText || '' }), 'tagsText', d), 'Separate with commas. Up to eight.', true),
      h('div', { class: 'field full' }, h('span', { class: 'lab mono', text: 'Cover image' }),
        h('div', { class: 'cover-edit' }, thumb, fileIn,
          h('button', { class: 'btn ghost small', type: 'button', onclick: function () { d.cover = ''; applyCover(thumb, d); fileIn.value = ''; } }, 'Remove cover')),
        h('small', { text: 'Best as a 16:9 image, for example 1920 x 1080. It is resized to fit the page. Without one, a chrome pattern is generated.' })),
      h('div', { class: 'field full' }, h('label', { class: 'mono', for: 'f-video', text: 'Video link' }),
        vIn,
        h('div', { class: 'cover-edit' }, h('button', { class: 'btn ghost small', type: 'button', onclick: function () { d.video = ''; vIn.value = ''; vErr.textContent = ''; vStatus.textContent = 'No video yet.'; } }, 'Remove video')),
        vStatus, vErr, h('small', { text: 'Paste a direct link to a 16:9 .mp4 or .webm file (not a YouTube or Drive page link). It previews silently when a visitor hovers the card, and plays with controls when the project is opened.' })),
      field('f-status', 'Status', statSel),
      h('div', { class: 'field' }, h('span', { class: 'lab mono', text: 'Pin to front' }), h('label', { class: 'check', for: 'f-feat' }, feat, 'Show first on the site')),
      h('div', { class: 'field full' }, errBox, h('div', { class: 'form-actions' },
        h('button', { class: 'btn', type: 'submit' }, d.isNew ? 'Add project' : 'Save project'),
        h('button', { class: 'btn ghost', type: 'button', onclick: function () { editor = null; render(); } }, 'Cancel'))));
  }

  function saveProject(errBox) {
    var d = editor;
    if (!d.title.trim()) { errBox.textContent = 'Give the project a title.'; var t = $('#f-title'); if (t) t.focus(); return; }
    var url = d.url && d.url.trim() ? safeUrl(d.url) : '';
    if (d.url && d.url.trim() && !url) { errBox.textContent = 'That link is not a valid web address.'; return; }
    var rec = {
      id: d.id, title: d.title.trim(), category: d.category, year: (d.year || '').trim(), role: (d.role || '').trim(),
      summary: (d.summary || '').trim(), details: (d.details || '').trim(),
      tags: (d.tagsText || '').split(',').map(function (x) { return x.trim(); }).filter(Boolean).slice(0, 8),
      url: url, cover: d.cover || '', video: d.video || '', status: d.status, featured: !!d.featured
    };
    var idx = state.projects.findIndex(function (x) { return x.id === rec.id; });
    if (idx >= 0) state.projects[idx] = rec; else state.projects.unshift(rec);
    editor = null; markDirty(); render();
    toast(rec.status === 'published' ? 'Saved. Publish changes to put it on the site.' : 'Saved as a draft.');
  }

  function fileToCover(file) {
    return new Promise(function (res, rej) {
      if (!/^image\/(png|jpe?g|webp|gif)$/.test(file.type)) return rej(new Error('type'));
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        var s = Math.min(1, 1000 / Math.max(img.width, img.height));
        var w = Math.max(1, Math.round(img.width * s)), hh = Math.max(1, Math.round(img.height * s));
        var c = document.createElement('canvas'); c.width = w; c.height = hh;
        var x = c.getContext('2d'); x.fillStyle = '#111'; x.fillRect(0, 0, w, hh); x.drawImage(img, 0, 0, w, hh);
        URL.revokeObjectURL(url);
        res(c.toDataURL('image/jpeg', 0.78));
      };
      img.onerror = function () { URL.revokeObjectURL(url); rej(new Error('read')); };
      img.src = url;
    });
  }

  function fileToSquare(file, size) {
    return new Promise(function (res, rej) {
      if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) return rej(new Error('type'));
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        var s = Math.min(img.width, img.height);
        var sx = (img.width - s) / 2;
        var sy = (img.height - s) * 0.2;
        var c = document.createElement('canvas'); c.width = size; c.height = size;
        var x = c.getContext('2d'); x.fillStyle = '#111'; x.fillRect(0, 0, size, size);
        x.drawImage(img, sx, sy, s, s, 0, 0, size, size);
        URL.revokeObjectURL(url);
        res(c.toDataURL('image/jpeg', 0.86));
      };
      img.onerror = function () { URL.revokeObjectURL(url); rej(new Error('read')); };
      img.src = url;
    });
  }

  function profilePanel(which) {
    var p = state.profile;
    if (!p.experience) p.experience = [];
    function inp(id, key, label, hint, full, type) {
      return field(id, label, h('input', { type: type || 'text', id: id, value: p[key] || '', autocomplete: 'off', oninput: function (e) { p[key] = e.target.value; markDirty(); } }), hint, full);
    }
    function area(id, key, label, hint, rows) {
      return field(id, label, h('textarea', { id: id, rows: String(rows || 4), value: p[key] || '', oninput: function (e) { p[key] = e.target.value; markDirty(); } }), hint, true);
    }
    function panel(title, intro, kids) {
      return h('div', { role: 'tabpanel' },
        h('div', { class: 'panel-head' }, h('h2', { text: title })),
        h('p', { class: 'muted', style: 'margin:0 0 4px', text: intro }),
        h('div', { class: 'form' }, kids));
    }

    if (which === 'nav') {
      return panel('Task bar', 'The four links in the bar at the top of the site. Each one scrolls to its section.', [
        inp('p-n1', 'navServices', 'Link 1 (goes to What I do)'),
        inp('p-n3', 'navAbout', 'Link 2 (goes to About me)'),
        inp('p-n4', 'navExperience', 'Link 3 (goes to Experience)'),
        inp('p-n5', 'navContact', 'Link 4 (goes to Let\'s work together)')
      ]);
    }

    if (which === 'services') {
      var capBox = h('div', { class: 'field full' }, h('span', { class: 'lab mono', text: 'Areas' }));
      p.caps.forEach(function (c, i) {
        capBox.append(h('div', { class: 'xp-edit', style: 'display:grid;grid-template-columns:1fr;gap:8px;padding:14px 0;border-top:1px solid var(--line, rgba(128,128,128,.3))' },
          h('input', { type: 'text', value: c.title, 'aria-label': 'Area ' + (i + 1) + ' title', placeholder: 'Title', maxlength: '200', oninput: function (e) { c.title = e.target.value; markDirty(); } }),
          h('textarea', { rows: '3', 'aria-label': 'Area ' + (i + 1) + ' text', placeholder: 'Description', value: c.text, oninput: function (e) { c.text = e.target.value; markDirty(); } }),
          h('input', { type: 'text', value: c.keywords, 'aria-label': 'Area ' + (i + 1) + ' keywords', placeholder: 'Keywords, separated by commas', oninput: function (e) { c.keywords = e.target.value; markDirty(); } }),
          h('div', null,
            h('button', { class: 'btn ghost small', type: 'button', disabled: i === 0, onclick: function () { p.caps.splice(i - 1, 0, p.caps.splice(i, 1)[0]); markDirty(); render(); } }, 'Move up'), ' ',
            h('button', { class: 'btn ghost small', type: 'button', disabled: i === p.caps.length - 1, onclick: function () { p.caps.splice(i + 1, 0, p.caps.splice(i, 1)[0]); markDirty(); render(); } }, 'Move down'), ' ',
            h('button', { class: 'btn ghost small', type: 'button', onclick: function () { p.caps.splice(i, 1); markDirty(); render(); } }, icon('trash'), 'Remove'))));
      });
      capBox.append(h('div', null, h('button', { class: 'btn ghost small', type: 'button', onclick: function () { p.caps.push({ title: '', text: '', keywords: '' }); markDirty(); render(); } }, icon('plus'), 'Add area')));
      return panel('What I do', 'The services section: heading, the small line beside it, and each area with its description and keywords.', [
        inp('p-sha', 'servicesHeadA', 'Heading, first part'),
        inp('p-she', 'servicesHeadEm', 'Heading, accent part', 'Shown in green italics. Leave empty for none.'),
        inp('p-stag', 'servicesTag', 'Small line beside the heading', 'Leave empty for none.', true),
        capBox
      ]);
    }

    if (which === 'hero') {
      var hvErr = h('span', { class: 'err', role: 'alert' });
      var hvWasFile = /^[0-9a-f]{32}$/.test(p.heroVideo || '');
      var hvStatus = h('small', { text: hvWasFile ? 'The hero uses a video file uploaded earlier. Paste a link to replace it.' : p.heroVideo ? 'Hero video link set.' : 'No hero video yet. The chrome ring shows instead.' });
      var hvIn = h('input', { type: 'url', id: 'p-hv', value: hvWasFile ? '' : (p.heroVideo || ''), placeholder: 'https://example.com/hero.mp4', autocomplete: 'off' });
      hvIn.addEventListener('input', function () {
        var m = checkVideoUrl(hvIn.value);
        hvErr.textContent = m;
        if (!m) { p.heroVideo = hvIn.value.trim(); hvStatus.textContent = p.heroVideo ? 'Hero video link set. Publish to show it.' : 'No hero video yet. The chrome ring shows instead.'; markDirty(); }
      });
      var hpErr = h('span', { class: 'err', role: 'alert' });
      var hpThumb = h('div', { class: 'thumb' });
      function paintPoster() { hpThumb.style.backgroundImage = imgSrc(p.heroPoster) ? 'url("' + p.heroPoster + '")' : 'none'; }
      paintPoster();
      var hpIn = h('input', { type: 'file', id: 'p-hp', accept: 'image/png,image/jpeg,image/webp', onchange: function () {
        var f = hpIn.files && hpIn.files[0]; if (!f) return;
        fileToCover(f).then(function (data) { p.heroPoster = data; hpErr.textContent = ''; paintPoster(); markDirty(); },
          function () { hpErr.textContent = 'That file could not be read. Use a PNG, JPG or WebP image.'; });
      } });
      return panel('Hero', 'The first screen of the site: the line above the headline, the three headline lines, the paragraph, the background video and the bottom strip.', [
        inp('p-name', 'name', 'Name (above the headline)'),
        inp('p-title', 'title', 'Professional title', 'Shown after the name, above the headline.'),
        inp('p-ha', 'headlineA', 'Headline, line 1'),
        inp('p-hb', 'headlineB', 'Headline, line 2'),
        inp('p-hem', 'headlineEm', 'Headline, line 3 (accent)'),
        area('p-intro', 'intro', 'Hero paragraph', 'One or two sentences.', 3),
        inp('p-loc', 'location', 'Location', 'Shown at the bottom of the hero and in the footer.'),
        inp('p-scroll', 'scrollLabel', 'Scroll link text', 'The small link at the bottom right of the hero.'),
        field('p-hbtn', 'Hero button text', h('input', { type: 'text', id: 'p-hbtn', value: p.heroButton === undefined ? 'Explore Projects' : p.heroButton, autocomplete: 'off', oninput: function (e) { p.heroButton = e.target.value; markDirty(); } }), 'The button under the intro that jumps to Projects. Leave empty to hide it.'),
        h('div', { class: 'field full' }, h('label', { class: 'mono', for: 'p-hv', text: 'Hero video link (loops behind the headline)' }),
          hvIn,
          h('div', { class: 'cover-edit' }, h('button', { class: 'btn ghost small', type: 'button', onclick: function () { p.heroVideo = ''; p.heroPoster = ''; hvIn.value = ''; hvErr.textContent = ''; paintPoster(); hvStatus.textContent = 'No hero video yet. The chrome ring shows instead.'; markDirty(); } }, 'Remove video')),
          hvStatus, hvErr, h('small', { text: 'Paste a direct link to an .mp4 or .webm file. It plays muted and looped behind the headline.' })),
        h('div', { class: 'field full' }, h('label', { class: 'mono', for: 'p-hp', text: 'Hero poster image (optional)' }),
          h('div', { class: 'cover-edit' }, hpThumb, hpIn, h('button', { class: 'btn ghost small', type: 'button', onclick: function () { p.heroPoster = ''; hpIn.value = ''; paintPoster(); markDirty(); } }, 'Remove poster')),
          hpErr, h('small', { text: 'Shown while the video loads.' }))
      ]);
    }

    if (which === 'about') {
      var phErr = h('span', { class: 'err', role: 'alert' });
      var phPrev = h('div', { class: 'photo-prev', role: 'img', 'aria-label': 'Photo preview' });
      function paintPhoto() { phPrev.style.backgroundImage = imgSrc(p.photo) ? 'url("' + p.photo + '")' : 'none'; }
      paintPhoto();
      var phIn = h('input', { type: 'file', id: 'p-photo', accept: 'image/png,image/jpeg,image/webp', onchange: function () {
        var f = phIn.files && phIn.files[0]; if (!f) return;
        fileToSquare(f, 900).then(function (data) { p.photo = data; phErr.textContent = ''; paintPhoto(); markDirty(); toast('Photo added. Publish changes to show it on the site.'); },
          function () { phErr.textContent = 'That file could not be read. Use a PNG, JPG or WebP image.'; });
      } });
      var photoField = h('div', { class: 'field full' }, h('label', { class: 'mono', for: 'p-photo', text: 'About photo' }),
        h('div', { class: 'cover-edit' }, phPrev, phIn,
          h('button', { class: 'btn ghost small', type: 'button', onclick: function () { p.photo = ''; phIn.value = ''; paintPhoto(); markDirty(); } }, 'Remove photo')),
        phErr, h('small', { text: 'Shown as a circle next to your About text. It is cropped to a square from the centre, a little toward the top, so use a portrait with your face in the upper half.' }));
      var xp = h('div', { class: 'field full' }, h('span', { class: 'lab mono', text: 'Experience' }));
      p.experience.forEach(function (x, i) {
        xp.append(h('div', { class: 'xp-edit' },
          h('input', { type: 'text', value: x.org, 'aria-label': 'Organisation', placeholder: 'Organisation', oninput: function (e) { x.org = e.target.value; markDirty(); } }),
          h('input', { type: 'text', value: x.role, 'aria-label': 'Role', placeholder: 'Role', oninput: function (e) { x.role = e.target.value; markDirty(); } }),
          h('input', { type: 'text', value: x.period, 'aria-label': 'Period', placeholder: 'Period', oninput: function (e) { x.period = e.target.value; markDirty(); } }),
          h('div', { style: 'display:flex;gap:6px' },
            h('button', { class: 'icon-btn', type: 'button', disabled: i === 0, 'aria-label': 'Move ' + (x.org || 'role') + ' up', title: 'Move up', onclick: function () { p.experience.splice(i - 1, 0, p.experience.splice(i, 1)[0]); markDirty(); render(); } }, icon('up')),
            h('button', { class: 'icon-btn', type: 'button', disabled: i === p.experience.length - 1, 'aria-label': 'Move ' + (x.org || 'role') + ' down', title: 'Move down', onclick: function () { p.experience.splice(i + 1, 0, p.experience.splice(i, 1)[0]); markDirty(); render(); } }, icon('down')),
            h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Remove ' + (x.org || 'role'), onclick: function () { p.experience.splice(i, 1); markDirty(); render(); } }, icon('trash')))));
      });
      xp.append(h('div', null, h('button', { class: 'btn ghost small', type: 'button', onclick: function () { p.experience.push({ org: '', role: '', period: '' }); markDirty(); render(); } }, icon('plus'), 'Add role'), ' ', h('button', { class: 'btn ghost small', type: 'button', onclick: function () { p.experience.unshift({ org: '', role: '', period: '' }); markDirty(); render(); } }, icon('plus'), 'Add role at top')));
      return panel('About me', 'The dark About section: heading, name, line under the name, text, skills, photo and experience.', [
        inp('p-ah', 'aboutHeading', 'Section heading'),
        inp('p-fname', 'fullName', 'Full name (About heading)'),
        inp('p-tagline', 'tagline', 'Line under the name', 'For example: Technology · Operations · Growth.', true),
        area('p-about', 'about', 'About text', 'Leave a blank line between paragraphs. Lines break automatically after 11 words.', 8),
        inp('p-skills', 'skills', 'Skills line', 'Shown under the About text after "Skills:". Separate with commas.', true),
        inp('p-resume', 'resumeUrl', 'Resume link (PDF)', 'The file the resume button downloads. Paste an https link, or a /media/... path on this site. Leave empty to hide the button.', true, 'text'),
        inp('p-resume-label', 'resumeLabel', 'Resume button text', 'For example: Download resume, or Resume.'),
        photoField,
        xp
      ]);
    }

    var avail = h('input', { type: 'checkbox', id: 'p-avail', checked: p.available, onchange: function (e) { p.available = e.target.checked; markDirty(); } });
    return panel("Let's work together", 'The contact section at the bottom of the site.', [
      inp('p-ce', 'contactEyebrow', 'Small label above the heading'),
      inp('p-cha', 'contactHeadA', 'Heading, first part'),
      inp('p-che', 'contactHeadEm', 'Heading, accent part', 'Shown in green italics after the first part. Leave empty for none.'),
      area('p-ct', 'contactText', 'Paragraph', 'One or two sentences under the heading.', 3),
      inp('p-cb', 'contactButton', 'Email button text'),
      inp('p-email', 'email', 'Contact email', 'The Email button opens a message to this address.', false, 'email'),
      inp('p-fiverr', 'fiverr', 'Fiverr profile link', 'Adds a Fiverr button when filled in.', false, 'url'),
      inp('p-li', 'linkedin', 'LinkedIn link', 'Adds a LinkedIn button when filled in.', false, 'url'),
      h('div', { class: 'field' }, h('span', { class: 'lab mono', text: 'Availability' }), h('label', { class: 'check', for: 'p-avail' }, avail, 'Show "Available for work"'))
    ]);
  }

  /* Motion: GSAP intro curtain, masked text reveals, scroll reveals and pointer parallax.
     Text and media only ever start offset, so everything is visible at rest. */
  var gctx = null;
  var introDone = false;
  var introTl = null;
  var settleFn = null;
  var cardSetup = null;

  function splitWords(el) {
    var out = [];
    Array.prototype.slice.call(el.childNodes).forEach(function (n) {
      if (n.nodeType === 3) {
        var f = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(function (t) {
          if (!t) return;
          if (/^\s+$/.test(t)) { f.append(document.createTextNode(' ')); return; }
          var o = document.createElement('span'); o.className = 'word';
          var i = document.createElement('span'); i.className = 'wi'; i.textContent = t;
          o.append(i); f.append(o); out.push(i);
        });
        n.replaceWith(f);
      } else if (n.nodeType === 1) {
        var o2 = document.createElement('span'); o2.className = 'word';
        n.replaceWith(o2); n.classList.add('wi'); o2.append(n); out.push(n);
      }
    });
    return out;
  }

  function playCurtain(g) {
    var letters = 'KASHAN'.split('').map(function (ch) { return h('span', { text: ch }); });
    var name = h('span', { class: 'curtain-name' }, letters);
    var bar = h('i');
    var count = h('span', { class: 'curtain-count', text: '000' });
    var c = h('div', { class: 'curtain', 'aria-hidden': 'true' }, h('span', { class: 'curtain-mask' }, name), h('span', { class: 'curtain-bar' }, bar), count);
    document.body.append(c);
    var done = false;
    function end() { if (done) return; done = true; c.remove(); }
    setTimeout(end, 5000);
    var n = { v: 0 };
    g.timeline({ onComplete: end })
      .fromTo(letters, { yPercent: 115 }, { yPercent: 0, duration: 0.8, stagger: 0.07, ease: 'power4.out' }, 0)
      .fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: 1.5, ease: 'power2.inOut' }, 0)
      .to(n, { v: 100, duration: 1.5, ease: 'power2.inOut', onUpdate: function () { count.textContent = String(Math.round(n.v)).padStart(3, '0'); } }, 0)
      .to(letters, { yPercent: -115, duration: 0.5, stagger: 0.04, ease: 'power3.in' }, 1.65)
      .to([bar.parentNode, count], { opacity: 0, duration: 0.3 }, 1.65)
      .to(c, { yPercent: -100, duration: 0.9, ease: 'power4.inOut' }, 2.1);
    return 2.4;
  }

  /* Project cards tilt a few degrees toward the pointer (mouse only). */
  function tiltCards(root) {
    var g = window.gsap;
    return; /* tilt removed */
    g.utils.toArray('.card', root).forEach(function (card) {
      g.set(card, { transformPerspective: 900 });
      var qx = g.quickTo(card, 'rotationX', { duration: 0.7, ease: 'power3' });
      var qy = g.quickTo(card, 'rotationY', { duration: 0.7, ease: 'power3' });
      card.addEventListener('pointermove', function (e) {
        if (e.pointerType === 'touch') return;
        var r = card.getBoundingClientRect();
        qy(((e.clientX - r.left) / r.width - 0.5) * 9);
        qx(-((e.clientY - r.top) / r.height - 0.5) * 9);
      });
      card.addEventListener('pointerleave', function () { qx(0); qy(0); });
    });
  }

  function animate(mode) {
    var g = window.gsap;
    if (!g || REDUCED) return;
    if (window.ScrollTrigger) g.registerPlugin(window.ScrollTrigger);
    var ST = window.ScrollTrigger;
    var fine = !!(window.matchMedia && matchMedia('(pointer: fine)').matches);
    var TA = 'restart reset restart reset';
    var heroTl = null;
    var settleReady = false;
    setTimeout(function () { settleReady = true; }, 3000);
    if (ST) {
      if (settleFn) ST.removeEventListener('refresh', settleFn);
      settleFn = function () {
        if (!settleReady) return;
        ST.getAll().forEach(function (t) {
          var a = t.animation;
          if (t.isActive && a && t.vars && t.vars.toggleActions === TA && a.progress() === 0 && !a.isActive()) a.progress(1);
        });
      };
      ST.addEventListener('refresh', settleFn);
    }
    gctx = g.context(function () {
      if (view === 'dash') {
        if (mode === 'full') g.from('.dash-head, .bar, .tile, .tabs', { y: 24, duration: 0.8, stagger: 0.06, ease: 'power3.out' });
        return;
      }
      var hasRing = !!$('.chrome', app);
      var hero = $('.hero', app);

      {
        var delay = 0;
        var isFull = mode === 'full';
        if (isFull && !introDone) { delay = playCurtain(g); introDone = true; }
        if (isFull) g.fromTo('.nav-in', { y: -34 }, { y: 0, duration: 1, delay: delay, ease: 'power4.out' });
        var tl = g.timeline({ delay: delay, defaults: { ease: 'power4.out' } });
        heroTl = tl; introTl = isFull ? tl : null;
        tl.fromTo('.eyebrow', { y: 22 }, { y: 0, duration: 1 }, 0.05)
          .fromTo('.display .ln', { yPercent: 118 }, { yPercent: 0, duration: 1.4, stagger: 0.13 }, 0.1)
          .fromTo('.lede, .actions', { y: 30 }, { y: 0, duration: 1.1, stagger: 0.12 }, 0.6)
          .fromTo('.hero-meta', { y: 20 }, { y: 0, duration: 1 }, 0.85);
        if ($('.hero-bg', app)) tl.fromTo('.hero-bg', { opacity: 0 }, { opacity: 1, duration: 2, ease: 'power2.out' }, 0);
        if (hasRing) {
          tl.fromTo('.chrome', { scale: 0.78, rotate: -28 }, { scale: 1, rotate: 0, duration: 2.2, ease: 'power3.out' }, 0)
            .fromTo('.chrome-inner', { scale: 0.55 }, { scale: 1, duration: 2.2, ease: 'power3.out' }, 0.1);
        }
        if (!isFull) tl.progress(1);
      }

      cardSetup = null;
      if (ST) {
        var heroTrig = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.8 };
        g.fromTo('.hero-copy', { y: 0 }, { y: -60, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.8 } });
        ST.create({ trigger: '.hero', start: 'top top', end: 'bottom top', onEnterBack: function () { if (heroTl) heroTl.restart(false); } });
        if (hasRing) {
          g.fromTo('.chrome', { y: 0 }, { y: 120, ease: 'none', scrollTrigger: heroTrig });
          g.fromTo('.chrome-inner', { rotation: 0, y: 0 }, { rotation: 150, y: 50, ease: 'none', scrollTrigger: heroTrig });
        }
        if ($('.hero-bg video', app)) g.fromTo('.hero-bg video', { scale: 1 }, { scale: 1.1, ease: 'none', scrollTrigger: heroTrig });
      }
      if (hasRing) g.to('.chrome-inner', { yPercent: -3, duration: 4.5, repeat: -1, yoyo: true, ease: 'sine.inOut' });

      if (fine) {
        if (hasRing && hero) {
          var qa = g.quickTo($('.chrome', app), 'x', { duration: 1.1, ease: 'power3' });
          var qb = g.quickTo($('.chrome-inner', app), 'x', { duration: 1.4, ease: 'power3' });
          hero.addEventListener('pointermove', function (e) {
            var r = hero.getBoundingClientRect();
            var nx = (e.clientX - r.left) / r.width - 0.5;
            qa(nx * 56); qb(nx * -96);
          });
          hero.addEventListener('pointerleave', function () { qa(0); qb(0); });
        }
        g.utils.toArray('.hero .btn, .contact-actions .btn, .about-cta').forEach(function (b) {
          var qx = g.quickTo(b, 'x', { duration: 0.4, ease: 'power3' });
          var qy = g.quickTo(b, 'y', { duration: 0.4, ease: 'power3' });
          b.addEventListener('pointermove', function (e) {
            var r = b.getBoundingClientRect();
            qx((e.clientX - r.left - r.width / 2) * 0.25);
            qy((e.clientY - r.top - r.height / 2) * 0.25);
          });
          b.addEventListener('pointerleave', function () { qx(0); qy(0); });
        });
      }

      tiltCards(app);

      var track = $('.marquee-track', app);
      if (track) {
        var drift = g.to(track, { xPercent: -50, duration: 38, ease: 'none', repeat: -1 });
        if (ST) ST.create({ onUpdate: function (self) {
          drift.timeScale(1 + Math.min(5, Math.abs(self.getVelocity()) / 400));
          g.to(drift, { timeScale: 1, duration: 0.9, overwrite: true });
        } });
      }

      if (ST) {

        g.utils.toArray('h2.title, h2.big').forEach(function (hd) {
          var words = splitWords(hd);
          g.fromTo(words, { yPercent: 118 }, { yPercent: 0, duration: 1.25, stagger: 0.07, ease: 'power4.out', scrollTrigger: { trigger: hd, start: 'top 90%', toggleActions: TA } });
        });
        g.utils.toArray('.section-head > :not(h2):not(.chips), .contact-grid .lede, .contact-actions > *, .empty, .foot').forEach(function (el) {
          g.fromTo(el, { y: 40 }, { y: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 94%', toggleActions: TA } });
        });

        g.utils.toArray('.cap').forEach(function (row) {
          var words = splitWords(row.querySelector('h3'));
          var t = g.timeline({ scrollTrigger: { trigger: row, start: 'top 88%', toggleActions: TA }, defaults: { ease: 'power4.out' } });
          t.fromTo(words, { yPercent: 118 }, { yPercent: 0, duration: 1.2, stagger: 0.08 })
            .fromTo(row.querySelectorAll('p, .kw span'), { y: 24 }, { y: 0, duration: 0.9, stagger: 0.05, ease: 'power3.out' }, '-=0.8');
        });

        g.utils.toArray('.about-copy > *').forEach(function (el) {
          g.fromTo(el, { y: 40 }, { y: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 92%', toggleActions: TA } });
        });
        var aph = $('.about-photo', app);
        if (aph) {
          g.fromTo(aph, { clipPath: 'circle(0% at 50% 50%)' }, { clipPath: 'circle(75% at 50% 50%)', duration: 1.5, ease: 'power4.out', scrollTrigger: { trigger: aph, start: 'top 88%', toggleActions: TA } });
          var aim = $('img', aph);
          if (aim) g.fromTo(aim, { yPercent: -4 }, { yPercent: 4, ease: 'none', scrollTrigger: { trigger: aph, start: 'top bottom', end: 'bottom top', scrub: true } });
        }
        if ($('.xp', app)) g.fromTo('.xp > div', { y: 34 }, { y: 0, duration: 0.9, stagger: 0.12, ease: 'power3.out', scrollTrigger: { trigger: '.xp', start: 'top 88%', toggleActions: TA } });

        var setupCards = function (root) {
          g.utils.toArray('.card', root).forEach(function (el, i) {
            var lag = (i % 3) * 0.1;
            var t = g.timeline({ scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: TA }, defaults: { ease: 'power4.out' }, delay: lag });
            t.fromTo(el.querySelector('.cover'), { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3 })
              .fromTo(el.querySelectorAll(':scope > .card-meta, :scope > .card-title, :scope > p, :scope > .card-cta'), { y: 28 }, { y: 0, duration: 1, stagger: 0.07, ease: 'power3.out' }, '-=0.9');
          });
          g.utils.toArray('.card .cover', root).forEach(function (c) {
            g.fromTo(c, { '--py': '-7%' }, { '--py': '7%', ease: 'none', scrollTrigger: { trigger: c, start: 'top bottom', end: 'bottom top', scrub: true } });
          });
        };
        setupCards(app);
        cardSetup = function (root) { if (gctx) gctx.add(function () { setupCards(root); }); };
      }
    }, app);
  }

  /* Animated cursor: a dot plus a trailing ring that grows over links and says View over projects. */
  var cur = null;
  function syncCursor() {
    var g = window.gsap;
    var want = !!g && !REDUCED && view === 'site' && !!(window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches);
    if (!want) {
      if (cur) { cur.destroy(); cur = null; }
      document.documentElement.classList.remove('has-cursor');
      return;
    }
    if (cur) return;
    var dot = h('div', { class: 'cursor-dot', 'aria-hidden': 'true' });
    var label = h('span', { class: 'cursor-label mono' });
    var ring = h('div', { class: 'cursor-ring', 'aria-hidden': 'true' }, label);
    document.body.append(dot, ring);
    g.set([dot, ring], { xPercent: -50, yPercent: -50, x: -200, y: -200, opacity: 0 });
    var dx = g.quickTo(dot, 'x', { duration: 0.1, ease: 'power3' }), dy = g.quickTo(dot, 'y', { duration: 0.1, ease: 'power3' });
    var rx = g.quickTo(ring, 'x', { duration: 0.5, ease: 'power3' }), ry = g.quickTo(ring, 'y', { duration: 0.5, ease: 'power3' });
    var mode = '';
    function setMode(m, text) {
      if (m === mode && label.textContent === (text || '')) return;
      mode = m;
      ring.classList.toggle('is-link', m === 'link');
      ring.classList.toggle('is-view', m === 'view');
      dot.classList.toggle('is-hidden', m === 'view');
      label.textContent = text || '';
    }
    function onMove(e) {
      if (!document.documentElement.classList.contains('has-cursor')) {
        document.documentElement.classList.add('has-cursor');
        g.set([dot, ring], { x: e.clientX, y: e.clientY });
      }
      g.to([dot, ring], { opacity: 1, duration: 0.3, overwrite: 'auto' });
      dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
      var t = e.target && e.target.closest ? e.target : null;
      if (t && t.closest('a, button, .chip, label, [role="button"]')) setMode('link', '');
      else setMode('', '');
    }
    function onDown() { g.to(ring, { scale: 0.8, duration: 0.2 }); }
    function onUp() { g.to(ring, { scale: 1, duration: 0.4, ease: 'back.out(2)' }); }
    function onOut(e) { if (!e.relatedTarget) g.to([dot, ring], { opacity: 0, duration: 0.2, overwrite: 'auto' }); }
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointerout', onOut);
    cur = { destroy: function () {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointerout', onOut);
      dot.remove(); ring.remove();
    } };
  }

  function render(mode) {
    if (adminPending) return;
    normCats();
    var top = window.scrollY;
    if (gctx) { gctx.revert(); gctx = null; }
    clearPreviews();
    app.replaceChildren();
    if (view === 'dash' && !canEdit) view = 'login';
    if (view === 'login') app.append(renderLogin());
    else if (view === 'dash') { app.append(renderDash()); updateBar(); }
    else { view = 'site'; app.append(renderSite()); }
    fitLayout();
    window.scrollTo(0, top);
    animate(mode);
    syncCursor();
  }
  /* Anchor links scroll smoothly through script. A CSS smooth-scroll rule makes ScrollTrigger measure positions wrongly after a refresh, which hid headings. */
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (!a) return;
    var id = a.getAttribute('href').slice(1);
    var t = id ? document.getElementById(id) : null;
    if (!t) return;
    e.preventDefault();
    t.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  render('full');
  document.documentElement.classList.remove('booting');
  if (document.fonts && document.fonts.ready && window.ScrollTrigger) {
    document.fonts.ready.then(function () { window.ScrollTrigger.refresh(); });
  }

  /* Admin session: asked after first paint so public visitors never wait for it. */
  function boot() {
    return api('GET', '/api/auth/me').then(function (me) {
      authInfo = me;
      if (!me.authenticated) return false;
      canEdit = true;
      /* Make sure the dashboard edits the latest saved copy, even if the page fell back to the built-in content while loading. */
      return api('GET', '/api/content').then(function (cur) {
        if (cur && cur.state && (cur.version || 0) !== contentVersion && !dirty) { state = cur.state; contentVersion = cur.version || 0; }
      }).catch(function () {}).then(function () {
      var raw = store('session', 'pf-draft');
      if (raw) {
        try {
          var dr = JSON.parse(raw);
          if (JSON.stringify(dr) !== JSON.stringify(state)) draftOffer = dr; else store('session', 'pf-draft', null);
        } catch (e) { store('session', 'pf-draft', null); }
      }
      return true;
      });
    });
  }
  (function init() {
    if (bootPath === '/admin') {
      boot().then(function (ok) { adminPending = false; view = ok ? 'dash' : 'login'; render('full'); document.documentElement.classList.remove('booting'); })
        .catch(function () { adminPending = false; view = 'login'; render('full'); document.documentElement.classList.remove('booting'); });
      return;
    }
    boot().then(function (ok) {
      if (!ok) return;
      var go = function () { render('quiet'); };
      if (introTl && introTl.progress() < 1) {
        var fired = false;
        var once = function () { if (fired) return; fired = true; go(); };
        introTl.eventCallback('onComplete', once);
        setTimeout(once, 6000);
      } else go();
    }).catch(function () {});
  })();
})();
