const paintingsBtn = document.getElementById('paintingsBtn');
let visibleCount = 10;
let currentProducts = [];
const loadMoreBtn = document.getElementById('loadMoreBtn');

if (paintingsBtn) {
  paintingsBtn.addEventListener('click', e => {
    e.stopPropagation();

    const submenu = paintingsBtn.parentElement;
    submenu.classList.toggle('open');
  });
}
let allProducts = [];

async function initCatalog() {
  try {
    const CACHE_KEY = 'products';
    const CACHE_TIME_KEY = 'products_timestamp';
    const CACHE_LIFETIME = 1000 * 60 * 5;

    const cached = localStorage.getItem(CACHE_KEY);
    const cachedTime = localStorage.getItem(CACHE_TIME_KEY);

    let isFresh = false;

    if (cached && cachedTime) {
      isFresh = Date.now() - Number(cachedTime) < CACHE_LIFETIME;
    }

    // 👇 показываем skeleton ТОЛЬКО если нет кэша
    if (!isFresh) {
      renderSkeleton();
    }

    allProducts = await getProducts();
    currentProducts = allProducts;

    createArtistButtons();
    renderProducts();
  } catch (e) {
    console.error(e);
    showError('Failed to load products');
  }
}

function renderSkeleton(count = 6) {
  const container = document.getElementById('catalog');

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

  const paintings = allProducts.filter(p => p.category === 'painting');
  const artists = [...new Set(paintings.map(p => p.artist))];

  container.innerHTML = '';

  // 🔥 ДОБАВЛЯЕМ "All Paintings"
  const allBtn = document.createElement('button');
  allBtn.textContent = 'All Paintings';

  allBtn.onclick = () => {
    filterCategory('painting', allBtn);
  };

  container.appendChild(allBtn);

  artists.forEach(name => {
    const count = paintings.filter(p => p.artist === name).length;

    const btn = document.createElement('button');
    btn.textContent = `${name} (${count})`;

    btn.onclick = () => {
      filterArtist(name);
      setFilterLabel(name);
      setActive(btn);
      closeAllFilters();
    };

    container.appendChild(btn);
  });
}

function renderProducts() {
  const container = document.getElementById('catalog');
  const visibleProducts = currentProducts.slice(0, visibleCount);
  container.innerHTML = generateProductsHTML(visibleProducts);

  updateLoadMoreButton();
}

function generateProductsHTML(products) {
  return products
    .map(p => {
      const isSold = String(p.sold).toLowerCase() === 'true';

      return `
      <div class="card ${isSold ? 'card--sold' : ''}">
        <a href="${isSold ? '#' : `product.html?id=${p.id}`}">
          <div class="img-wrap">
            <img src="${optimizeImage(p.image, 400)}" width="270" height="270"
     loading="lazy" decoding="async" alt="${p.title}">
            
            ${isSold ? `<div class="sold-badge">SOLD</div>` : ''}
          </div>

          <div class="info-wrap">
            <h3>${p.title}</h3>
            <p>${p.price} €</p>
          </div>
        </a>
      </div>
      `;
    })
    .join('');
}

function updateProducts(products) {
  currentProducts = products;
  visibleCount = 10;
  renderProducts();
}

function updateLoadMoreButton() {
  if (!loadMoreBtn) return;

  if (visibleCount < currentProducts.length) {
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

    setTimeout(() => {
      visibleCount += 10;
      renderProducts();
    }, 300);
  };
}

function filterCategory(category, btn) {
  const filtered = allProducts.filter(p => p.category === category);
  updateProducts(filtered);
  setFilterLabel(btn.textContent);
  setActive(btn);
  closeAllFilters();
}

function filterArtist(name) {
  const filtered = allProducts.filter(
    p => p.category === 'painting' && p.artist.toLowerCase() === name.toLowerCase()
  );

  updateProducts(filtered);
  setFilterLabel(name);

  closeAllFilters();
}

function showAll(btn) {
  updateProducts(allProducts);
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
  if (btn) {
    btn.firstChild.nodeValue = text + ' ';
  }
}

function closeAllFilters() {
  filter.classList.remove('open');

  document.querySelectorAll('.submenu').forEach(s => {
    s.classList.remove('open');
  });
}

function setActive(btn) {
  document.querySelectorAll('.filter-menu button').forEach(b => b.classList.remove('active'));

  btn.classList.add('active');
}

const searchInput = document.getElementById('searchInput');

if (searchInput) {
  searchInput.addEventListener('input', e => {
    const value = e.target.value.toLowerCase();

    const filtered = allProducts.filter(
      p =>
        p.title.toLowerCase().includes(value) ||
        (p.artist && p.artist.toLowerCase().includes(value))
    );

    updateProducts(filtered);
  });
}

function setGridActive(btn) {
  document
    .querySelectorAll('.catalog__grid-btns button')
    .forEach(b => b.classList.remove('active'));

  btn.classList.add('active');
}

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

function showError(msg) {
  const container = document.getElementById('catalog');
  container.innerHTML = `<p style="color:red">${msg}</p>`;
}
