const burger = document.getElementById('burger');
const nav = document.getElementById('nav');
const overlay = document.getElementById('menu-overlay');

function closeMenu() {
  if (burger) burger.classList.remove('active');
  if (nav) nav.classList.remove('active');
  if (overlay) overlay.classList.remove('active');
  document.body.classList.remove('menu-open');
}

if (burger && nav && overlay) {
  burger.addEventListener('click', () => {
    burger.classList.toggle('active');
    nav.classList.toggle('active');
    overlay.classList.toggle('active');
    document.body.classList.toggle('menu-open');
  });

  overlay.addEventListener('click', closeMenu);
}

document.querySelectorAll('.nav a').forEach(link => {
  link.addEventListener('click', closeMenu);
});
