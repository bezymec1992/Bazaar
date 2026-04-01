import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET);

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  let buf = '';

  for await (const chunk of req) {
    buf += chunk;
  }

  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // ✅ УСПЕШНАЯ ОПЛАТА
  if (event.type === 'checkout.session.completed') {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      console.log('Payment successful:', session.id);

      try {
        await fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service_id: 'service_sywru66',
            template_id: 'template_grw3wfq',
            user_id: 'pkMEalN8-JDvhkW-4',
            template_params: {
              product_title: 'New Order',
              product_price: session.amount_total / 100,
              product_id: session.id,
              product_image: '',
            },
          }),
        });
      } catch (err) {
        console.error('Email error:', err);
      }
    }
  }

  res.status(200).json({ received: true });
}
