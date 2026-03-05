import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { configureLemonSqueezy } from "@/lib/lemonsqueezy";
import { createCheckout } from "@lemonsqueezy/lemonsqueezy.js";

// Make sure to initialize the SDK
export const dynamic = "force-dynamic";

async function handler(req: NextRequest) {
  try {
    configureLemonSqueezy();
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
      return NextResponse.redirect(`${siteUrl}/login`);
    }

    const checkoutBaseUrl = process.env.LEMON_SQUEEZY_CHECKOUT_URL || "https://huevsite.lemonsqueezy.com/checkout/buy/d1f67827-c296-4708-a267-c6666ea0f3ae";
    const url = new URL(checkoutBaseUrl);

    if (user.email) {
      url.searchParams.set("checkout[email]", user.email);
    }
    url.searchParams.set("checkout[custom][user_id]", user.id);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    url.searchParams.set("checkout[redirect_url]", `${siteUrl}/checkout/success`);

    console.log("Redirecting user to:", url.toString());

    return NextResponse.redirect(url.toString(), {
      status: 302,
    });

  } catch (error) {
    console.error("Error in checkout route:", error);
    return NextResponse.json({ error: "Error redirecting to checkout" }, { status: 500 });
  }
}

export { handler as GET, handler as POST };
