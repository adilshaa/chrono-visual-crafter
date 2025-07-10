import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useClerkAuth } from "@/hooks/useClerkAuth";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  User,
  Crown,
  Settings,
  LogOut,
  ShieldCheck,
  Calendar,
  Activity,
  ChevronRight,
  CreditCard,
  MinusCircle,
  Clock,
  Video,
  Image,
  Check,
  Bell,
  Lock,
  Mail,
  Home,
  LineChart,
  CreditCard as BillingIcon,
  ShieldAlert,
  X,
  AlertTriangle,
  RefreshCw,
  Zap,
  AlertCircle,
} from "lucide-react";
import { StudioBackground } from "@/components/ui/studio-background";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  validateSubscription,
  cancelSubscription,
  reactivateSubscription,
  retryBilling,
  updateSubscriptionInSupabase as updateSupabaseSubscription,
  isSubscriptionExpired,
  getDaysUntilExpiry,
} from "@/api/subscriptions";
import { usePaddle } from "@/components/payments/PaddleProvider";

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

// Interface for Paddle subscription data
interface PaddleSubscription {
  id: string;
  status: string;
  current_billing_period: {
    starts_at: string;
    ends_at: string;
  };
  next_billing_period?: {
    starts_at: string;
    ends_at: string;
  };
  cancel_at_period_end: boolean;
}

const UserProfile = ({ open, onOpenChange }: UserProfileProps) => {
  const navigate = useNavigate();
  const { user, profile, signOut } = useClerkAuth();
  const { theme } = useTheme();
  const { toast } = useToast();
  const { cancelSubscriptionAPI } = usePaddle();
  const isDark = theme === "dark";
  const [activeTab, setActiveTab] = useState("overview");
  const [subscriptionDetails, setSubscriptionDetails] =
    useState<SubscriptionDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [paddleSubscription, setPaddleSubscription] =
    useState<PaddleSubscription | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);

  // Fetch subscription details from Supabase and validate with Paddle
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
        console.log("userSubscriptions", userSubscriptions);

        const userSubscription =
          userSubscriptions &&
          Array.isArray(userSubscriptions) &&
          userSubscriptions.length > 0
            ? userSubscriptions[0]
            : null;

        // Type guard to ensure userSubscription is not null and has the expected properties
        if (!userSubscription) {
          console.log("No subscription found for user");
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

        // If user has a Paddle subscription ID, fetch latest data from Paddle
        if (details.paddle_subscription_id) {
          await validateWithPaddle(details.paddle_subscription_id);
        }
      } catch (error) {
        console.error("Error fetching subscription details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchPaymentHistory = async () => {
      if (!user) return;
      // Replace 'payment_history' with your actual table name if different
      const { data, error } = await supabase
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Error fetching payment history:", error);
        setPaymentHistory([]);
      } else {
        setPaymentHistory(data || []);
      }
    };

    if (open && user) {
      fetchSubscriptionDetails();
      fetchPaymentHistory();
    }
  }, [user, open]);

  // Validate subscription with Paddle API
  const validateWithPaddle = async (subscriptionId: string) => {
    try {
      setIsValidating(true);

      // Call your backend API to fetch Paddle subscription data
      const response = await fetch(
        `/api/subscriptions/${subscriptionId}/validate`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const paddleData: PaddleSubscription = await response.json();
        setPaddleSubscription(paddleData);
        console.log("paddleData", paddleData);

        // Update local subscription details with Paddle data
        setSubscriptionDetails((prev) =>
          prev
            ? {
                ...prev,
                current_period_end: paddleData.current_billing_period.ends_at,
                next_invoice_date: paddleData.next_billing_period?.starts_at,
                cancel_at_period_end: paddleData.cancel_at_period_end,
                status: paddleData.status,
                is_expired:
                  new Date(paddleData.current_billing_period.ends_at) <
                  new Date(),
                days_until_expiry: Math.ceil(
                  (new Date(
                    paddleData.current_billing_period.ends_at
                  ).getTime() -
                    new Date().getTime()) /
                    (1000 * 60 * 60 * 24)
                ),
              }
            : null
        );

        // Update Supabase if there are discrepancies
        await updateSubscriptionInSupabase(paddleData);

        toast({
          title: "Subscription Validated",
          description:
            "Your subscription status has been updated with the latest information.",
        });
      } else {
        throw new Error("Failed to validate subscription");
      }
    } catch (error) {
      console.error("Error validating subscription with Paddle:", error);
      toast({
        title: "Validation Error",
        description: "Unable to validate subscription. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  // Update subscription data in Supabase
  const updateSubscriptionInSupabase = async (
    paddleData: PaddleSubscription
  ) => {
    try {
      const { error } = await supabase
        .from("user_subscriptions")
        .update({
          current_period_start: paddleData.current_billing_period.starts_at,
          current_period_end: paddleData.current_billing_period.ends_at,
          status: paddleData.status,
          updated_at: new Date().toISOString(),
        })
        .eq("subscription_id", paddleData.id);

      if (error) {
        console.error("Error updating subscription in Supabase:", error);
      }
    } catch (error) {
      console.error("Error updating subscription:", error);
    }
  };

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

      // Use the cancelSubscriptionAPI method from PaddleProvider
      const success = await cancelSubscriptionAPI(
        subscriptionDetails.paddle_subscription_id
      );

      if (success) {
        // Refresh subscription details
        setSubscriptionDetails((prev) =>
          prev
            ? {
                ...prev,
                cancel_at_period_end: true,
              }
            : null
        );
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

  // Handle subscription reactivation
  const handleReactivateSubscription = async () => {
    if (!subscriptionDetails?.paddle_subscription_id) {
      toast({
        title: "Error",
        description: "No subscription found to reactivate.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCanceling(true);

      // Call your backend API to reactivate subscription
      const response = await fetch(
        `/api/subscriptions/${subscriptionDetails.paddle_subscription_id}/reactivate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        toast({
          title: "Subscription Reactivated",
          description: "Your subscription has been reactivated successfully.",
        });

        // Refresh subscription details
        setSubscriptionDetails((prev) =>
          prev
            ? {
                ...prev,
                cancel_at_period_end: false,
              }
            : null
        );
      } else {
        throw new Error("Failed to reactivate subscription");
      }
    } catch (error) {
      console.error("Error reactivating subscription:", error);
      toast({
        title: "Reactivation Error",
        description:
          "Unable to reactivate subscription. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsCanceling(false);
    }
  };

  // Handle billing retry for expired subscriptions
  const handleRetryBilling = async () => {
    if (!subscriptionDetails?.paddle_subscription_id) {
      toast({
        title: "Error",
        description: "No subscription found to retry billing.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsValidating(true);

      // Call your backend API to retry billing
      const response = await fetch(
        `/api/subscriptions/${subscriptionDetails.paddle_subscription_id}/retry-billing`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        toast({
          title: "Billing Retry Initiated",
          description:
            "We've initiated a retry of your payment. You'll be notified of the result.",
        });

        // Refresh subscription details after a delay
        setTimeout(() => {
          if (subscriptionDetails.paddle_subscription_id) {
            validateWithPaddle(subscriptionDetails.paddle_subscription_id);
          }
        }, 5000);
      } else {
        throw new Error("Failed to retry billing");
      }
    } catch (error) {
      console.error("Error retrying billing:", error);
      toast({
        title: "Billing Retry Error",
        description: "Unable to retry billing. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (!user) {
    return null;
  }

  // Determine subscription tier for styling
  const isPro = (profile?.subscription_plan || "")
    .toLowerCase()
    .includes("pro");
  const isTeam = (profile?.subscription_plan || "")
    .toLowerCase()
    .includes("team");

  // Set gradient based on subscription
  let gradientStyle = "from-gray-400/20 to-gray-500/20";
  let accentColor = "gray";

  if (isPro) {
    gradientStyle = "from-indigo-500/20 to-blue-600/20";
    accentColor = "indigo";
  } else if (isTeam) {
    gradientStyle = "from-amber-500/20 to-orange-600/20";
    accentColor = "amber";
  }

  // Credits calculations (free plan only)
  const INITIAL_CREDITS = 50;
  const remainingCredits =
    profile?.subscription_plan === "pro"
      ? null
      : typeof profile?.credits === "number"
      ? profile.credits
      : 0;
  const usedCredits =
    profile?.subscription_plan === "pro"
      ? null
      : INITIAL_CREDITS - (remainingCredits ?? 0);

  // Navigation items (removed help tab)
  const navItems = [
    { id: "overview", label: "Overview", icon: <Home className="w-4 h-4" /> },
    { id: "usage", label: "Usage", icon: <LineChart className="w-4 h-4" /> },
    {
      id: "billing",
      label: "Billing",
      icon: <BillingIcon className="w-4 h-4" />,
    },
    {
      id: "security",
      label: "Security",
      icon: <ShieldAlert className="w-4 h-4" />,
    },
  ];

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  // Get subscription status color and text
  const getSubscriptionStatusInfo = () => {
    if (!subscriptionDetails) return { color: "gray", text: "Unknown" };

    const status = subscriptionDetails.status?.toLowerCase();
    const isExpired = subscriptionDetails.is_expired;

    if (isExpired) return { color: "red", text: "Expired" };
    if (status === "active") return { color: "green", text: "Active" };
    if (status === "canceled") return { color: "orange", text: "Canceled" };
    if (status === "past_due") return { color: "red", text: "Past Due" };
    if (status === "paused") return { color: "yellow", text: "Paused" };

    return { color: "gray", text: status || "Unknown" };
  };

  const statusInfo = getSubscriptionStatusInfo();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl p-0 h-[85vh] max-h-[700px] bg-[#101010]">
        <div className="flex h-full min-h-0">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0 border-r border-white/[0.08] flex flex-col bg-[#101010] backdrop-blur-sm">
            {/* User info */}
            <div className="p-6 border-b border-white/[0.08]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20">
                  <img
                    src={user.imageUrl}
                    alt={user.fullName || "User"}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="overflow-hidden">
                  <h3 className="text-sm font-medium text-white truncate">
                    {user.fullName || "User"}
                  </h3>
                  <p className="text-xs text-white/50 truncate">
                    {user.primaryEmailAddress?.emailAddress}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4">
              <ul className="space-y-1 px-2">
                {navItems.map((item) => (
                  <li key={item.id}>
                    <button
                      className={cn(
                        "flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm transition-colors",
                        activeTab === item.id
                          ? "bg-white/10 text-white"
                          : "text-white/60 hover:text-white hover:bg-white/5"
                      )}
                      onClick={() => setActiveTab(item.id)}
                    >
                      {item.icon}
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Sign Out Button */}
            <div className="p-4 border-t border-white/[0.08]">
              <Button
                variant="outline"
                onClick={handleSignOut}
                className="w-full border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0 overflow-y-auto relative bg-[#101010] custom-scrollbar">
            {/* Close button */}
            <DialogClose className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all">
              {/* <X className="w-4 h-4" /> */}
            </DialogClose>

            <div className="p-6 relative z-10">
              {/* Overview Tab */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-white">
                    Account Overview
                  </h2>

                  {/* Subscription Status Alert */}
                  {subscriptionDetails && (
                    <Alert
                      className={cn(
                        "border",
                        subscriptionDetails.is_expired
                          ? "border-red-500/30 bg-red-500/10"
                          : subscriptionDetails.status === "past_due"
                          ? "border-orange-500/30 bg-orange-500/10"
                          : "border-green-500/30 bg-green-500/10"
                      )}
                    >
                      <AlertTriangle
                        className={cn(
                          "h-4 w-4",
                          subscriptionDetails.is_expired
                            ? "text-red-400"
                            : subscriptionDetails.status === "past_due"
                            ? "text-orange-400"
                            : "text-green-400"
                        )}
                      />
                      <AlertDescription
                        className={cn(
                          subscriptionDetails.is_expired
                            ? "text-red-300"
                            : subscriptionDetails.status === "past_due"
                            ? "text-orange-300"
                            : "text-green-300"
                        )}
                      >
                        {subscriptionDetails.is_expired
                          ? "Your subscription has expired. Please update your payment method to continue using premium features."
                          : subscriptionDetails.status === "past_due"
                          ? "Your payment is past due. Please update your payment method to avoid service interruption."
                          : "Your subscription is active and up to date."}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Account Information */}
                  <Card className="bg-[#151515] border border-white/[0.08] shadow-lg backdrop-blur-sm overflow-hidden">
                    <CardHeader className="pb-3 relative z-10">
                      <CardTitle className="text-xl font-semibold flex items-center text-white">
                        <User className="w-5 h-5 mr-2 text-gray-400" />
                        Account Details
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="relative z-10 pt-0">
                      <div className="space-y-4">
                        <div className="p-3 rounded-lg bg-[#181818] border border-white/[0.08]">
                          <label className="text-xs text-white/40">
                            Full Name
                          </label>
                          <p className="text-white mt-1">
                            {user.fullName || "Not provided"}
                          </p>
                        </div>

                        <div className="p-3 rounded-lg bg-[#181818] border border-white/[0.08]">
                          <label className="text-xs text-white/40">Email</label>
                          <p className="text-white mt-1">
                            {user.primaryEmailAddress?.emailAddress}
                          </p>
                        </div>

                        <div className="p-3 rounded-lg bg-[#181818] border border-white/[0.08]">
                          <label className="text-xs text-white/40">
                            Member Since
                          </label>
                          <p className="text-white mt-1 flex items-center">
                            <Calendar className="w-4 h-4 mr-2 text-white/40" />
                            {new Date(user.createdAt).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="p-3 rounded-lg bg-[#181818] border border-white/[0.08]">
                          <label className="text-xs text-white/40">
                            Last Login
                          </label>
                          <p className="text-white mt-1 flex items-center">
                            <Clock className="w-4 h-4 mr-2 text-white/40" />
                            {new Date().toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Subscription Info */}
                  <Card className="bg-[#151515] border border-white/[0.08] shadow-lg backdrop-blur-sm overflow-hidden">
                    <CardHeader className="pb-3 relative z-10">
                      <CardTitle className="text-xl font-semibold flex items-center text-white">
                        <Crown
                          className={cn(
                            "w-5 h-5 mr-2",
                            isPro
                              ? "text-indigo-400"
                              : isTeam
                              ? "text-amber-400"
                              : "text-gray-400"
                          )}
                        />
                        Current Plan
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="relative z-10 pt-0">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-[#181818] border border-white/[0.08]">
                          <div>
                            <h3 className="font-medium text-white">
                              {(profile?.subscription_plan || "Free")
                                .charAt(0)
                                .toUpperCase() +
                                (profile?.subscription_plan || "Free").slice(
                                  1
                                )}{" "}
                              Plan
                            </h3>
                            <p className="text-sm text-white/50">
                              {profile?.subscription_plan === "Free"
                                ? "Limited features"
                                : "Full access to all features"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={cn(
                                "border",
                                statusInfo.color === "green"
                                  ? "border-green-500/30 text-green-400"
                                  : statusInfo.color === "red"
                                  ? "border-red-500/30 text-red-400"
                                  : statusInfo.color === "orange"
                                  ? "border-orange-500/30 text-orange-400"
                                  : statusInfo.color === "yellow"
                                  ? "border-yellow-500/30 text-yellow-400"
                                  : "border-gray-500/30 text-gray-400"
                              )}
                            >
                              {statusInfo.text}
                            </Badge>
                            <Button
                              onClick={() => navigate("/pricing")}
                              className="bg-[#2c2c2c] hover:bg-[#3a3a3a] text-white border-none"
                            >
                              {profile?.subscription_plan === "Free"
                                ? "Upgrade Plan"
                                : "Manage Plan"}
                            </Button>
                          </div>
                        </div>

                        {/* Subscription Actions */}
                        {subscriptionDetails &&
                          subscriptionDetails.paddle_subscription_id && (
                            <div className="flex gap-2">
                              <Button
                                onClick={() =>
                                  validateWithPaddle(
                                    subscriptionDetails.paddle_subscription_id!
                                  )
                                }
                                disabled={isValidating}
                                variant="outline"
                                size="sm"
                                className="border-white/20 bg-white/5 hover:bg-white/10 text-white"
                              >
                                {isValidating ? (
                                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <Zap className="w-4 h-4 mr-2" />
                                )}
                                {isValidating
                                  ? "Validating..."
                                  : "Refresh Status"}
                              </Button>

                              {subscriptionDetails.is_expired && (
                                <Button
                                  onClick={handleRetryBilling}
                                  disabled={isValidating}
                                  size="sm"
                                  className="bg-orange-600 hover:bg-orange-700 text-white"
                                >
                                  <AlertCircle className="w-4 h-4 mr-2" />
                                  Retry Payment
                                </Button>
                              )}

                              {subscriptionDetails.cancel_at_period_end ? (
                                <Button
                                  onClick={handleReactivateSubscription}
                                  disabled={isCanceling}
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  {isCanceling
                                    ? "Reactivating..."
                                    : "Reactivate"}
                                </Button>
                              ) : (
                                <Button
                                  onClick={handleCancelSubscription}
                                  disabled={isCanceling}
                                  variant="outline"
                                  size="sm"
                                  className="border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400"
                                >
                                  {isCanceling
                                    ? "Canceling..."
                                    : "Cancel Subscription"}
                                </Button>
                              )}
                            </div>
                          )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Usage Tab */}
              {activeTab === "usage" && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-white">
                    Usage Statistics
                  </h2>

                  <Card className="bg-[#151515] border border-white/[0.08] shadow-lg backdrop-blur-sm overflow-hidden">
                    <CardHeader className="pb-3 relative z-10">
                      <CardTitle className="text-xl font-semibold flex items-center text-white">
                        <Activity className="w-5 h-5 mr-2 text-gray-400" />
                        Credits Usage
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="relative z-10 pt-0">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <StatItem
                          icon={<CreditCard className="w-5 h-5" />}
                          value={
                            profile?.subscription_plan === "pro"
                              ? "Unlimited"
                              : profile?.credits?.toString() ?? "0"
                          }
                          label="Credits Remaining"
                          color="emerald"
                        />
                        <StatItem
                          icon={<MinusCircle className="w-5 h-5" />}
                          value={
                            profile?.subscription_plan === "pro"
                              ? "N/A"
                              : usedCredits?.toString() ?? "0"
                          }
                          label="Credits Used"
                          color="amber"
                        />
                      </div>

                      {profile?.subscription_plan !== "pro" && (
                        <div className="mt-4">
                          <div className="h-2 bg-[#202020] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{
                                width: `${
                                  ((remainingCredits ?? 0) / INITIAL_CREDITS) *
                                  100
                                }%`,
                              }}
                            />
                          </div>
                          <div className="flex justify-between mt-1 text-xs text-white/50">
                            <span>0</span>
                            <span>{INITIAL_CREDITS}</span>
                          </div>
                        </div>
                      )}

                      <div className="mt-6">
                        <Button
                          onClick={() => setActiveTab("billing")}
                          className="w-full bg-[#2c2c2c] hover:bg-[#3a3a3a] text-white"
                        >
                          {profile?.subscription_plan === "Free"
                            ? "Get More Credits"
                            : "Manage Subscription"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Billing Tab */}
              {activeTab === "billing" && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-white">
                    Billing & Payments
                  </h2>

                  <Card className="bg-[#151515] border border-white/[0.08] shadow-lg backdrop-blur-sm overflow-hidden">
                    <CardHeader className="pb-3 relative z-10">
                      <CardTitle className="text-xl font-semibold flex items-center text-white">
                        <BillingIcon className="w-5 h-5 mr-2 text-gray-400" />
                        Payment Method
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="relative z-10 pt-0">
                      {profile?.subscription_plan !== "Free" ? (
                        <div className="p-3 rounded-lg bg-[#181818] border border-white/[0.08]">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-md bg-[#202020] flex items-center justify-center">
                                <CreditCard className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <h3 className="text-sm font-medium text-white">
                                  Visa ending in 4242
                                </h3>
                                <p className="text-xs text-white/40">
                                  Expires 12/25
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-white/20 bg-white/5 hover:bg-white/10 text-white"
                            >
                              Update
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 rounded-lg bg-[#181818] border border-white/[0.08]">
                          <p className="text-white/60">
                            No payment method on file
                          </p>
                          <Button className="mt-3 bg-[#2c2c2c] hover:bg-[#3a3a3a] text-white">
                            Add Payment Method
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Subscription Details from Supabase */}
                  <Card className="bg-[#151515] border border-white/[0.08] shadow-lg backdrop-blur-sm overflow-hidden">
                    <CardHeader className="pb-3 relative z-10">
                      <CardTitle className="text-xl font-semibold flex items-center text-white">
                        <Crown className="w-5 h-5 mr-2 text-gray-400" />
                        Subscription Details
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="relative z-10 pt-0">
                      {isLoading ? (
                        <div className="p-6 text-center">
                          <p className="text-white/60">
                            Loading subscription details...
                          </p>
                        </div>
                      ) : profile?.subscription_plan !== "Free" ? (
                        <div className="space-y-4">
                          <div className="p-3 rounded-lg bg-[#181818] border border-white/[0.08] flex justify-between">
                            <div>
                              <label className="text-xs text-white/40">
                                Current Period Ends
                              </label>
                              <p className="text-white mt-1">
                                {formatDate(
                                  subscriptionDetails?.current_period_end
                                )}
                              </p>
                            </div>
                            <div className="text-right">
                              <label className="text-xs text-white/40">
                                Status
                              </label>
                              <p className="text-white mt-1">
                                {subscriptionDetails?.status || "Active"}
                              </p>
                            </div>
                          </div>

                          <div className="p-3 rounded-lg bg-[#181818] border border-white/[0.08] flex justify-between">
                            <div>
                              <label className="text-xs text-white/40">
                                Next Invoice Date
                              </label>
                              <p className="text-white mt-1">
                                {formatDate(
                                  subscriptionDetails?.next_invoice_date
                                )}
                              </p>
                            </div>
                            <div className="text-right">
                              <label className="text-xs text-white/40">
                                Auto-Renewal
                              </label>
                              <p className="text-white mt-1">
                                {subscriptionDetails?.cancel_at_period_end
                                  ? "Off"
                                  : "On"}
                              </p>
                            </div>
                          </div>

                          <div className="p-3 rounded-lg bg-[#181818] border border-white/[0.08]">
                            <label className="text-xs text-white/40">
                              Plan
                            </label>
                            <p className="text-white mt-1">
                              {subscriptionDetails?.plan ||
                                profile?.subscription_plan ||
                                "Pro Plan"}
                            </p>
                          </div>

                          {/* Expiry Warning */}
                          {subscriptionDetails?.is_expired && (
                            <Alert className="border-red-500/30 bg-red-500/10">
                              <AlertTriangle className="h-4 w-4 text-red-400" />
                              <AlertDescription className="text-red-300">
                                Your subscription expired on{" "}
                                {formatDate(
                                  subscriptionDetails.current_period_end
                                )}
                                . Please update your payment method to continue
                                using premium features.
                              </AlertDescription>
                            </Alert>
                          )}

                          {/* Days until expiry warning */}
                          {subscriptionDetails?.days_until_expiry !==
                            undefined &&
                            subscriptionDetails.days_until_expiry <= 7 &&
                            subscriptionDetails.days_until_expiry > 0 && (
                              <Alert className="border-orange-500/30 bg-orange-500/10">
                                <AlertTriangle className="h-4 w-4 text-orange-400" />
                                <AlertDescription className="text-orange-300">
                                  Your subscription will expire in{" "}
                                  {subscriptionDetails.days_until_expiry} days.
                                  Please ensure your payment method is up to
                                  date.
                                </AlertDescription>
                              </Alert>
                            )}

                          <div className="flex justify-end mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-white/20 bg-white/5 hover:bg-white/10 text-white mr-2"
                              onClick={handleCancelSubscription}
                              disabled={isCanceling}
                            >
                              {subscriptionDetails?.cancel_at_period_end
                                ? "Resume Subscription"
                                : isCanceling
                                ? "Canceling..."
                                : "Cancel Subscription"}
                            </Button>
                            <Button
                              size="sm"
                              className="bg-[#2c2c2c] hover:bg-[#3a3a3a] text-white"
                            >
                              Change Plan
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-6 text-center">
                          <p className="text-white/60 mb-4">
                            No subscription details found
                          </p>
                          <Button className="bg-[#2c2c2c] hover:bg-[#3a3a3a] text-white">
                            Upgrade to Pro
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-[#151515] border border-white/[0.08] shadow-lg backdrop-blur-sm overflow-hidden">
                    <CardHeader className="pb-3 relative z-10">
                      <CardTitle className="text-xl font-semibold flex items-center text-white">
                        <Activity className="w-5 h-5 mr-2 text-gray-400" />
                        Payment History
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="relative z-10 pt-0">
                      {profile?.subscription_plan !== "Free" ? (
                        <div className="space-y-4">
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b border-white/10">
                                  <th className="text-left py-2 text-xs font-medium text-white/50">
                                    Invoice
                                  </th>
                                  <th className="text-left py-2 text-xs font-medium text-white/50">
                                    Date
                                  </th>
                                  <th className="text-left py-2 text-xs font-medium text-white/50">
                                    Plan
                                  </th>
                                  <th className="text-left py-2 text-xs font-medium text-white/50">
                                    Amount
                                  </th>
                                  <th className="text-left py-2 text-xs font-medium text-white/50">
                                    Status
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {paymentHistory.length > 0 ? (
                                  paymentHistory.map((payment, idx) => (
                                    <tr
                                      key={payment.id || idx}
                                      className="border-b border-white/5"
                                    >
                                      <td className="py-3 text-sm text-white/80">
                                        {payment.invoice_number || payment.id}
                                      </td>
                                      <td className="py-3 text-sm text-white/80">
                                        {payment.created_at
                                          ? new Date(
                                              payment.created_at
                                            ).toLocaleDateString()
                                          : "N/A"}
                                      </td>
                                      <td className="py-3 text-sm text-white/80">
                                        {payment.plan_name ||
                                          payment.plan ||
                                          "-"}
                                      </td>
                                      <td className="py-3 text-sm text-white/80">
                                        {payment.amount
                                          ? `$${payment.amount}`
                                          : "-"}
                                      </td>
                                      <td className="py-3">
                                        <span
                                          className={`text-xs py-1 px-2 rounded-full ${
                                            payment.status === "paid"
                                              ? "bg-emerald-500/20 text-emerald-400"
                                              : "bg-orange-500/20 text-orange-400"
                                          }`}
                                        >
                                          {payment.status || "-"}
                                        </span>
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td
                                      colSpan={5}
                                      className="py-6 text-center text-white/60"
                                    >
                                      No payment history found
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : (
                        <div className="p-6 text-center">
                          <p className="text-white/60 mb-4">
                            No payment history found
                          </p>
                          <Button className="bg-[#2c2c2c] hover:bg-[#3a3a3a] text-white">
                            Upgrade to Pro
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === "security" && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-white">
                    Security Settings
                  </h2>

                  <Card className="bg-[#151515] border border-white/[0.08] shadow-lg backdrop-blur-sm overflow-hidden">
                    <CardHeader className="pb-3 relative z-10">
                      <CardTitle className="text-xl font-semibold flex items-center text-white">
                        <ShieldCheck className="w-5 h-5 mr-2 text-gray-400" />
                        Account Security
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="relative z-10 pt-0">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 rounded-lg bg-[#181818] border border-white/[0.08]">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#202020] flex items-center justify-center">
                              <Lock className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-white">
                                Two-Factor Authentication
                              </h3>
                              <p className="text-xs text-white/40">
                                Add an extra layer of security
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-white/20 bg-white/5 hover:bg-white/10 text-white"
                          >
                            Enable
                          </Button>
                        </div>

                        <div className="flex justify-between items-center p-3 rounded-lg bg-[#181818] border border-white/[0.08]">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#202020] flex items-center justify-center">
                              <Bell className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-white">
                                Login Notifications
                              </h3>
                              <p className="text-xs text-white/40">
                                Get notified of new logins
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-white/20 bg-white/5 hover:bg-white/10 text-white"
                          >
                            Configure
                          </Button>
                        </div>

                        <div className="flex justify-between items-center p-3 rounded-lg bg-[#181818] border border-white/[0.08]">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#202020] flex items-center justify-center">
                              <Mail className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-white">
                                Recovery Email
                              </h3>
                              <p className="text-xs text-white/40">
                                Set a backup email address
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-white/20 bg-white/5 hover:bg-white/10 text-white"
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface StatItemProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  color: "indigo" | "blue" | "violet" | "rose" | "amber" | "emerald";
}

const StatItem = ({ icon, value, label, color }: StatItemProps) => {
  const colorMap = {
    indigo: "from-[#202020] to-[#181818] border-white/10 text-white",
    blue: "from-[#202020] to-[#181818] border-white/10 text-white",
    violet: "from-[#202020] to-[#181818] border-white/10 text-white",
    rose: "from-[#202020] to-[#181818] border-white/10 text-white",
    amber: "from-[#202020] to-[#181818] border-white/10 text-white",
    emerald: "from-[#202020] to-[#181818] border-white/10 text-white",
  };

  return (
    <div
      className={cn(
        "p-4 rounded-xl bg-gradient-to-br border",
        "relative overflow-hidden",
        colorMap[color]
      )}
    >
      <div className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full bg-white/5" />
      <div className="flex flex-col items-center md:items-start">
        <div className="mb-2 text-gray-400">{icon}</div>
        <span className="text-2xl font-bold text-white">{value}</span>
        <span className="text-xs text-white/50 mt-1">{label}</span>
      </div>
    </div>
  );
};

// Add custom scrollbar styles to index.css:
// .custom-scrollbar::-webkit-scrollbar {
//   width: 8px;
// }
// .custom-scrollbar::-webkit-scrollbar-track {
//   background: #101010;
// }
// .custom-scrollbar::-webkit-scrollbar-thumb {
//   background: #333;
//   border-radius: 4px;
// }
// .custom-scrollbar::-webkit-scrollbar-thumb:hover {
//   background: #444;
// }

export default UserProfile;
