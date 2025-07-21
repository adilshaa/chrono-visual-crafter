import React from "react";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  User as UserIcon,
  Crown,
  Calendar,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

interface OverviewTabProps {
  user: User;
  profile: any;
  subscriptionDetails: SubscriptionDetails | null;
  onNavigate: (path: string) => void;
  onCancelSubscription: () => void;
  onReactivateSubscription: () => void;
  isCanceling: boolean;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  user,
  profile,
  subscriptionDetails,
  onNavigate,
  onCancelSubscription,
  onReactivateSubscription,
  isCanceling,
}) => {
  // Determine subscription tier for styling
  const isPro = (profile?.subscription_plan || "")
    .toLowerCase()
    .includes("pro");
  const isTeam = (profile?.subscription_plan || "")
    .toLowerCase()
    .includes("team");

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
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white">Account Overview</h2>

      {/* Subscription Status Alert */}
      {subscriptionDetails &&
        subscriptionDetails.status &&
        subscriptionDetails.status !== "unknown" && (
          <Alert
            className={cn(
              "border",
              subscriptionDetails.is_expired
                ? "border-red-500/30 bg-red-500/10"
                : subscriptionDetails.status === "past_due"
                ? "border-orange-500/30 bg-orange-500/10"
                : subscriptionDetails.status === "active"
                ? "border-green-500/30 bg-green-500/10"
                : "border-gray-500/30 bg-gray-500/10"
            )}
          >
            <AlertTriangle
              className={cn(
                "h-4 w-4",
                subscriptionDetails.is_expired
                  ? "text-red-400"
                  : subscriptionDetails.status === "past_due"
                  ? "text-orange-400"
                  : subscriptionDetails.status === "active"
                  ? "text-green-400"
                  : "text-gray-400"
              )}
            />
            <AlertDescription
              className={cn(
                subscriptionDetails.is_expired
                  ? "text-red-300"
                  : subscriptionDetails.status === "past_due"
                  ? "text-orange-300"
                  : subscriptionDetails.status === "active"
                  ? "text-green-300"
                  : "text-gray-300"
              )}
            >
              {subscriptionDetails.is_expired
                ? "Your subscription has expired. Please update your payment method to continue using premium features."
                : subscriptionDetails.status === "past_due"
                ? "Your payment is past due. Please update your payment method to avoid service interruption."
                : subscriptionDetails.status === "active"
                ? "Your subscription is active and up to date."
                : `Subscription status: ${subscriptionDetails.status}`}
            </AlertDescription>
          </Alert>
        )}

      {/* Account Information */}
      <Card className="bg-[#151515] border border-white/[0.08] shadow-lg backdrop-blur-sm overflow-hidden">
        <CardHeader className="pb-3 relative z-10">
          <CardTitle className="text-xl font-semibold flex items-center text-white">
            <UserIcon className="w-5 h-5 mr-2 text-gray-400" />
            Account Details
          </CardTitle>
        </CardHeader>

        <CardContent className="relative z-10 pt-0">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-[#181818] border border-white/[0.08]">
                <label className="text-xs text-white/40">Full Name</label>
                <p className="text-white mt-1">
                  {profile?.full_name ||
                    user.user_metadata?.full_name ||
                    "Not provided"}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#181818] border border-white/[0.08]">
                <label className="text-xs text-white/40">Email</label>
                <p className="text-white mt-1 text-sm break-all">
                  {profile?.email || user.email}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#181818] border border-white/[0.08]">
                <label className="text-xs text-white/40">Member Since</label>
                <p className="text-white mt-1 flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-white/40" />
                  {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#181818] border border-white/[0.08]">
                <label className="text-xs text-white/40">Last Login</label>
                <p className="text-white mt-1 flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-white/40" />
                  {new Date().toLocaleDateString()}
                </p>
              </div>
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-[#181818] border border-white/[0.08] gap-3">
              <div>
                <h3 className="font-medium text-white">
                  {(profile?.subscription_plan || "Free")
                    .charAt(0)
                    .toUpperCase() +
                    (profile?.subscription_plan || "Free").slice(1)}{" "}
                  Plan
                </h3>
                <p className="text-sm text-white/50">
                  {profile?.subscription_plan.toLocaleLowerCase() === "free"
                    ? "Limited features"
                    : "Full access to all features"}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
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
                {profile?.subscription_plan.toLocaleLowerCase() === "free" && (
                  <Button
                    onClick={() => onNavigate("/pricing")}
                    className="bg-[#2BA6FF]/60 hover:bg-[#2BA6FF]/80 text-white border-none w-full sm:w-auto"
                    size="sm"
                  >
                    Upgrade Plan
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
