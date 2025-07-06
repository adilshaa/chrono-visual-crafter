// Test script to simulate Paddle webhook
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const dotenv = require("dotenv");
dotenv.config();

// SECURITY: Use environment variables instead of hardcoded values
const webhookUrl =
  process.env.WEBHOOK_URL ||
  "https://ummxlnjjrnwqvuxpkdfc.supabase.co/functions/v1/paddle-webhook";

const testPayload = {
  event_type: "subscription.created",
  event_id: "test_event_123",
  data: {
    id: "sub_test_123",
    customer_id: "ctm_test_456",
    status: "active",
    items: [
      {
        product_id:
          process.env.TEST_PRODUCT_ID || "pri_01jzd18ccw9bacpda72n20z7c8", // Premium plan
      },
    ],
    current_billing_period: {
      starts_at: "2025-07-05T10:00:00Z",
      ends_at: "2025-08-05T10:00:00Z",
    },
    custom_data: {
      userId: process.env.TEST_USER_ID || "user_test_789", // Replace with actual user ID from env
    },
  },
};

async function testWebhook() {
  try {
    console.log(
      "Testing webhook with payload:",
      JSON.stringify(testPayload, null, 2)
    );

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Paddle-Signature": "ts=1234567890;h1=test_signature", // Mock signature for testing
      },
      body: JSON.stringify(testPayload),
    });

    const result = await response.text();
    console.log("Response status:", response.status);
    console.log("Response body:", result);
  } catch (error) {
    console.error("Error testing webhook:", error);
  }
}

testWebhook();
