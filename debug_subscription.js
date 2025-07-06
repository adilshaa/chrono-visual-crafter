// Debug script to check database state
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://ummxlnjjrnwqvuxpkdfc.supabase.co";
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || "your-service-role-key";

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugDatabase() {
  try {
    console.log("=== Checking Subscription Plans ===");
    const { data: plans, error: plansError } = await supabase
      .from("subscription_plans")
      .select("*");

    if (plansError) {
      console.error("Error fetching plans:", plansError);
    } else {
      console.log("Subscription Plans:", JSON.stringify(plans, null, 2));
    }

    console.log("\n=== Checking Profiles ===");
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .limit(5);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
    } else {
      console.log("Profiles:", JSON.stringify(profiles, null, 2));
    }

    console.log("\n=== Checking User Subscriptions ===");
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from("user_subscriptions")
      .select("*");

    if (subscriptionsError) {
      console.error("Error fetching subscriptions:", subscriptionsError);
    } else {
      console.log(
        "User Subscriptions:",
        JSON.stringify(subscriptions, null, 2)
      );
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

debugDatabase();
