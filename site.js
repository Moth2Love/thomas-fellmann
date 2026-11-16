// Progressive enhancement: every piece of content is visible without this file.
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('js');

  // Hero loop: stop it for reduced motion.
  const hero = document.querySelector('.phone video');
  if (hero && reduce) { hero.removeAttribute('autoplay'); hero.pause(); hero.setAttribute('controls', ''); }

  // Numbers strip: count up once when it comes into view.
  const nums = [...document.querySelectorAll('.numbers b')];
  const WS = /[\s  ]/g;
  const parse = (txt) => {
    const m = txt.match(/^([\d.,\s  ]*\d)(.*)$/); if (!m) return null;
    const raw = m[1]; const fr = /[\s  ]/.test(raw) || /,\d{1,2}$/.test(raw);
    const val = parseFloat(fr ? raw.replace(WS, '').replace(',', '.') : raw.replace(/,/g, ''));
    const dec = fr ? (raw.split(',')[1] || '').length : (raw.split('.')[1] || '').length;
    return { val, dec, suffix: m[2], fr };
  };
  const fmt = (v, p) => {
    const [i, d] = v.toFixed(p.dec).split('.');
    return i.replace(/\B(?=(\d{3})+(?!\d))/g, p.fr ? ' ' : ',') + (d ? (p.fr ? ',' : '.') + d : '');
  };
  if (!reduce && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return; io.unobserve(e.target);
        const el = e.target, final = el.textContent, p = parse(final); if (!p || isNaN(p.val)) return;
        const t0 = performance.now(), dur = 1100;
        const step = (t) => {
          const k = Math.max(0, Math.min(1, (t - t0) / dur)), eased = 1 - Math.pow(1 - k, 3);
          el.textContent = k < 1 ? fmt(p.val * eased, p) + p.suffix : final;
          if (k < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    nums.forEach((n) => io.observe(n));
  }

  // Chart: tooltip on hover or tap.
  const chart = document.querySelector('.chart');
  if (chart) {
    const tip = document.createElement('div'); tip.className = 'chart-tip'; tip.setAttribute('role', 'status');
    chart.parentElement.style.position = 'relative'; chart.parentElement.appendChild(tip);
    chart.querySelectorAll('.bar.fb').forEach((bar) => {
      const label = bar.querySelector('title') ? bar.querySelector('title').textContent : '';
      bar.setAttribute('tabindex', '0');
      const show = () => {
        const r = bar.getBoundingClientRect(), pr = chart.parentElement.getBoundingClientRect();
        tip.textContent = label; tip.style.left = (r.left - pr.left + r.width / 2) + 'px'; tip.style.top = (r.top - pr.top) + 'px';
        tip.classList.add('on'); chart.querySelectorAll('.bar').forEach((b) => b.classList.toggle('dim', b.getAttribute('x') !== bar.getAttribute('x')));
      };
      const hide = () => { tip.classList.remove('on'); chart.querySelectorAll('.bar').forEach((b) => b.classList.remove('dim')); };
      bar.addEventListener('pointerenter', show); bar.addEventListener('focus', show);
      bar.addEventListener('pointerleave', hide); bar.addEventListener('blur', hide);
      bar.addEventListener('click', show);
    });
  }

  // Shop tabs.
  const tabs = [...document.querySelectorAll('.tabs [role="tab"]')];
  const select = (i) => tabs.forEach((t, j) => {
    t.setAttribute('aria-selected', j === i ? 'true' : 'false'); t.tabIndex = j === i ? 0 : -1;
    document.getElementById(t.getAttribute('aria-controls')).hidden = j !== i;
  });
  if (tabs.length) {
    select(0);
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(i));
      t.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          const n = (i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length; select(n); tabs[n].focus();
        }
      });
    });
  }

  // Before / after slider.
  document.querySelectorAll('.ba').forEach((ba) => {
    const r = ba.querySelector('input[type="range"]');
    const set = () => ba.style.setProperty('--pos', r.value + '%');
    r.addEventListener('input', set); set();
  });

  // Lightbox for ads and screenshots.
  const lb = document.getElementById('lightbox');
  if (lb && typeof lb.showModal === 'function') {
    const big = lb.querySelector('img');
    document.querySelectorAll('.ads-grid img, .ads-wide img, .proof img, .shop-panel img, .scenes img, .spot-imgs img, .voice-top img, .lesson-wide img').forEach((img) => {
      img.classList.add('zoomable'); img.tabIndex = 0; img.setAttribute('role', 'button');
      const open = () => { big.src = img.currentSrc || img.src; big.alt = img.alt; lb.showModal(); };
      img.addEventListener('click', open);
      img.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    });
    lb.addEventListener('click', (e) => { if (e.target === lb || e.target.classList.contains('lb-close')) lb.close(); });
  }

  // Format videos: muted preview on hover (desktop), stops when the pointer leaves.
  if (!reduce && window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.videos video').forEach((v) => {
      let userPlay = false;
      v.addEventListener('play', () => { if (!v.dataset.preview) userPlay = true; });
      v.addEventListener('pointerenter', () => { if (v.paused && !userPlay) { v.dataset.preview = '1'; v.muted = true; v.play().catch(() => {}); } });
      v.addEventListener('pointerleave', () => { if (v.dataset.preview && !userPlay) { v.pause(); } delete v.dataset.preview; });
      v.addEventListener('volumechange', () => { if (!v.muted) userPlay = true; });
    });
  }
  // Reading progress in the top bar.
  const prog = document.querySelector('.progress');
  if (prog) {
    const upd = () => { const h = document.documentElement; prog.style.setProperty('--read', Math.min(1, h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight)).toFixed(4)); };
    addEventListener('scroll', upd, { passive: true }); upd();
  }

  const fr = document.documentElement.lang === 'fr';

  // Live wardrobe calculator: same outfits and prices as the store's theme section.
  const calc = document.querySelector('.demo.calc');
  if (calc) {
    const OUTFITS = [[2,3,9,11],[2,4,10,11],[3,9,11],[5,10,11],[1,6,10,11],[2,9,11],[1,4,9,11],[3,8,12],[1,8,12],[2,6,8,12],[1,6,8,11],[4,8,12],[5,8,12],[1,3,9,12],[5,7,9,11],[2,3,10,11],[5,6,10,11],[2,7,10,11],[2,4,8,11],[5,7,8,11],[3,7,8,12],[2,4,7,10,11],[1,3,7,9,11],[4,6,8,11],[5,7,10,11],[2,4,9,11],[2,7,10,11],[3,10,11],[5,6,9,11],[1,4,9,12]];
    const boxes = [...calc.querySelectorAll('input')];
    const el = (k) => calc.querySelector('[data-calc="' + k + '"]');
    const run = () => {
      const have = new Set(boxes.filter((b) => b.checked).map((b) => +b.value));
      const n = OUTFITS.filter((o) => o.every((p) => have.has(p))).length;
      const missing = boxes.filter((b) => !b.checked);
      const cost = missing.reduce((a, b) => a + +b.dataset.price, 0), m = missing.length;
      el('outfits').textContent = n;
      el('cost').textContent = cost + ' €';
      el('outfits-label').textContent = fr ? 'tenues sur 30 déjà possibles' : 'of 30 outfits already possible';
      el('cost-label').textContent = fr
        ? (m ? 'pour ' + (m > 1 ? 'les ' + m + ' pièces qui te manquent' : 'la pièce qui te manque') : 'tu as tout : rien à acheter')
        : (m ? 'for the ' + (m > 1 ? m + ' pieces' : 'one piece') + ' you’re missing' : 'you have it all: nothing to buy');
      el('phrase').textContent = fr
        ? (have.size === 0 ? 'Coche tes vêtements : tu vas voir.' : m === 0 ? 'Tu as les 12 pièces. Le guide te montre les 30 tenues.' : n === 0 ? 'Avec ce que tu as, aucune tenue complète. Le guide te dit quoi acheter en premier.' : 'Tu as déjà de quoi faire ' + n + ' tenue' + (n > 1 ? 's' : '') + '. Le guide te les montre, en photos.')
        : (have.size === 0 ? 'Tick your clothes: you’ll see.' : m === 0 ? 'You have all 12 pieces. The guide shows you the 30 outfits.' : n === 0 ? 'With what you have, no complete outfit. The guide tells you what to buy first.' : 'You can already make ' + n + ' outfit' + (n > 1 ? 's' : '') + '. The guide shows them to you, in photos.');
    };
    boxes.forEach((b) => b.addEventListener('change', run)); run();
  }

  // Live Advent calendar: doors exist only from their day on.
  const cal = document.querySelector('.demo.cal');
  if (cal) {
    const range = cal.querySelector('input'), doors = [...cal.querySelectorAll('.door')];
    const dateEl = cal.querySelector('[data-cal="date"]'), status = cal.querySelector('[data-cal="status"]');
    const dateTxt = (d) => fr ? (d === 0 ? '30 novembre' : (d === 1 ? '1er' : d) + ' décembre') : (d === 0 ? '30 November' : d + ' December');
    const run = () => {
      const d = +range.value;
      doors.forEach((b) => { const n = +b.dataset.day; b.classList.toggle('open', n <= d); b.classList.toggle('today', n === d); });
      dateEl.textContent = dateTxt(d);
      status.textContent = fr
        ? (d === 0 ? 'Aucune porte dans la page : rien à ouvrir, rien à lire dans le code.' : d + ' porte' + (d > 1 ? 's' : '') + ' dans la page, ' + (24 - d) + ' pas encore écrite' + (24 - d > 1 ? 's' : '') + '. Celle du jour est en or.')
        : (d === 0 ? 'No door in the page: nothing to open, nothing to read in the code.' : d + ' door' + (d > 1 ? 's' : '') + ' in the page, ' + (24 - d) + ' not written yet. Today’s is gold.');
    };
    range.addEventListener('input', run); run();
    doors.forEach((b) => b.addEventListener('click', () => {
      const n = +b.dataset.day, d = +range.value;
      if (n > d) { b.classList.remove('nope'); void b.offsetWidth; b.classList.add('nope'); status.textContent = fr ? 'Porte ' + n + ' : elle s’ouvre le ' + dateTxt(n) + '.' : 'Door ' + n + ': it opens on ' + dateTxt(n) + '.'; }
      else { status.textContent = fr ? 'Porte ' + n + ' ouverte : l’acheteur y trouve l’image, le titre et le texte du jour.' : 'Door ' + n + ' open: the buyer finds the day’s image, title and text.'; }
    }));
  }

  // Copy the email address.
  document.querySelectorAll('[data-copy]').forEach((b) => {
    const label = b.textContent;
    b.addEventListener('click', () => {
      navigator.clipboard.writeText(b.dataset.copy).then(() => { b.textContent = b.dataset.done; setTimeout(() => { b.textContent = label; }, 2200); }).catch(() => { b.textContent = b.dataset.copy; });
    });
  });

  // Email buttons: mailto only works when the visitor has a mail app set up.
  // So every click also copies the address and says so; the mailto still opens for those who have one.
  const toast = document.createElement('p');
  toast.className = 'toast'; toast.setAttribute('role', 'status'); document.body.appendChild(toast);
  let toastTimer;
  document.querySelectorAll('a[href^="mailto:"]').forEach((a) => {
    a.addEventListener('click', () => {
      const mail = a.getAttribute('href').slice(7).split('?')[0];
      const fr = document.documentElement.lang === 'fr';
      const show = (ok) => {
        toast.textContent = ok ? (fr ? 'Adresse copiée : ' + mail + '. Collez-la dans votre messagerie.' : 'Address copied: ' + mail + '. Paste it into your email.')
                               : (fr ? 'Mon adresse : ' + mail : 'My address: ' + mail);
        toast.classList.add('on'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('on'), 7000);
      };
      (navigator.clipboard ? navigator.clipboard.writeText(mail) : Promise.reject()).then(() => show(true)).catch(() => show(false));
    });
  });
})();
