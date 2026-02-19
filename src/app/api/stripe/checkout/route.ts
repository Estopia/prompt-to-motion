import { requireAuth } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { getStripePriceId, stripe } from "@/lib/stripe";
import type { PlanId } from "@/lib/db/types";
import { NextResponse } from "next/server";
import { z } from "zod";

const BodySchema = z.object({ planId: z.enum(["starter", "pro", "team"]) });

export async function POST(req: Request) {
  const user = await requireAuth().catch((r) => r as Response);
  if (user instanceof Response) return user;
  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  if (!stripe) {
    return NextResponse.json(
      { error: "Billing not configured" },
      { status: 503 }
    );
  }

  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  const planId = parsed.success ? (parsed.data.planId as PlanId) : "starter";
  const priceId = getStripePriceId(planId);
  if (!priceId) {
    return NextResponse.json(
      { error: "Price not configured for this plan" },
      { status: 400 }
    );
  }

  const supabase = createServiceRoleClient();
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const customerId =
    (sub as { stripe_customer_id: string | null } | null)?.stripe_customer_id ??
    null;

  let stripeCustomerId = customerId;
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { supabase_user_id: user.id },
    });
    stripeCustomerId = customer.id;
    await supabase
      .from("subscriptions")
      .update({
        stripe_customer_id: stripeCustomerId,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);
  }

  const origin = req.headers.get("origin") ?? req.url.split("/").slice(0, 3).join("/");
  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/dashboard?checkout=success`,
    cancel_url: `${origin}/account?checkout=cancelled`,
    subscription_data: {
      metadata: { supabase_user_id: user.id },
    },
  });

  return NextResponse.json({ url: session.url });
}
