import Stripe from 'stripe';
import { Resend } from 'resend';

const stripe = new Stripe(process.env.STRIPE_SECRET);
const resend = new Resend(process.env.RESEND_API_KEY);

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(chunk);
  }

  const buf = Buffer.concat(chunks);

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
    const { metadata } = session;
    console.log('Payment successful:', session.id);

    try {
      const email = await resend.emails.send({
        from: 'Bazaar <onboarding@resend.dev>',
        to: 'bbezzymecc@gmail.com', // ← замени на свой
        subject: 'Test email',
        html: `
  <h2>New Order 🎉</h2>
  <p><strong>Product:</strong> ${metadata.title}</p>
  <p><strong>Price:</strong> €${metadata.price}</p>
  <p><strong>ID:</strong> ${metadata.productId}</p>
`,
      });

      console.log('Email sent:', email);
    } catch (err) {
      console.error('Resend error:', err);
    }
  }

  res.status(200).json({ received: true });
}
