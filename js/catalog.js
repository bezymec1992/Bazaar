let allProducts = [];

async function initCatalog() {
  allProducts = await getProducts();

  createArtistButtons();

  showProducts(allProducts);
}

function createArtistButtons() {
  const container = document.getElementById('artists');

  const paintings = allProducts.filter(p => p.category === 'painting');

  const artists = [...new Set(paintings.map(p => p.artist))];

  container.innerHTML = '';

  artists.forEach(name => {
    const count = paintings.filter(p => p.artist === name).length;

    const btn = document.createElement('button');

    btn.textContent = `${name} (${count})`;

    btn.onclick = () => filterArtist(name);

    container.appendChild(btn);
  });
}

function showProducts(products) {
  const container = document.getElementById('catalog');

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

  const artistBlock = document.getElementById('artists');

  if (category === 'painting') {
    artistBlock.style.display = 'block';
  } else {
    artistBlock.style.display = 'none';
  }

  setFilterLabel(btn.textContent);
  filter.classList.remove('open');
}

function filterArtist(name) {
  const filtered = allProducts.filter(
    p => p.category === 'painting' && p.artist.toLowerCase() === name.toLowerCase()
  );

  showProducts(filtered);
}

function showAll() {
  showProducts(allProducts);
  document.getElementById('artists').style.display = 'none';
  setFilterLabel('All');
  filter.classList.remove('open');
}

const filter = document.querySelector('.filter');
const toggle = document.querySelector('.filter-toggle');

if (filter && toggle) {
  toggle.addEventListener('click', () => {
    filter.classList.toggle('open');
  });

  document.addEventListener('click', e => {
    if (!filter.contains(e.target)) {
      filter.classList.remove('open');
    }
  });
}

function setFilterLabel(text) {
  const btn = document.getElementById('filterToggle');
  if (btn) {
    btn.firstChild.nodeValue = text + ' ';
  }
}
