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
      `Paddle API error: ${JSON.stringify(data) || response.statusText}`
    );
    // Attach additional details to the error
    (error as any).details = errorDetails;
    (error as any).paddleErrorCode = data.error?.code;

    throw error;
  }

  return { data, response };
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

    const { userId, subscriptionId, customerId } = payload;

    // Validate required fields
    if (!userId || !subscriptionId || !customerId) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields",
          details: "userId, subscriptionId, and customerId are required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify the user has permission to access this subscription
   

    // Use a more efficient query that checks both fields in one go with minimal data selection
    const { data: userSubscription, error: subscriptionError } =
      await supabaseClient
        .from("user_subscriptions")
        .select("id")
        .eq("user_id", userId)
        .or(
          `paddle_subscription_id.eq.${subscriptionId},subscription_id.eq.${subscriptionId}`
        )
        .limit(1)
        .maybeSingle(); // Use maybeSingle instead of single to avoid errors when no rows found

    if (subscriptionError || !userSubscription) {
      console.error("Error verifying subscription:", subscriptionError);
      return new Response(
        JSON.stringify({
          error: "Subscription verification failed",
          details:
            subscriptionError?.message ||
            "Subscription not found for this user",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if Paddle API key is configured
    if (!PADDLE_API_KEY) {
      console.error("PADDLE_API_KEY not found in environment variables");
      return new Response(
        JSON.stringify({ error: "Paddle API key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create customer portal session with Paddle API using the helper function

    try {
      const { data: paddleData } = await callPaddleAPI(
        `/customers/${customerId}/portal-sessions`,
        "POST",
        {
          subscription_ids: [subscriptionId],
        }
      );

      return new Response(
        JSON.stringify({
          success: true,
          portal_url: paddleData?.data?.urls?.subscriptions,
          alldata:paddleData,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (paddleError) {
      console.error("Error calling Paddle API:", paddleError);
      return new Response(
        JSON.stringify({
          error: "Failed to create customer portal session",
          details: paddleError.message || "Unknown Paddle API error",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Error creating customer portal session:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
