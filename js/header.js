const burger = document.getElementById('burger');
const nav = document.getElementById('nav');
const overlay = document.getElementById('menu-overlay');

burger.addEventListener('click', () => {
  burger.classList.toggle('active');
  nav.classList.toggle('active');
  overlay.classList.toggle('active');
  document.body.classList.toggle('menu-open');
});

document.querySelectorAll('.nav a').forEach(link => {
  link.addEventListener('click', () => {
    burger.classList.remove('active');
    nav.classList.remove('active');
    overlay.classList.remove('active');
    document.body.classList.remove('menu-open');
  });
});

overlay.addEventListener('click', () => {
  burger.classList.remove('active');
  nav.classList.remove('active');
  overlay.classList.remove('active');
  document.body.classList.remove('menu-open');
});
