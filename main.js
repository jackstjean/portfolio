// ----- rendering and filter logic -----

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

      const iconHTML = Object.entries(t.links || {})
        .filter(([, url]) => url)
        .map(([key, url]) => {
          const p = PLATFORMS[key];
          return p ? `<a href="${url}" class="platform-icon" title="Listen on ${p.label}" target="_blank" rel="noopener">${p.icon}</a>` : '';
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

  let openCat      = null;
  let activeFilters = {}; // { cat: value } — multiple filters ANDed together

  function matchesAll(el) {
    return Object.entries(activeFilters).every(([cat, value]) => {
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

    opts.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'filter-sub-btn';
      btn.textContent = opt;
      if (activeFilters[cat] === opt) btn.classList.add('active');
      btn.addEventListener('click', () => {
        if (activeFilters[cat] === opt) {
          delete activeFilters[cat];
        } else {
          activeFilters[cat] = opt;
        }
        applyFilter();
        renderSubRow(cat);
        updateCatButtons();
      });
      subEl.appendChild(btn);
    });
    subEl.classList.add('visible');
  }

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
  document.getElementById('section-personal').style.display = show === 'client'   ? 'none' : '';
  document.getElementById('section-client').style.display   = show === 'personal' ? 'none' : '';
});

const personalTracks = tracks.filter(t => t.artist === 'Jack St Jean');
const clientTracks   = tracks.filter(t => t.artist !== 'Jack St Jean');

buildSection(clientTracks, 'client-list', 'client-filter-cats', 'client-filter-sub', [
  { key: 'work',   label: 'Service' },
  { key: 'artist', label: 'Artist'  },
  { key: 'genre',  label: 'Genre'   },
]);

buildSection(personalTracks, 'personal-list', 'personal-filter-cats', 'personal-filter-sub', [
  { key: 'work',  label: 'Service' },
  { key: 'genre', label: 'Genre'   },
]);

// Audio: one track at a time + mini-player
const nowPlaying = document.getElementById('now-playing');
const npTitle    = document.getElementById('np-title');
const npToggle   = document.getElementById('np-toggle');
let currentAudio = null;

document.querySelectorAll('audio').forEach(audio => {
  const title = audio.closest('.credit').querySelector('.credit-top span').textContent;

  audio.addEventListener('play', () => {
    document.querySelectorAll('audio').forEach(a => { if (a !== audio) a.pause(); });
    currentAudio = audio;
    npTitle.textContent = title;
    npToggle.textContent = 'pause';
    nowPlaying.classList.add('visible');
  });

  audio.addEventListener('pause', () => {
    if (currentAudio === audio) npToggle.textContent = 'play';
  });

  audio.addEventListener('ended', () => {
    if (currentAudio === audio) nowPlaying.classList.remove('visible');
  });
});

npToggle.addEventListener('click', () => {
  if (!currentAudio) return;
  currentAudio.paused ? currentAudio.play() : currentAudio.pause();
});
