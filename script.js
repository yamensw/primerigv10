/* Prime Rig interactions (no external libraries)
   - Mobile drawer menu
   - Scroll reveal
   - Smooth scrolling for on-page anchors
   - Liquid-glass button press: sweep + ripple + micro-bounce
   - Enhanced animations
*/

(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------------------------
  // Helpers
  // ---------------------------
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  // ---------------------------
  // Smooth scroll (only same-page hash links)
  // ---------------------------
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href') || '#';
      if (href === '#' || href.length < 2) return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();
      target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });

      // Close mobile menu if open
      closeMobileMenu();

      // Update URL hash without jumping
      history.pushState(null, '', href);
    });
  });

  // ---------------------------
  // Mobile menu
  // ---------------------------
  const menuBtn = document.getElementById('menuBtn');
  const mobileMenu = document.getElementById('mobileMenu');

  function isMobileNavActive() {
    return window.matchMedia('(max-width: 720px)').matches;
  }

  function openMobileMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.add('open');
    mobileMenu.setAttribute('aria-hidden', 'false');
    if (menuBtn) menuBtn.setAttribute('aria-expanded', 'true');
    document.documentElement.classList.add('no-scroll');
  }

  function closeMobileMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.remove('open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
    document.documentElement.classList.remove('no-scroll');
  }

  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.contains('open');
      if (isOpen) closeMobileMenu();
      else openMobileMenu();
    });

    // Click outside dialog closes
    mobileMenu.addEventListener('click', (e) => {
      if (e.target === mobileMenu) closeMobileMenu();
    });

    // ESC closes
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMobileMenu();
    });

    // If user resizes to desktop, ensure menu is closed
    window.addEventListener('resize', () => {
      if (!isMobileNavActive()) closeMobileMenu();
    });
  }

  // Mobile menu links close after click
  if (mobileMenu) {
    $$('a', mobileMenu).forEach(a => a.addEventListener('click', closeMobileMenu));
  }

  // ---------------------------
  // Scroll reveal
  // ---------------------------
  const revealEls = $$('.reveal');
  if (!prefersReducedMotion && 'IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -10% 0px' });

    revealEls.forEach(el => {
      // If already in, skip
      if (!el.classList.contains('in')) io.observe(el);
    });
  } else {
    // Reduced motion or no IO support: show immediately
    revealEls.forEach(el => el.classList.add('in'));
  }

  // ---------------------------
  // Active nav link (index page sections)
  // ---------------------------
  const navLinks = $$('.navlinks a[href^="#"]');
  const sections = navLinks
    .map(a => document.querySelector(a.getAttribute('href') || ''))
    .filter(Boolean);

  if (!prefersReducedMotion && 'IntersectionObserver' in window && navLinks.length && sections.length) {
    const map = new Map(sections.map((sec, i) => [sec, navLinks[i]]));

    const navIO = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navLinks.forEach(a => a.classList.remove('active'));
          const link = map.get(entry.target);
          if (link) link.classList.add('active');
        }
      });
    }, { threshold: 0.45 });

    sections.forEach(sec => navIO.observe(sec));
  }

  // ---------------------------
  // Button: sweep + ripple + micro-bounce
  // ---------------------------
  const buttons = $$('.btn');

  // Add sweep element if missing
  buttons.forEach(btn => {
    if (!btn.querySelector('.sweep')) {
      const sweep = document.createElement('i');
      sweep.className = 'sweep';
      sweep.setAttribute('aria-hidden', 'true');
      btn.prepend(sweep);
    }

    // Ensure <span> wrapper exists for label (so text always above effects)
    if (!btn.querySelector('span')) {
      const text = btn.textContent;
      btn.textContent = '';
      const span = document.createElement('span');
      span.textContent = text;
      btn.append(span);
    }
  });

  // Avoid double firing on touch devices that support pointer events
  let lastPointerDownAt = 0;

  function pressEffect(e, btn) {
    // Ripple position
    const rect = btn.getBoundingClientRect();

    let clientX = e.clientX;
    let clientY = e.clientY;

    if ((clientX == null || clientY == null) && e.touches && e.touches[0]) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    }

    if (clientX == null || clientY == null) {
      clientX = rect.left + rect.width / 2;
      clientY = rect.top + rect.height / 2;
    }

    const x = clamp(clientX - rect.left, 0, rect.width);
    const y = clamp(clientY - rect.top, 0, rect.height);

    // Ripple
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    btn.appendChild(ripple);

    ripple.addEventListener('animationend', () => ripple.remove(), { once: true });

    // Sweep
    btn.classList.remove('sweeping');
    // force reflow so animation restarts reliably
    void btn.offsetWidth;
    btn.classList.add('sweeping');
    window.setTimeout(() => btn.classList.remove('sweeping'), 420);

    // Micro-bounce (handled by CSS :active too, but this makes it consistent on iOS)
    btn.classList.add('pressed');
    window.setTimeout(() => btn.classList.remove('pressed'), 140);
  }

  buttons.forEach(btn => {
    btn.addEventListener('pointerdown', (e) => {
      lastPointerDownAt = Date.now();
      pressEffect(e, btn);
    });

    btn.addEventListener('touchstart', (e) => {
      // If pointerdown fired recently, don't duplicate
      if (Date.now() - lastPointerDownAt < 250) return;
      pressEffect(e, btn);
    }, { passive: true });
  });

  // ---------------------------
  // Hero video: best-effort play
  // ---------------------------
  const heroVideo = document.querySelector('video[data-hero]');
  if (heroVideo && !prefersReducedMotion) {
    // Some browsers block autoplay; keep muted + playsInline for best odds
    const tryPlay = () => {
      const p = heroVideo.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    };
    // Try immediately + after interaction
    tryPlay();
    window.addEventListener('touchstart', tryPlay, { once: true, passive: true });
    window.addEventListener('click', tryPlay, { once: true });
  }

  // ---------------------------
  // Staggered card animations
  // ---------------------------
  function initStaggeredCards() {
    const cards = $$('.glass.card.reveal');
    cards.forEach((card, index) => {
      card.style.setProperty('--i', index);
      card.style.animationDelay = `${index * 100}ms`;
    });
  }

  // ---------------------------
  // Hover tilt effect for cards
  // ---------------------------
  function initTiltEffect() {
    const cards = $$('.glass.card');
    
    cards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        if (window.innerWidth < 768) return; // Disable on mobile
        
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateY = (x - centerX) / 25;
        const rotateX = (centerY - y) / 25;
        
        card.style.transform = `
          perspective(1000px) 
          rotateX(${rotateX}deg) 
          rotateY(${rotateY}deg) 
          translateZ(10px)
        `;
      });
      
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
      });
    });
  }

  // ---------------------------
  // Scroll progress indicator
  // ---------------------------
  function initScrollProgress() {
    const progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress';
    progressBar.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 0%;
      height: 3px;
      background: linear-gradient(90deg, var(--pink), var(--purple));
      z-index: 9999;
      transition: width 100ms ease;
    `;
    document.body.appendChild(progressBar);
    
    window.addEventListener('scroll', () => {
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (winScroll / height) * 100;
      progressBar.style.width = scrolled + '%';
    });
  }

  // ---------------------------
  // Typing animation for hero text
  // ---------------------------
  function initTypewriter() {
    const heroH1 = document.querySelector('.hero .h1');
    if (!heroH1 || prefersReducedMotion) return;
    
    const text = heroH1.textContent;
    heroH1.textContent = '';
    
    let i = 0;
    const typeWriter = () => {
      if (i < text.length) {
        heroH1.textContent += text.charAt(i);
        i++;
        setTimeout(typeWriter, 40);
      }
    };
    
    // Start typing after 1 second
    setTimeout(typeWriter, 1000);
  }

  // ---------------------------
  // Initialize all animations
  // ---------------------------
  function initAnimations() {
    if (!prefersReducedMotion) {
      initStaggeredCards();
      initScrollProgress();
      
      // Only run tilt effect on desktop
      if (window.innerWidth >= 768) {
        setTimeout(initTiltEffect, 1000);
      }
      
      // Only run typewriter on homepage
      if (window.location.pathname === '/' || window.location.pathname.endsWith('index.html')) {
        initTypewriter();
      }
    }
  }

  // Call initialization after DOM loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAnimations);
  } else {
    initAnimations();
  }

  // Reinitialize tilt effect on resize (for switching between mobile/desktop)
  window.addEventListener('resize', () => {
    if (!prefersReducedMotion && window.innerWidth >= 768) {
      // Remove any existing tilt effects and reinitialize
      const cards = $$('.glass.card');
      cards.forEach(card => {
        card.style.transform = '';
      });
      initTiltEffect();
    }
  });

})();
