// Referral system types
export interface ReferralData {
  referralId: string;
  referrerUserId: string;
  newUserCredits: number;
  referrerBonusCredits: number;
}

export interface ReferralStats {
  totalReferrals: number;
  totalCreditsEarned: number;
  pendingReferrals: number;
}

export interface ReferralReward {
  newUserBonus: number;
  referrerBonus: number;
  baseCredits: number;
}

// Default referral rewards
export const REFERRAL_REWARDS: ReferralReward = {
  newUserBonus: 20,
  referrerBonus: 20,
  baseCredits: 50,
};
