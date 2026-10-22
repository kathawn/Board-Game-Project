// ============ EDITORIAL REDESIGN — reveal + note-card scroll behavior ============
document.addEventListener('DOMContentLoaded', () => {
  gsap.registerPlugin(ScrollTrigger);

  // Navbar scroll state
  const navbar = document.getElementById('eNavbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  });

  // Hero entrance
  gsap.set('[data-ed-reveal]', { y: 24 });
  const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  heroTl
    .to('.e-hero .e-eyebrow', { opacity: 1, y: 0, duration: 0.8 }, 0.1)
    .to('.e-signature', { opacity: 1, y: 0, duration: 1.1 }, 0.3)
    .to('.e-hero-sub', { opacity: 1, y: 0, duration: 0.9 }, 0.6)
    .to('.e-hero-cta', { opacity: 1, y: 0, duration: 0.8 }, 0.8)
    .to('.e-scroll-hint', { opacity: 1, y: 0, duration: 0.6 }, 1.0);

  // Generic reveal-on-scroll for everything outside the hero
  document.querySelectorAll('[data-ed-reveal]:not(.e-hero [data-ed-reveal])').forEach((el) => {
    gsap.fromTo(el,
      { opacity: 0, y: 32 },
      { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 87%', toggleActions: 'play none none reverse' } }
    );
  });

  // Featured photo slide-reveal
  gsap.fromTo('.e-featured-photo',
    { clipPath: 'inset(0 100% 0 0)' },
    { clipPath: 'inset(0 0% 0 0)', duration: 1.1, ease: 'power3.inOut',
      scrollTrigger: { trigger: '.e-featured-photo', start: 'top 80%' } }
  );

  // Note card: slides/fades in, then each row reveals in sequence (like a
  // hand-written fragrance note unfolding) — mirrors the Herbier Blanc card.
  const noteCard = document.querySelector('.e-note-card');
  if (noteCard) {
    const rows = noteCard.querySelectorAll('.e-note-row');
    const noteTl = gsap.timeline({
      scrollTrigger: { trigger: noteCard, start: 'top 82%' }
    });
    noteTl
      .fromTo(noteCard, { opacity: 0, x: 40, rotate: 6 }, { opacity: 1, x: 0, rotate: 2, duration: 0.8, ease: 'power3.out' })
      .to(rows, { opacity: 1, y: 0, duration: 0.5, stagger: 0.18, ease: 'power2.out' }, '-=0.3');
  }

  // Occasion items: staggered fade with their number counting a beat ahead
  gsap.utils.toArray('.e-occasion-item').forEach((item, i) => {
    gsap.fromTo(item,
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.7, delay: i * 0.06, ease: 'power3.out',
        scrollTrigger: { trigger: '.e-occasions-row', start: 'top 85%' } }
    );
  });

  // Product cards stagger
  gsap.utils.toArray('.e-product-card').forEach((card, i) => {
    gsap.fromTo(card,
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 0.8, delay: (i % 4) * 0.08, ease: 'power3.out',
        scrollTrigger: { trigger: card, start: 'top 88%' } }
    );
  });

  // Size toggle (Mua / Thuê) — cosmetic only
  document.querySelectorAll('.e-size-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      btn.parentElement.querySelectorAll('.e-size-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  ScrollTrigger.refresh();
});
