import Stripe from 'stripe';
import { Resend } from 'resend';

import { createClient } from '@supabase/supabase-js';

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeHttpsUrl(u) {
  if (!u || typeof u !== 'string') return '';
  const t = u.trim();
  return /^https:\/\//i.test(t) ? t : '';
}

function isUniqueViolation(err) {
  return err?.code === '23505' || /duplicate key|unique constraint/i.test(String(err?.message || ''));
}

function buildOrderEmailHtml(metadata) {
  const title = escapeHtml(metadata.title);
  const price = escapeHtml(metadata.price);
  const productId = escapeHtml(metadata.productId);
  const imageUrl = safeHttpsUrl(metadata.image);
  const productImg = imageUrl
    ? `<img src="${escapeHtml(imageUrl)}" width="150" style="margin-top:10px; border-radius:6px;" alt="" />`
    : '';

  return `
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

      <p><strong>Product:</strong> ${title}</p>
      <p><strong>Price:</strong> €${price}</p>
      <p><strong>ID:</strong> ${productId}</p>

      ${productImg}

      <hr style="margin:20px 0;">

      <p style="color:#888;">Order from Bazaar website</p>
    </div>

    <hr style="border: none; border-top: 1px solid rgba(212,175,55,0.3); margin: 25px 0;">

    <p style="text-align: center; font-size: 12px; opacity: 0.7;">
      Bazaar Antiques • Website Order Notification
    </p>

  </div>
</div>
`;
}

async function sendOrderEmail(resend, metadata) {
  const html = buildOrderEmailHtml(metadata);
  await resend.emails.send({
    from: 'Bazaar <onboarding@resend.dev>',
    to: process.env.ADMIN_EMAIL,
    subject: 'New Bazaar order',
    html,
  });
}

/**
 * Claim this Stripe event id. Returns 'new' if we own processing, 'duplicate' if another delivery won the row.
 */
async function claimWebhookEvent(supabase, eventId, checkoutSessionId) {
  const { error } = await supabase.from('stripe_webhook_events').insert({
    id: eventId,
    checkout_session_id: checkoutSessionId,
  });
  if (!error) return 'new';
  if (isUniqueViolation(error)) return 'duplicate';
  const err = new Error(error.message || 'stripe_webhook_events insert failed');
  err.cause = error;
  throw err;
}

async function markEmailOk(supabase, eventId) {
  const { error } = await supabase
    .from('stripe_webhook_events')
    .update({ email_sent: true, email_last_error: null })
    .eq('id', eventId);
  if (error) throw error;
}

async function markEmailFailed(supabase, eventId, message) {
  await supabase
    .from('stripe_webhook_events')
    .update({ email_last_error: String(message).slice(0, 2000) })
    .eq('id', eventId);
}

async function releaseClaim(supabase, eventId) {
  await supabase.from('stripe_webhook_events').delete().eq('id', eventId);
}

async function handleCheckoutSessionCompleted(event, res, supabase, resend) {
  const session = event.data.object;
  const eventId = event.id;
  const checkoutSessionId = session.id;
  const { metadata } = session;

  if (!metadata || metadata.productId == null || metadata.productId === '') {
    console.warn('checkout.session.completed missing product metadata', checkoutSessionId);
    return res.status(200).json({ received: true, skipped: true, reason: 'no_metadata' });
  }

  let claimStatus;
  try {
    claimStatus = await claimWebhookEvent(supabase, eventId, checkoutSessionId);
  } catch (e) {
    console.error('Webhook idempotency claim failed:', e);
    return res.status(500).json({ error: 'idempotency_unavailable' });
  }

  if (claimStatus === 'duplicate') {
    const { data: row, error: readErr } = await supabase
      .from('stripe_webhook_events')
      .select('email_sent, email_last_error')
      .eq('id', eventId)
      .maybeSingle();

    if (readErr || !row) {
      console.error('Idempotency row read failed:', readErr);
      return res.status(500).json({ error: 'idempotency_read_failed' });
    }

    if (row.email_sent) {
      return res.status(200).json({ received: true, idempotent: true });
    }

    try {
      await sendOrderEmail(resend, metadata);
      await markEmailOk(supabase, eventId);
      return res.status(200).json({ received: true, email_retried: true });
    } catch (emailErr) {
      console.error('Resend error (retry path):', emailErr);
      await markEmailFailed(supabase, eventId, emailErr.message || emailErr);
      return res.status(500).json({ error: 'email_failed' });
    }
  }

  const { data, error } = await supabase
    .from('products')
    .update({ sold: true })
    .eq('id', metadata.productId)
    .eq('sold', false)
    .select();

  if (error) {
    console.error('DB error (sold update):', error);
    await releaseClaim(supabase, eventId);
    return res.status(500).json({ error: 'Database error' });
  }

  if (!data || data.length === 0) {
    console.log('No inventory row updated (already sold or missing id):', metadata.productId);
    await supabase
      .from('stripe_webhook_events')
      .update({
        email_sent: true,
        email_last_error: 'no_row_updated',
      })
      .eq('id', eventId);
    return res.status(200).json({ received: true, skipped: true, reason: 'already_sold_or_missing' });
  }

  try {
    await sendOrderEmail(resend, metadata);
    await markEmailOk(supabase, eventId);
    return res.status(200).json({ received: true });
  } catch (emailErr) {
    console.error('Resend error:', emailErr);
    await markEmailFailed(supabase, eventId, emailErr.message || emailErr);
    return res.status(500).json({ error: 'email_failed' });
  }
}

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

  if (event.type === 'checkout.session.completed') {
    return handleCheckoutSessionCompleted(event, res, supabase, resend);
  }

  return res.status(200).json({ received: true });
}
