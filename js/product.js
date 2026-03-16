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
};

lightbox.onclick = () => {
  lightbox.classList.remove('show');
};
