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

document.getElementById('buyBtn').addEventListener('click', async () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  const res = await fetch('https://bazaar-hkq1.onrender.com/create-checkout-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ productId: id }),
  });

  const data = await res.json();

  // редирект на Stripe
  window.location.href = data.url;
});
