"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import type { PlanId } from "@/lib/db/types";

export function UpgradeButton({ planId = "starter" }: { planId?: PlanId }) {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      if (!res.ok) {
        alert(data.error ?? "Checkout failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleUpgrade} disabled={loading}>
      {loading ? "Redirecting…" : `Upgrade to ${planId}`}
    </Button>
  );
}
