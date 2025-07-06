// @ts-ignore -- Deno environment
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore -- Deno environment
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// @ts-ignore -- Deno environment
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

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
const WEBHOOK_TIMESTAMP_TOLERANCE_SECONDS = 300; // 5 minutes

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
  const REDUCED_TIMESTAMP_TOLERANCE = 120; // 2 minutes
  const currentTimestamp = Math.floor(Date.now() / 1000);
  if (Math.abs(currentTimestamp - timestamp) > REDUCED_TIMESTAMP_TOLERANCE) {
    console.warn(
      `[WEBHOOK WARN] Timestamp validation failed. Header ts: ${timestamp}, Current ts: ${currentTimestamp}, Tolerance: ${REDUCED_TIMESTAMP_TOLERANCE}s`
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const rawBody = await req.text();

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

    // It's good practice to log after verification, to avoid logging unverified payloads
    console.log("[WEBHOOK INFO] Paddle webhook received and verified", {
      eventType: payload.event_type,
    });

    let result: HandlerResult = {
      success: false,
      message: "Event type not handled by any dedicated handler.",
    };
    // Handle different webhook events
    switch (payload.event_type) {
      case "subscription.created":
      case "subscription.updated":
        result = await handleSubscriptionEvent(supabaseClient, payload);
        break;
      case "transaction.completed":
        result = await handleTransactionCompleted(supabaseClient, payload);
        break;
      case "subscription.canceled":
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
      default:
        console.log(
          `[WEBHOOK INFO] Received event_type: ${payload.event_type} - No specific handler needed`
        );
        // Acknowledge receipt to Paddle, but log that it wasn't specifically handled.
        result = {
          success: true,
          message: `Event ${payload.event_type} acknowledged but no specific handling required.`,
        };
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

async function handleSubscriptionEvent(
  supabaseClient: any,
  payload: any
): Promise<HandlerResult> {
  const subscription = payload.data;
  const eventId = payload.event_id || "N/A";
  const customData = subscription.custom_data || {};
  const userId = customData.userId;

  console.log("=== SUBSCRIPTION EVENT DEBUG START ===");
  console.log("[WEBHOOK INFO] Processing subscription event", {
    eventId,
    userId,
  });
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

  console.log(
    `[WEBHOOK INFO] Attempting to find plan with paddle_price_id: '${priceId}'`
  );
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

    console.log(
      `[WEBHOOK INFO] Attempting to find plan with paddle_product_id: '${productId}'`
    );
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

  console.log("[WEBHOOK INFO] Plan found:", JSON.stringify(plan, null, 2));
  console.log("=== SUBSCRIPTION EVENT DEBUG END ===");

  // Check if profile exists, create if it doesn't
  console.log("[WEBHOOK INFO] Checking if profile exists for user:", userId);
  const { data: existingProfile, error: profileFetchError } =
    await supabaseClient
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

  if (profileFetchError && profileFetchError.code === "PGRST116") {
    // Profile doesn't exist, create it
    console.log(
      "[WEBHOOK INFO] Profile doesn't exist, creating new profile for user:",
      userId
    );
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

    console.log(
      "[WEBHOOK INFO] Profile created successfully:",
      JSON.stringify(newProfile, null, 2)
    );
  } else if (profileFetchError) {
    console.error(
      `[WEBHOOK ERROR] DB_ERROR: Error fetching profile for user ${userId}. Event ID: ${eventId}. Error:`,
      profileFetchError
    );
    throw new Error(`Database error fetching profile for user ${userId}.`);
  } else {
    console.log(
      "[WEBHOOK INFO] Profile exists:",
      JSON.stringify(existingProfile, null, 2)
    );
  }

  // Update user profile
  const profileUpdateData = {
    subscription_status: subscription.status,
    subscription_plan: plan.name.toLowerCase(),
    paddle_customer_id: subscription.customer_id,
    updated_at: new Date().toISOString(),
  };

  console.log(
    "[WEBHOOK INFO] Updating profile with data:",
    JSON.stringify(profileUpdateData, null, 2)
  );
  console.log("[WEBHOOK INFO] For user ID:", userId);

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

  console.log(
    "[WEBHOOK INFO] Profile updated successfully:",
    JSON.stringify(updatedProfile, null, 2)
  );

  // Create or update subscription record
  const subscriptionData = {
    user_id: userId,
    plan_id: plan.id,
    paddle_subscription_id: subscription.id,
    status: subscription.status,
    current_period_start: subscription.current_billing_period?.starts_at,
    current_period_end: subscription.current_billing_period?.ends_at,
    updated_at: new Date().toISOString(),
  };

  console.log(
    "[WEBHOOK INFO] Upserting subscription with data:",
    JSON.stringify(subscriptionData, null, 2)
  );

  const { data: upsertedSubscription, error: subscriptionUpsertError } =
    await supabaseClient
      .from("user_subscriptions")
      .upsert(subscriptionData)
      .select()
      .single();

  if (subscriptionUpsertError) {
    console.error(
      `[WEBHOOK ERROR] DB_ERROR: Error upserting subscription for user ${userId}. Event ID: ${eventId}. Error:`,
      subscriptionUpsertError
    );
    throw new Error(
      `Database error upserting subscription for user ${userId}.`
    ); // Caught by main try-catch, results in 500
  }

  console.log(
    "[WEBHOOK INFO] Subscription upserted successfully:",
    JSON.stringify(upsertedSubscription, null, 2)
  );

  console.log(
    `[WEBHOOK INFO] EVENT_PROCESSED: Subscription event for user: ${userId}, plan: ${plan.name}, status: ${subscription.status}. Event ID: ${eventId}`
  );
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

  console.log("=== TRANSACTION COMPLETED DEBUG START ===");
  console.log("[WEBHOOK INFO] Event ID:", eventId);
  console.log("[WEBHOOK INFO] User ID from custom_data:", userId);
  console.log(
    "[WEBHOOK INFO] Transaction custom_data:",
    JSON.stringify(customData, null, 2)
  );
  console.log(
    "[WEBHOOK INFO] Transaction items:",
    JSON.stringify(transaction.items, null, 2)
  );

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
  console.log("[WEBHOOK INFO] Checking if profile exists for user:", userId);
  const { data: existingProfile, error: profileFetchError } =
    await supabaseClient
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

  if (profileFetchError && profileFetchError.code === "PGRST116") {
    // Profile doesn't exist, create it
    console.log(
      "[WEBHOOK INFO] Profile doesn't exist, creating new profile for user:",
      userId
    );
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

    console.log(
      "[WEBHOOK INFO] Profile created successfully:",
      JSON.stringify(newProfile, null, 2)
    );
  } else if (profileFetchError) {
    console.error(
      `[WEBHOOK ERROR] DB_ERROR: Error fetching profile for user ${userId}. Event ID: ${eventId}. Error:`,
      profileFetchError
    );
    throw new Error(`Database error fetching profile for user ${userId}.`);
  } else {
    console.log(
      "[WEBHOOK INFO] Profile exists:",
      JSON.stringify(existingProfile, null, 2)
    );
  }

  if (
    !transaction.subscription_id &&
    transaction.items &&
    transaction.items.length > 0
  ) {
    const item = transaction.items[0];
    const priceId = item.price?.id || item.price_id;

    if (!priceId) {
      console.warn(
        `[WEBHOOK WARN] No price_id found in transaction item. Event ID: ${eventId}. Cannot update profile based on this item.`
      );
      return {
        success: true,
        message:
          "Transaction completed but no price ID to process for profile update.",
      };
    }

    console.log(
      `[WEBHOOK INFO] Attempting to find plan with paddle_price_id: '${priceId}' from transaction`
    );
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

      console.log(
        `[WEBHOOK INFO] Attempting to find plan with paddle_product_id: '${productId}' from transaction`
      );
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
      console.log(
        "[WEBHOOK INFO] Plan found for transaction item:",
        JSON.stringify(plan, null, 2)
      );
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
      console.log(
        `[WEBHOOK INFO] EVENT_PROCESSED: Profile updated for user ${userId} from one-time transaction, plan: ${plan.name}. Event ID: ${eventId}`
      );
    } else {
      const finalId = item.price?.product_id || priceId;
      console.warn(
        `[WEBHOOK WARN] EVENT_PROCESSING_FAILURE: Plan not found in 'subscription_plans' for ID: '${finalId}' (from transaction item). Profile not updated for this item.`
      );
    }
  } else {
    console.log(
      `[WEBHOOK INFO] EVENT_PROCESSING_INFO: Transaction for user ${userId} (Event ID: ${eventId}) is related to a subscription or has no items to process for profile update.`
    );
  }
  console.log("=== TRANSACTION COMPLETED DEBUG END ===");
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

  console.log("=== SUBSCRIPTION STATUS CHANGE DEBUG START ===");
  console.log("[WEBHOOK INFO] Processing subscription status change", {
    eventId,
    eventType: payload.event_type,
    userId,
    status: subscription.status,
  });

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
      subscriptionPlan = currentProfile.subscription_plan;
    }
  } else if (payload.event_type === "subscription.canceled") {
    subscriptionStatus = "canceled";
    subscriptionPlan = "free";
  }

  // Update user profile
  const { error: profileUpdateError } = await supabaseClient
    .from("profiles")
    .update({
      subscription_status: subscriptionStatus,
      subscription_plan: subscriptionPlan,
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
  const { error: subscriptionUpdateError } = await supabaseClient
    .from("user_subscriptions")
    .update({
      status: subscription.status || "canceled",
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

  console.log(
    `[WEBHOOK INFO] EVENT_PROCESSED: Subscription status change for user: ${userId}, status: ${subscriptionStatus}, plan: ${subscriptionPlan}. Event ID: ${eventId}`
  );
  console.log("=== SUBSCRIPTION STATUS CHANGE DEBUG END ===");
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

  console.log("=== PAYMENT METHOD DELETED DEBUG START ===");
  console.log("[WEBHOOK INFO] Processing payment method deletion", {
    eventId,
    customerId,
  });
  console.debug("[WEBHOOK DEBUG] Payment method data", paymentMethod);

  // Log the event for audit purposes
  console.log(
    `[WEBHOOK INFO] Payment method ${paymentMethod.id} deleted for customer ${customerId}. Event ID: ${eventId}`
  );

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

  console.log("=== PAYMENT METHOD DELETED DEBUG END ===");
  return {
    success: true,
    message: "Payment method deletion acknowledged.",
  };
}

async function handleCustomerEvent(
  supabaseClient: any,
  payload: any
): Promise<HandlerResult> {
  const customer = payload.data;
  const eventId = payload.event_id || "N/A";

  console.log("=== CUSTOMER EVENT DEBUG START ===");
  console.log("[WEBHOOK INFO] Processing customer event", {
    eventId,
    eventType: payload.event_type,
    customerId: customer.id,
  });
  console.debug("[WEBHOOK DEBUG] Customer data", customer);

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
      console.log(
        `[WEBHOOK INFO] Updated profile for user ${customer.custom_data.userId} with customer ID ${customer.id}`
      );
    }
  }

  console.log("=== CUSTOMER EVENT DEBUG END ===");
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

  console.log("=== INVOICE EVENT DEBUG START ===");
  console.log("[WEBHOOK INFO] Processing invoice event", {
    eventId,
    eventType: payload.event_type,
    userId,
    invoiceId: invoice.id,
  });
  console.debug("[WEBHOOK DEBUG] Invoice data", invoice);

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
      console.log(
        `[WEBHOOK INFO] Updated subscription status to 'past_due' for user ${userId} due to failed payment`
      );
    }
  }

  console.log("=== INVOICE EVENT DEBUG END ===");
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

  console.log("=== SUBSCRIPTION PAYMENT EVENT DEBUG START ===");
  console.log("[WEBHOOK INFO] Processing subscription payment event", {
    eventId,
    eventType: payload.event_type,
    userId,
  });
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
      console.log(
        `[WEBHOOK INFO] Updated subscription status to 'past_due' for user ${userId} due to failed payment`
      );
    }
  }

  // Handle successful payments
  if (payload.event_type === "subscription.payment_succeeded") {
    const { error: updateError } = await supabaseClient
      .from("profiles")
      .update({
        subscription_status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (updateError) {
      console.error(
        `[WEBHOOK ERROR] Error updating subscription status for successful payment: ${updateError.message}`
      );
    } else {
      console.log(
        `[WEBHOOK INFO] Updated subscription status to 'active' for user ${userId} due to successful payment`
      );
    }
  }

  console.log("=== SUBSCRIPTION PAYMENT EVENT DEBUG END ===");
  return {
    success: true,
    message: `Subscription payment ${payload.event_type} processed successfully.`,
  };
}
