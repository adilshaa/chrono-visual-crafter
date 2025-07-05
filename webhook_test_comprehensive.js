// Comprehensive webhook testing script
const fetch = require("node-fetch");

const webhookUrl = "https://ummxlnjjrnwqvuxpkdfc.supabase.co/functions/v1/paddle-webhook";

// Test scenarios
const testScenarios = [
  {
    name: "Subscription Created - Premium Plan",
    payload: {
      event_type: "subscription.created",
      event_id: "evt_test_sub_created_001",
      occurred_at: new Date().toISOString(),
      data: {
        id: "sub_test_premium_001",
        customer_id: "ctm_test_001",
        status: "active",
        items: [
          {
            price_id: "pri_01jzd18ccw9bacpda72n20z7c8", // Premium plan
            product_id: "pro_premium_001",
            quantity: 1,
          },
        ],
        current_billing_period: {
          starts_at: new Date().toISOString(),
          ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        },
        custom_data: {
          userId: "user_test_premium_001",
          email: "premium@test.com",
          full_name: "Premium Test User",
        },
      },
    },
  },
  {
    name: "Transaction Completed - One-time Payment",
    payload: {
      event_type: "transaction.completed",
      event_id: "evt_test_txn_completed_001",
      occurred_at: new Date().toISOString(),
      data: {
        id: "txn_test_001",
        customer_id: "ctm_test_002",
        status: "completed",
        currency_code: "USD",
        details: {
          totals: {
            total: "999", // $9.99
          },
        },
        items: [
          {
            price_id: "pri_01jz83w5yaedw208g22mke3k9j", // Basic plan
            product_id: "pro_basic_001",
            quantity: 1,
          },
        ],
        custom_data: {
          userId: "user_test_basic_001",
          email: "basic@test.com",
          full_name: "Basic Test User",
        },
      },
    },
  },
  {
    name: "Subscription Canceled",
    payload: {
      event_type: "subscription.canceled",
      event_id: "evt_test_sub_canceled_001",
      occurred_at: new Date().toISOString(),
      data: {
        id: "sub_test_premium_001",
        customer_id: "ctm_test_001",
        status: "canceled",
        current_billing_period: {
          starts_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
          ends_at: new Date().toISOString(),
        },
        custom_data: {
          userId: "user_test_premium_001",
          email: "premium@test.com",
          full_name: "Premium Test User",
        },
      },
    },
  },
  {
    name: "Invalid Payload - Missing User ID",
    payload: {
      event_type: "subscription.created",
      event_id: "evt_test_invalid_001",
      occurred_at: new Date().toISOString(),
      data: {
        id: "sub_test_invalid_001",
        customer_id: "ctm_test_invalid",
        status: "active",
        items: [
          {
            price_id: "pri_01jzd18ccw9bacpda72n20z7c8",
            quantity: 1,
          },
        ],
        custom_data: {
          // Missing userId
          email: "invalid@test.com",
        },
      },
    },
  },
  {
    name: "Invalid Product ID",
    payload: {
      event_type: "subscription.created",
      event_id: "evt_test_invalid_product_001",
      occurred_at: new Date().toISOString(),
      data: {
        id: "sub_test_invalid_product_001",
        customer_id: "ctm_test_invalid_product",
        status: "active",
        items: [
          {
            price_id: "pri_invalid_product_id", // Non-existent product
            quantity: 1,
          },
        ],
        custom_data: {
          userId: "user_test_invalid_product_001",
          email: "invalidproduct@test.com",
          full_name: "Invalid Product Test User",
        },
      },
    },
  },
];

async function runTest(scenario) {
  console.log(`\n=== Testing: ${scenario.name} ===`);
  console.log("Payload:", JSON.stringify(scenario.payload, null, 2));

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Paddle-Signature": "ts=1234567890;h1=test_signature", // Mock signature for development
      },
      body: JSON.stringify(scenario.payload),
    });

    console.log("Response Status:", response.status);
    console.log("Response Headers:", Object.fromEntries(response.headers.entries()));

    const result = await response.text();
    console.log("Response Body:", result);

    if (response.ok) {
      console.log("✅ Test PASSED");
    } else {
      console.log("❌ Test FAILED");
    }

    return {
      scenario: scenario.name,
      status: response.status,
      success: response.ok,
      response: result,
    };
  } catch (error) {
    console.error("❌ Test ERROR:", error.message);
    return {
      scenario: scenario.name,
      status: "ERROR",
      success: false,
      error: error.message,
    };
  }
}

async function runAllTests() {
  console.log("🚀 Starting Comprehensive Webhook Tests");
  console.log("Webhook URL:", webhookUrl);
  console.log("Total Test Scenarios:", testScenarios.length);

  const results = [];

  for (const scenario of testScenarios) {
    const result = await runTest(scenario);
    results.push(result);
    
    // Wait between tests to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log("\n📊 TEST SUMMARY");
  console.log("================");
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`Total Tests: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  
  console.log("\nDetailed Results:");
  results.forEach(result => {
    const status = result.success ? "✅ PASS" : "❌ FAIL";
    console.log(`${status} - ${result.scenario} (${result.status})`);
  });

  if (failed > 0) {
    console.log("\n🔍 Failed Test Details:");
    results.filter(r => !r.success).forEach(result => {
      console.log(`\n${result.scenario}:`);
      console.log(`Status: ${result.status}`);
      if (result.error) {
        console.log(`Error: ${result.error}`);
      }
      if (result.response) {
        console.log(`Response: ${result.response}`);
      }
    });
  }
}

// Run the tests
runAllTests().catch(console.error);