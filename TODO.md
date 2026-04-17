# TapGive — Development Roadmap

## Priority 1: Real Payments (Critical Path)
- [x] Stripe Elements wired on `/donate/[charityId]` — shows real PaymentElement when `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` set
- [x] `lib/stripe.ts` uses real Stripe SDK when `STRIPE_SECRET_KEY` set; mocks otherwise
- [x] `/api/payment-intent` now injects `userId` + `privacyMode` into PI metadata (webhook can attribute payments)
- [x] Webhook handler verifies Stripe signature, handles `payment_intent.succeeded` + `payment_intent.payment_failed`
- [x] `transactions` table added to schema + migration_005 (run in Supabase to activate)
- [x] `stripe_customer_id` + `stripe_payment_method_id` columns added to profiles
- [ ] Tap-to-give on `/home` QuickGive: write pending transaction row to `transactions` table before Stripe confirms
- [ ] End-to-end test with real Stripe keys: set `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`

## Priority 2: Persist User Data to Supabase
- [x] Profile edits on Settings page now call `PATCH /api/me` → upserts to `profiles` table
- [x] `getDonations()` / `createDonation()` already wired to Supabase `donations` table via mock-db
- [x] `getStreak()` / `updateStreak()` already wired to `streaks` table via mock-db
- [x] `getBadges()` / `awardBadges()` already wired to `badges` table via mock-db
- [x] `/api/donations/summary` now uses server-side auth (no more hardcoded demo-user-id)
- [x] `createDonation` on home + donate pages now calls `addFeedItem` to populate live feed
- [ ] Run `migration_004_profile_columns_and_feed.sql` in Supabase to add giving_mode + donation_id columns

## Priority 3: Charity Detail & Discovery
- [x] Charity detail card added to `/donate/[charityId]` — shows mission, tax-deductible badge, 501(c)(3), EIN, website link
- [x] `POST /api/charities` inserts PENDING charity row to Supabase (service role)
- [x] Unclaimed gift flow: name + amount + website inputs → `POST /api/charities` → confirmation screen
- [x] Explore page fetches from `/api/charities` (Supabase-backed) with mock-data fallback + loading skeletons
- [x] CharitySearchModal fetches from `/api/charities` on open; falls back to mock-data
- [ ] Seed real charity rows to `charities` table in Supabase (currently only mock-data has them)

## Priority 4: Social & Feed
- [ ] Feed page (`/feed`) must read from real `donations` table joined with `profiles`
- [ ] Like/reaction state must persist (currently local state only)
- [ ] Add follow/friend graph so "Near me" and "Friends" filters work with real data
- [ ] Share a donation: generate shareable link or social card

## Priority 5: Onboarding & Growth
- [ ] Complete onboarding flow: save city/region to `profiles.city_region`
- [ ] Referral / invite link system: track via `referrals` table
- [ ] Monthly recap email: trigger via `/api/cron/month-end` → Resend
- [ ] Push notifications for streak reminders (PWA or native)
- [ ] Charity org dashboard: claim charity, view incoming donations, connect Stripe Connect payout
