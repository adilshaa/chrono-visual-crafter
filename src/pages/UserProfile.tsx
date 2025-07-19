import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useClerkAuth } from "@/hooks/useClerkAuth";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePaddle } from "@/components/payments/PaddleProvider";
import {
  UserProfileSidebar,
  UserProfileNavigation,
  UserProfileHeader,
  OverviewTab,
  UsageTab,
  BillingTab,
  SecurityTab,
} from "@/components/user-profile";

interface UserProfileProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Interface for subscription details
interface SubscriptionDetails {
  current_period_end?: string;
  next_invoice_date?: string;
  cancel_at_period_end?: boolean;
  status?: string;
  plan?: string;
  paddle_subscription_id?: string;
  is_expired?: boolean;
  days_until_expiry?: number;
}

const UserProfile = ({ open, onOpenChange }: UserProfileProps) => {
  const navigate = useNavigate();
  const { user, profile, signOut, updateProfile, refreshProfile } =
    useClerkAuth();
  const { toast } = useToast();
  const { cancelSubscriptionAPI, refreshSubscriptionStatus } = usePaddle();
  const [activeTab, setActiveTab] = useState("overview");
  const [subscriptionDetails, setSubscriptionDetails] =
    useState<SubscriptionDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  // Fetch subscription details from Supabase
  useEffect(() => {
    const fetchSubscriptionDetails = async () => {
      if (!user) return;

      setIsLoading(true);
      try {
        const { data: userSubscriptions, error } = await supabase
          .from("user_subscriptions")
          .select(
            "plan_id,current_period_end,status,paddle_subscription_id,created_at"
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1);

        if (error) {
          console.error("Error fetching user subscriptions:", error);
          setIsLoading(false);
          return;
        }

        const userSubscription =
          userSubscriptions &&
          Array.isArray(userSubscriptions) &&
          userSubscriptions.length > 0
            ? userSubscriptions[0]
            : null;

        // Type guard to ensure userSubscription is not null and has the expected properties
        if (!userSubscription) {
          setIsLoading(false);
          return;
        }

        // Check if all required properties exist
        if (
          !("plan_id" in userSubscription) ||
          !("current_period_end" in userSubscription) ||
          !("status" in userSubscription) ||
          !("paddle_subscription_id" in userSubscription)
        ) {
          console.error(
            "Subscription is missing required fields",
            userSubscription
          );
          setIsLoading(false);
          return;
        }

        // TypeScript type assertion to help with type safety
        const typedSubscription = userSubscription as {
          plan_id: string;
          current_period_end: string;
          status: string;
          paddle_subscription_id: string;
        };

        let plan: any = null;
        if (typedSubscription.plan_id) {
          const { data: planData, error: planError } = await supabase
            .from("subscription_plans")
            .select("*")
            .eq("id", typedSubscription.plan_id)
            .single();
          if (planError) {
            console.error("Error fetching plan:", planError);
          }
          plan = planData;
        }

        const details: SubscriptionDetails = {
          current_period_end: typedSubscription.current_period_end,
          status: typedSubscription.status,
          plan: plan?.name ?? null,
          paddle_subscription_id: typedSubscription.paddle_subscription_id,
        };

        // Check if subscription is expired
        if (details.current_period_end) {
          const expiryDate = new Date(details.current_period_end);
          const now = new Date();
          details.is_expired = expiryDate < now;
          details.days_until_expiry = Math.ceil(
            (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );
        }

        setSubscriptionDetails(details);
      } catch (error) {
        console.error("Error fetching subscription details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (open && user) {
      fetchSubscriptionDetails();
    }
  }, [user, open]);

  // Handle subscription cancellation
  const handleCancelSubscription = async () => {
    if (!subscriptionDetails?.paddle_subscription_id) {
      toast({
        title: "Error",
        description: "No subscription found to cancel.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCanceling(true);

      // Try to cancel via the Edge Function first
      try {
        // Import the API function
        const { cancelSubscription } = await import("@/api/subscriptions");

        // Call the Edge Function
        const result = await cancelSubscription({
          subscriptionId: subscriptionDetails.paddle_subscription_id,
          userId: user.id,
          reason: "user_initiated",
        });

        if (result.success) {
          toast({
            title: "Subscription Canceled",
            description:
              "Your subscription has been canceled successfully. The page will reload to update your status.",
          });

          // Update local state immediately
          setSubscriptionDetails((prev) =>
            prev
              ? {
                  ...prev,
                  status: "cancelled",
                  cancel_at_period_end: true,
                }
              : null
          );

          // Refresh subscription status
          await refreshSubscriptionStatus();

          // Close the modal and reload the page to ensure all components update
          setTimeout(() => {
            onOpenChange(false);
            window.location.reload();
          }, 2000);

          return;
        } else {
          // Check if the error indicates the subscription is already cancelled
          const errorMessage = result.error?.message || result.message || "";
          if (
            errorMessage.includes("subscription_update_when_canceled") ||
            errorMessage.includes("subscription is canceled") ||
            errorMessage.includes("already cancelled")
          ) {
            // Subscription is already cancelled, treat as success
            toast({
              title: "Subscription Already Canceled",
              description:
                "Your subscription was already canceled. The page will reload to update your status.",
            });

            // Update local state immediately
            setSubscriptionDetails((prev) =>
              prev
                ? {
                    ...prev,
                    status: "cancelled",
                    cancel_at_period_end: true,
                  }
                : null
            );

            // Refresh subscription status
            await refreshSubscriptionStatus();

            // Close the modal and reload the page to ensure all components update
            setTimeout(() => {
              onOpenChange(false);
              window.location.reload();
            }, 2000);

            return;
          }

          console.error("Edge function cancellation failed:", result.error);
          // Fall back to client-side API for other errors
        }
      } catch (edgeError) {
        console.error("Error with Edge function cancellation:", edgeError);
        // Fall back to client-side API
      }

      // Fallback: Use the cancelSubscriptionAPI method from PaddleProvider
      const success = await cancelSubscriptionAPI(
        subscriptionDetails.paddle_subscription_id
      );

      if (success) {
        toast({
          title: "Subscription Canceled",
          description:
            "Your subscription has been canceled successfully. The page will reload to update your status.",
        });

        // Update local state immediately
        setSubscriptionDetails((prev) =>
          prev
            ? {
                ...prev,
                status: "cancelled",
                cancel_at_period_end: true,
              }
            : null
        );

        // Refresh subscription status
        await refreshSubscriptionStatus();

        // Close the modal and reload the page to ensure all components update
        setTimeout(() => {
          onOpenChange(false);
          window.location.reload();
        }, 2000);
      }
    } catch (error) {
      console.error("Error canceling subscription:", error);
      toast({
        title: "Cancellation Error",
        description: "Unable to cancel subscription. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsCanceling(false);
    }
  };

  // Handle subscription reactivation - removed since we don't have backend
  const handleReactivateSubscription = async () => {
    toast({
      title: "Feature Not Available",
      description:
        "Subscription reactivation is not available at this time. Please contact support.",
      variant: "destructive",
    });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (!user) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl w-[95vw] h-[90vh] sm:h-[85vh] pt-6 sm:pt-10 border border-white/[0.08] backdrop-blur-sm max-h-[95vh] overflow-y-auto custom-scrollbar">
        <div className="flex flex-col lg:flex-row h-full min-h-0">
          {/* Mobile Header */}
          <UserProfileHeader user={user} />

          {/* Mobile Navigation */}
          <UserProfileNavigation
            activeTab={activeTab}
            onTabChange={setActiveTab}
            isMobile={true}
          />

          {/* Desktop Sidebar */}
          <UserProfileSidebar
            user={user}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onSignOut={handleSignOut}
          />

          {/* Main Content */}
          <div className="flex-1 min-w-0 overflow-y-auto bg-[#101010] custom-scrollbar">
            <div className="p-4 sm:p-6 relative z-10">
              {/* Overview Tab */}
              {activeTab === "overview" && (
                <OverviewTab
                  user={user}
                  profile={profile}
                  subscriptionDetails={subscriptionDetails}
                  onNavigate={navigate}
                  onCancelSubscription={handleCancelSubscription}
                  onReactivateSubscription={handleReactivateSubscription}
                  isCanceling={isCanceling}
                />
              )}

              {/* Usage Tab */}
              {activeTab === "usage" && (
                <UsageTab profile={profile} onNavigate={navigate} />
              )}

              {/* Billing Tab */}
              {activeTab === "billing" && (
                <BillingTab
                  profile={profile}
                  subscriptionDetails={subscriptionDetails}
                  isLoading={isLoading}
                  onCancelSubscription={handleCancelSubscription}
                  isCanceling={isCanceling}
                  userId={user.id}
                />
              )}

              {/* Security Tab */}
              {activeTab === "security" && (
                <SecurityTab
                  user={user}
                  profile={profile}
                  onProfileUpdate={updateProfile}
                />
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserProfile;
