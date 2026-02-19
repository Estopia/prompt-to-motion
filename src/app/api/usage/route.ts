import { requireAuth } from "@/lib/auth";
import {
  getUsageCount,
  getUserPlanId,
  PLAN_QUOTAS,
} from "@/lib/quota";
import type { PlanId } from "@/lib/db/types";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await requireAuth().catch((r) => r as Response);
  if (user instanceof Response) return user;
  if (!user) {
    return NextResponse.json(
      { generations: 0, renders: 0, planId: "free" as PlanId },
      { status: 200 }
    );
  }

  const planId = await getUserPlanId(user.id);
  const [generations, renders] = await Promise.all([
    getUsageCount(user.id, "generation"),
    getUsageCount(user.id, "render"),
  ]);
  const quotas = PLAN_QUOTAS[planId];

  return NextResponse.json({
    planId,
    generations,
    renders,
    limitGenerations: quotas.generations_per_month,
    limitRenders: quotas.renders_per_month,
  });
}
