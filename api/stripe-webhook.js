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
    const session = event.data.object;

    console.log('Payment successful:', session.id);
  }

  res.status(200).json({ received: true });
}
