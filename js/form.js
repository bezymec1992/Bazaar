(function () {
  emailjs.init('pkMEalN8-JDvhkW-4');
})();

const form = document.getElementById('contactForm');
const toast = document.getElementById('toast');

if (form) {
  const button = form.querySelector('button');
  if (button) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      const params = {
        email: document.getElementById('email').value,
        message: document.getElementById('message').value,
      };

      button.disabled = true;
      button.textContent = 'Sending...';

      emailjs
        .send('service_sywru66', 'template_mozbimv', params)
        .then(() => {
          if (toast) toast.classList.add('toast--show');

          setTimeout(() => {
            if (toast) toast.classList.remove('toast--show');
          }, 2000);

          form.reset();
        })
        .catch(err => {
          console.error(err);
          alert('Failed to send. Please try again later.');
        })
        .finally(() => {
          button.disabled = false;
          button.textContent = 'Send';
        });
    });
  }
}
