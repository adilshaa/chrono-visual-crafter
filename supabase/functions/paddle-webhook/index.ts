// @ts-ignore -- Deno environment
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore -- Deno environment
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// @ts-ignore -- Deno environment
import {
  createHmac,
  decodeHex,
} from "https://deno.land/std@0.168.0/node/crypto.ts";

// @ts-ignore -- Deno environment
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// Enhanced logger for comprehensive debugging
class WebhookLogger {
  private logs: any[] = [];
  private maxLogs = 100;

  private addLog(level: string, message: string, data?: any) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data: data ? JSON.stringify(data, null, 2) : undefined,
      requestId: this.generateRequestId(),
    };

    this.logs.push(logEntry);

    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs.splice(0, this.logs.length - this.maxLogs);
    }

    // Enhanced console logging with request ID
    const consoleMethod =
      level === "error" ? "error" : level === "warn" ? "warn" : "log";
    console[consoleMethod](
      `[WEBHOOK ${level.toUpperCase()}] [${logEntry.requestId}] ${message}`,
      data || ""
    );
  }

  private generateRequestId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  info(message: string, data?: any) {
    this.addLog("info", message, data);
  }

  warn(message: string, data?: any) {
    this.addLog("warn", message, data);
  }

  error(message: string, data?: any) {
    this.addLog("error", message, data);
  }

  debug(message: string, data?: any) {
    this.addLog("debug", message, data);
  }

  critical(message: string, data?: any) {
    this.addLog("critical", message, data);
  }

  getLogs() {
    return this.logs;
  }

  exportLogs() {
    return JSON.stringify(this.logs, null, 2);
  }
}

const logger = new WebhookLogger();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, paddle-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Environment variables
const PADDLE_WEBHOOK_SIGNING_SECRET = Deno.env.get("PADDLE_WEBHOOK_SIGNING_SECRET");
const APP_ENVIRONMENT = Deno.env.get("APP_ENVIRONMENT") || "development";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const WEBHOOK_TIMESTAMP_TOLERANCE_SECONDS = 300; // 5 minutes

// Validate environment variables on startup
function validateEnvironment() {
  const requiredVars = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
  const missing = requiredVars.filter(varName => !Deno.env.get(varName));
  
  if (missing.length > 0) {
    logger.critical("CRITICAL_CONFIG_ERROR: Missing required environment variables", {
      missing,
      environment: APP_ENVIRONMENT
    });
    return false;
  }

  if (APP_ENVIRONMENT === "production" && !PADDLE_WEBHOOK_SIGNING_SECRET) {
    logger.critical("CRITICAL_CONFIG_ERROR: Paddle webhook signing secret is required in production");
    return false;
  }

  logger.info("Environment validation passed", {
    environment: APP_ENVIRONMENT,
    hasSigningSecret: !!PADDLE_WEBHOOK_SIGNING_SECRET,
    supabaseConfigured: !!SUPABASE_URL
  });

  return true;
}

// Enhanced signature verification with detailed logging
async function verifyPaddleSignature(
  req: Request,
  rawBody: string
): Promise<{ isValid: boolean; reason?: string }> {
  logger.debug("Starting signature verification", {
    environment: APP_ENVIRONMENT,
    hasSecret: !!PADDLE_WEBHOOK_SIGNING_SECRET,
    bodyLength: rawBody.length
  });

  if (APP_ENVIRONMENT !== "production") {
    logger.warn(
      `SECURITY_BYPASS: Paddle signature verification is BYPASSED in ${APP_ENVIRONMENT} environment. THIS SHOULD NOT HAPPEN IN PRODUCTION.`
    );
    return { isValid: true, reason: "bypassed_for_development" };
  }

  if (!PADDLE_WEBHOOK_SIGNING_SECRET) {
    logger.error("CRITICAL_CONFIG_ERROR: Paddle webhook signing secret is NOT CONFIGURED for PRODUCTION environment.");
    return { isValid: false, reason: "missing_signing_secret" };
  }

  const signatureHeader = req.headers.get("Paddle-Signature");
  if (!signatureHeader) {
    logger.warn("Missing Paddle-Signature header");
    return { isValid: false, reason: "missing_signature_header" };
  }

  logger.debug("Parsing signature header", { signatureHeader });

  const parts = signatureHeader.split(";");
  const timestampStr = parts
    .find((part) => part.startsWith("ts="))
    ?.split("=")[1];
  const h1Hash = parts.find((part) => part.startsWith("h1="))?.split("=")[1];

  if (!timestampStr || !h1Hash) {
    logger.warn("Invalid Paddle-Signature header format", { parts });
    return { isValid: false, reason: "invalid_signature_format" };
  }

  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) {
    logger.warn("Invalid timestamp in Paddle-Signature header", { timestampStr });
    return { isValid: false, reason: "invalid_timestamp" };
  }

  const currentTimestamp = Math.floor(Date.now() / 1000);
  const timeDiff = Math.abs(currentTimestamp - timestamp);
  
  if (timeDiff > WEBHOOK_TIMESTAMP_TOLERANCE_SECONDS) {
    logger.warn("Timestamp validation failed", {
      headerTimestamp: timestamp,
      currentTimestamp,
      timeDifference: timeDiff,
      tolerance: WEBHOOK_TIMESTAMP_TOLERANCE_SECONDS
    });
    return { isValid: false, reason: "timestamp_too_old" };
  }

  const signedPayload = `${timestampStr}:${rawBody}`;
  logger.debug("Computing HMAC", { payloadLength: signedPayload.length });

  try {
    const hmac = createHmac("sha256", PADDLE_WEBHOOK_SIGNING_SECRET);
    hmac.update(signedPayload);
    const computedHash = hmac.digest("hex");

    const isValid = computedHash.toLowerCase() === h1Hash.toLowerCase();
    
    logger.debug("Signature verification result", {
      isValid,
      computedHashPrefix: computedHash.substring(0, 8),
      providedHashPrefix: h1Hash.substring(0, 8)
    });

    return { isValid, reason: isValid ? "valid" : "signature_mismatch" };
  } catch (error) {
    logger.error("Error computing HMAC signature", { error: error.message });
    return { isValid: false, reason: "hmac_computation_error" };
  }
}

// Enhanced data validation
function validateWebhookPayload(payload: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!payload.event_type) {
    errors.push("Missing event_type");
  }

  if (!payload.event_id) {
    errors.push("Missing event_id");
  }

  if (!payload.data) {
    errors.push("Missing data object");
  }

  if (payload.data && !payload.data.custom_data?.userId) {
    errors.push("Missing userId in custom_data");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Enhanced user validation
async function validateUser(supabaseClient: any, userId: string): Promise<{ isValid: boolean; profile?: any; error?: string }> {
  try {
    logger.debug("Validating user", { userId });

    const { data: profile, error } = await supabaseClient
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code === "PGRST116") {
      logger.info("User profile not found, will create new profile", { userId });
      return { isValid: true, profile: null };
    }

    if (error) {
      logger.error("Database error during user validation", { error, userId });
      return { isValid: false, error: error.message };
    }

    logger.debug("User profile found", { userId, profileId: profile.id });
    return { isValid: true, profile };
  } catch (error) {
    logger.error("Unexpected error during user validation", { error: error.message, userId });
    return { isValid: false, error: error.message };
  }
}

// Enhanced profile creation/update
async function upsertUserProfile(
  supabaseClient: any,
  userId: string,
  customData: any,
  subscriptionData: any
): Promise<{ success: boolean; profile?: any; error?: string }> {
  try {
    logger.debug("Upserting user profile", { userId, subscriptionData });

    const profileData = {
      user_id: userId,
      email: customData.email || "unknown@example.com",
      full_name: customData.full_name || "Unknown User",
      subscription_status: subscriptionData.status || "active",
      subscription_plan: subscriptionData.planName || "unknown",
      paddle_customer_id: subscriptionData.customerId,
      updated_at: new Date().toISOString(),
    };

    // Try to update first
    const { data: updatedProfile, error: updateError } = await supabaseClient
      .from("profiles")
      .update(profileData)
      .eq("user_id", userId)
      .select()
      .single();

    if (updateError && updateError.code === "PGRST116") {
      // Profile doesn't exist, create it
      logger.info("Creating new user profile", { userId });
      
      const { data: newProfile, error: createError } = await supabaseClient
        .from("profiles")
        .insert({
          ...profileData,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError) {
        logger.error("Failed to create user profile", { error: createError, userId });
        return { success: false, error: createError.message };
      }

      logger.info("User profile created successfully", { userId, profileId: newProfile.id });
      return { success: true, profile: newProfile };
    }

    if (updateError) {
      logger.error("Failed to update user profile", { error: updateError, userId });
      return { success: false, error: updateError.message };
    }

    logger.info("User profile updated successfully", { userId, profileId: updatedProfile.id });
    return { success: true, profile: updatedProfile };
  } catch (error) {
    logger.error("Unexpected error during profile upsert", { error: error.message, userId });
    return { success: false, error: error.message };
  }
}

// Enhanced subscription management
async function upsertSubscription(
  supabaseClient: any,
  subscriptionData: any
): Promise<{ success: boolean; subscription?: any; error?: string }> {
  try {
    logger.debug("Upserting subscription", { subscriptionData });

    const { data: subscription, error } = await supabaseClient
      .from("user_subscriptions")
      .upsert({
        user_id: subscriptionData.userId,
        plan_id: subscriptionData.planId,
        paddle_subscription_id: subscriptionData.paddleSubscriptionId,
        status: subscriptionData.status,
        current_period_start: subscriptionData.currentPeriodStart,
        current_period_end: subscriptionData.currentPeriodEnd,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      logger.error("Failed to upsert subscription", { error, subscriptionData });
      return { success: false, error: error.message };
    }

    logger.info("Subscription upserted successfully", { 
      subscriptionId: subscription.id,
      userId: subscriptionData.userId 
    });
    return { success: true, subscription };
  } catch (error) {
    logger.error("Unexpected error during subscription upsert", { 
      error: error.message, 
      subscriptionData 
    });
    return { success: false, error: error.message };
  }
}

// Main webhook handler
serve(async (req) => {
  const requestId = Math.random().toString(36).substring(2, 15);
  logger.info("=== WEBHOOK REQUEST START ===", { 
    requestId,
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  });

  if (req.method === "OPTIONS") {
    logger.debug("Handling OPTIONS request", { requestId });
    return new Response("ok", { headers: corsHeaders });
  }

  // Validate environment on each request
  if (!validateEnvironment()) {
    return new Response(
      JSON.stringify({ error: "Server configuration error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }

  let rawBody: string;
  try {
    rawBody = await req.text();
    logger.debug("Request body received", { 
      requestId,
      bodyLength: rawBody.length,
      bodyPreview: rawBody.substring(0, 200) + "..."
    });
  } catch (error) {
    logger.error("Failed to read request body", { requestId, error: error.message });
    return new Response(
      JSON.stringify({ error: "Invalid request body" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }

  try {
    // Verify signature
    const signatureResult = await verifyPaddleSignature(req, rawBody);
    if (!signatureResult.isValid) {
      logger.error("Paddle webhook signature verification failed", { 
        requestId,
        reason: signatureResult.reason 
      });
      return new Response(
        JSON.stringify({ 
          error: "Signature verification failed",
          reason: signatureResult.reason 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    // Parse payload
    let payload: any;
    try {
      payload = JSON.parse(rawBody);
      logger.info("Webhook payload parsed successfully", { 
        requestId,
        eventType: payload.event_type,
        eventId: payload.event_id 
      });
    } catch (error) {
      logger.error("Failed to parse webhook payload", { requestId, error: error.message });
      return new Response(
        JSON.stringify({ error: "Invalid JSON payload" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Validate payload structure
    const validation = validateWebhookPayload(payload);
    if (!validation.isValid) {
      logger.error("Webhook payload validation failed", { 
        requestId,
        errors: validation.errors 
      });
      return new Response(
        JSON.stringify({ 
          error: "Invalid payload structure",
          details: validation.errors 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Initialize Supabase client
    const supabaseClient = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Process webhook based on event type
    let result: HandlerResult;
    switch (payload.event_type) {
      case "subscription.created":
      case "subscription.updated":
        result = await handleSubscriptionEvent(supabaseClient, payload, requestId);
        break;
      case "transaction.completed":
        result = await handleTransactionCompleted(supabaseClient, payload, requestId);
        break;
      case "subscription.canceled":
        result = await handleSubscriptionCanceled(supabaseClient, payload, requestId);
        break;
      default:
        logger.warn(`Unhandled event type: ${payload.event_type}`, { requestId });
        result = {
          success: true,
          message: `Event type ${payload.event_type} acknowledged but not processed`,
        };
    }

    logger.info("=== WEBHOOK REQUEST END ===", { 
      requestId,
      success: result.success,
      message: result.message 
    });

    return new Response(
      JSON.stringify({
        received: result.success,
        message: result.message || "Event processed successfully",
        requestId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    logger.critical("Unhandled webhook processing error", {
      requestId,
      error: error.message,
      stack: error.stack,
    });
    
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        requestId,
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
}

// Enhanced subscription event handler
async function handleSubscriptionEvent(
  supabaseClient: any,
  payload: any,
  requestId: string
): Promise<HandlerResult> {
  const subscription = payload.data;
  const eventId = payload.event_id;
  const customData = subscription.custom_data || {};
  const userId = customData.userId;

  logger.info("=== SUBSCRIPTION EVENT PROCESSING START ===", { 
    requestId,
    eventId,
    userId,
    subscriptionId: subscription.id,
    status: subscription.status 
  });

  // Validate user
  const userValidation = await validateUser(supabaseClient, userId);
  if (!userValidation.isValid) {
    logger.error("User validation failed", { requestId, userId, error: userValidation.error });
    return {
      success: false,
      message: `User validation failed: ${userValidation.error}`,
    };
  }

  // Extract product ID
  let productId = subscription.items?.[0]?.product_id || 
                  subscription.items?.[0]?.price_id || 
                  subscription.product_id;

  if (!productId) {
    logger.error("No product ID found in subscription", { 
      requestId,
      subscriptionItems: subscription.items 
    });
    return {
      success: false,
      message: "Product ID missing in subscription data",
    };
  }

  // Get subscription plan
  logger.debug("Fetching subscription plan", { requestId, productId });
  const { data: plan, error: planError } = await supabaseClient
    .from("subscription_plans")
    .select("*")
    .eq("paddle_product_id", productId)
    .single();

  if (planError || !plan) {
    logger.error("Subscription plan not found", { 
      requestId,
      productId,
      error: planError 
    });
    return {
      success: false,
      message: `Subscription plan not found for product ID: ${productId}`,
    };
  }

  logger.debug("Subscription plan found", { 
    requestId,
    planId: plan.id,
    planName: plan.name 
  });

  // Upsert user profile
  const profileResult = await upsertUserProfile(
    supabaseClient,
    userId,
    customData,
    {
      status: subscription.status,
      planName: plan.name.toLowerCase(),
      customerId: subscription.customer_id,
    }
  );

  if (!profileResult.success) {
    logger.error("Failed to upsert user profile", { 
      requestId,
      userId,
      error: profileResult.error 
    });
    return {
      success: false,
      message: `Profile update failed: ${profileResult.error}`,
    };
  }

  // Upsert subscription
  const subscriptionResult = await upsertSubscription(supabaseClient, {
    userId,
    planId: plan.id,
    paddleSubscriptionId: subscription.id,
    status: subscription.status,
    currentPeriodStart: subscription.current_billing_period?.starts_at,
    currentPeriodEnd: subscription.current_billing_period?.ends_at,
  });

  if (!subscriptionResult.success) {
    logger.error("Failed to upsert subscription", { 
      requestId,
      userId,
      error: subscriptionResult.error 
    });
    return {
      success: false,
      message: `Subscription update failed: ${subscriptionResult.error}`,
    };
  }

  logger.info("=== SUBSCRIPTION EVENT PROCESSING END ===", { 
    requestId,
    success: true,
    userId,
    planName: plan.name 
  });

  return {
    success: true,
    message: `Subscription ${subscription.status} processed successfully for plan ${plan.name}`,
  };
}

// Enhanced transaction completed handler
async function handleTransactionCompleted(
  supabaseClient: any,
  payload: any,
  requestId: string
): Promise<HandlerResult> {
  const transaction = payload.data;
  const eventId = payload.event_id;
  const customData = transaction.custom_data || {};
  const userId = customData.userId;

  logger.info("=== TRANSACTION COMPLETED PROCESSING START ===", { 
    requestId,
    eventId,
    userId,
    transactionId: transaction.id,
    amount: transaction.details?.totals?.total,
    currency: transaction.currency_code 
  });

  // Validate user
  const userValidation = await validateUser(supabaseClient, userId);
  if (!userValidation.isValid) {
    logger.error("User validation failed for transaction", { 
      requestId,
      userId,
      error: userValidation.error 
    });
    return {
      success: false,
      message: `User validation failed: ${userValidation.error}`,
    };
  }

  // Process one-time payments (non-subscription)
  if (!transaction.subscription_id && transaction.items?.length > 0) {
    const item = transaction.items[0];
    const productId = item.product_id || item.price_id;

    if (productId) {
      logger.debug("Processing one-time payment", { requestId, productId });
      
      const { data: plan, error: planError } = await supabaseClient
        .from("subscription_plans")
        .select("*")
        .eq("paddle_product_id", productId)
        .single();

      if (plan && !planError) {
        const profileResult = await upsertUserProfile(
          supabaseClient,
          userId,
          customData,
          {
            status: "active",
            planName: plan.name.toLowerCase(),
            customerId: transaction.customer_id,
          }
        );

        if (!profileResult.success) {
          logger.error("Failed to update profile for one-time payment", { 
            requestId,
            userId,
            error: profileResult.error 
          });
          return {
            success: false,
            message: `Profile update failed for one-time payment: ${profileResult.error}`,
          };
        }

        logger.info("One-time payment processed successfully", { 
          requestId,
          userId,
          planName: plan.name 
        });
      }
    }
  }

  logger.info("=== TRANSACTION COMPLETED PROCESSING END ===", { 
    requestId,
    success: true,
    userId 
  });

  return {
    success: true,
    message: "Transaction completed event processed successfully",
  };
}

// Enhanced subscription canceled handler
async function handleSubscriptionCanceled(
  supabaseClient: any,
  payload: any,
  requestId: string
): Promise<HandlerResult> {
  const subscription = payload.data;
  const eventId = payload.event_id;
  const customData = subscription.custom_data || {};
  const userId = customData.userId;

  logger.info("=== SUBSCRIPTION CANCELED PROCESSING START ===", { 
    requestId,
    eventId,
    userId,
    subscriptionId: subscription.id 
  });

  // Validate user
  const userValidation = await validateUser(supabaseClient, userId);
  if (!userValidation.isValid) {
    logger.error("User validation failed for cancellation", { 
      requestId,
      userId,
      error: userValidation.error 
    });
    return {
      success: false,
      message: `User validation failed: ${userValidation.error}`,
    };
  }

  // Update profile to free plan
  const profileResult = await upsertUserProfile(
    supabaseClient,
    userId,
    customData,
    {
      status: subscription.status || "canceled",
      planName: "free",
      customerId: subscription.customer_id,
    }
  );

  if (!profileResult.success) {
    logger.error("Failed to update profile for cancellation", { 
      requestId,
      userId,
      error: profileResult.error 
    });
    return {
      success: false,
      message: `Profile update failed for cancellation: ${profileResult.error}`,
    };
  }

  // Update subscription record
  const { error: subscriptionUpdateError } = await supabaseClient
    .from("user_subscriptions")
    .update({
      status: subscription.status || "canceled",
      updated_at: new Date().toISOString(),
      current_period_end: subscription.current_billing_period?.ends_at || new Date().toISOString(),
    })
    .eq("paddle_subscription_id", subscription.id);

  if (subscriptionUpdateError) {
    logger.error("Failed to update subscription record for cancellation", { 
      requestId,
      userId,
      error: subscriptionUpdateError 
    });
    return {
      success: false,
      message: `Subscription record update failed: ${subscriptionUpdateError.message}`,
    };
  }

  logger.info("=== SUBSCRIPTION CANCELED PROCESSING END ===", { 
    requestId,
    success: true,
    userId 
  });

  return {
    success: true,
    message: "Subscription cancellation processed successfully",
  };
}