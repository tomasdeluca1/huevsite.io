-- Lifetime ("Founder") one-time Pro purchases. A lifetime buyer pays once and
-- keeps Pro forever — they have no subscription, so the webhook's subscription_*
-- downgrade handlers must never flip them back to free. This flag, set on the
-- `order_created` webhook event, guards that.

alter table public.profiles
  add column if not exists is_lifetime boolean not null default false;
