const btn = document.getElementById('buyBtn');

async function loadProduct() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  let products = JSON.parse(localStorage.getItem('products'));

  if (!products) {
    products = await getProducts();
  }

  const product = products.find(p => p.id == id);

  if (!product) return;

  document.getElementById('title').textContent = product.title;
  document.getElementById('price').textContent = product.price + ' €';
  document.getElementById('image').src = product.image;
  document.getElementById('desc').textContent = product.description;

  if (String(product.sold).toLowerCase() === 'true') {
    btn.textContent = 'Sold';
    btn.disabled = true;
  }
}

loadProduct();

const image = document.getElementById('image');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');

image.onclick = () => {
  lightbox.classList.add('show');
  lightboxImg.src = image.src;
  document.body.style.overflow = 'hidden';
};

lightbox.onclick = () => {
  lightbox.classList.remove('show');
  document.body.style.overflow = '';
};

btn.addEventListener('click', async () => {
  try {
    btn.textContent = 'Loading...';
    btn.disabled = true;

    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    const products = await getProducts();
    const product = products.find(p => p.id == id);

    localStorage.setItem('lastPurchased', JSON.stringify(product));

    const res = await fetch('https://bazaar-lake-one.vercel.app/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: id }),
    });

    const data = await res.json();

    window.location.href = data.url;
  } catch (err) {
    btn.textContent = 'Buy';
    btn.disabled = false;
    alert('Something went wrong');
    console.error(err);
  }
});
