export type PrivacyMode = 'PUBLIC' | 'FRIENDS' | 'PRIVATE';
export type GivingMode = 'budget' | 'open' | 'intentional';
export type RemainderPreference = 'top_charity' | 'split_even' | 'rollover';
export type TransactionType = 'tap' | 'one_time' | 'budget_remainder';
export type TransactionStatus = 'pending' | 'settled' | 'failed';
export type SettlementStatus = 'pending' | 'completed' | 'failed';
export type OrgType = '501c3' | 'mutual_aid' | 'personal' | 'other';
export type DonationStatus = 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED';
export type VerificationStatus = 'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED';
export type BadgeType =
  | 'FIRST_DONATION'
  | 'STREAK_7'
  | 'STREAK_30'
  | 'STREAK_365'
  | 'CAUSES_5'
  | 'CAUSES_10'
  | 'DONATED_100'
  | 'DONATED_1000'
  | 'EARLY_ADOPTER'
  | 'LOCAL_HERO';
export type CauseCategory =
  | 'animals'
  | 'education'
  | 'hunger'
  | 'disaster_relief'
  | 'environment'
  | 'health'
  | 'housing'
  | 'veterans'
  | 'children';

export interface Charity {
  id: string;
  displayName: string;
  legalName: string;
  category: CauseCategory;
  emoji: string;
  missionSummary: string;
  impactSummary?: string;
  logoUrl?: string;
  website?: string;
  verificationStatus: VerificationStatus;
  cityRegion?: string;
  country: string;
  popularityScore: number;
  urgencyScore: number;
  impactMetricLabel: string;
  impactPerDollar: number;
  stripeAccountId?: string;
  ein?: string;
  orgType?: OrgType;
  taxDeductible?: boolean;
}

export interface Donation {
  id: string;
  userId: string;
  charityId: string;
  charity?: Charity;
  amountCents: number;
  tipCents: number;
  feeCents: number;
  totalCents: number;
  charityReceivesCents: number;
  currency: string;
  status: DonationStatus;
  privacyMode: PrivacyMode;
  fundingSource?: string;
  stripePaymentIntentId?: string;
  idempotencyKey: string;
  donatedAt: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  privacyMode: PrivacyMode;
  cityRegion?: string;
  bio?: string;
  username: string;
  memberSince: string;
  // Stripe Connect / giving mode fields
  stripeCustomerId?: string;
  stripePaymentMethodId?: string;
  givingMode?: GivingMode;
  monthlyBudgetCents?: number;
  remainderPreference?: RemainderPreference;
  weeklyAlertCents?: number;
  onboardingComplete?: boolean;
}

export interface Transaction {
  id: string;
  userId: string;
  charityId: string;
  amountCents: number;
  type: TransactionType;
  status: TransactionStatus;
  stripePaymentIntentId?: string;
  settlementId?: string;
  createdAt: string;
}

export interface Settlement {
  id: string;
  charityId: string;
  totalCents: number;
  stripeTransferId?: string;
  periodStart: string;
  periodEnd: string;
  status: SettlementStatus;
  createdAt: string;
}

export interface UserCharityPreference {
  id: number;
  userId: string;
  charityId: string;
  weight: number;
  createdAt: string;
}

export interface Streak {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastDonationDate: Date | null;
  updatedAt: Date;
}

export interface Badge {
  userId: string;
  badgeType: BadgeType;
  awardedAt: string;
}

export interface FeedItem {
  id: string;
  userId: string;
  donationId: string;
  charityId: string;
  charity: Charity;
  displayName: string;
  cityRegion?: string;
  amountCents: number;
  privacyMode: PrivacyMode;
  createdAt: string;
  liked?: boolean;
}
