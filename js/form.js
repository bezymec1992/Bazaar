const form = document.getElementById('contactForm');
const toast = document.getElementById('toast');

form.addEventListener('submit', e => {
  e.preventDefault();

  toast.classList.add('toast--show');

  setTimeout(() => {
    toast.classList.remove('toast--show');
  }, 2000);

  form.reset();
});
