const API_URL = 'https://bazaar-lake-one.vercel.app';
const btn = document.getElementById('buyBtn');

async function loadProduct() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  const products = await getProducts();

  const product = products.find(p => p.id === Number(id));

  if (!product) return;

  document.getElementById('title').textContent = product.title;
  document.getElementById('price').textContent = product.price + ' €';
  document.getElementById('image').src = product.image;
  document.getElementById('desc').textContent = product.description;

  if (product.sold === true) {
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
    const product = products.find(p => p.id === Number(id));

    localStorage.setItem('lastPurchased', JSON.stringify(product));

    const res = await fetch(API_URL + '/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: id }),
    });

    if (!res.ok) {
      throw new Error('Checkout failed');
    }

    const data = await res.json();

    window.location.href = data.url;
  } catch (err) {
    btn.textContent = 'Buy';
    btn.disabled = false;
    alert('Something went wrong');
    console.error(err);
  }
});
