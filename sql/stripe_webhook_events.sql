-- Run once in Supabase SQL editor (service role used by Vercel bypasses RLS).
-- Idempotent Stripe webhook delivery: same event.id is never processed twice for email/side effects.

create table if not exists public.stripe_webhook_events (
  id text primary key,
  checkout_session_id text,
  created_at timestamptz not null default now(),
  email_sent boolean not null default false,
  email_last_error text
);

create index if not exists stripe_webhook_events_email_pending
  on public.stripe_webhook_events (email_sent)
  where email_sent = false;

comment on table public.stripe_webhook_events is 'Stripe webhook idempotency; email_sent=false means Stripe may retry until email succeeds.';
