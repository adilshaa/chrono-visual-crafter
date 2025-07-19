// @ts-ignore -- Deno environment
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore -- Deno environment
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// @ts-ignore -- Deno environment
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// SECURITY: Restrict CORS to only necessary origins
const getAllowedOrigin = (requestOrigin: string | null): string => {
  const allowedOrigins = (
    Deno.env.get("ALLOWED_ORIGIN") || "http://localhost:8080"
  ).split(",");

  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    return requestOrigin;
  }

  // Default to first allowed origin if no match
  return allowedOrigins[0];
};

const getCorsHeaders = (requestOrigin: string | null) => ({
  "Access-Control-Allow-Origin": getAllowedOrigin(requestOrigin),
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Max-Age": "86400", // Cache preflight request for 24 hours
});

const PADDLE_API_KEY = Deno.env.get("PADDLE_API_KEY");
const PADDLE_API_URL =
  Deno.env.get("PADDLE_API_URL") || "https://api.paddle.com";
const APP_ENVIRONMENT = Deno.env.get("APP_ENVIRONMENT") || "development";
const API_VERSION = Deno.env.get("PADDLE_API_VERSION") || "v2";

// Helper function to make Paddle API calls
async function callPaddleAPI(endpoint: string, method = "GET", body?: any) {
  if (!PADDLE_API_KEY) {
    throw new Error("PADDLE_API_KEY not configured");
  }

  const url = `${PADDLE_API_URL}${endpoint}`;

  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${PADDLE_API_KEY}`,
    },
  };

  if (body && method !== "GET") {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  // Try to parse the JSON response
  let data;
  try {
    data = await response.json();
  } catch (error) {
    console.error("Error parsing Paddle API response:", error);
    throw new Error(`Failed to parse Paddle response: ${error.message}`);
  }

  // Check if the response was successful
  if (!response.ok) {
    console.error(`Paddle API error (${method} ${endpoint}):`, data);

    // Create a more detailed error object
    const errorDetails = {
      status: response.status,
      statusText: response.statusText,
      paddleError: data.error || data,
      endpoint: endpoint,
      method: method,
    };

    const error = new Error(
      `Paddle API error: ${data.error?.message || response.statusText}`
    );
    // Attach additional details to the error
    (error as any).details = errorDetails;
    (error as any).paddleErrorCode = data.error?.code;

    throw error;
  }

  return { data, response };
}

// Get subscription details
async function getSubscriptionDetails(subscriptionId: string) {
  try {
    const { data } = await callPaddleAPI(`/subscriptions/${subscriptionId}`);
    return data;
  } catch (error) {
    console.error("Error fetching subscription details:", error);
    throw error;
  }
}

// Check for pending changes
function hasPendingChanges(subscriptionData: any): boolean {
  return (
    subscriptionData.scheduled_change !== undefined &&
    subscriptionData.scheduled_change !== null
  );
}

// Cancel pending changes
async function cancelPendingChanges(subscriptionId: string) {
  try {
    const { data } = await callPaddleAPI(
      `/subscriptions/${subscriptionId}/cancel-scheduled-changes`,
      "POST"
    );

    return data;
  } catch (error) {
    console.error("Error canceling pending changes:", error);
    throw error;
  }
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("Origin"));

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Check request method
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract JWT token from auth header for Supabase client
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.substring(7);

    // Parse request body
    let payload;
    try {
      payload = await req.json();
    } catch (error) {
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate required fields
    const { subscriptionId, userId, reason = "user_initiated" } = payload;
    if (!subscriptionId || !userId) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields",
          details: "subscriptionId and userId are required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verify user has permission to cancel this subscription

    const { data: subscription, error: subscriptionError } =
      await supabaseClient
        .from("user_subscriptions")
        .select("id, status")
        .eq("user_id", userId)
        .eq("paddle_subscription_id", subscriptionId)
        .order("created_at", { ascending: false })
        .limit(1);

    if (subscriptionError || !subscription) {
      console.error("Error verifying subscription:", subscriptionError);
      return new Response(
        JSON.stringify({
          error: "Subscription verification failed",
          details: subscriptionError?.message || "Subscription not found",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if subscription is already cancelled - handle both spelling variants
    if (
      subscription.status === "cancelled" ||
      subscription.status === "canceled"
    ) {
      return new Response(
        JSON.stringify({
          message: "Subscription is already cancelled",
          success: true,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check subscription status with Paddle API
   

    if (!PADDLE_API_KEY) {
      console.error("PADDLE_API_KEY not configured");
      return new Response(
        JSON.stringify({
          error: "Server configuration error",
          details: "Paddle API key is not configured",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    try {
      // Step 1: Get current subscription details from Paddle
     

      // Step 2: Handle pending changes if they exist
      if (hasPendingChanges(subscriptionDetails)) {
        await cancelPendingChanges(subscriptionId);
      }

      // Step 3: Now proceed with cancellation
      let paddleData;
      try {
        const result = await callPaddleAPI(
          `/subscriptions/${subscriptionId}/cancel`,
          "POST",
          {
            effective_from: "immediately",
          }
        );
        paddleData = result.data;
      } catch (paddleError: any) {
        // Check if the subscription is already cancelled
        if (
          paddleError.paddleErrorCode === "subscription_update_when_canceled" ||
          (paddleError.message &&
            paddleError.message.includes(
              "subscription_update_when_canceled"
            )) ||
          (paddleError.message &&
            paddleError.message.includes("subscription is canceled")) ||
          (paddleError.message &&
            paddleError.message.includes(
              "cannot update subscription, as subscription is canceled"
            ))
        ) {
         
          paddleData = {
            status: "cancelled",
            message: "Subscription was already cancelled in Paddle",
          };
        } else {
          // Re-throw other Paddle errors
          console.error(
            "Unhandled Paddle error during cancellation:",
            paddleError
          );
          throw paddleError;
        }
      }

      // Update subscription in database using the new cancel function

      const { error: updateError } = await supabaseClient.rpc(
        "cancel_user_subscription",
        {
          p_user_id: userId,
          p_paddle_subscription_id: subscriptionId,
          p_reason: reason,
        }
      );

      if (updateError) {
        console.error("Error canceling subscription in database:", updateError);
        return new Response(
          JSON.stringify({
            error: "Database update failed",
            paddleStatus:
              "Subscription was canceled in Paddle but database update failed",
            details: updateError.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

    

      // Log to audit table
      try {
        const { error: auditError } = await supabaseClient
          .from("subscription_audit_logs")
          .insert({
            user_id: userId,
            subscription_id: subscriptionId,
            action: "cancel",
            reason: reason,
            details: JSON.stringify(paddleData),
            created_at: new Date().toISOString(),
          });

        if (auditError) {
          console.error("Error logging to audit table:", auditError);
          // Non-critical error, continue
        }
      } catch (error) {
        console.error("Error inserting audit log:", error);
        // Non-critical error, continue
      }

      // Return success response
      return new Response(
        JSON.stringify({
          success: true,
          message: "Subscription canceled successfully",
          data: paddleData,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("Error during Paddle API operations:", error);
      return new Response(
        JSON.stringify({
          error: "Paddle API operation failed",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Unhandled error in cancel-subscription function:", error);
    return new Response(
      JSON.stringify({
        error: "An unexpected error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
