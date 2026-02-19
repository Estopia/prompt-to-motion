import { createServiceRoleClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import type { PlanId } from "@/lib/db/types";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

const PLAN_FROM_PRICE_ID: Record<string, PlanId> = {};
if (process.env.STRIPE_PRICE_STARTER) PLAN_FROM_PRICE_ID[process.env.STRIPE_PRICE_STARTER] = "starter";
if (process.env.STRIPE_PRICE_PRO) PLAN_FROM_PRICE_ID[process.env.STRIPE_PRICE_PRO] = "pro";
if (process.env.STRIPE_PRICE_TEAM) PLAN_FROM_PRICE_ID[process.env.STRIPE_PRICE_TEAM] = "team";

function planIdFromPriceId(priceId: string): PlanId {
  return PLAN_FROM_PRICE_ID[priceId] ?? "starter";
}

export async function POST(req: Request) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret not set" }, { status: 500 });
  }

  const body = await req.text();
  const headersList = await headers();
  const sig = headersList.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  switch (event.type) {
    case "customer.subscription.updated":
    case "customer.subscription.created": {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.supabase_user_id;
      if (!userId) break;
      const priceId = typeof sub.items.data[0]?.price?.id === "string"
        ? sub.items.data[0].price.id
        : "";
      const planId = planIdFromPriceId(priceId);
      const periodEnd = sub.current_period_end
        ? new Date(sub.current_period_end * 1000).toISOString()
        : null;
      await supabase
        .from("subscriptions")
        .upsert(
          {
            user_id: userId,
            stripe_subscription_id: sub.id,
            plan_id: planId,
            status: sub.status,
            current_period_end: periodEnd,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.supabase_user_id;
      if (!userId) break;
      await supabase
        .from("subscriptions")
        .update({
          plan_id: "free",
          stripe_subscription_id: null,
          status: "canceled",
          current_period_end: null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
      break;
    }
    case "invoice.paid":
      // Optional: extend with usage-based billing later
      break;
    default:
      // Unhandled event type
      break;
  }

  return NextResponse.json({ received: true });
}
