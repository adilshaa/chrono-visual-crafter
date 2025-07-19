import { supabase } from "@/integrations/supabase/client";

export class SubscriptionAuditLogger {
  /**
   * Log subscription cancellation for audit purposes
   */
  static async logCancellation(
    userId: string,
    subscriptionId: string,
    reason: string,
    previousStatus: string
  ): Promise<void> {
    try {
      const { error } = await supabase.from("subscription_audit_logs").insert({
        user_id: userId,
        subscription_id: subscriptionId,
        action: "cancel",
        reason: reason,
        previous_status: previousStatus,
        details: JSON.stringify({
          timestamp: new Date().toISOString(),
          source: "client_side",
        }),
        created_at: new Date().toISOString(),
      });

      if (error) {
        console.error("Error logging subscription cancellation:", error);
        // Don't throw error as this is non-critical logging
      } else {
      }
    } catch (error) {
      console.error(
        "Exception while logging subscription cancellation:",
        error
      );
      // Don't throw error as this is non-critical logging
    }
  }

  /**
   * Log subscription activation for audit purposes
   */
  static async logActivation(
    userId: string,
    subscriptionId: string,
    planName: string
  ): Promise<void> {
    try {
      const { error } = await supabase.from("subscription_audit_logs").insert({
        user_id: userId,
        subscription_id: subscriptionId,
        action: "activate",
        reason: "payment_completed",
        details: JSON.stringify({
          plan: planName,
          timestamp: new Date().toISOString(),
          source: "client_side",
        }),
        created_at: new Date().toISOString(),
      });

      if (error) {
        console.error("Error logging subscription activation:", error);
      } else {
      }
    } catch (error) {
      console.error("Exception while logging subscription activation:", error);
    }
  }

  /**
   * Log subscription status change for audit purposes
   */
  static async logStatusChange(
    userId: string,
    subscriptionId: string,
    action: string,
    previousStatus: string,
    newStatus: string,
    reason?: string
  ): Promise<void> {
    try {
      const { error } = await supabase.from("subscription_audit_logs").insert({
        user_id: userId,
        subscription_id: subscriptionId,
        action: action,
        reason: reason || "status_change",
        previous_status: previousStatus,
        details: JSON.stringify({
          new_status: newStatus,
          timestamp: new Date().toISOString(),
          source: "client_side",
        }),
        created_at: new Date().toISOString(),
      });

      if (error) {
        console.error("Error logging subscription status change:", error);
      } else {
      }
    } catch (error) {
      console.error(
        "Exception while logging subscription status change:",
        error
      );
    }
  }
}
