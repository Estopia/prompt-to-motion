# MotionForge – SaaS Build Plan (Ausführlicher Plan)

## Produktname: MotionForge

- Einprägsam, professionell, „schmieden“ = Motion Graphics erschaffen.
- Domain-Idee: motionforge.app

---

## Phase 1: Branding & Dependencies ✅

- [x] package.json: name `motionforge`, description, homepage
- [x] Dependencies: @supabase/supabase-js, @supabase/ssr, stripe
- [x] src/lib/site.ts: SITE_NAME, SITE_DESCRIPTION
- [x] Layout metadata + Header auf MotionForge umgestellt
- [x] .env.example: Supabase + Stripe Variablen

---

## Phase 2: Supabase Schema & RLS

- [ ] Supabase-Projekt anlegen (Dashboard)
- [ ] SQL-Migrationen in `supabase/migrations/`:
  - profiles (id = auth.uid(), email, full_name, avatar_url, created_at, updated_at)
  - usage_events (id, user_id, event_type: generation | render, metadata jsonb, created_at)
  - api_keys (id, user_id, name, key_prefix, key_hash, last_used_at, created_at)
  - subscriptions (id, user_id, stripe_customer_id, stripe_subscription_id, plan_id, status, current_period_end, created_at)
  - projects (id, user_id, title, code, duration_in_frames, fps, thumbnail_url, updated_at)
- [ ] RLS für alle Tabellen: auth.uid() = user_id (bzw. org_id bei Teams später)
- [ ] Trigger: profile anlegen bei auth.users INSERT
- [ ] TypeScript-Typen aus Schema (generiert oder manuell in src/lib/db/types.ts)

---

## Phase 3: Supabase Auth

- [ ] src/lib/supabase/server.ts: createServerClient (Cookies) mit @supabase/ssr
- [ ] src/lib/supabase/client.ts: createBrowserClient (Anon Key)
- [ ] src/lib/supabase/middleware.ts: Session refresh
- [ ] middleware.ts: Protected routes (/generate, /dashboard, /account), redirect /login wenn nicht eingeloggt
- [ ] src/app/(auth)/login/page.tsx + signup/page.tsx (Supabase Auth UI oder eigene Formulare)
- [ ] src/app/(auth)/auth/callback/route.ts: Exchange code for session
- [ ] Auth-Links im Header (Sign in / Sign out, Avatar)

---

## Phase 4: API-Schutz & Auth in Routes

- [ ] getCurrentUser() in src/lib/auth.ts (Server): Session aus Cookie, return user oder null
- [ ] requireAuth(): throw 401 wenn kein User
- [ ] API Keys: Tabelle prüfen, key_hash mit crypto.timingSafeEqual; User zuweisen
- [ ] src/app/api/generate/route.ts: am Anfang requireAuth() bzw. API-Key, userId an usage_events
- [ ] src/app/api/lambda/render/route.ts: gleiche Auth + userId
- [ ] src/app/api/lambda/progress/route.ts: Auth (optional, kann gleicher User sein)

---

## Phase 5: Usage & Quotas

- [ ] src/lib/quota.ts: getPlanQuotas(planId), getUsageCount(userId, period, eventType), checkQuota(), recordUsage()
- [ ] plan_id aus subscriptions (default: free)
- [ ] Vor OpenAI in /api/generate: checkQuota(userId, 'generation'); nach Erfolg recordUsage('generation')
- [ ] Vor Lambda in /api/lambda/render: checkQuota(userId, 'render'); nach Erfolg recordUsage('render')
- [ ] Response 402 + klare Meldung wenn Limit erreicht

---

## Phase 6: Stripe

- [ ] Stripe Dashboard: Products (Free, Starter, Pro), Prices (monthly/yearly)
- [ ] src/app/api/stripe/checkout/route.ts: Create Checkout Session, redirect zu Stripe
- [ ] src/app/api/stripe/webhook/route.ts: subscription.created/updated/deleted, invoice.paid → subscriptions Tabelle updaten
- [ ] Webhook-Signatur prüfen (STRIPE_WEBHOOK_SECRET)
- [ ] Billing-Seite: aktueller Plan, Usage, Button „Upgrade“ / „Manage subscription“ (Customer Portal)

---

## Phase 7: Dashboard & Billing UI

- [ ] /dashboard: Nach Login Standard-Route; Liste „Recent projects“, Usage-Zähler, CTA „New animation“ → /generate
- [ ] /account oder /settings: Profil, Billing (Plan, Upgrade, Manage subscription)
- [ ] Projekte: Save-Button im Editor → INSERT projects; Load im Dashboard → /generate?project=id

---

## Best Practices

- RLS immer an: Kein Zugriff ohne Policy.
- Service Role nur serverseitig (API Routes, Webhooks).
- API Keys gehasht (SHA-256), nur Prefix anzeigen.
- Stripe Webhook idempotent (z. B. insert on conflict do update).
- Alle Nutzer-Inputs mit Zod validieren.
