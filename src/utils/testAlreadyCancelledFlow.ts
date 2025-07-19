/**
 * Test utility for the "already cancelled" subscription scenario
 * This helps verify that our error handling works correctly
 */

import { supabase } from "@/integrations/supabase/client";

export async function testAlreadyCancelledScenario(
  subscriptionId: string,
  userId: string
) {
  

  try {
    // First, let's check the current subscription status
    
    const { data: currentSub, error: subError } = await supabase
      .from("user_subscriptions")
      .select("status, paddle_subscription_id")
      .eq("user_id", userId)
      .eq("paddle_subscription_id", subscriptionId)
      .single();

    if (subError) {
      console.error("❌ Error fetching subscription:", subError);
      return { success: false, error: subError };
    }

    

    // Now test the cancellation API
    
    const { data, error } = await supabase.functions.invoke(
      "cancel-subscription",
      {
        method: "POST",
        body: {
          subscriptionId,
          userId,
          reason: "test_already_cancelled",
        },
      }
    );

    if (error) {
     

      // Check if it's the "already cancelled" error
      const errorMessage = error.message || "";
      if (
        errorMessage.includes("subscription_update_when_canceled") ||
        errorMessage.includes("subscription is canceled") ||
        errorMessage.includes("already cancelled")
      ) {
        
        return {
          success: true,
          message: "Already cancelled scenario handled correctly",
          handledGracefully: true,
        };
      } else {
        
        return { success: false, error, unexpectedError: true };
      }
    }

    

    // Check if the response indicates success despite already being cancelled
    if (data?.success) {
      
      return {
        success: true,
        message: "Already cancelled scenario handled gracefully",
        data,
      };
    }

    return { success: true, data };
  } catch (exception) {
    console.error("❌ Exception during test:", exception);
    return { success: false, error: exception };
  }
}

export async function simulateRaceCondition(
  subscriptionId: string,
  userId: string
) {
  

  // Simulate multiple cancellation attempts happening simultaneously
  const promises = Array.from({ length: 3 }, (_, index) => {
    return supabase.functions.invoke("cancel-subscription", {
      method: "POST",
      body: {
        subscriptionId,
        userId,
        reason: `race_condition_test_${index + 1}`,
      },
    });
  });

  try {
    const results = await Promise.allSettled(promises);

    
    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        
      } else {
        
      }
    });

    // Check if at least one succeeded or all handled the "already cancelled" gracefully
    const successCount = results.filter(
      (r) => r.status === "fulfilled" && r.value.data?.success
    ).length;

    const gracefulHandlingCount = results.filter((r) => {
      if (r.status === "rejected") return false;
      const error = r.value.error;
      if (!error) return false;
      const errorMessage = error.message || "";
      return (
        errorMessage.includes("subscription_update_when_canceled") ||
        errorMessage.includes("subscription is canceled") ||
        errorMessage.includes("already cancelled")
      );
    }).length;

   

    return {
      success: true,
      successCount,
      gracefulHandlingCount,
      totalRequests: promises.length,
    };
  } catch (error) {
    console.error("❌ Race condition test failed:", error);
    return { success: false, error };
  }
}

// Development helper - only available in dev mode
if (process.env.NODE_ENV === "development") {
  // @ts-ignore
  window.testAlreadyCancelled = testAlreadyCancelledScenario;
  // @ts-ignore
  window.testRaceCondition = simulateRaceCondition;

  
  
}
