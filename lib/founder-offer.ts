import type { FounderSeats } from "@/lib/founder-seats";
import { lemonFounder129CheckoutUrl, lemonLifetimeCheckoutUrl } from "@/lib/lemon-checkout-url";

export const FOUNDER_LAUNCH_PRICE = 79;
export const FOUNDER_NEXT_PRICE_USD = 129;

export interface FounderOffer {
  /** 79 while seats remain (or when the live count failed). 129 once the cap is full. */
  price: number;
  /** Seats left at $79. -1 means the count failed and the counter stays hidden. */
  remaining: number;
  /** Checkout to open. Null when the $129 product is not configured and the cap is full. */
  checkoutUrl: string | null;
  /** Cap is full and there is no $129 checkout, so the card must not keep selling $79. */
  soldOut: boolean;
}

export function resolveFounderOffer(seats: FounderSeats): FounderOffer {
  // remaining === 0 is the only "cap full" signal. -1 is a failed count:
  // keep the $79 checkout rather than announcing a sellout we couldn't verify.
  if (seats.remaining !== 0) {
    return {
      price: FOUNDER_LAUNCH_PRICE,
      remaining: seats.remaining,
      checkoutUrl: lemonLifetimeCheckoutUrl || null,
      soldOut: false,
    };
  }

  if (lemonFounder129CheckoutUrl) {
    return {
      price: FOUNDER_NEXT_PRICE_USD,
      remaining: 0,
      checkoutUrl: lemonFounder129CheckoutUrl,
      soldOut: false,
    };
  }

  return {
    price: FOUNDER_NEXT_PRICE_USD,
    remaining: 0,
    checkoutUrl: null,
    soldOut: true,
  };
}
