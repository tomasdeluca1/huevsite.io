import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { configureLemonSqueezy } from "@/lib/lemonsqueezy";
import { createCheckout } from "@lemonsqueezy/lemonsqueezy.js";

// Make sure to initialize the SDK
configureLemonSqueezy();

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Se puede usar la URL que proveas en las variables de entorno, o la que pasaste por defecto
    const checkoutBaseUrl = process.env.LEMON_SQUEEZY_CHECKOUT_URL || "https://huevsite.lemonsqueezy.com/checkout/buy/d1f67827-c296-4708-a267-c6666ea0f3ae";
    
    const url = new URL(checkoutBaseUrl);
    
    // Le pasamos el email para autocompletar, y muy importante, el user_id para que el webhook sepa a quién darle el plan Pro
    if (user.email) {
      url.searchParams.set("checkout[email]", user.email);
    }
    url.searchParams.set("checkout[custom][user_id]", user.id);

    return NextResponse.json({ checkoutUrl: url.toString() }, { status: 200 });

  } catch (error) {
    console.error("Error general en checkout:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
