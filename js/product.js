const API_URL = 'https://bazaar-lake-one.vercel.app';
const btn = document.getElementById('buyBtn');
const DEFAULT_BTN_TEXT = btn.textContent;
async function loadProduct() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  const product = await getProductById(Number(id));

  if (!product) return;

  document.getElementById('title').textContent = product.title;
  document.getElementById('price').textContent = product.price + ' €';
  document.getElementById('desc').textContent = product.description;

  const img = document.getElementById('image');
  img.onload = () => {
    img.classList.add('loaded');
  };
  img.src = product.image;

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

    const res = await fetch(API_URL + '/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: id }),
    });

    const data = await res.json(); // 🔥 сначала читаем ответ

    if (!res.ok) {
      throw new Error(data.error || 'Checkout failed'); // 🔥 используем текст с бэка
    }

    window.location.href = data.url;
  } catch (err) {
    btn.textContent = DEFAULT_BTN_TEXT;
    btn.disabled = false;
    alert(err.message);
  }
});

//modal delivery info
const deliveryBtn = document.getElementById('deliveryBtn');
const modal = document.getElementById('deliveryModal');
const modalClose = document.getElementById('modalClose');

const closeModal = () => {
  modal.classList.remove('show');
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
};

deliveryBtn.onclick = () => {
  const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;

  document.body.style.paddingRight = scrollBarWidth + 'px';
  document.body.style.overflow = 'hidden';

  modal.classList.add('show');
};

modalClose.onclick = closeModal;

modal.onclick = e => {
  if (e.target === modal) {
    closeModal();
  }
};

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});
