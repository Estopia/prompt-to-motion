import type { PlanId } from "@/lib/db/types";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export const PLAN_QUOTAS: Record<
  PlanId,
  { generations_per_month: number; renders_per_month: number }
> = {
  free: { generations_per_month: 10, renders_per_month: 0 },
  starter: { generations_per_month: 50, renders_per_month: 5 },
  pro: { generations_per_month: 200, renders_per_month: 30 },
  team: { generations_per_month: 500, renders_per_month: 100 },
};

export type UsageEventType = "generation" | "render";

function getMonthBounds(now: Date): { start: string; end: string } {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

/**
 * Get the user's plan (from subscriptions). Defaults to "free" if no row.
 */
export async function getUserPlanId(userId: string): Promise<PlanId> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("plan_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return "free";
  return ((data as { plan_id: PlanId }).plan_id) ?? "free";
}

/**
 * Count usage events for the user in the current month.
 */
export async function getUsageCount(
  userId: string,
  eventType: UsageEventType
): Promise<number> {
  const { start, end } = getMonthBounds(new Date());
  const supabase = createServiceRoleClient();
  const { count, error } = await supabase
    .from("usage_events")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("event_type", eventType)
    .gte("created_at", start)
    .lte("created_at", end);
  if (error) return 0;
  return count ?? 0;
}

/**
 * Check if the user is within quota for the given event type. Throws Response (402) if over limit.
 */
export async function checkQuota(
  userId: string,
  eventType: UsageEventType
): Promise<void> {
  const planId = await getUserPlanId(userId);
  const quotas = PLAN_QUOTAS[planId];
  const limit =
    eventType === "generation"
      ? quotas.generations_per_month
      : quotas.renders_per_month;
  const used = await getUsageCount(userId, eventType);
  if (used >= limit) {
    throw new Response(
      JSON.stringify({
        error: "Quota exceeded",
        message:
          eventType === "render"
            ? "Video render limit reached for this month. Upgrade for more."
            : "Generation limit reached for this month. Upgrade for more.",
        type: "quota",
      }),
      { status: 402, headers: { "Content-Type": "application/json" } }
    );
  }
}

/**
 * Record a usage event (call after successful generation or render).
 */
export async function recordUsage(
  userId: string,
  eventType: UsageEventType,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  const supabase = createServiceRoleClient();
  await supabase.from("usage_events").insert({
    user_id: userId,
    event_type: eventType,
    metadata,
  });
}
