# TapGive — Development Roadmap

## Priority 1: Real Payments (Critical Path)
- [ ] Wire Stripe Elements to real payment intent flow on `/donate/[charityId]`
- [ ] Replace `lib/stripe.ts` mock with real Stripe SDK calls
- [ ] Confirm webhook handler (`/api/webhook`) verifies Stripe signature and writes to `transactions` table
- [ ] Tap-to-give on `/home` QuickGive must write to `transactions` table (currently writes to mock-db only)
- [ ] Test end-to-end: tap → payment intent → confirm → receipt email → transaction row

## Priority 2: Persist User Data to Supabase
- [x] Profile edits on Settings page now call `PATCH /api/me` → upserts to `profiles` table
- [x] `getDonations()` / `createDonation()` already wired to Supabase `donations` table via mock-db
- [x] `getStreak()` / `updateStreak()` already wired to `streaks` table via mock-db
- [x] `getBadges()` / `awardBadges()` already wired to `badges` table via mock-db
- [x] `/api/donations/summary` now uses server-side auth (no more hardcoded demo-user-id)
- [x] `createDonation` on home + donate pages now calls `addFeedItem` to populate live feed
- [ ] Run `migration_004_profile_columns_and_feed.sql` in Supabase to add giving_mode + donation_id columns

## Priority 3: Charity Detail & Discovery
- [ ] Charity detail page (`/donate/[charityId]`) needs real bio, mission statement, 501(c)(3) status, tax-deductible indicator, and impact stats
- [ ] "Add a charity" flow must insert row to `charities` table (currently client-side only)
- [ ] Unclaimed charity gift: show amount input + "Send unclaimed gift" CTA
- [ ] Explore/search page: connect to real `charities` table rows instead of `CHARITIES` constant

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
