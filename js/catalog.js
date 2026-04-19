const paintingsBtn = document.getElementById('paintingsBtn');
const loadMoreBtn = document.getElementById('loadMoreBtn');

function getItemsPerLoad() {
  return window.innerWidth <= 768 ? 10 : 16;
}

/** Single mutable catalog state (no framework). */
const catalogState = {
  visibleCount: getItemsPerLoad(),
  currentProducts: [],
  baseProducts: [],
  allProducts: [],
};

const PLACEHOLDER_PIXEL =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

if (paintingsBtn) {
  paintingsBtn.addEventListener('click', e => {
    e.stopPropagation();

    const submenu = paintingsBtn.parentElement;
    submenu.classList.toggle('open');
  });
}
async function initCatalog() {
  try {
    const hasCache = hasFreshCache();

    if (!hasCache) {
      renderSkeleton(); //только когда реально нужен
    }

    const data = await getProducts();

    catalogState.allProducts = data;
    catalogState.currentProducts = catalogState.allProducts;
    catalogState.baseProducts = catalogState.allProducts;

    createArtistButtons();
    renderProducts();
  } catch (e) {
    console.error(e);
    showError('Failed to load products');
  }
}

function renderSkeleton(count = 8) {
  const container = document.getElementById('catalog');
  if (!container) return;

  container.innerHTML = Array(count)
    .fill(0)
    .map(
      () => `
      <div class="card skeleton">
        <div class="img-wrap skeleton-box"></div>
        <div class="info-wrap">
          <div class="skeleton-line"></div>
          <div class="skeleton-line short"></div>
        </div>
      </div>
    `
    )
    .join('');
}

function createArtistButtons() {
  const container = document.getElementById('paintingsSubmenu');
  if (!container) return;

  const paintings = catalogState.allProducts.filter(p => p.category === 'painting');
  const artistCounts = new Map();
  for (const p of paintings) {
    if (!p.artist) continue;
    artistCounts.set(p.artist, (artistCounts.get(p.artist) || 0) + 1);
  }
  const artists = [...artistCounts.keys()];

  container.innerHTML = '';

  const allBtn = document.createElement('button');
  allBtn.textContent = 'All Paintings';

  allBtn.onclick = () => {
    filterCategory('painting', allBtn);
  };

  container.appendChild(allBtn);

  artists.forEach(name => {
    const count = artistCounts.get(name) || 0;

    const btn = document.createElement('button');
    btn.textContent = `${name} (${count})`;

    btn.onclick = () => {
      filterArtist(name, btn);
    };

    container.appendChild(btn);
  });
}

function renderProducts() {
  const container = document.getElementById('catalog');
  if (!container) return;
  const visibleProducts = catalogState.currentProducts.slice(0, catalogState.visibleCount);
  container.innerHTML = generateProductsHTML(visibleProducts);

  updateLoadMoreButton();
}

function generateProductsHTML(products) {
  return products
    .filter(p => p && p.id != null)
    .map(p => {
      const isSold = p.sold === true || p.sold === 'true';
      const safeId = encodeURIComponent(String(p.id));
      const href = isSold ? '#' : `product.html?id=${safeId}`;
      const imgSrc = optimizeImage(p.image, 400) || PLACEHOLDER_PIXEL;
      const titleEsc = escapeHtml(p.title);
      const priceEsc = escapeHtml(p.price);

      return `
      <div class="card ${isSold ? 'card--sold' : ''}">
        <a href="${href}">
          <div class="img-wrap">
            <img src="${imgSrc}" width="270" height="270"
     loading="lazy" decoding="async" alt="${titleEsc}">
            
            ${isSold ? `<div class="sold-badge">SOLD</div>` : ''}
            <span class="card__id">${escapeHtml(p.id)}</span>
          </div>

          <div class="info-wrap">
            <h3>${titleEsc}</h3>
            <p>${priceEsc} €</p>
          </div>
        </a>
      </div>
      `;
    })
    .join('');
}

function updateProducts(products) {
  catalogState.currentProducts = products;
  catalogState.visibleCount = getItemsPerLoad();
  renderProducts();
}

function updateLoadMoreButton() {
  if (!loadMoreBtn) return;

  if (catalogState.visibleCount < catalogState.currentProducts.length) {
    loadMoreBtn.style.display = 'block';
    loadMoreBtn.textContent = 'Load more';
    loadMoreBtn.disabled = false;
  } else {
    loadMoreBtn.style.display = 'block';
    loadMoreBtn.textContent = 'No more items';
    loadMoreBtn.disabled = true;
  }
}

if (loadMoreBtn) {
  loadMoreBtn.onclick = () => {
    loadMoreBtn.textContent = 'Loading...';
    catalogState.visibleCount += getItemsPerLoad();
    renderProducts();
  };
}

function filterCategory(category, btn) {
  const filtered = catalogState.allProducts.filter(p => p.category === category);
  catalogState.baseProducts = filtered;
  updateProducts(filtered);
  setFilterLabel(btn.textContent);
  setActive(btn);
  closeAllFilters();
}

function filterArtist(name, btn) {
  const filtered = catalogState.allProducts.filter(
    p => p.category === 'painting' && p.artist && p.artist.toLowerCase() === name.toLowerCase()
  );
  catalogState.baseProducts = filtered;
  updateProducts(filtered);
  setFilterLabel(name);
  setActive(btn);
  closeAllFilters();
}

function showAll(btn) {
  updateProducts(catalogState.allProducts);
  setFilterLabel(btn.textContent);
  setActive(btn);
  closeAllFilters();
}

const filter = document.querySelector('.filter');
const toggle = document.querySelector('.filter-toggle');

if (filter && toggle) {
  toggle.addEventListener('click', () => {
    filter.classList.toggle('open');
  });

  document.addEventListener('click', e => {
    if (!filter.contains(e.target)) {
      closeAllFilters();
    }
  });
}

function setFilterLabel(text) {
  const btn = document.getElementById('filterToggle');
  if (!btn) return;
  for (const node of btn.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      node.nodeValue = text + ' ';
      return;
    }
  }
}

function closeAllFilters() {
  if (filter) filter.classList.remove('open');

  document.querySelectorAll('.submenu').forEach(s => {
    s.classList.remove('open');
  });
}

function setActive(btn) {
  if (!btn) return;
  document.querySelectorAll('.filter-menu button').forEach(b => b.classList.remove('active'));

  btn.classList.add('active');
}

const searchInput = document.getElementById('searchInput');
let searchTimeout;

if (searchInput) {
  searchInput.addEventListener('input', e => {
    clearTimeout(searchTimeout);

    searchTimeout = setTimeout(() => {
      const value = e.target.value.toLowerCase().trim();

      if (!value) {
        updateProducts(catalogState.baseProducts);
        return;
      }

      const filtered = catalogState.baseProducts.filter(
        p =>
          (p.title && p.title.toLowerCase().includes(value)) ||
          (p.artist && p.artist.toLowerCase().includes(value))
      );

      updateProducts(filtered);
    }, 300);
  });
}

function setGridActive(btn) {
  if (!btn) return;
  document
    .querySelectorAll('.catalog__grid-btns button')
    .forEach(b => b.classList.remove('active'));

  btn.classList.add('active');
}

const grid1Btn = document.getElementById('grid1Btn');
const grid2Btn = document.getElementById('grid2Btn');
const catalog = document.getElementById('catalog');

if (grid1Btn && grid2Btn && catalog) {
  grid1Btn.addEventListener('click', () => {
    catalog.classList.remove('grid-2');
    catalog.classList.add('grid-1');
    setGridActive(grid1Btn);
  });

  grid2Btn.addEventListener('click', () => {
    catalog.classList.remove('grid-1');
    catalog.classList.add('grid-2');
    setGridActive(grid2Btn);
  });
}

function showError(msg) {
  const container = document.getElementById('catalog');
  if (!container) return;
  const p = document.createElement('p');
  p.className = 'catalog__error';
  p.style.color = '#e8a0a0';
  p.textContent = msg;
  container.innerHTML = '';
  container.appendChild(p);
}
