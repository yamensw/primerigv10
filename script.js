(() => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Mobile menu (drawer)
  const menuBtn = document.getElementById('menuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  if (menuBtn && mobileMenu) {
    const closeMenu = () => {
      mobileMenu.classList.remove('open');
      mobileMenu.setAttribute('aria-hidden', 'true');
      menuBtn.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('noScroll');
    };
    const openMenu = () => {
      mobileMenu.classList.add('open');
      mobileMenu.setAttribute('aria-hidden', 'false');
      menuBtn.setAttribute('aria-expanded', 'true');
      document.body.classList.add('noScroll');
    };

    menuBtn.addEventListener('click', () => {
      mobileMenu.classList.contains('open') ? closeMenu() : openMenu();
    });

    // Close when clicking the backdrop
    mobileMenu.addEventListener('click', (e) => {
      if (e.target === mobileMenu) closeMenu();
    });

    // Close when clicking any link
    mobileMenu.querySelectorAll('a[href]').forEach(a => {
      a.addEventListener('click', () => closeMenu());
    });

    // Close on ESC
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMenu();
    });

    // If resizing to desktop, ensure it's closed
    window.addEventListener('resize', () => {
      if (window.innerWidth > 720) closeMenu();
    });
  }



  // Scroll reveal
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) e.target.classList.add('in');
    }
  }, { threshold: 0.14 });

  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  // Active nav link on scroll
  const sections = [...document.querySelectorAll('section[id]')];
  const navLinks = [...document.querySelectorAll('.navlinks a[href^="#"]')];

  const setActive = () => {
    const y = window.scrollY + 120;
    let current = sections[0]?.id;
    for (const s of sections) {
      if (s.offsetTop <= y) current = s.id;
    }
    navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${current}`));
  };
  window.addEventListener('scroll', setActive, { passive: true });
  setActive();

  // Button interactions: sweep + ripple + micro-bounce
  const buttons = document.querySelectorAll('.btn');
  buttons.forEach(btn => {
    // add sweep element once
    if (!btn.querySelector('.sweep')) {
      const s = document.createElement('span');
      s.className = 'sweep';
      btn.appendChild(s);
    }

    const doRipple = (evt) => {
      const rect = btn.getBoundingClientRect();
      const x = (evt.clientX ?? (rect.left + rect.width/2)) - rect.left;
      const y = (evt.clientY ?? (rect.top + rect.height/2)) - rect.top;

      const r = document.createElement('span');
      r.className = 'ripple';
      r.style.left = `${x}px`;
      r.style.top = `${y}px`;
      btn.appendChild(r);
      r.addEventListener('animationend', () => r.remove(), { once: true });

      btn.classList.remove('sweeping');
      // retrigger
      void btn.offsetWidth;
      btn.classList.add('sweeping');
      setTimeout(() => btn.classList.remove('sweeping'), 380);
    };

    btn.addEventListener('pointerdown', (e) => {
      if (prefersReduced) return;
      doRipple(e);
    });

    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        if (!prefersReduced) doRipple(e);
      }
    });
  });

  // Make sure hero video tries to play; show controls only if autoplay fails
  const v = document.querySelector('video[data-hero]');
  if (v) {
    const tryPlay = async () => {
      try {
        const p = v.play();
        if (p && typeof p.then === 'function') await p;
      } catch {
        v.controls = true;
      }
    };
    // iOS/Safari: play after metadata
    v.addEventListener('loadedmetadata', tryPlay, { once: true });
    // also attempt immediately
    tryPlay();
  }

  // Smooth scrolling
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
      history.replaceState(null, '', id);
    });
  });

  // Demo form -> Formspree
  const form = document.querySelector('#demoForm');
  const status = document.querySelector('#formStatus');
  const submitBtn = document.querySelector('#demoSubmit');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (submitBtn) submitBtn.disabled = true;
      if (status) status.textContent = 'Sending…';

      try {
        const res = await fetch(form.action, {
          method: form.method || 'POST',
          body: new FormData(form),
          headers: { 'Accept': 'application/json' }
        });

        if (res.ok) {
          if (status) status.textContent = 'Thanks — we got it. We’ll reply shortly.';
          form.reset();
        } else {
          let msg = 'Something went wrong. Please try again.';
          try {
            const data = await res.json();
            if (data?.errors?.length) msg = data.errors[0].message || msg;
          } catch (_) {}
          if (status) status.textContent = msg;
        }
      } catch (err) {
        if (status) status.textContent = 'Network error. Please check your connection and try again.';
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }
})();