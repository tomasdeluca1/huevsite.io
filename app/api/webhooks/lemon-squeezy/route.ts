
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { postProUpgrade } from "@/lib/twitter";
import { resolveXHandles } from "@/lib/twitter-utils";
import { findUserIdByEmail } from "@/lib/find-user-by-email";
import { scoreService } from "@/lib/score-service";
import {
  founderRefundAlreadyRecorded,
  hasActiveProSubscription,
  isFounderVariant,
  isRecordedFounderOrder,
  markLemonOrderRefunded,
  orderVariantId,
  recordLemonPurchase,
} from "@/lib/lemon-purchases";

// Recompute the builder score after a tier change (pro/free affects it).
// Non-fatal: a webhook must still 200 even if the score RPC hiccups.
async function recomputeScoreSafe(userId: string) {
   try {
      await scoreService.recomputeScore(userId);
   } catch (e) {
      console.error("recompute score (non-fatal) for", userId, e);
   }
}

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

         // Tier changed → recompute the builder score.
         await recomputeScoreSafe(userId);

         if (eventName === "subscription_created") {
            await recordLemonPurchase(supabase, {
               userId,
               eventName,
               lemonId: subscriptionId,
               status,
               customData,
            });
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

         const { data: resumed, error } = await supabase
            .from("profiles")
            .update({
               subscription_tier: isPro ? "pro" : "free",
            })
            .eq("lemon_squeezy_subscription_id", subscriptionId)
            .select("id");

         if (error) {
            console.error("Error resumiendo el perfil en Supabase:", error);
            return NextResponse.json({ error: "Database resume failed" }, { status: 500 });
         }

         for (const row of resumed || []) {
            await recomputeScoreSafe(row.id);
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

         const { data: downgraded, error } = await supabase
            .from("profiles")
            .update({
               subscription_tier: "free",
               // Don't remove the IDs just in case they resubscribe later
            })
            .eq("lemon_squeezy_subscription_id", subscriptionId)
            // Never downgrade a lifetime (Founder) buyer over a stale sub event.
            .eq("is_lifetime", false)
            .select("id");

         if (error) {
            console.error("Error downgradeando el perfil en Supabase:", error);
            return NextResponse.json({ error: "Database downgrade failed" }, { status: 500 });
         }

         // Downgraded to free → recompute the builder score so it reflects the
         // free-tier state (the block cap stays dynamic: 5 + share-unlock bonus).
         for (const row of downgraded || []) {
            await recomputeScoreSafe(row.id);
         }
      }
      // Handle one-time "Founder / Lifetime" purchase. Subscriptions come through
      // the subscription_* events; the lifetime product is a one-time order and
      // ONLY surfaces here — without this, a lifetime buyer pays and never gets Pro.
      else if (eventName === "order_created") {
         const attrs = payload.data.attributes || {};

         const boostVariant = process.env.LEMON_BOOST_VARIANT_ID || "";
         const orderVariant = orderVariantId(attrs);
         const orderId = payload.data?.id?.toString() || "";

         // One-time "Launch boost" ($12): flips featured on the buyer's launch.
         // Ownership is enforced in the UPDATE (id + user_id) so a crafted
         // custom_data can't feature someone else's launch.
         if (boostVariant && orderVariant === boostVariant) {
            if (attrs.status && attrs.status !== "paid") {
               return NextResponse.json({ message: `Boost order status ${attrs.status} ignored` }, { status: 200 });
            }
            const launchId = customData?.launch_id;
            let boostUserId = customData?.user_id;
            if (!boostUserId) boostUserId = await findUserIdByEmail(supabase, attrs.user_email);
            if (!launchId || !boostUserId) {
               console.error("boost order_created: falta launch_id o comprador mapeable", { launchId, boostUserId });
               return NextResponse.json({ error: "Missing launch or user for boost" }, { status: 400 });
            }
            const { data: boosted, error: boostErr } = await supabase
               .from("project_launches")
               .update({ featured: true })
               .eq("id", launchId)
               .eq("user_id", boostUserId)
               .select("id");
            if (boostErr || !boosted?.length) {
               console.error("boost order_created: no se pudo destacar el launch", boostErr, { launchId, boostUserId });
               return NextResponse.json({ error: "Boost update failed" }, { status: 500 });
            }
            try {
               await supabase.from("activities").insert({
                  user_id: boostUserId,
                  type: "launch_boost",
                  data: { launch_id: launchId, order_id: orderId },
               });
            } catch (e) {
               console.error("boost order_created: activity insert (non-fatal):", e);
            }
            await recordLemonPurchase(supabase, {
               userId: boostUserId,
               eventName,
               lemonId: orderId,
               variantId: orderVariant,
               status: "paid",
               customData,
            });
            console.log(`launch boost aplicado: launch ${launchId} destacado (user ${boostUserId})`);
            return NextResponse.json({ message: "Launch boosted" }, { status: 200 });
         }

         // Gate: only grant Pro for a Founder variant ($79 or $129). A missing
         // variant still grants, matching the previous webhook (some payloads
         // omit first_order_item). Any other one-time product does not.
         if (orderVariant && !isFounderVariant(orderVariant)) {
            console.log(`order_created ignorado: variant ${orderVariant} no es Founder`);
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

         // Granted lifetime Pro → recompute the builder score.
         await recomputeScoreSafe(userId);

         try {
            await supabase.from("activities").insert({
               user_id: userId,
               type: "pro_upgrade",
               data: { event: eventName, lifetime: true, order_id: orderId, variant_id: orderVariant },
            });
         } catch (e) {
            console.error("order_created: activity insert (non-fatal):", e);
         }

         await recordLemonPurchase(supabase, {
            userId,
            eventName,
            lemonId: orderId,
            variantId: orderVariant,
            status: "paid",
            customData,
         });
      }
      // Full or partial refund of a Founder order. Drops lifetime. Pro stays
      // only when a separate subscription is active or on trial right now.
      else if (eventName === "order_refunded") {
         const attrs = payload.data.attributes || {};
         const orderVariant = orderVariantId(attrs);
         const orderId = payload.data?.id?.toString() || "";

         if (!orderId) {
            return NextResponse.json({ error: "Missing order id" }, { status: 400 });
         }
         const founderOrder = isFounderVariant(orderVariant) || (!orderVariant && await isRecordedFounderOrder(supabase, orderId));
         if (!founderOrder) {
            console.log(`order_refunded ignorado: variant ${orderVariant || "?"} no es Founder`);
            return NextResponse.json({ message: "Refund ignored (not founder)" }, { status: 200 });
         }
         if (await founderRefundAlreadyRecorded(supabase, orderId)) {
            return NextResponse.json({ message: "Refund already processed" }, { status: 200 });
         }

         let userId = customData?.user_id;
         if (!userId) userId = await findUserIdByEmail(supabase, attrs.user_email);
         if (!userId) {
            console.error("order_refunded: no se pudo mapear el comprador");
            return NextResponse.json({ error: "Missing user for refund" }, { status: 400 });
         }

         const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("id, lemon_squeezy_subscription_id")
            .eq("id", userId)
            .maybeSingle();
         if (profileError || !profile) {
            console.error("order_refunded: perfil no encontrado", profileError);
            return NextResponse.json({ error: "Profile not found" }, { status: 400 });
         }

         const keepPro = await hasActiveProSubscription(profile.lemon_squeezy_subscription_id);
         if (keepPro === null) {
            return NextResponse.json({ error: "Could not verify subscription" }, { status: 500 });
         }

         const patch: Record<string, unknown> = { is_lifetime: false };
         if (!keepPro) patch.subscription_tier = "free";

         const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
         if (error) {
            console.error("order_refunded: error actualizando el perfil:", error);
            return NextResponse.json({ error: "Database update failed" }, { status: 500 });
         }

         await recomputeScoreSafe(userId);
         await markLemonOrderRefunded(supabase, orderId, userId, orderVariant);

         try {
            const { data: prior } = await supabase
               .from("activities")
               .select("id")
               .eq("user_id", userId)
               .eq("type", "founder_refund")
               .contains("data", { order_id: orderId })
               .maybeSingle();
            if (!prior) {
               await supabase.from("activities").insert({
                  user_id: userId,
                  type: "founder_refund",
                  data: { order_id: orderId, variant_id: orderVariant, kept_pro: keepPro },
               });
            }
         } catch (e) {
            console.error("order_refunded: activity insert (non-fatal):", e);
         }
      }

      return NextResponse.json({ message: "Webhook processed successfully" }, { status: 200 });

   } catch (error) {
      console.error("Error procesando webhook:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
   }
}
