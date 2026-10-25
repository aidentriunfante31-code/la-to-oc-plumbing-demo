/* L.A to O.C Plumbing Pro: page behaviour */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  $('#year').textContent = new Date().getFullYear();

  /* ---------- Menu ---------- */
  const bar = $('#bar');
  const menuBtn = $('#menuBtn');
  const setMenu = (open) => {
    bar.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', open);
  };
  menuBtn.addEventListener('click', () => setMenu(!bar.classList.contains('open')));
  $$('#drawer a').forEach(a => a.addEventListener('click', () => setMenu(false)));

  /* ---------- Current section in the bar ---------- */
  const navLinks = $$('.bar-nav a');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) navLinks.forEach(a => a.classList.toggle('on', a.hash === '#' + e.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['services', 'work', 'letters', 'questions'].forEach(id => io.observe(document.getElementById(id)));
  }

  /* ---------- Plates and letters settle in once ----------
     Content is visible by default; only items below the fold are held back,
     and a timer releases anything the observer never reaches. */
  const settles = $$('.settle');
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const below = settles.filter(el => el.getBoundingClientRect().top > innerHeight);
    below.forEach(el => el.classList.add('pre'));
    let soAlive = false;
    const so = new IntersectionObserver(entries => {
      soAlive = true;
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const siblings = [...el.parentElement.children].filter(c => c.classList.contains('settle'));
        el.style.transitionDelay = Math.min(siblings.indexOf(el), 3) * 90 + 'ms';
        el.classList.remove('pre');
        so.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    below.forEach(el => so.observe(el));
    setTimeout(() => { if (!soAlive) below.forEach(el => el.classList.remove('pre')); }, 2500);
  }

  /* ---------- Reading ribbon + tipped plate depth ---------- */
  const ribbon = $('#ribbon');
  const tipped = $('.tipped');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    ribbon.style.setProperty('--read', max > 0 ? Math.min(scrollY / max, 1).toFixed(4) : 0);
    // The plate sits a little above the cover: it drifts slower than the page
    if (!still && scrollY < innerHeight * 1.2) tipped.style.translate = `0 ${(-scrollY * 0.06).toFixed(1)}px`;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* ---------- Rules draw and lists arrive as each section comes in ----------
     Everything is visible by default. Only parts below the fold are held back,
     and a timer releases anything the observer never reaches. */
  if ('IntersectionObserver' in window && !still) {
    const below = el => el.getBoundingClientRect().top > innerHeight * 0.92;
    const groups = [];
    $$('.part-head, .toc, .qa').forEach(el => { if (below(el)) { el.classList.add('drawn-pre'); groups.push([el, () => el.classList.remove('drawn-pre')]); } });
    $$('.toc ol').forEach(ol => {
      if (!below(ol)) return;
      [...ol.children].forEach((li, i) => li.style.setProperty('--i-delay', 120 + i * 70 + 'ms'));
      ol.classList.add('list-pre');
      groups.push([ol, () => ol.classList.remove('list-pre')]);
    });
    [$('.entries'), $('.steps')].forEach(list => {
      [...list.children].forEach((li, i) => {
        li.classList.add('rise');
        li.style.setProperty('--i-delay', Math.min(i, 4) * 80 + 'ms');
        if (below(li)) { li.classList.add('pre-rise'); groups.push([li, () => li.classList.remove('pre-rise')]); }
      });
    });
    const release = new Map(groups);
    let alive = false;
    const go = new IntersectionObserver(entries => {
      alive = true;
      entries.forEach(e => { if (e.isIntersecting) { release.get(e.target)(); go.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -10% 0px' });
    release.forEach((_, el) => go.observe(el));
    // If the observer never runs (background tab, odd browser), show everything
    setTimeout(() => { if (!alive) release.forEach(fn => fn()); }, 2500);
  }

  /* ---------- Only one answer open at a time ---------- */
  const details = $$('.qa details');
  details.forEach(d => d.addEventListener('toggle', () => {
    if (d.open) details.forEach(o => { if (o !== d) o.open = false; });
  }));

  /* ---------- Order form ---------- */
  const form = $('#order');
  const receipt = $('#receipt');
  const WORK = {
    drain: 'drain cleaning', leak: 'leak repair', heater: 'water heater',
    repipe: 'repipe', commercial: 'commercial', other: 'plumbing'
  };

  // "Ask about No. 2" links pre-mark the matching line on the form
  $$('.entry-price a[data-service]').forEach(a => a.addEventListener('click', () => {
    const key = a.dataset.service;
    const input = form.querySelector(`input[name="service"][value="${key}"]`);
    if (input) { input.checked = true; show('service', false); }
  }));

  const show = (key, on) => $(`.err[data-for="${key}"]`, form).classList.toggle('show', on);
  const mark = (input, bad) => {
    input.closest('.line').classList.toggle('bad', bad);
    input.setAttribute('aria-invalid', bad ? 'true' : 'false');
  };
  const rules = {
    zip: v => /^\d{5}$/.test(v),
    name: v => v.trim().length >= 2,
    phone: v => v.replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '').length === 10,
  };

  $('#zip').addEventListener('input', e => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 5); });
  $('#phone').addEventListener('input', e => {
    const d = e.target.value.replace(/\D/g, '').slice(0, 10);
    e.target.value = d.length > 6 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : d.length > 3 ? `(${d.slice(0, 3)}) ${d.slice(3)}` : d;
  });
  ['zip', 'name', 'phone'].forEach(id => {
    const input = $('#' + id);
    input.addEventListener('blur', () => { if (input.value) { const bad = !rules[id](input.value); mark(input, bad); show(id, bad); } });
    input.addEventListener('input', () => { if (rules[id](input.value)) { mark(input, false); show(id, false); } });
  });
  form.addEventListener('change', e => { if (e.target.name === 'service') show('service', false); });

  form.addEventListener('submit', e => {
    e.preventDefault();
    const service = form.querySelector('input[name="service"]:checked');
    let firstBad = null;
    show('service', !service);
    if (!service) firstBad = firstBad || form.querySelector('input[name="service"]');
    ['zip', 'name', 'phone'].forEach(id => {
      const input = $('#' + id), bad = !rules[id](input.value);
      mark(input, bad); show(id, bad);
      if (bad && !firstBad) firstBad = input;
    });
    if (firstBad) { firstBad.focus(); return; }

    // Spam trap filled in: a bot, so show nothing new and send nothing.
    if (form.elements.company_website.value) return;

    // Demo only: nothing is sent anywhere. At launch, post the form to the
    // chosen form service here and show the receipt only once it accepts it.
    $('#rName').textContent = $('#name').value.trim().split(/\s+/)[0];
    $('#rPhone').textContent = $('#phone').value;
    $('#rWork').textContent = WORK[service.value];
    form.hidden = true;
    receipt.hidden = false;
    receipt.focus();
  });

  $('#again').addEventListener('click', () => {
    form.reset();
    $$('.line', form).forEach(l => l.classList.remove('bad'));
    $$('.err', form).forEach(el => el.classList.remove('show'));
    receipt.hidden = true;
    form.hidden = false;
    form.querySelector('input').focus();
  });

  /* ---------- Reminders sign-up ---------- */
  $('#news').addEventListener('submit', e => {
    e.preventDefault();
    const input = $('#newsEmail'), msg = $('#newsMsg');
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value);
    msg.className = 'news-msg ' + (ok ? 'ok' : 'bad');
    msg.textContent = ok ? 'Signed up. The first note comes before the rainy season.' : 'That email address looks incomplete.';
    if (ok) input.value = '';
  });
})();
