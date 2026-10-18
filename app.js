/* L.A to O.C Plumbing Pro — interactions */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  if (window.lucide) lucide.createIcons();
  setTimeout(() => document.body.classList.add('loaded'), 30);
  $('#year').textContent = new Date().getFullYear();

  /* ---------- Nav: scroll state, mobile menu, active link ---------- */
  const nav = $('#nav');
  const menuBtn = $('#menuBtn');
  const mobileBar = $('.mobile-bar');
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle('scrolled', y > 20);
    mobileBar.classList.toggle('show', y > 520);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const setMenu = (open) => {
    nav.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', open);
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  menuBtn.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  $$('#mobileMenu a').forEach(a => a.addEventListener('click', () => setMenu(false)));

  const navLinks = $$('.nav-links a');
  const sectionObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  ['why', 'services', 'process', 'reviews', 'pricing', 'faq'].forEach(id => sectionObs.observe(document.getElementById(id)));

  /* ---------- Reveal on scroll ---------- */
  const revealObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); revealObs.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach(el => {
    revealObs.observe(el);
    // drop the stagger delay once revealed so hover effects respond instantly
    el.addEventListener('transitionend', () => el.classList.contains('in') && el.style.setProperty('--rd', 0), { once: true });
  });

  /* ---------- Count-up stats ---------- */
  const runCount = (el, delay) => {
    if (el.dataset.started) return;
    el.dataset.started = '1';
    const to = parseFloat(el.dataset.to), dec = +(el.dataset.dec || 0), dur = 1600;
    setTimeout(() => {
      const start = Date.now();
      const timer = setInterval(() => {
        const p = Math.min((Date.now() - start) / dur, 1), eased = 1 - Math.pow(1 - p, 4);
        el.textContent = (to * eased).toFixed(dec);
        if (p >= 1) clearInterval(timer);
      }, 16);
    }, delay);
  };
  const countObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      runCount(e.target, 600);
      countObs.unobserve(e.target);
    });
  }, { threshold: 0.5 });
  $$('.count').forEach(el => countObs.observe(el));
  // fallback so the hero stats never sit at 0 if the observer is slow to fire
  setTimeout(() => $$('.count').forEach(el => runCount(el, 0)), 2500);

  /* ---------- Hero tracker ETA ticker ---------- */
  const eta = $('#eta');
  let etaVal = 38;
  setInterval(() => { etaVal = etaVal <= 12 ? 38 : etaVal - 1; eta.textContent = etaVal; }, 2200);

  /* ---------- Spotlight cards ---------- */
  $$('.spot').forEach(card => {
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });

  /* ---------- Gallery filter ---------- */
  const filters = $$('.filter');
  const works = $$('.work');
  filters.forEach(btn => btn.addEventListener('click', () => {
    filters.forEach(b => { b.classList.toggle('active', b === btn); b.setAttribute('aria-selected', b === btn); });
    const f = btn.dataset.filter;
    works.forEach(w => {
      const show = f === 'all' || w.dataset.cat === f;
      w.classList.toggle('hide', !show);
      if (show) { w.classList.add('in'); w.classList.remove('pop'); void w.offsetWidth; w.classList.add('pop'); }
    });
  }));

  /* ---------- Reviews slider ---------- */
  const track = $('#reviewTrack');
  const dotsWrap = $('#reviewDots');
  const cards = $$('.review', track);
  const perView = () => Math.max(1, Math.round(track.clientWidth / cards[0].getBoundingClientRect().width));
  const pages = () => Math.max(1, cards.length - perView() + 1);
  const renderDots = () => {
    dotsWrap.innerHTML = '';
    for (let i = 0; i < pages(); i++) {
      const d = document.createElement('button');
      d.setAttribute('aria-label', `Go to review ${i + 1}`);
      d.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(d);
    }
    syncDots();
  };
  const step = () => cards[1].offsetLeft - cards[0].offsetLeft;
  const current = () => Math.round(track.scrollLeft / step());
  const goTo = (i) => track.scrollTo({ left: i * step(), behavior: 'smooth' });
  const syncDots = () => $$('button', dotsWrap).forEach((d, i) => d.classList.toggle('active', i === Math.min(current(), pages() - 1)));
  $('#prevReview').addEventListener('click', () => goTo(current() <= 0 ? pages() - 1 : current() - 1));
  $('#nextReview').addEventListener('click', () => goTo(current() >= pages() - 1 ? 0 : current() + 1));
  track.addEventListener('scroll', () => requestAnimationFrame(syncDots), { passive: true });
  window.addEventListener('resize', renderDots);
  renderDots();
  let auto = setInterval(() => $('#nextReview').click(), 6000);
  track.parentElement.addEventListener('pointerenter', () => clearInterval(auto));
  track.parentElement.addEventListener('pointerleave', () => { clearInterval(auto); auto = setInterval(() => $('#nextReview').click(), 6000); });

  /* ---------- Pricing toggle ---------- */
  const toggle = $('.toggle');
  $$('.toggle-opt').forEach(btn => btn.addEventListener('click', () => {
    const mode = btn.dataset.mode;
    toggle.classList.toggle('com', mode === 'com');
    $$('.toggle-opt').forEach(b => { b.classList.toggle('active', b === btn); b.setAttribute('aria-checked', b === btn); });
    $$('.amt').forEach(a => {
      a.textContent = '$' + a.dataset[mode];
      a.classList.remove('flip'); void a.offsetWidth; a.classList.add('flip');
    });
    const prop = $(`input[name="property"][value="${mode}"]`);
    if (prop) { prop.checked = true; updateEstimate(); }
  }));
  // Tier buttons preselect the service in the quote form
  $$('.tier [data-service]').forEach(b => b.addEventListener('click', () => {
    const r = $(`input[name="service"][value="${b.dataset.service}"]`);
    if (r) { r.checked = true; updateEstimate(); }
  }));

  /* ---------- FAQ accordion ---------- */
  $$('.acc').forEach(acc => {
    $('.acc-q', acc).addEventListener('click', () => {
      const open = !acc.classList.contains('open');
      $$('.acc').forEach(a => { a.classList.remove('open'); $('.acc-q', a).setAttribute('aria-expanded', 'false'); });
      acc.classList.toggle('open', open);
      $('.acc-q', acc).setAttribute('aria-expanded', open);
    });
  });

  /* ---------- Multi-step quote form ---------- */
  const form = $('#quoteForm');
  const steps = $$('.q-step', form);
  const back = $('#qBack'), next = $('#qNext');
  const labels = ['Your problem', 'Timing & location', 'Contact details'];
  let stepIdx = 0;

  const SERVICES = {
    drain:  { name: 'drain cleaning',      range: [150, 375] },
    leak:   { name: 'leak repair',         range: [225, 650] },
    heater: { name: 'water heater',        range: [1450, 3900] },
    repipe: { name: 'repipe / reroute',    range: [2400, 8500] },
    sewer:  { name: 'sewer line',          range: [350, 1250] },
    other:  { name: 'plumbing',            range: [150, 600] },
  };
  const URGENCY = {
    now:  { mult: 1.2,  eta: 'Dispatching today' },
    soon: { mult: 1,    eta: 'Within 48 hours' },
    flex: { mult: 0.95, eta: 'You pick the time' },
  };
  const val = (n) => (form.querySelector(`input[name="${n}"]:checked`) || {}).value;
  const money = (n) => '$' + (Math.round(n / 25) * 25).toLocaleString();

  function updateEstimate() {
    const s = SERVICES[val('service')];
    const u = URGENCY[val('urgency')] || URGENCY.soon;
    const p = val('property') === 'com' ? 1.3 : 1;
    const out = $('#estRange');
    const text = s ? `${money(s.range[0] * u.mult * p)} – ${money(s.range[1] * u.mult * p)}` : 'Choose a service';
    if (out.textContent !== text) {
      out.textContent = text;
      out.classList.remove('bump'); void out.offsetWidth; out.classList.add('bump');
    }
    $('#estEta').textContent = s ? u.eta : '—';
  }
  form.addEventListener('change', updateEstimate);

  const showErr = (key, show) => $(`[data-err="${key}"]`, form).classList.toggle('show', show);
  const fieldState = (input, ok) => {
    const f = input.closest('.field');
    f.classList.toggle('valid', ok);
    f.classList.toggle('invalid', !ok);
  };
  const checks = {
    zip:   (v) => /^\d{5}$/.test(v),
    name:  (v) => v.trim().length >= 2,
    phone: (v) => v.replace(/\D/g, '').replace(/^1/, '').length === 10,
  };
  ['zip', 'name', 'phone'].forEach(id => {
    const input = $('#' + id);
    input.addEventListener('input', () => {
      if (id === 'zip') input.value = input.value.replace(/\D/g, '').slice(0, 5);
      if (id === 'phone') {
        const d = input.value.replace(/\D/g, '').slice(0, 10);
        input.value = d.length > 6 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : d.length > 3 ? `(${d.slice(0, 3)}) ${d.slice(3)}` : d;
      }
      const ok = checks[id](input.value);
      if (ok) { fieldState(input, true); showErr(id, false); }
      else input.closest('.field').classList.remove('valid');
    });
    input.addEventListener('blur', () => {
      if (!input.value) return;
      const ok = checks[id](input.value);
      fieldState(input, ok); showErr(id, !ok);
    });
  });

  function validateStep(i) {
    let ok = true;
    if (i === 0) { ok = !!val('service'); showErr('service', !ok); }
    if (i === 1) { const z = $('#zip'); ok = checks.zip(z.value); fieldState(z, ok); showErr('zip', !ok); }
    if (i === 2) {
      ['name', 'phone'].forEach(id => {
        const inp = $('#' + id), good = checks[id](inp.value);
        fieldState(inp, good); showErr(id, !good); ok = ok && good;
      });
    }
    if (!ok) { const st = steps[i]; st.classList.remove('shake'); void st.offsetWidth; st.classList.add('shake'); }
    return ok;
  }

  function goStep(i, dir = 1) {
    steps.forEach((s, k) => { s.classList.toggle('active', k === i); s.classList.toggle('back', dir < 0); });
    $$('.q-dot').forEach((d, k) => { d.classList.toggle('active', k === i); d.classList.toggle('done', k < i); d.textContent = k < i ? '✓' : k + 1; });
    $$('.q-line').forEach((l, k) => l.classList.toggle('done', k < i));
    $('#qLabel').textContent = `Step ${i + 1} of 3 · ${labels[i]}`;
    back.disabled = i === 0;
    next.innerHTML = i === 2 ? 'Get My Quote <i data-lucide="send"></i>' : 'Continue <i data-lucide="arrow-right"></i>';
    if (window.lucide) lucide.createIcons();
    stepIdx = i;
    const first = steps[i].querySelector('input:not([type=radio]), input[type=radio]');
    if (dir > 0 && i > 0 && first && first.type !== 'radio') setTimeout(() => first.focus({ preventScroll: true }), 300);
  }

  next.addEventListener('click', () => {
    if (!validateStep(stepIdx)) return;
    if (stepIdx < 2) return goStep(stepIdx + 1, 1);
    // "Submit" — demo only, nothing is sent anywhere
    $('#sName').textContent = $('#name').value.trim().split(' ')[0];
    $('#sPhone').textContent = $('#phone').value;
    $('#sService').textContent = SERVICES[val('service')].name;
    form.hidden = true;
    $('.q-progress').hidden = true;
    $('#qSuccess').hidden = false;
  });
  back.addEventListener('click', () => stepIdx > 0 && goStep(stepIdx - 1, -1));
  $$('input[name="service"]').forEach(r => r.addEventListener('change', () => { showErr('service', false); setTimeout(() => stepIdx === 0 && next.click(), 280); }));
  form.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.tagName === 'INPUT') { e.preventDefault(); next.click(); } });
  $('#qReset').addEventListener('click', () => {
    form.reset();
    $$('.field', form).forEach(f => f.classList.remove('valid', 'invalid'));
    $$('.err', form).forEach(e => e.classList.remove('show'));
    form.hidden = false; $('.q-progress').hidden = false; $('#qSuccess').hidden = true;
    goStep(0, -1); updateEstimate();
  });
  updateEstimate();

  /* ---------- Newsletter ---------- */
  $('#newsForm').addEventListener('submit', e => {
    e.preventDefault();
    const f = e.currentTarget, input = $('input', f), msg = $('#newsMsg');
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value);
    f.classList.toggle('invalid', !ok);
    msg.className = 'news-msg ' + (ok ? 'ok' : 'bad');
    msg.textContent = ok ? "You're in! First tips arrive before the next rainy season." : 'Please enter a valid email address.';
    if (ok) input.value = '';
  });
})();
