
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { postProUpgrade } from "@/lib/twitter";
import { resolveXHandles } from "@/lib/twitter-utils";
import { findUserIdByEmail } from "@/lib/find-user-by-email";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
   try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseKey) {
         console.error("Falta SUPABASE_SERVICE_ROLE_KEY");
         return NextResponse.json({ error: "Supabase key not configured" }, { status: 500 });
      }

      const supabase = createClient(supabaseUrl, supabaseKey);

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
      const digest = hmac.update(rawBody).digest("hex");

      const digestBuffer = Buffer.from(digest, "utf8");
      const signatureBuffer = Buffer.from(signature, "utf8");

      if (digestBuffer.length !== signatureBuffer.length || !crypto.timingSafeEqual(digestBuffer, signatureBuffer)) {
         console.error("Firma de Lemon Squeezy inválida.");
         return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }

      const payload = JSON.parse(rawBody);
      const eventName = payload.meta.event_name;
      const customData = payload.meta.custom_data;

      // Handle Subscription Created/Updated
      if (eventName === "subscription_created" || eventName === "subscription_updated") {
         let userId = customData?.user_id;
         const customerId = payload.data.attributes.customer_id.toString();
         const subscriptionId = payload.data.id.toString();
         const status = payload.data.attributes.status; // 'active', 'past_due', 'unpaid', 'cancelled', 'expired'

         console.log(`Procesando ${eventName} para subscription ${subscriptionId}, status: ${status}`);

         // Si no viene user_id (puede pasar en updates), lo buscamos por subscriptionId
         if (!userId) {
            const { data: profile } = await supabase
               .from("profiles")
               .select("id")
               .eq("lemon_squeezy_subscription_id", subscriptionId)
               .maybeSingle();

            if (profile) {
               userId = profile.id;
            }
         }

         // Fallback por email del comprador: cubre checkouts que no llevaron
         // custom_data.user_id (p.ej. la URL de checkout estática). Matchea
         // contra profiles.email y, si no, contra el email de auth (poblado al
         // ~100%), que es lo que lo hace confiable.
         if (!userId) {
            const buyerEmail = payload.data.attributes?.user_email;
            userId = await findUserIdByEmail(supabase, buyerEmail);
            if (userId) {
               console.log(`Usuario mapeado por email (${buyerEmail}) para subscription ${subscriptionId}`);
            }
         }

         if (!userId) {
            console.error("No se pudo encontrar un usuario para esta suscripción (ni en custom_data, ni por subscription_id, ni por email)");
            return NextResponse.json({ error: "Missing user_id and subscription not found" }, { status: 400 });
         }

         const isPro = status === "active" || status === "on_trial";

         const { error } = await supabase
            .from("profiles")
            .update({
               subscription_tier: isPro ? "pro" : "free",
               lemon_squeezy_customer_id: customerId,
               lemon_squeezy_subscription_id: subscriptionId,
               pro_since: isPro ? new Date().toISOString() : null
            })
            .eq("id", userId);

         if (error) {
            console.error("Error actualizando el perfil en Supabase:", error);
            return NextResponse.json({ error: "Database update failed" }, { status: 500 });
         }

         if (eventName === "subscription_created" && isPro) {
            await supabase.from("activities").insert({
               user_id: userId,
               type: "pro_upgrade",
               data: { event: eventName, subscription_id: subscriptionId },
            });

            // Referral Logic
            try {
               const { data: userData } = await supabase
                  .from("profiles")
                  .select("referred_by")
                  .eq("id", userId)
                  .single();

               if (userData?.referred_by) {
                  const referrerId = userData.referred_by;
                  
                  // Increment count
                  const { data: referrer, error: refError } = await supabase.rpc('increment_pro_referrals', { user_id_param: referrerId });
                  
                  // If we don't have an RPC, we'll do it manually (safest if transition hasn't applied)
                  if (refError) {
                     const { data: currentReferrer } = await supabase
                        .from("profiles")
                        .select("pro_referrals_count")
                        .eq("id", referrerId)
                        .single();
                     
                     if (currentReferrer) {
                        const newCount = (currentReferrer.pro_referrals_count || 0) + 1;
                        const updates: any = { pro_referrals_count: newCount };
                        
                        if (newCount >= 3) {
                           updates.subscription_tier = "pro";
                           // Set expiration to 3 months from now
                           const expiresAt = new Date();
                           expiresAt.setMonth(expiresAt.getMonth() + 3);
                           updates.referral_reward_expires_at = expiresAt.toISOString();
                        }
                        
                        await supabase
                           .from("profiles")
                           .update(updates)
                           .eq("id", referrerId);
                     }
                  }
               }
            } catch (err) {
               console.error("Error processing referral reward:", err);
            }

            // Post to X
            try {
               const { data: profile } = await supabase
                  .from("profiles")
                  .select("username")
                  .eq("id", userId)
                  .single();

               if (profile?.username) {
                  const handles = await resolveXHandles([profile.username]);
                  await postProUpgrade(profile.username, handles[profile.username]);
               }
            } catch (xErr) {
               console.error("Error posting PRO upgrade to X:", xErr);
            }
         }
      }
      // Handle Subscription Resumed
      else if (eventName === "subscription_resumed") {
         const subscriptionId = payload.data.id.toString();
         const status = payload.data.attributes.status;
         const isPro = status === "active" || status === "on_trial";

         const { error } = await supabase
            .from("profiles")
            .update({
               subscription_tier: isPro ? "pro" : "free",
            })
            .eq("lemon_squeezy_subscription_id", subscriptionId);

         if (error) {
            console.error("Error resumiendo el perfil en Supabase:", error);
            return NextResponse.json({ error: "Database resume failed" }, { status: 500 });
         }
      }
      // Handle Subscription Expired/Payment Failed/Paused/Cancelled
      else if (
         eventName === 'subscription_expired' ||
         eventName === 'subscription_payment_failed' ||
         eventName === 'subscription_paused' ||
         eventName === 'subscription_cancelled'
      ) {
         // Find the user by subscription ID
         const subscriptionId = payload.data.id.toString();

         const { error } = await supabase
            .from("profiles")
            .update({
               subscription_tier: "free",
               // Don't remove the IDs just in case they resubscribe later
            })
            .eq("lemon_squeezy_subscription_id", subscriptionId)
            // Never downgrade a lifetime (Founder) buyer over a stale sub event.
            .eq("is_lifetime", false);

         if (error) {
            console.error("Error downgradeando el perfil en Supabase:", error);
            return NextResponse.json({ error: "Database downgrade failed" }, { status: 500 });
         }
      }
      // Handle one-time "Founder / Lifetime" purchase. Subscriptions come through
      // the subscription_* events; the lifetime product is a one-time order and
      // ONLY surfaces here — without this, a lifetime buyer pays and never gets Pro.
      else if (eventName === "order_created") {
         const attrs = payload.data.attributes || {};

         // Optional gate: if LEMON_LIFETIME_VARIANT_ID is set, only grant Pro for
         // that variant (so any other one-time product won't grant Pro).
         const lifetimeVariant = process.env.LEMON_LIFETIME_VARIANT_ID;
         const orderVariant = attrs.first_order_item?.variant_id?.toString();
         if (lifetimeVariant && orderVariant && orderVariant !== lifetimeVariant) {
            console.log(`order_created ignorado: variant ${orderVariant} != lifetime ${lifetimeVariant}`);
            return NextResponse.json({ message: "Order ignored (not lifetime)" }, { status: 200 });
         }

         // Only grant on a paid order.
         if (attrs.status && attrs.status !== "paid") {
            return NextResponse.json({ message: `Order status ${attrs.status} ignored` }, { status: 200 });
         }

         let userId = customData?.user_id;
         if (!userId) {
            userId = await findUserIdByEmail(supabase, attrs.user_email);
            if (userId) console.log(`order_created mapeado por email (${attrs.user_email})`);
         }
         if (!userId) {
            console.error("order_created: no se pudo mapear el comprador (ni custom_data ni email)");
            return NextResponse.json({ error: "Missing user for order" }, { status: 400 });
         }

         const { error } = await supabase
            .from("profiles")
            .update({
               subscription_tier: "pro",
               is_lifetime: true,
               pro_since: new Date().toISOString(),
               lemon_squeezy_customer_id: attrs.customer_id?.toString() ?? null,
            })
            .eq("id", userId);

         if (error) {
            console.error("order_created: error actualizando el perfil:", error);
            return NextResponse.json({ error: "Database update failed" }, { status: 500 });
         }

         try {
            await supabase.from("activities").insert({
               user_id: userId,
               type: "pro_upgrade",
               data: { event: eventName, lifetime: true },
            });
         } catch (e) {
            console.error("order_created: activity insert (non-fatal):", e);
         }
      }

      return NextResponse.json({ message: "Webhook processed successfully" }, { status: 200 });

   } catch (error) {
      console.error("Error procesando webhook:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
   }
}
