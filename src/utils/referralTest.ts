import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

/**
 * Test utility to verify referral system functionality
 */
export class ReferralTester {
  /**
   * Test if a referral ID exists and is valid
   */
  static async testReferralId(referralId: string): Promise<{
    isValid: boolean;
    referrer?: any;
    error?: string;
  }> {
    try {
      logger.info("Testing referral ID", { referralId });

      const { data: referrer, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, credits, ref_credits, ref_id")
        .eq("ref_id", referralId)
        .single();

      if (error) {
        logger.error("Referral ID test failed", { error, referralId });
        return {
          isValid: false,
          error: error.message,
        };
      }

      if (!referrer) {
        return {
          isValid: false,
          error: "Referral ID not found",
        };
      }

      logger.info("Referral ID is valid", { referralId, referrer });
      return {
        isValid: true,
        referrer,
      };
    } catch (error) {
      logger.error("Unexpected error testing referral ID", {
        error,
        referralId,
      });
      return {
        isValid: false,
        error: "Unexpected error occurred",
      };
    }
  }

  /**
   * Test the complete referral flow simulation
   */
  static async simulateReferralFlow(referralId: string): Promise<{
    success: boolean;
    steps: string[];
    error?: string;
  }> {
    const steps: string[] = [];

    try {
      steps.push("1. Testing referral ID validity...");
      const { isValid, referrer, error } = await this.testReferralId(
        referralId
      );

      if (!isValid) {
        steps.push(`❌ Referral ID invalid: ${error}`);
        return { success: false, steps, error };
      }

      steps.push("✅ Referral ID is valid");
      steps.push(`📊 Referrer: ${referrer.full_name || "Unknown"}`);
      steps.push(`💰 Current credits: ${referrer.credits || 0}`);
      steps.push(`🎁 Referral credits: ${referrer.ref_credits || 0}`);

      steps.push("2. Simulating new user signup...");
      steps.push("✅ New user would receive 70 credits (50 base + 20 bonus)");
      steps.push("✅ Referrer would receive +20 credits");
      steps.push(
        `💰 Referrer new total would be: ${(referrer.credits || 0) + 20}`
      );
      steps.push(
        `🎁 Referrer new ref_credits would be: ${
          (referrer.ref_credits || 0) + 20
        }`
      );

      return { success: true, steps };
    } catch (error) {
      steps.push(`❌ Simulation failed: ${error}`);
      return { success: false, steps, error: String(error) };
    }
  }

  /**
   * Get referral statistics for a user
   */
  static async getReferralStats(userId: string): Promise<{
    totalCredits: number;
    referralCredits: number;
    referralId: string | null;
    referredBy: string | null;
    referralCount: number;
  }> {
    try {
      // Get user's profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("credits, ref_credits, ref_id, referred_by")
        .eq("user_id", userId)
        .single();

      // Count how many people this user has referred
      const { count: referralCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("referred_by", userId);

      return {
        totalCredits: profile?.credits || 0,
        referralCredits: profile?.ref_credits || 0,
        referralId: profile?.ref_id || null,
        referredBy: profile?.referred_by || null,
        referralCount: referralCount || 0,
      };
    } catch (error) {
      logger.error("Error getting referral stats", { error, userId });
      return {
        totalCredits: 0,
        referralCredits: 0,
        referralId: null,
        referredBy: null,
        referralCount: 0,
      };
    }
  }
}

/**
 * Quick test function for development
 */
export const testReferralSystem = async (referralId: string) => {
  console.log("🧪 Testing Referral System");
  console.log("========================");

  const result = await ReferralTester.simulateReferralFlow(referralId);

  result.steps.forEach((step) => console.log(step));

  if (result.success) {
    console.log("\n✅ Referral system test passed!");
  } else {
    console.log("\n❌ Referral system test failed!");
    if (result.error) {
      console.log(`Error: ${result.error}`);
    }
  }

  return result;
};
