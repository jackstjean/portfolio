// ----- theme toggle -----

(function () {
  const btn = document.getElementById('theme-toggle');
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  function update() {
    const isLight = document.documentElement.classList.contains('light');
    btn.textContent = isLight ? 'dark' : 'light';
    themeColorMeta.content = isLight ? '#ffffff' : '#111111';
  }
  update();
  btn.addEventListener('click', function () {
    const isLight = document.documentElement.classList.toggle('light');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    update();
  });
})();

// ----- rendering and filter logic -----

// Shared filter state — both sections read from and write to this object
const activeFilters = {};
const sections = [];

function applyAllFilters() {
  sections.forEach(s => s.applyFilter());
}

function updateAllCatButtons() {
  sections.forEach(s => s.updateCatButtons());
}

function buildSection(sectionTracks, listId, catsId, subId, categories) {
  const listEl = document.getElementById(listId);
  const catsEl = document.getElementById(catsId);
  const subEl  = document.getElementById(subId);

  // Wrap filter rows in a sticky container
  const stickyFilter = document.createElement('div');
  stickyFilter.className = 'filter-sticky';
  catsEl.parentNode.insertBefore(stickyFilter, catsEl);
  stickyFilter.appendChild(catsEl);
  stickyFilter.appendChild(subEl);

  [...sectionTracks]
    .sort((a, b) => b.date.localeCompare(a.date))
    .forEach(t => {
      const el = document.createElement('div');
      el.className = 'credit';
      el.dataset.artist = t.artist;
      el.dataset.genres = t.genres.join(',');
      el.dataset.work   = t.work.join(',');
      el.dataset.type   = t.artist === 'Jack St Jean' ? 'personal' : 'client';

      const iconHTML = Object.keys(PLATFORMS)
        .filter(key => t.links && t.links[key])
        .map(key => {
          const p = PLATFORMS[key];
          return `<a href="${t.links[key]}" class="platform-icon" title="Listen on ${p.label}" target="_blank" rel="noopener">${p.icon}</a>`;
        }).join('');

      el.innerHTML = `
        <div class="credit-top">
          <span>${t.title}</span>
          <span class="credit-right">${iconHTML}<span class="credit-date">${t.date}</span></span>
        </div>
        <div class="credit-sub">${t.artist}</div>
        <div class="credit-tags">
          <span>${t.genreLabel}</span>
          <span>${t.workLabel}</span>
        </div>
        <audio controls src="${t.src}" preload="none"></audio>
      `;
      listEl.appendChild(el);
    });

  let openCat = null;

  function matchesAll(el) {
    return Object.entries(activeFilters).every(([cat, value]) => {
      if (cat === 'type')   return el.dataset.type === value;
      if (cat === 'artist') return el.dataset.artist === value;
      if (cat === 'genre')  return el.dataset.genres.split(',').includes(value);
      if (cat === 'work')   return el.dataset.work.split(',').includes(value);
      return true;
    });
  }

  function applyFilter() {
    const hasFilters = Object.keys(activeFilters).length > 0;
    listEl.querySelectorAll('.credit').forEach(el => {
      el.classList.toggle('hidden', hasFilters && !matchesAll(el));
    });
  }

  function updateCatButtons() {
    catsEl.querySelectorAll('.filter-cat').forEach(btn => {
      btn.classList.toggle('open',   btn.dataset.cat === openCat);
      btn.classList.toggle('active', btn.dataset.cat in activeFilters);
    });
  }

  /* bubble-map sizing
  function getCounts(cat) {
    const counts = {};
    [...listEl.querySelectorAll('.credit')].forEach(e => {
      const keys = cat === 'artist' ? [e.dataset.artist]
                 : cat === 'genre'  ? e.dataset.genres.split(',').filter(Boolean)
                 : cat === 'work'   ? e.dataset.work.split(',').filter(Boolean)
                 : [];
      keys.forEach(k => { counts[k] = (counts[k] || 0) + 1; });
    });
    return counts;
  }
  */

  function getOptions(cat) {
    const els = [...listEl.querySelectorAll('.credit')];
    if (cat === 'artist') return [...new Set(els.map(e => e.dataset.artist))].sort();
    if (cat === 'genre')  return [...new Set(els.flatMap(e => e.dataset.genres.split(',').filter(Boolean)))].sort();
    if (cat === 'work')   return [...new Set(els.flatMap(e => e.dataset.work.split(',').filter(Boolean)))].sort();
    return [];
  }

  function renderSubRow(cat) {
    subEl.innerHTML = '';
    const opts = getOptions(cat);
    if (!opts.length) { subEl.classList.remove('visible'); return; }

    /* bubble-map sizing
    const counts = getCounts(cat);
    const vals = Object.values(counts);
    const minCount = Math.min(...vals);
    const maxCount = Math.max(...vals);
    */

    opts.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'filter-sub-btn';
      btn.textContent = opt;
      if (activeFilters[cat] === opt) btn.classList.add('active');

      /* bubble-map sizing
      const t = maxCount > minCount ? (counts[opt] - minCount) / (maxCount - minCount) : 0;
      btn.style.fontSize = (11 + t * 9) + 'px';
      */

      btn.addEventListener('click', () => {
        if (activeFilters[cat] === opt) {
          delete activeFilters[cat];
        } else {
          activeFilters[cat] = opt;
        }
        applyAllFilters();
        renderSubRow(cat);
        updateAllCatButtons();
      });
      subEl.appendChild(btn);
    });
    subEl.classList.add('visible');
  }

  sections.push({ applyFilter, updateCatButtons });

  const labelEl = document.createElement('span');
  labelEl.className = 'filter-label';
  labelEl.textContent = 'filter by';
  catsEl.appendChild(labelEl);

  categories.forEach(({ key, label }) => {
    const btn = document.createElement('button');
    btn.className = 'filter-cat';
    btn.dataset.cat = key;
    btn.textContent = label;
    btn.addEventListener('click', () => {
      if (openCat === key) {
        openCat = null;
        subEl.classList.remove('visible');
        subEl.innerHTML = '';
      } else {
        openCat = key;
        renderSubRow(key);
      }
      updateCatButtons();
    });
    catsEl.appendChild(btn);
  });
}

// Section toggle
document.getElementById('section-toggle').addEventListener('click', e => {
  const btn = e.target.closest('.toggle-btn');
  if (!btn) return;
  const show = btn.dataset.show;
  document.querySelectorAll('.toggle-btn').forEach(b => b.classList.toggle('active', b === btn));

  if (show === 'all') {
    delete activeFilters.type;
  } else {
    activeFilters.type = show;
  }

  // Artist filter only applies to client tracks — clear when switching to personal-only
  if (show === 'personal' && 'artist' in activeFilters) {
    delete activeFilters.artist;
    updateAllCatButtons();
  }

  applyAllFilters();
});

buildSection(tracks, 'all-list', 'all-filter-cats', 'all-filter-sub', [
  { key: 'work',   label: 'Service' },
  { key: 'artist', label: 'Artist'  },
  { key: 'genre',  label: 'Genre'   },
]);

// Audio: one track at a time + mini-player
const nowPlaying = document.getElementById('now-playing');
const npTitle    = document.getElementById('np-title');
const npToggle   = document.getElementById('np-toggle');

document.getElementById('all-filter-cats').appendChild(nowPlaying);
let currentAudio = null;

document.querySelectorAll('audio').forEach(audio => {
  const title = audio.closest('.credit').querySelector('.credit-top span').textContent;

  const card = audio.closest('.credit');

  audio.addEventListener('play', () => {
    document.querySelectorAll('audio').forEach(a => { if (a !== audio) a.pause(); });
    document.querySelectorAll('.credit.playing').forEach(c => c.classList.remove('playing'));
    currentAudio = audio;
    card.classList.add('playing');
    npTitle.textContent = title;
    npToggle.textContent = 'pause';
    nowPlaying.classList.add('visible');
  });

  audio.addEventListener('pause', () => {
    if (currentAudio === audio) {
      npToggle.textContent = 'play';
      card.classList.remove('playing');
    }
  });

  audio.addEventListener('ended', () => {
    if (currentAudio === audio) {
      nowPlaying.classList.remove('visible');
      card.classList.remove('playing');
    }
  });
});

npToggle.addEventListener('click', () => {
  if (!currentAudio) return;
  currentAudio.paused ? currentAudio.play() : currentAudio.pause();
});

document.getElementById('lucky-btn').addEventListener('click', (e) => {
  e.stopPropagation();
  const audios = [...document.querySelectorAll('.credit:not(.hidden) audio')];
  if (!audios.length) return;
  const audio = audios[Math.floor(Math.random() * audios.length)];
  const card = audio.closest('.credit');
  card.classList.add('lucky-active'); // suppress playing bg during flash
  audio.play();
  card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  card.classList.add('lucky-highlight');
  card.addEventListener('animationend', () => {
    card.classList.remove('lucky-highlight');
    requestAnimationFrame(() => card.classList.remove('lucky-active')); // fade in gray after flash
  }, { once: true });
});
