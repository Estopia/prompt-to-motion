import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/PageLayout";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/dashboard");

  return (
    <PageLayout>
      <div className="flex-1 px-12 py-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="mt-2 text-secondary-foreground">
          Welcome back. Your usage and saved projects will appear here.
        </p>
        <div className="flex gap-4 mt-6">
          <Link href="/generate">
            <Button>New animation</Button>
          </Link>
          <Link href="/account">
            <Button variant="outline">Account & Billing</Button>
          </Link>
        </div>
      </div>
    </PageLayout>
  );
}
