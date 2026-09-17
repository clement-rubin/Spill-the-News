// ── Waveform (hero player, index.html only) ──
const waveform = document.getElementById('waveform');
if (waveform) {
  const heights = [26,50,38,72,30,62,44,80,34,56,72,38,62,48,76,26,54,34,66,44,38,72,30,56,80,34,48,62,26,52];
  heights.forEach((h, i) => {
    const bar = document.createElement('div');
    bar.className = 'w-bar' + (i < 12 ? ' played' : '');
    bar.style.height = h + '%';
    waveform.appendChild(bar);
  });
}

// ── Episodes (index.html only) ──
const epsGrid = document.getElementById('eps-grid');
if (epsGrid) {
  const eps = [
    { n:'47', title:'L\'IA va-t-elle nous remplacer ?', desc:'Avec une chercheuse en IA et un étudiant en philo, on explore ce que l\'intelligence artificielle change pour notre génération.', tag:'Tech & Société', dur:'41 min' },
    { n:'46', title:'Le syndrome de l\'imposteur', desc:'On en a tous vécu. Des témoignages bruts et des pistes concrètes pour arrêter de se saboter.', tag:'Santé mentale', dur:'38 min' },
    { n:'45', title:'Étudier à l\'étranger : rêve ou galère ?', desc:'Six mois à Melbourne, Berlin, Montréal — nos invités racontent sans embellir.', tag:'Mobilité', dur:'52 min' },
    { n:'44', title:'Le stage qui a tout changé', desc:'Quatre étudiants, quatre histoires de stages qui ont réorienté leur trajectoire.', tag:'Carrière', dur:'45 min' },
    { n:'43', title:'Dormir, manger, réviser — dans quel ordre ?', desc:'Une nutritionniste et un chercheur en sommeil démythifient les habitudes étudiantes.', tag:'Bien-être', dur:'34 min' },
    { n:'42', title:'Premier de ma famille à l\'université', desc:'Une conversation intime sur la fierté, la pression et ce qu\'on doit — ou non — aux siens.', tag:'Témoignage', dur:'48 min' },
  ];
  eps.forEach(e => {
    epsGrid.insertAdjacentHTML('beforeend', `
      <div class="ep-card">
        <div class="ep-num">Épisode ${e.n}</div>
        <div class="ep-title">${e.title}</div>
        <div class="ep-desc">${e.desc}</div>
        <div class="ep-foot"><span class="ep-tag">${e.tag}</span><span>${e.dur}</span></div>
      </div>`);
  });
}

// ── Team (about.html only) ──
const teamGrid = document.getElementById('team-grid');
if (teamGrid) {
  const team = [
    { name:'Manon Leroux', role:'Co-fondatrice · Voix principale', emoji:'👩‍💻', bg:'#F5E4DC', quote:'"Je voulais qu\'on parle vraiment, pas qu\'on performe."' },
    { name:'Théo Marchand', role:'Co-fondateur · Réalisation', emoji:'🎧', bg:'#E7BBAD', quote:'"Le son, c\'est une façon de voir les choses autrement."' },
    { name:'Inès Bouali', role:'Communication', emoji:'📱', bg:'#F5E4DC', quote:'"Une communauté, ça se construit à la voix, pas à l\'algo."' },
    { name:'Raphaël Costa', role:'Recherche & invités', emoji:'🔍', bg:'#E7BBAD', quote:'"Chaque invité m\'apprend ce que l\'école n\'enseigne pas."' },
  ];
  team.forEach(m => {
    teamGrid.insertAdjacentHTML('beforeend', `
      <div class="member">
        <div class="m-avatar" style="background:${m.bg}">${m.emoji}</div>
        <div class="m-name">${m.name}</div>
        <div class="m-role">${m.role}</div>
        <div class="m-quote">${m.quote}</div>
      </div>`);
  });
}

// ── GSAP ──
if (window.gsap) {
  gsap.registerPlugin(ScrollTrigger);

  const mm = gsap.matchMedia();
  mm.add({ full: '(prefers-reduced-motion: no-preference)' }, ctx => {
    const { full } = ctx.conditions;
    if (!full) return;

    // Hero (index.html)
    if (document.querySelector('.hero')) {
      gsap.from('.eyebrow', { opacity: 0, y: 20, duration: 0.55, delay: 0.1, ease: 'power3.out' });
      gsap.from('.hero h1', { opacity: 0, y: 36, duration: 0.7, delay: 0.22, ease: 'power3.out' });
      gsap.from('.hero-desc', { opacity: 0, y: 24, duration: 0.55, delay: 0.38, ease: 'power3.out' });
      gsap.from('.hero .btn-row', { opacity: 0, y: 18, duration: 0.5, delay: 0.5, ease: 'power3.out' });
      gsap.from('#player', { opacity: 0, y: 30, scale: 0.96, duration: 0.75, delay: 0.3, ease: 'power3.out' });
      gsap.from('.player-stat', { opacity: 0, y: 10, duration: 0.5, delay: 0.75, ease: 'power3.out' });

      gsap.to('.w-bar.played', {
        scaleY: () => 0.3 + Math.random() * 0.85,
        duration: 0.28,
        repeat: -1,
        yoyo: true,
        stagger: { each: 0.05, from: 'random' },
        ease: 'none',
        transformOrigin: 'bottom center',
      });
    }

    // About hero
    if (document.querySelector('.about-hero')) {
      gsap.from('.about-hero .eyebrow', { opacity: 0, y: 20, duration: 0.55, delay: 0.1, ease: 'power3.out' });
      gsap.from('.about-hero h1', { opacity: 0, y: 32, duration: 0.65, delay: 0.2, ease: 'power3.out' });
      gsap.from('.about-hero p', { opacity: 0, y: 20, duration: 0.5, delay: 0.34, ease: 'power3.out' });
    }

    // Scroll-triggered groups (shared)
    gsap.utils.toArray('.ep-card').forEach((card, i) => {
      gsap.from(card, {
        opacity: 0, y: 30, duration: 0.5, ease: 'power3.out',
        scrollTrigger: { trigger: '.eps-grid', start: 'top 85%' },
        delay: i * 0.05,
      });
    });

    if (document.querySelector('.origin-grid')) {
      gsap.from('.origin-text', { opacity: 0, x: -30, duration: 0.6, ease: 'power3.out',
        scrollTrigger: { trigger: '.origin-grid', start: 'top 80%' } });
      gsap.from('.stats', { opacity: 0, x: 30, duration: 0.6, ease: 'power3.out',
        scrollTrigger: { trigger: '.origin-grid', start: 'top 80%' } });
    }

    gsap.utils.toArray('.member').forEach((m, i) => {
      gsap.from(m, {
        opacity: 0, y: 26, duration: 0.5, ease: 'power3.out',
        scrollTrigger: { trigger: '.team-grid', start: 'top 85%' },
        delay: i * 0.07,
      });
    });

    gsap.utils.toArray('.val-card').forEach((v, i) => {
      gsap.from(v, {
        opacity: 0, y: 20, duration: 0.45, ease: 'power3.out',
        scrollTrigger: { trigger: '.values-grid', start: 'top 88%' },
        delay: i * 0.06,
      });
    });

    gsap.from('.band blockquote', {
      opacity: 0, y: 24, duration: 0.6, ease: 'power3.out',
      scrollTrigger: { trigger: '.band', start: 'top 82%' },
    });
  });
}
