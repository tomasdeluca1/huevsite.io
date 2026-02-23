import { lemonSqueezySetup } from "@lemonsqueezy/lemonsqueezy.js";

/**
 * Initializes the Lemon Squeezy SDK with the API key from environment variables.
 */
export function configureLemonSqueezy() {
  const apiKey = process.env.LEMON_SQUEEZY_API_KEY;

  if (!apiKey) {
    console.warn("LEMON_SQUEEZY_API_KEY no encontrada. La integración de pagos no funcionará.");
    return;
  }

  lemonSqueezySetup({
    apiKey,
    onError: (error) => console.error("Error setting up Lemon Squeezy:", error),
  });
}
