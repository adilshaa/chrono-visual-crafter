import { supabase } from "@/integrations/supabase/client";

// Paddle API configuration
const PADDLE_API_URL =
  import.meta.env.VITE_PADDLE_API_URL || "https://api.paddle.com";
const PADDLE_API_KEY = import.meta.env.VITE_PADDLE_API_KEY;

interface PaddleSubscription {
  id: string;
  status: string;
  current_billing_period: {
    starts_at: string;
    ends_at: string;
  };
  next_billing_period?: {
    starts_at: string;
    ends_at: string;
  };
  cancel_at_period_end: boolean;
}

// Helper function to make authenticated Paddle API requests
const makePaddleRequest = async (
  endpoint: string,
  method: string = "GET",
  body?: any
) => {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${PADDLE_API_KEY}`,
    "Content-Type": "application/json",
  };

  const config: RequestInit = {
    method,
    headers,
  };

  if (body && method !== "GET") {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${PADDLE_API_URL}${endpoint}`, config);

  if (!response.ok) {
    throw new Error(
      `Paddle API error: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
};

// Validate subscription with Paddle
export const validateSubscription = async (
  subscriptionId: string
): Promise<PaddleSubscription> => {
  try {
    const data = await makePaddleRequest(`/subscriptions/${subscriptionId}`);

    return {
      id: data.id,
      status: data.status,
      current_billing_period: {
        starts_at: data.current_billing_period.starts_at,
        ends_at: data.current_billing_period.ends_at,
      },
      next_billing_period: data.next_billing_period
        ? {
            starts_at: data.next_billing_period.starts_at,
            ends_at: data.next_billing_period.ends_at,
          }
        : undefined,
      cancel_at_period_end: data.cancel_at_period_end,
    };
  } catch (error) {
    console.error("Error validating subscription with Paddle:", error);
    throw error;
  }
};

// Cancel subscription
export const cancelSubscription = async (
  subscriptionId: string
): Promise<boolean> => {
  try {
    await makePaddleRequest(`/subscriptions/${subscriptionId}/cancel`, "POST");
    return true;
  } catch (error) {
    console.error("Error canceling subscription:", error);
    throw error;
  }
};

// Reactivate subscription
export const reactivateSubscription = async (
  subscriptionId: string
): Promise<boolean> => {
  try {
    await makePaddleRequest(
      `/subscriptions/${subscriptionId}/reactivate`,
      "POST"
    );
    return true;
  } catch (error) {
    console.error("Error reactivating subscription:", error);
    throw error;
  }
};

// Retry billing for failed payments
export const retryBilling = async (
  subscriptionId: string
): Promise<boolean> => {
  try {
    await makePaddleRequest(
      `/subscriptions/${subscriptionId}/retry-billing`,
      "POST"
    );
    return true;
  } catch (error) {
    console.error("Error retrying billing:", error);
    throw error;
  }
};

// Update subscription in Supabase
export const updateSubscriptionInSupabase = async (
  subscriptionId: string,
  paddleData: PaddleSubscription
): Promise<void> => {
  try {
    const { error } = await supabase
      .from("user_subscriptions")
      .update({
        current_period_start: paddleData.current_billing_period.starts_at,
        current_period_end: paddleData.current_billing_period.ends_at,
        status: paddleData.status,
        updated_at: new Date().toISOString(),
      })
      .eq("paddle_subscription_id", subscriptionId);

    if (error) {
      console.error("Error updating subscription in Supabase:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error updating subscription:", error);
    throw error;
  }
};

// Get subscription details from Supabase
export const getSubscriptionFromSupabase = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from("user_subscriptions")
      .select(
        `
        current_period_end,
        status,
        paddle_subscription_id,
        subscription_plans:plan_id(name)
      `
      )
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error fetching subscription from Supabase:", error);
    throw error;
  }
};

// Check if subscription is expired
export const isSubscriptionExpired = (currentPeriodEnd: string): boolean => {
  const expiryDate = new Date(currentPeriodEnd);
  const now = new Date();
  return expiryDate < now;
};

// Calculate days until expiry
export const getDaysUntilExpiry = (currentPeriodEnd: string): number => {
  const expiryDate = new Date(currentPeriodEnd);
  const now = new Date();
  return Math.ceil(
    (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
};
