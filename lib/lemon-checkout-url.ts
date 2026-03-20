const FALLBACK_LEMON_CHECKOUT_URL = "https://huevsite.lemonsqueezy.com/checkout/buy/d1f67827-c296-4708-a267-c6666ea0f3ae";

export const lemonCheckoutUrl =
  process.env.NEXT_PUBLIC_LEMON_SQUEEZY_CHECKOUT_URL ||
  process.env.LEMON_SQUEEZY_CHECKOUT_URL ||
  FALLBACK_LEMON_CHECKOUT_URL;
