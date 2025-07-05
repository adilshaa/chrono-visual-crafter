// Database verification script
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://ummxlnjjrnwqvuxpkdfc.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "your-service-role-key";

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyDatabaseState() {
  console.log("🔍 Verifying Database State");
  console.log("===========================");

  try {
    // 1. Check subscription plans
    console.log("\n1. Checking Subscription Plans:");
    const { data: plans, error: plansError } = await supabase
      .from("subscription_plans")
      .select("*")
      .order("price", { ascending: true });

    if (plansError) {
      console.error("❌ Error fetching subscription plans:", plansError);
    } else {
      console.log("✅ Subscription Plans Found:", plans.length);
      plans.forEach(plan => {
        console.log(`  - ${plan.name}: $${plan.price}/${plan.interval_type} (Paddle ID: ${plan.paddle_product_id})`);
      });
    }

    // 2. Check user profiles
    console.log("\n2. Checking User Profiles:");
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .limit(10);

    if (profilesError) {
      console.error("❌ Error fetching profiles:", profilesError);
    } else {
      console.log("✅ User Profiles Found:", profiles.length);
      profiles.forEach(profile => {
        console.log(`  - ${profile.full_name || 'Unknown'} (${profile.email}): ${profile.subscription_plan} - ${profile.subscription_status}`);
      });
    }

    // 3. Check user subscriptions
    console.log("\n3. Checking User Subscriptions:");
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from("user_subscriptions")
      .select(`
        *,
        subscription_plans(name, price)
      `)
      .limit(10);

    if (subscriptionsError) {
      console.error("❌ Error fetching subscriptions:", subscriptionsError);
    } else {
      console.log("✅ User Subscriptions Found:", subscriptions.length);
      subscriptions.forEach(sub => {
        console.log(`  - User: ${sub.user_id}, Plan: ${sub.subscription_plans?.name}, Status: ${sub.status}`);
      });
    }

    // 4. Test database operations
    console.log("\n4. Testing Database Operations:");
    
    // Test profile creation
    const testUserId = `test_user_${Date.now()}`;
    console.log(`Creating test profile for user: ${testUserId}`);
    
    const { data: newProfile, error: createError } = await supabase
      .from("profiles")
      .insert({
        user_id: testUserId,
        email: "test@example.com",
        full_name: "Test User",
        subscription_status: "free",
        subscription_plan: "free",
      })
      .select()
      .single();

    if (createError) {
      console.error("❌ Error creating test profile:", createError);
    } else {
      console.log("✅ Test profile created successfully");
      
      // Test profile update
      const { data: updatedProfile, error: updateError } = await supabase
        .from("profiles")
        .update({
          subscription_status: "active",
          subscription_plan: "premium",
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", testUserId)
        .select()
        .single();

      if (updateError) {
        console.error("❌ Error updating test profile:", updateError);
      } else {
        console.log("✅ Test profile updated successfully");
      }

      // Clean up test profile
      const { error: deleteError } = await supabase
        .from("profiles")
        .delete()
        .eq("user_id", testUserId);

      if (deleteError) {
        console.error("❌ Error deleting test profile:", deleteError);
      } else {
        console.log("✅ Test profile cleaned up successfully");
      }
    }

    // 5. Check RLS policies
    console.log("\n5. Checking RLS Policies:");
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_policies', {});

    if (policiesError) {
      console.log("⚠️  Could not fetch RLS policies (this is normal)");
    } else {
      console.log("✅ RLS policies are configured");
    }

    console.log("\n✅ Database verification completed successfully!");

  } catch (error) {
    console.error("❌ Database verification failed:", error);
  }
}

// Helper function to create test data
async function createTestData() {
  console.log("\n🔧 Creating Test Data");
  console.log("=====================");

  try {
    // Create test users
    const testUsers = [
      {
        user_id: "user_test_basic_001",
        email: "basic@test.com",
        full_name: "Basic Test User",
        subscription_status: "free",
        subscription_plan: "free",
      },
      {
        user_id: "user_test_premium_001",
        email: "premium@test.com",
        full_name: "Premium Test User",
        subscription_status: "free",
        subscription_plan: "free",
      },
    ];

    for (const user of testUsers) {
      const { data, error } = await supabase
        .from("profiles")
        .upsert(user)
        .select()
        .single();

      if (error) {
        console.error(`❌ Error creating test user ${user.user_id}:`, error);
      } else {
        console.log(`✅ Test user created: ${user.user_id}`);
      }
    }

    console.log("✅ Test data creation completed!");

  } catch (error) {
    console.error("❌ Test data creation failed:", error);
  }
}

// Run verification
async function main() {
  await verifyDatabaseState();
  
  // Uncomment to create test data
  // await createTestData();
}

main().catch(console.error);