import Stripe from "stripe";
import type { PlanId } from "@/lib/db/types";

const stripeSecret = process.env.STRIPE_SECRET_KEY;
export const stripe =
  stripeSecret && stripeSecret.length > 0
    ? new Stripe(stripeSecret, { apiVersion: "2025-02-24.acacia" })
    : null;

export const STRIPE_PRICE_IDS: Partial<Record<PlanId, string>> = {
  starter: process.env.STRIPE_PRICE_STARTER ?? "",
  pro: process.env.STRIPE_PRICE_PRO ?? "",
  team: process.env.STRIPE_PRICE_TEAM ?? "",
};

export function getStripePriceId(planId: PlanId): string | null {
  const id = STRIPE_PRICE_IDS[planId];
  return id && id.length > 0 ? id : null;
}
