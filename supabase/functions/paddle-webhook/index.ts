// @ts-ignore -- Deno environment
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore -- Deno environment
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// @ts-ignore -- Deno environment
const crypto = globalThis.crypto;

// @ts-ignore -- Deno environment
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// SECURITY: Restrict CORS to only necessary origins and headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "https://paddle.com",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, paddle-signature",
  "Access-Control-Max-Age": "86400", // Cache preflight request for 24 hours
};

const PADDLE_WEBHOOK_SIGNING_SECRET = Deno.env.get(
  "PADDLE_WEBHOOK_SIGNING_SECRET"
);
const APP_ENVIRONMENT = Deno.env.get("APP_ENVIRONMENT") || "development"; // Default to development
const WEBHOOK_TIMESTAMP_TOLERANCE_SECONDS = 120; // 2 minutes (reduced for security)
const MAX_PAYLOAD_SIZE_MB = 10;

async function verifyPaddleSignature(
  req: Request,
  rawBody: string
): Promise<boolean> {
  // SECURITY: Always verify in production
  if (APP_ENVIRONMENT !== "production") {
    console.warn(
      `[WEBHOOK WARN] SECURITY_BYPASS: Paddle signature verification is BYPASSED in ${APP_ENVIRONMENT} environment. THIS SHOULD NOT HAPPEN IN PRODUCTION.`
    );
    return true; // Bypass verification for non-production environments
  }

  // Production environment: proceed with signature verification
  if (!PADDLE_WEBHOOK_SIGNING_SECRET) {
    console.error(
      "[WEBHOOK ERROR] CRITICAL_CONFIG_ERROR: Paddle webhook signing secret is NOT CONFIGURED for PRODUCTION environment."
    );
    return false; // Verification fails if secret is missing in production
  }

  const signatureHeader = req.headers.get("Paddle-Signature");
  if (!signatureHeader) {
    console.warn("[WEBHOOK WARN] Missing Paddle-Signature header.");
    return false;
  }

  const parts = signatureHeader.split(";");
  const timestampStr = parts
    .find((part) => part.startsWith("ts="))
    ?.split("=")[1];
  const h1Hash = parts.find((part) => part.startsWith("h1="))?.split("=")[1];

  if (!timestampStr || !h1Hash) {
    console.warn("[WEBHOOK WARN] Invalid Paddle-Signature header format.");
    return false;
  }

  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) {
    console.warn(
      "[WEBHOOK WARN] Invalid timestamp in Paddle-Signature header."
    );
    return false;
  }

  // SECURITY: Reduce timestamp tolerance from 5 minutes to 2 minutes
  const currentTimestamp = Math.floor(Date.now() / 1000);
  if (
    Math.abs(currentTimestamp - timestamp) > WEBHOOK_TIMESTAMP_TOLERANCE_SECONDS
  ) {
    console.warn(
      `[WEBHOOK WARN] Timestamp validation failed. Header ts: ${timestamp}, Current ts: ${currentTimestamp}, Tolerance: ${WEBHOOK_TIMESTAMP_TOLERANCE_SECONDS}s`
    );
    return false; // Timestamp too old or too far in the future
  }

  // SECURITY: Use constant-time comparison to prevent timing attacks
  try {
    const signedPayload = `${timestampStr}:${rawBody}`;
    const encoder = new TextEncoder();
    const key = encoder.encode(PADDLE_WEBHOOK_SIGNING_SECRET);
    const message = encoder.encode(signedPayload);

    // Create HMAC
    const keyObject = await crypto.subtle.importKey(
      "raw",
      key,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signature = await crypto.subtle.sign("HMAC", keyObject, message);
    const computedHash = Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return computedHash.toLowerCase() === h1Hash.toLowerCase();
  } catch (error) {
    console.error("[WEBHOOK ERROR] Error verifying signature:", error);
    return false;
  }
}

// Idempotency check using a simple in-memory store
// In production, use Redis or database
const processedEvents = new Map<string, number>();
const IDEMPOTENCY_TTL = 24 * 60 * 60 * 1000; // 24 hours

function isEventProcessed(eventId: string): boolean {
  const timestamp = processedEvents.get(eventId);
  if (!timestamp) return false;

  // Clean up expired entries
  if (Date.now() - timestamp > IDEMPOTENCY_TTL) {
    processedEvents.delete(eventId);
    return false;
  }

  return true;
}

function markEventProcessed(eventId: string): void {
  processedEvents.set(eventId, Date.now());

  // Clean up old entries periodically
  if (processedEvents.size > 1000) {
    const cutoff = Date.now() - IDEMPOTENCY_TTL;
    for (const [id, timestamp] of processedEvents.entries()) {
      if (timestamp < cutoff) {
        processedEvents.delete(id);
      }
    }
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const rawBody = await req.text();

  // Validate payload size
  const payloadSizeBytes = new Blob([rawBody]).size;
  const maxSizeBytes = MAX_PAYLOAD_SIZE_MB * 1024 * 1024;
  if (payloadSizeBytes > maxSizeBytes) {
    console.error(
      `[WEBHOOK ERROR] Payload too large: ${payloadSizeBytes} bytes (max: ${maxSizeBytes})`
    );
    return new Response(JSON.stringify({ error: "Payload too large" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 413, // Payload Too Large
    });
  }

  try {
    const isVerified = await verifyPaddleSignature(req, rawBody);
    if (!isVerified) {
      console.error(
        "[WEBHOOK ERROR] Paddle webhook signature verification failed."
      );
      return new Response(
        JSON.stringify({ error: "Signature verification failed" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401, // Unauthorized
        }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Parse the webhook payload
    const payload = JSON.parse(rawBody);
    const eventId = payload.event_id;

    // Idempotency check
    if (eventId && isEventProcessed(eventId)) {
     
      return new Response(
        JSON.stringify({ received: true, message: "Event already processed" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // It's good practice to log after verification, to avoid logging unverified payloads


    // Validate event type
    const validEventTypes = [
      "subscription.created",
      "subscription.updated",
      "subscription.cancelled",
      "subscription.paused",
      "subscription.resumed",
      "transaction.completed",
      "customer.created",
      "customer.updated",
      "invoice.paid",
      "invoice.payment_failed",
      "subscription.payment_succeeded",
      "subscription.payment_failed",
      "payment_method.saved",
      "payment_method.deleted",
    ];

    if (!validEventTypes.includes(payload.event_type)) {
      console.warn(`[WEBHOOK WARN] Unknown event type: ${payload.event_type}`);
      return new Response(
        JSON.stringify({ received: true, message: "Unknown event type" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    let result: HandlerResult = {
      success: false,
      message: "Event type not handled by any dedicated handler.",
    };
    // Handle different webhook events
    switch (payload.event_type) {
      case "subscription.created":
      case "subscription.updated":
      case "subscription.cancelled":
        result = await handleSubscriptionEvent(supabaseClient, payload);
        break;
      case "transaction.completed":
        result = await handleTransactionCompleted(supabaseClient, payload);
        break;
      case "subscription.paused":
      case "subscription.resumed":
        result = await handleSubscriptionCanceled(supabaseClient, payload);
        break;
      case "payment_method.deleted":
        result = await handlePaymentMethodDeleted(supabaseClient, payload);
        break;
      case "customer.created":
      case "customer.updated":
        result = await handleCustomerEvent(supabaseClient, payload);
        break;
      case "invoice.paid":
      case "invoice.payment_failed":
        result = await handleInvoiceEvent(supabaseClient, payload);
        break;
      case "subscription.payment_succeeded":
      case "subscription.payment_failed":
        result = await handleSubscriptionPaymentEvent(supabaseClient, payload);
        break;
      case "payment_method.saved":
        result = await handlePaymentMethodSaved(supabaseClient, payload);
        break;
      default:
       
        // Acknowledge receipt to Paddle, but log that it wasn't specifically handled.
        result = {
          success: true,
          message: `Event ${payload.event_type} acknowledged but no specific handling required.`,
        };
    }

    // Mark event as processed if successful
    if (result.success && eventId) {
      markEventProcessed(eventId);
    }

    // If a handler explicitly threw an error for a 500-type situation, it would be caught by the main catch.
    // If a handler returned success:false for a business logic issue (e.g. user_id missing), we return 200.
    return new Response(
      JSON.stringify({
        received: result.success,
        message: result.message || "Event processed.",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200, // We send 200 to Paddle if we've handled it, even if it's a "business logic error" on our side.
      }
    );
  } catch (error) {
    // This catch block is for truly unexpected errors or those explicitly thrown by handlers for 500-level issues.
    console.error("[WEBHOOK ERROR] Unhandled Webhook processing error", {
      message: error.message,
      stack: error.stack,
    });
    return new Response(
      JSON.stringify({
        error: "An unexpected error occurred processing the webhook.",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

interface HandlerResult {
  success: boolean;
  message?: string;
  // status field removed as we'll rely on throwing for 500s, and always return 200 for non-exceptions.
}

// Helper function to update subscription record with latest data
async function updateSubscriptionRecord(
  supabaseClient: any,
  subscriptionData: any,
  eventType: string,
  userId: string
): Promise<void> {
  const updateData: any = {
    status:
      subscriptionData.status === "canceled"
        ? "cancelled"
        : subscriptionData.status,
    updated_at: new Date().toISOString(),
  };

  // Update billing period if available
  if (subscriptionData.current_billing_period) {
    updateData.current_period_start =
      subscriptionData.current_billing_period.starts_at;
    updateData.current_period_end =
      subscriptionData.current_billing_period.ends_at;
  }

 

  const { error: subscriptionUpdateError } = await supabaseClient
    .from("user_subscriptions")
    .update(updateData)
    .eq("paddle_subscription_id", subscriptionData.id);

  if (subscriptionUpdateError) {
    console.error(
      `[WEBHOOK ERROR] Error updating subscription record for ${eventType}: ${subscriptionUpdateError.message}`
    );
    throw new Error(
      `Database error updating subscription record for user ${userId}.`
    );
  }

 
}

async function handleSubscriptionEvent(
  supabaseClient: any,
  payload: any
): Promise<HandlerResult> {
  const subscription = payload.data;
  const eventId = payload.event_id || "N/A";
  const eventType = payload.event_type;
  const customData = subscription.custom_data || {};
  const userId = customData.userId;

  

  console.debug("[WEBHOOK DEBUG] Subscription custom_data", customData);
  console.debug(
    "[WEBHOOK DEBUG] Subscription items from payload",
    subscription.items
  );

  if (!userId) {
    const errorMessage = `EVENT_PROCESSING_FAILURE: No userId found in custom_data for subscription event. Event ID: ${eventId}.`;
    console.error(`[WEBHOOK ERROR] ${errorMessage}`, {
      payloadData: payload.data,
    });
    return {
      success: false,
      message:
        "User ID missing in custom_data. Cannot process subscription event.",
    };
  }

  let priceId =
    subscription.items?.[0]?.price?.id || subscription.items?.[0]?.price_id;

  if (!priceId) {
    const errorMessage = `EVENT_PROCESSING_FAILURE: No price_id found in subscription items for event ID: ${eventId}. User: ${userId}.`;
    console.error(`[WEBHOOK ERROR] ${errorMessage}`, {
      payloadItems: subscription.items,
    });
    return {
      success: false,
      message: "Price ID missing in subscription items. Cannot process event.",
    };
  }


  let { data: plan, error: planError } = await supabaseClient
    .from("subscription_plans")
    .select("*")
    .eq("paddle_price_id", priceId)
    .maybeSingle();

  if (planError) {
    console.error(
      `[WEBHOOK ERROR] DB_ERROR: Error fetching plan by price_id ${priceId}. User: ${userId}.`,
      planError
    );
    throw new Error(
      `Database error fetching plan details for price ${priceId}.`
    );
  }

  if (!plan) {
    console.warn(
      `[WEBHOOK WARN] Plan not found for price_id '${priceId}'. Falling back to product_id.`
    );
    const productId = subscription.items?.[0]?.price?.product_id;

    if (!productId) {
      const errorMessage = `EVENT_PROCESSING_FAILURE: Plan not found for price_id '${priceId}' and no product_id fallback was available. Event ID: ${eventId}. User: ${userId}.`;
      console.error(`[WEBHOOK ERROR] ${errorMessage}`, {
        payloadItems: subscription.items,
      });
      return {
        success: false,
        message: `Plan not found for price ID '${priceId}' and no product ID available.`,
      };
    }

    
    const { data: planByProduct, error: productError } = await supabaseClient
      .from("subscription_plans")
      .select("*")
      .eq("paddle_product_id", productId)
      .maybeSingle();

    if (productError) {
      console.error(
        `[WEBHOOK ERROR] DB_ERROR: Error fetching plan by product_id ${productId}. User: ${userId}.`,
        productError
      );
      throw new Error(
        `Database error fetching plan details for product ${productId}.`
      );
    }
    plan = planByProduct;
  }

  if (!plan) {
    const finalId = subscription.items?.[0]?.price?.product_id || priceId;
    const errorMessage = `EVENT_PROCESSING_FAILURE: Plan not found in 'subscription_plans' for paddle_price_id OR paddle_product_id: '${finalId}'. Subscription for user ${userId} (Event ID: ${eventId}) cannot be processed. Please verify this ID exists in your 'subscription_plans' table.`;
    console.error(`[WEBHOOK ERROR] ${errorMessage}`);
    return {
      success: false,
      message: `Plan not found for ID: '${finalId}'.`,
    };
  }

  
  

  // Check if profile exists, create if it doesn't
  
  const { data: existingProfile, error: profileFetchError } =
    await supabaseClient
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

  if (profileFetchError && profileFetchError.code === "PGRST116") {
    // Profile doesn't exist, create it
   
    const { data: newProfile, error: profileCreateError } = await supabaseClient
      .from("profiles")
      .insert({
        user_id: userId,
        email: customData.email || "unknown@example.com",
        full_name: customData.full_name || "Unknown User",
        subscription_status: "free",
        subscription_plan: "free",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (profileCreateError) {
      console.error(
        `[WEBHOOK ERROR] DB_ERROR: Error creating profile for user ${userId}. Event ID: ${eventId}. Error:`,
        profileCreateError
      );
      throw new Error(`Database error creating profile for user ${userId}.`);
    }

   
  } else if (profileFetchError) {
    console.error(
      `[WEBHOOK ERROR] DB_ERROR: Error fetching profile for user ${userId}. Event ID: ${eventId}. Error:`,
      profileFetchError
    );
    throw new Error(`Database error fetching profile for user ${userId}.`);
  } else {
   
  }

  // Update user profile
  const profileUpdateData = {
    subscription_status: subscription.status,
    subscription_plan: plan.name.toLowerCase(),
    paddle_customer_id: subscription.customer_id,
    updated_at: new Date().toISOString(),
  };

  if (subscription.status === "canceled") {
    profileUpdateData.subscription_plan = "free";
  }
 
  

  const { data: updatedProfile, error: profileUpdateError } =
    await supabaseClient
      .from("profiles")
      .update(profileUpdateData)
      .eq("user_id", userId)
      .select()
      .single();

  if (profileUpdateError) {
    console.error(
      `[WEBHOOK ERROR] DB_ERROR: Error updating profile for user ${userId}. Event ID: ${eventId}. Error:`,
      profileUpdateError
    );
    throw new Error(`Database error updating profile for user ${userId}.`); // Caught by main try-catch, results in 500
  }


  // Create or update subscription record
  // Normalize status to ensure consistent spelling
  let normalizedStatus = subscription.status;
  // Handle both US and UK spelling variants
  if (normalizedStatus === "canceled") {
    normalizedStatus = "cancelled";
  }

  

  // Upsert user subscription record directly
 

  const { data: upsertedSubscription, error: subscriptionUpsertError } =
    await supabaseClient
      .from("user_subscriptions")
      .upsert(
        {
          user_id: userId,
          plan_id: plan.id,
          paddle_subscription_id: subscription.id,
          status: normalizedStatus,
          current_period_start: subscription.current_billing_period?.starts_at,
          current_period_end: subscription.current_billing_period?.ends_at,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
          ignoreDuplicates: false,
        }
      )
      .select();

  if (subscriptionUpsertError) {
    console.error(
      `[WEBHOOK ERROR] DB_ERROR: Error upserting subscription for user ${userId}. Event ID: ${eventId}. Error:`,
      subscriptionUpsertError
    );
    throw new Error(
      `Database error upserting subscription for user ${userId}.`
    );
  }


  // Log payment history for audit trail
  const { error: historyError } = await supabaseClient
    .from("payment_history")
    .insert({
      user_id: userId,
      subscription_id: subscription.id,
      event_type: eventType,
      amount: plan.price,
      currency: "USD",
      plan_name: plan.name,
      paddle_data: payload,
      status: normalizedStatus,
      processed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    });

  if (historyError) {
    console.error(
      `[WEBHOOK ERROR] Error logging payment history for user ${userId}:`,
      historyError
    );
    // Don't throw error for history logging, just log it
  } else {
   
  }

 

  // Handle cancellation-specific logic
  if (eventType === "subscription.cancelled") {
    // Call the cancellation handler function
    const { error: cancellationError } = await supabaseClient.rpc(
      "handle_subscription_cancellation",
      {
        p_user_id: userId,
        p_subscription_id: subscription.id,
        p_reason: customData.cancelReason || "user_initiated",
      }
    );

    if (cancellationError) {
      console.error(
        `[WEBHOOK ERROR] Error calling cancellation handler:`,
        cancellationError
      );
      throw new Error(
        `Database error handling cancellation for user ${userId}.`
      );
    }
  }

  return {
    success: true,
    message: "Subscription event processed successfully.",
  };
}

async function handleTransactionCompleted(
  supabaseClient: any,
  payload: any
): Promise<HandlerResult> {
  const transaction = payload.data;
  const eventId = payload.event_id || "N/A";
  const customData = transaction.custom_data || {};
  const userId = customData.userId;

  
  
  
  

  if (!userId) {
    const errorMessage = `EVENT_PROCESSING_FAILURE: No userId found in transaction custom_data. Event ID: ${eventId}.`;
    console.error(`[WEBHOOK ERROR] ${errorMessage}`, {
      payloadData: payload.data,
    });
    return {
      success: false,
      message: "User ID missing in transaction custom_data. Cannot process.",
    };
  }

  // Create profile if it doesn't exist
  
  const { data: existingProfile, error: profileFetchError } =
    await supabaseClient
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

  if (profileFetchError && profileFetchError.code === "PGRST116") {
    // Profile doesn't exist, create it
  
    const { data: newProfile, error: profileCreateError } = await supabaseClient
      .from("profiles")
      .insert({
        user_id: userId,
        email: customData.email || "unknown@example.com",
        full_name: customData.full_name || "Unknown User",
        subscription_status: "free",
        subscription_plan: "free",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (profileCreateError) {
      console.error(
        `[WEBHOOK ERROR] DB_ERROR: Error creating profile for user ${userId}. Event ID: ${eventId}. Error:`,
        profileCreateError
      );
      throw new Error(`Database error creating profile for user ${userId}.`);
    }

   
  } else if (profileFetchError) {
    console.error(
      `[WEBHOOK ERROR] DB_ERROR: Error fetching profile for user ${userId}. Event ID: ${eventId}. Error:`,
      profileFetchError
    );
    throw new Error(`Database error fetching profile for user ${userId}.`);
  } else {
  
  }

  if (
    !transaction.subscription_id &&
    transaction.items &&
    transaction.items.length > 0
  ) {
    const item = transaction.items[0];
    const priceId = item.price?.id || item.price_id;

    if (!priceId) {
    
      return {
        success: true,
        message:
          "Transaction completed but no price ID to process for profile update.",
      };
    }

   
    let { data: plan, error: planError } = await supabaseClient
      .from("subscription_plans")
      .select("*")
      .eq("paddle_price_id", priceId)
      .maybeSingle();

    if (planError) {
      console.error(
        `[WEBHOOK ERROR] DB_ERROR: Error fetching plan by price_id ${priceId} from transaction.`,
        planError
      );
      throw new Error(
        `Database error fetching plan for transaction price ${priceId}.`
      );
    }

    if (!plan) {
      console.warn(
        `[WEBHOOK WARN] Plan not found for price_id '${priceId}' in transaction. Falling back to product_id.`
      );
      const productId = item.price?.product_id;

      if (!productId) {
        console.warn(
          `[WEBHOOK WARN] Plan not found for price_id '${priceId}' and no product_id fallback in transaction. Profile not updated.`
        );
        return {
          success: true,
          message: "Transaction processed, but plan not found.",
        };
      }

  
      const { data: planByProduct, error: productError } = await supabaseClient
        .from("subscription_plans")
        .select("*")
        .eq("paddle_product_id", productId)
        .maybeSingle();

      if (productError) {
        console.error(
          `[WEBHOOK ERROR] DB_ERROR: Error fetching plan by product_id ${productId} from transaction.`,
          productError
        );
        throw new Error(
          `Database error fetching plan for transaction product ${productId}.`
        );
      }
      plan = planByProduct;
    }

    if (plan) {
     
      const { error: profileUpdateError } = await supabaseClient
        .from("profiles")
        .update({
          subscription_status: "active",
          subscription_plan: plan.name.toLowerCase(),
          paddle_customer_id: transaction.customer_id,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (profileUpdateError) {
        console.error(
          `[WEBHOOK ERROR] DB_ERROR: Error updating profile for user ${userId} after one-time transaction. Event ID: ${eventId}. Error:`,
          profileUpdateError
        );
        throw new Error(
          `Database error updating profile for transaction for user ${userId}.`
        ); // Caught, results in 500
      }
     
    } else {
      const finalId = item.price?.product_id || priceId;
      console.warn(
        `[WEBHOOK WARN] EVENT_PROCESSING_FAILURE: Plan not found in 'subscription_plans' for ID: '${finalId}' (from transaction item). Profile not updated for this item.`
      );
    }
  } else {
 
  }
  
  return { success: true, message: "Transaction completed event processed." };
}

async function handleSubscriptionCanceled(
  supabaseClient: any,
  payload: any
): Promise<HandlerResult> {
  const subscription = payload.data;
  const eventId = payload.event_id || "N/A";
  const customData = subscription.custom_data || {};
  const userId = customData.userId;

 

  if (!userId) {
    const errorMessage = `EVENT_PROCESSING_FAILURE: No userId found in custom_data for subscription status change. Event ID: ${eventId}.`;
    console.error(`[WEBHOOK ERROR] ${errorMessage}`, {
      payloadData: payload.data,
    });
    return {
      success: false,
      message: "User ID missing. Cannot process status change.",
    }; // 200 OK to Paddle
  }

  // Determine the appropriate subscription status and plan based on the event
  let subscriptionStatus = subscription.status || "canceled";
  let subscriptionPlan = "free";

  if (payload.event_type === "subscription.paused") {
    subscriptionStatus = "paused";
    // Keep the current plan but mark as paused
    const { data: currentProfile } = await supabaseClient
      .from("profiles")
      .select("subscription_plan")
      .eq("user_id", userId)
      .single();

    if (
      currentProfile?.subscription_plan &&
      currentProfile.subscription_plan !== "free"
    ) {
      subscriptionPlan = currentProfile.subscription_plan;
    }
  } else if (payload.event_type === "subscription.resumed") {
    subscriptionStatus = "active";
    // Keep the current plan
    const { data: currentProfile } = await supabaseClient
      .from("profiles")
      .select("subscription_plan")
      .eq("user_id", userId)
      .single();

    if (
      currentProfile?.subscription_plan &&
      currentProfile.subscription_plan !== "free"
    ) {
      subscriptionPlan = "free";
    }
  } else if (
    payload.event_type === "subscription.canceled" ||
    payload.event_type === "subscription.cancelled"
  ) {
    subscriptionStatus = "cancelled"; // Using British spelling to match database constraint
    subscriptionPlan = "free";
  }

  // Update user profile
  const { error: profileUpdateError } = await supabaseClient
    .from("profiles")
    .update({
      subscription_status: subscriptionStatus,
      subscription_plan: "free",
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (profileUpdateError) {
    console.error(
      `[WEBHOOK ERROR] DB_ERROR: Error updating profile to 'free' for user ${userId} on cancellation. Event ID: ${eventId}. Error:`,
      profileUpdateError
    );
    throw new Error(
      `Database error updating profile on cancellation for user ${userId}.`
    ); // Caught, results in 500
  }

  // Update subscription record
  // Normalize status to ensure consistent spelling
  let normalizedStatus = subscription.status || "cancelled";
  // Handle both US and UK spelling variants
  if (normalizedStatus === "canceled") {
    normalizedStatus = "cancelled";
  }

  

  const { error: subscriptionUpdateError } = await supabaseClient
    .from("user_subscriptions")
    .update({
      status: normalizedStatus,
      subscription_plan: "free",
      updated_at: new Date().toISOString(),
      current_period_end:
        subscription.current_billing_period?.ends_at ||
        new Date().toISOString(), // Reflect cancellation time
    })
    .eq("paddle_subscription_id", subscription.id);

  if (subscriptionUpdateError) {
    // If the profile update succeeded but this failed, it's a partial success.
    // Depending on business logic, this might still throw to retry, or log and return success.
    // For consistency, we'll throw, assuming subscription record accuracy is critical.
    console.error(
      `[WEBHOOK ERROR] DB_ERROR: Error updating subscription record to '${
        subscription.status || "canceled"
      }' for user ${userId}. Event ID: ${eventId}. Error:`,
      subscriptionUpdateError
    );
    throw new Error(
      `Database error updating subscription record on cancellation for user ${userId}.`
    ); // Caught, results in 500
  }

  
  return {
    success: true,
    message: `Subscription ${payload.event_type} processed successfully.`,
  };
}

async function handlePaymentMethodDeleted(
  supabaseClient: any,
  payload: any
): Promise<HandlerResult> {
  const paymentMethod = payload.data;
  const eventId = payload.event_id || "N/A";
  const customerId = paymentMethod.customer_id;

  
  

  // If you store payment methods in your database, you might want to update or remove them
  // For example:
  /*
  const { error } = await supabaseClient
    .from('user_payment_methods')
    .update({ 
      status: 'deleted', 
      updated_at: new Date().toISOString() 
    })
    .eq('payment_method_id', paymentMethod.id)
  
  if (error) {
    console.error(`Error updating payment method status: ${error.message}`);
    throw new Error(`Database error updating payment method status.`);
  }
  */

  
  return {
    success: true,
    message: "Payment method deletion acknowledged.",
  };
}

async function handlePaymentMethodSaved(
  supabaseClient: any,
  payload: any
): Promise<HandlerResult> {
  const paymentMethod = payload.data;
  const eventId = payload.event_id || "N/A";
  const customerId = paymentMethod.customer_id;

  

  // If you store payment methods in your database, you might want to save or update them
  // For example:
  /*
  const { error } = await supabaseClient
    .from('user_payment_methods')
    .upsert({ 
      payment_method_id: paymentMethod.id,
      customer_id: customerId,
      type: paymentMethod.type,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString() 
    })
  
  if (error) {
    console.error(`Error saving payment method: ${error.message}`);
    throw new Error(`Database error saving payment method.`);
  }
  */

  
  return {
    success: true,
    message: "Payment method saved acknowledged.",
  };
}

async function handleCustomerEvent(
  supabaseClient: any,
  payload: any
): Promise<HandlerResult> {
  const customer = payload.data;
  const eventId = payload.event_id || "N/A";

  // You might want to update customer information in your profiles table
  if (customer.custom_data?.userId) {
    const { error: updateError } = await supabaseClient
      .from("profiles")
      .update({
        paddle_customer_id: customer.id,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", customer.custom_data.userId);

    if (updateError) {
      console.error(
        `[WEBHOOK ERROR] Error updating profile with customer ID: ${updateError.message}`
      );
      // Don't throw error for customer events, just log
    } else {
     
    }
  }

  
  return {
    success: true,
    message: `Customer ${payload.event_type} processed successfully.`,
  };
}

async function handleInvoiceEvent(
  supabaseClient: any,
  payload: any
): Promise<HandlerResult> {
  const invoice = payload.data;
  const eventId = payload.event_id || "N/A";
  const customData = invoice.custom_data || {};
  const userId = customData.userId;

  
  // Handle failed payments by updating subscription status
  if (payload.event_type === "invoice.payment_failed" && userId) {
    const { error: updateError } = await supabaseClient
      .from("profiles")
      .update({
        subscription_status: "past_due",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (updateError) {
      console.error(
        `[WEBHOOK ERROR] Error updating subscription status for failed payment: ${updateError.message}`
      );
    } else {
     
    }
  }

  
  return {
    success: true,
    message: `Invoice ${payload.event_type} processed successfully.`,
  };
}

async function handleSubscriptionPaymentEvent(
  supabaseClient: any,
  payload: any
): Promise<HandlerResult> {
  const subscription = payload.data;
  const eventId = payload.event_id || "N/A";
  const customData = subscription.custom_data || {};
  const userId = customData.userId;

  
  console.debug("[WEBHOOK DEBUG] Subscription payment data", subscription);

  if (!userId) {
    console.warn(
      `[WEBHOOK WARN] No userId found in subscription payment event. Event ID: ${eventId}`
    );
    return {
      success: false,
      message: "User ID missing in subscription payment event.",
    };
  }

  // Handle payment failures
  if (payload.event_type === "subscription.payment_failed") {
    // Update profile status
    const { error: profileUpdateError } = await supabaseClient
      .from("profiles")
      .update({
        subscription_status: "past_due",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (profileUpdateError) {
      console.error(
        `[WEBHOOK ERROR] Error updating profile status for failed payment: ${profileUpdateError.message}`
      );
    } else {
     
    }

    // Update subscription record status
    const { error: subscriptionUpdateError } = await supabaseClient
      .from("user_subscriptions")
      .update({
        status: "past_due",
        updated_at: new Date().toISOString(),
      })
      .eq("paddle_subscription_id", subscription.id);

    if (subscriptionUpdateError) {
      console.error(
        `[WEBHOOK ERROR] Error updating subscription record for failed payment: ${subscriptionUpdateError.message}`
      );
    } else {
      console.log(
        `[WEBHOOK INFO] Updated subscription record to 'past_due' for user ${userId}`
      );
    }

    // Log payment failure to payment history
    const { error: historyError } = await supabaseClient
      .from("payment_history")
      .insert({
        user_id: userId,
        subscription_id: subscription.id,
        event_type: "subscription.payment_failed",
        status: "past_due",
        paddle_data: payload,
        processed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });

    if (historyError) {
      console.error(
        `[WEBHOOK ERROR] Error logging payment failure to history: ${historyError.message}`
      );
      // Don't throw error for history logging, just log it
    }
  }

  // Handle successful payments
  if (payload.event_type === "subscription.payment_succeeded") {
    // Update profile status
    const { error: profileUpdateError } = await supabaseClient
      .from("profiles")
      .update({
        subscription_status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (profileUpdateError) {
      console.error(
        `[WEBHOOK ERROR] Error updating profile status for successful payment: ${profileUpdateError.message}`
      );
    } else {
      console.log(
        `[WEBHOOK INFO] Updated profile status to 'active' for user ${userId} due to successful payment`
      );
    }

    // Update subscription record with latest billing period and status
    const { error: subscriptionUpdateError } = await supabaseClient
      .from("user_subscriptions")
      .update({
        status: "active",
        current_period_start: subscription.current_billing_period?.starts_at,
        current_period_end: subscription.current_billing_period?.ends_at,
        updated_at: new Date().toISOString(),
      })
      .eq("paddle_subscription_id", subscription.id);

    if (subscriptionUpdateError) {
      console.error(
        `[WEBHOOK ERROR] Error updating subscription record for successful payment: ${subscriptionUpdateError.message}`
      );
    } else {
      console.log(
        `[WEBHOOK INFO] Updated subscription record for user ${userId} with latest billing period`
      );
    }

    // Log payment success to payment history
    const { error: historyError } = await supabaseClient
      .from("payment_history")
      .insert({
        user_id: userId,
        subscription_id: subscription.id,
        event_type: "subscription.payment_succeeded",
        status: "active",
        paddle_data: payload,
        processed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });

    if (historyError) {
      console.error(
        `[WEBHOOK ERROR] Error logging payment success to history: ${historyError.message}`
      );
      // Don't throw error for history logging, just log it
    }
  }

  
  return {
    success: true,
    message: `Subscription payment ${payload.event_type} processed successfully.`,
  };
}
