const CHECKOUT_ORIGIN = 'https://bazaar-lake-one.vercel.app';
const buyBtn = document.getElementById('buyBtn');
const DEFAULT_BTN_TEXT = buyBtn ? buyBtn.textContent : '';

async function loadProduct() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const numericId = Number(id);

  const titleEl = document.getElementById('title');
  const priceEl = document.getElementById('price');
  const descEl = document.getElementById('desc');
  const img = document.getElementById('image');

  if (!id || !Number.isFinite(numericId)) {
    if (titleEl) titleEl.textContent = 'Product not found';
    if (priceEl) priceEl.textContent = '';
    if (descEl) descEl.textContent = 'Missing or invalid product link.';
    if (buyBtn) {
      buyBtn.disabled = true;
      buyBtn.textContent = 'Unavailable';
    }
    return;
  }

  try {
    const product = await getProductById(numericId);

    if (!product) {
      if (titleEl) titleEl.textContent = 'Product not found';
      if (priceEl) priceEl.textContent = '';
      if (descEl) descEl.textContent = 'This item may have been removed.';
      if (buyBtn) {
        buyBtn.disabled = true;
        buyBtn.textContent = 'Unavailable';
      }
      return;
    }

    if (titleEl) titleEl.textContent = product.title != null ? String(product.title) : '';
    if (priceEl) priceEl.textContent = (product.price != null ? String(product.price) : '') + ' €';
    if (descEl) descEl.textContent = product.description != null ? String(product.description) : '';

    if (img) {
      img.onload = () => {
        img.classList.add('loaded');
      };
      img.onerror = () => {
        img.removeAttribute('src');
        img.alt = 'Image unavailable';
      };

      const width = window.innerWidth < 600 ? 500 : 800;
      const src = optimizeImage(product.image, width);
      if (src) img.src = src;
      else img.removeAttribute('src');
    }

    const isSold = product.sold === true || product.sold === 'true';
    if (isSold && buyBtn) {
      buyBtn.textContent = 'Sold';
      buyBtn.disabled = true;
    }
  } catch (e) {
    console.error(e);
    if (titleEl) titleEl.textContent = 'Something went wrong';
    if (descEl) descEl.textContent = 'Please try again later.';
    if (buyBtn) {
      buyBtn.disabled = true;
      buyBtn.textContent = 'Unavailable';
    }
  }
}

loadProduct();

const image = document.getElementById('image');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');

if (image && lightbox && lightboxImg) {
  image.addEventListener('click', () => {
    lightbox.classList.add('show');
    lightboxImg.src = image.src;
    document.body.style.overflow = 'hidden';
  });

  lightbox.addEventListener('click', () => {
    lightbox.classList.remove('show');
    document.body.style.overflow = '';
  });
}

if (buyBtn) {
  buyBtn.addEventListener('click', async () => {
    if (buyBtn.disabled) return;

    try {
      buyBtn.textContent = 'Loading...';
      buyBtn.disabled = true;

      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');

      const res = await fetch(CHECKOUT_ORIGIN + '/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: id }),
      });

      let data = {};
      try {
        data = await res.json();
      } catch {
        throw new Error('Invalid response from server');
      }

      if (!res.ok) {
        throw new Error(data.error || 'Checkout failed');
      }

      if (!data.url) {
        throw new Error('No checkout URL returned');
      }

      window.location.href = data.url;
    } catch (err) {
      buyBtn.textContent = DEFAULT_BTN_TEXT;
      buyBtn.disabled = false;
      alert(err.message || 'Checkout failed');
    }
  });
}

const deliveryBtn = document.getElementById('deliveryBtn');
const modal = document.getElementById('deliveryModal');
const modalClose = document.getElementById('modalClose');

const closeModal = () => {
  if (modal) modal.classList.remove('show');
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
};

if (deliveryBtn && modal) {
  deliveryBtn.addEventListener('click', () => {
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.paddingRight = scrollBarWidth + 'px';
    document.body.style.overflow = 'hidden';

    modal.classList.add('show');
  });
}

if (modalClose) {
  modalClose.addEventListener('click', closeModal);
}

if (modal) {
  modal.addEventListener('click', e => {
    if (e.target === modal) {
      closeModal();
    }
  });
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});
