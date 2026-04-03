import Stripe from 'stripe';
import { Resend } from 'resend';

import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

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

    await supabase
      .from('products')
      .update({ sold: true })
      .eq('id', metadata.productId)
      .eq('sold', false);

    try {
      const email = await resend.emails.send({
        from: 'Bazaar <onboarding@resend.dev>',
        to: 'bbezzymecc@gmail.com', // ← на какой имейл летит почта
        subject: 'Test email',
        html: `
<div style="margin: 0; padding: 0; color: #d4af37; font-family: Arial, sans-serif;">
  <div style="max-width: 600px; margin: 40px auto; padding: 30px; background: #0f4a1a; border-radius: 12px; box-shadow: 0 0 20px rgba(0,0,0,0.3);">
    <div style="text-align:center; margin-bottom:15px;">
      <img 
        src="https://bezymec1992.github.io/Bazaar/imgs/logo.png"
        width="70"
        style="display:block; margin:0 auto;"
      />
    </div>
    <h2 style="margin-top: 0; text-align: center; color: #d4af37; letter-spacing: 1px;">
      New Order from Bazaar
    </h2>

    <hr style="border: none; border-top: 1px solid rgba(212,175,55,0.3); margin: 20px 0;">

    <p style="font-size: 14px; opacity: 0.8;">
      You have received a new order from your website:
    </p>

    <div style="margin-top: 20px; padding: 15px; background: #0b3a14; border-radius: 8px;">
      
      <h2 style="margin-bottom:20px;">🛒 New Order</h2>

      <p><strong>Product:</strong> ${metadata.title}</p>
      <p><strong>Price:</strong> €${metadata.price}</p>
      <p><strong>ID:</strong> ${metadata.productId}</p>

      <img src="${metadata.image}" width="150" style="margin-top:10px; border-radius:6px;" />

      <hr style="margin:20px 0;">

      <p style="color:#888;">Order from Bazaar website</p>
    </div>

    <hr style="border: none; border-top: 1px solid rgba(212,175,55,0.3); margin: 25px 0;">

    <p style="text-align: center; font-size: 12px; opacity: 0.7;">
      Bazaar Antiques • Website Order Notification
    </p>

  </div>
</div>
`,
      });

      console.log('Email sent:', email);
    } catch (err) {
      console.error('Resend error:', err);
    }
  }

  res.status(200).json({ received: true });
}
