const paintingsBtn = document.getElementById('paintingsBtn');

if (paintingsBtn) {
  paintingsBtn.addEventListener('click', e => {
    e.stopPropagation();

    const submenu = paintingsBtn.parentElement;
    submenu.classList.toggle('open');
  });
}
let allProducts = [];

async function initCatalog() {
  allProducts = await getProducts();
  createArtistButtons();
  showProducts(allProducts);
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

function showProducts(products) {
  const container = document.getElementById('catalog');

  // 🔥 если ничего нет
  if (products.length === 0) {
    container.innerHTML = `
      <div class="no-results">
        No results found
      </div>
    `;
    return;
  }

  let html = '';

  products.forEach(p => {
    html += `
    <div class="card">
      <a href="product.html?id=${p.id}">
        <div class="img-wrap">
          <img src="${p.image}" width="270" height="270"
               loading="lazy" decoding="async" alt="${p.title}">
        </div>
        <div class="info-wrap">
          <h3>${p.title}</h3>
          <p>${p.price} €</p>
        </div>
      </a>
    </div>
    `;
  });

  container.innerHTML = html;
}

function filterCategory(category, btn) {
  const filtered = allProducts.filter(p => p.category === category);
  showProducts(filtered);
  setFilterLabel(btn.textContent);
  setActive(btn);
  closeAllFilters();
}

function filterArtist(name) {
  const filtered = allProducts.filter(
    p => p.category === 'painting' && p.artist.toLowerCase() === name.toLowerCase()
  );

  showProducts(filtered);
  setFilterLabel(name);

  closeAllFilters();
}

function showAll(btn) {
  showProducts(allProducts);
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

    showProducts(filtered);
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
