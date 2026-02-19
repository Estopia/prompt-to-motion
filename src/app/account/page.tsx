import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageLayout } from "@/components/PageLayout";
import { UpgradeButton } from "@/components/UpgradeButton";
import {
  getUserPlanId,
  PLAN_QUOTAS,
  getUsageCount,
} from "@/lib/quota";
import type { PlanId } from "@/lib/db/types";

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/account");

  const planId = await getUserPlanId(user.id);
  const [generations, renders] = await Promise.all([
    getUsageCount(user.id, "generation"),
    getUsageCount(user.id, "render"),
  ]);
  const quotas = PLAN_QUOTAS[planId as PlanId];

  return (
    <PageLayout>
      <div className="flex-1 px-12 py-8 max-w-2xl">
        <h1 className="text-2xl font-bold text-white">Account & Billing</h1>
        <p className="mt-2 text-secondary-foreground">
          Your plan and usage for this month.
        </p>

        <div className="mt-8 space-y-6">
          <div className="rounded-lg border border-border bg-card/50 p-4">
            <h2 className="font-semibold text-foreground">Plan</h2>
            <p className="mt-1 text-lg capitalize text-primary">{planId}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {quotas.generations_per_month} generations, {quotas.renders_per_month} renders per month
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card/50 p-4">
            <h2 className="font-semibold text-foreground">Usage this month</h2>
            <p className="mt-1 text-muted-foreground">
              Generations: <span className="text-foreground font-medium">{generations}</span> / {quotas.generations_per_month}
            </p>
            <p className="mt-1 text-muted-foreground">
              Renders: <span className="text-foreground font-medium">{renders}</span> / {quotas.renders_per_month}
            </p>
          </div>

          {planId === "free" && (
            <div>
              <UpgradeButton planId="starter" />
              <p className="mt-2 text-sm text-muted-foreground">
                Redirects to Stripe Checkout when billing is configured.
              </p>
            </div>
          )}
        </div>

        <Link href="/dashboard" className="inline-block mt-8 text-primary hover:underline">
          Back to Dashboard
        </Link>
      </div>
    </PageLayout>
  );
}
