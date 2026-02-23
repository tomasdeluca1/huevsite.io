import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseServiceKey) {
      console.error("Falta SUPABASE_SERVICE_ROLE_KEY");
      return NextResponse.json({ error: "Supabase service key not configured" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
    
    if (!secret) {
      console.error("Falta LEMON_SQUEEZY_WEBHOOK_SECRET");
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
    }

    // Get the raw body
    const rawBody = await req.text();
    const signature = req.headers.get("x-signature") || "";

    // Verify signature
    const hmac = crypto.createHmac("sha256", secret);
    const digest = Buffer.from(hmac.update(rawBody).digest("hex"), "utf8");
    const signatureBuffer = Buffer.from(signature, "utf8");

    if (digest.length !== signatureBuffer.length || !crypto.timingSafeEqual(digest, signatureBuffer)) {
      console.error("Firma de Lemon Squeezy inválida.");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const eventName = payload.meta.event_name;
    const customData = payload.meta.custom_data;

    // Handle Subscription Created/Updated
    if (eventName === "subscription_created" || eventName === "subscription_updated") {
       const userId = customData?.user_id;
       const customerId = payload.data.attributes.customer_id.toString();
       const subscriptionId = payload.data.id.toString();
       const status = payload.data.attributes.status; // 'active', 'past_due', 'unpaid', 'cancelled', 'expired'
       
       if (!userId) {
          console.error("Webhook recibido sin user_id en custom_data");
          return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
       }

       const isPro = status === "active" || status === "on_trial";

       const { error } = await supabase
          .from("profiles")
          .update({
             subscription_tier: isPro ? "pro" : "free",
             lemon_squeezy_customer_id: customerId,
             lemon_squeezy_subscription_id: subscriptionId
          })
          .eq("id", userId);

       if (error) {
           console.error("Error actualizando el perfil en Supabase:", error);
           return NextResponse.json({ error: "Database update failed" }, { status: 500 });
       }
    } 
    // Handle Subscription Cancelled/Expired
    else if (eventName === 'subscription_cancelled' || eventName === 'subscription_expired' || eventName === 'subscription_payment_failed') {
       // Find the user by subscription ID
       const subscriptionId = payload.data.id.toString();
       
       const { error } = await supabase
          .from("profiles")
          .update({
             subscription_tier: "free",
             // Don't remove the IDs just in case they resubscribe later
          })
          .eq("lemon_squeezy_subscription_id", subscriptionId);
          
       if (error) {
           console.error("Error downgradeando el perfil en Supabase:", error);
           return NextResponse.json({ error: "Database downgrade failed" }, { status: 500 });
       }
    }

    return NextResponse.json({ message: "Webhook processed successfully" }, { status: 200 });

  } catch (error) {
    console.error("Error procesando webhook:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
