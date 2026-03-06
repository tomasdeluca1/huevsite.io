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
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const storeId = process.env.LEMON_SQUEEZY_STORE_ID;
    const variantId = process.env.LEMON_SQUEEZY_PRO_VARIANT_ID;

    if (!storeId || !variantId) {
      throw new Error("Configuración de Lemon Squeezy incompleta (Store ID o Variant ID)");
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    console.log("Creando checkout para el usuario:", user.id);

    // Crear el checkout usando el SDK oficial
    const { data, error } = await createCheckout(
      storeId,
      variantId,
      {
        checkoutOptions: {
          embed: false,
          media: true,
          logo: true,
        },
        checkoutData: {
          email: user.email,
          custom: {
            user_id: user.id,
          },
        },
        productOptions: {
          redirectUrl: `${siteUrl}/checkout/success`,
        }
      }
    );

    if (error) {
      console.error("Error SDK Lemon Squeezy:", error);
      throw new Error(error.message);
    }

    const checkoutUrl = data?.data.attributes.url;

    if (!checkoutUrl) {
      throw new Error("No se pudo generar la URL de checkout");
    }

    console.log("Redirigiendo a checkout:", checkoutUrl);

    return NextResponse.redirect(checkoutUrl, {
      status: 302,
    });

  } catch (error: any) {
    console.error("Error in checkout route:", error);
    return NextResponse.json({ error: error.message || "Error al iniciar el pago" }, { status: 500 });
  }
}

export { handler as GET, handler as POST };
