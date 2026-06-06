// ----- rendering and filter logic -----

const creditsEl  = document.getElementById('credits');
const filterCats = document.getElementById('filter-cats');
const filterSub  = document.getElementById('filter-sub');

// Render tracks sorted newest first
[...tracks]
  .sort((a, b) => b.date.localeCompare(a.date))
  .forEach(t => {
    const el = document.createElement('div');
    el.className = 'credit';
    el.dataset.artist  = t.artist;
    el.dataset.genres  = t.genres.join(',');
    el.dataset.work    = t.work.join(',');
    el.dataset.credits = (t.credits || []).join(',');

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
    creditsEl.appendChild(el);
  });

// Filter state
let openCat = null;
let activeFilter = null; // { cat, value }

const categories = [
  { key: 'work',    label: 'My Work' },
  { key: 'artist',  label: 'Artist'  },
  { key: 'genre',   label: 'Genre'   },
  { key: 'credits', label: 'Credits' },
];

function getOptions(cat) {
  const els = [...creditsEl.querySelectorAll('.credit')];
  if (cat === 'artist')  return [...new Set(els.map(e => e.dataset.artist))].sort();
  if (cat === 'genre')   return [...new Set(els.flatMap(e => e.dataset.genres.split(',').filter(Boolean)))].sort();
  if (cat === 'work')    return [...new Set(els.flatMap(e => e.dataset.work.split(',').filter(Boolean)))].sort();
  if (cat === 'credits') return [...new Set(els.flatMap(e => e.dataset.credits.split(',').filter(Boolean)))].sort();
  return [];
}

function matchesFilter(el, cat, value) {
  if (cat === 'artist')  return el.dataset.artist === value;
  if (cat === 'genre')   return el.dataset.genres.split(',').includes(value);
  if (cat === 'work')    return el.dataset.work.split(',').includes(value);
  if (cat === 'credits') return el.dataset.credits.split(',').includes(value);
  return true;
}

function applyFilter() {
  creditsEl.querySelectorAll('.credit').forEach(el => {
    el.classList.toggle('hidden',
      activeFilter !== null && !matchesFilter(el, activeFilter.cat, activeFilter.value)
    );
  });
}

function updateCatButtons() {
  filterCats.querySelectorAll('.filter-cat').forEach(btn => {
    btn.classList.toggle('open',   btn.dataset.cat === openCat);
    btn.classList.toggle('active', activeFilter !== null && activeFilter.cat === btn.dataset.cat);
  });
}

function renderSubRow(cat) {
  filterSub.innerHTML = '';
  const opts = getOptions(cat);
  if (!opts.length) { filterSub.classList.remove('visible'); return; }

  opts.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'filter-sub-btn';
    btn.textContent = opt;
    if (activeFilter && activeFilter.cat === cat && activeFilter.value === opt) {
      btn.classList.add('active');
    }
    btn.addEventListener('click', () => {
      // Toggle: clicking active sub clears filter
      activeFilter = (activeFilter && activeFilter.cat === cat && activeFilter.value === opt)
        ? null
        : { cat, value: opt };
      applyFilter();
      renderSubRow(cat);
      updateCatButtons();
    });
    filterSub.appendChild(btn);
  });
  filterSub.classList.add('visible');
}

// Build category buttons
categories.forEach(({ key, label }) => {
  const btn = document.createElement('button');
  btn.className = 'filter-cat';
  btn.dataset.cat = key;
  btn.textContent = label;
  btn.addEventListener('click', () => {
    if (openCat === key) {
      // Close sub-row (keep filter active)
      openCat = null;
      filterSub.classList.remove('visible');
      filterSub.innerHTML = '';
    } else {
      // Switch category — clear any existing filter first
      if (activeFilter && activeFilter.cat !== key) {
        activeFilter = null;
        applyFilter();
      }
      openCat = key;
      renderSubRow(key);
    }
    updateCatButtons();
  });
  filterCats.appendChild(btn);
});
