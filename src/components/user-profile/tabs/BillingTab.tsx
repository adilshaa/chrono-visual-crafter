import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CreditCard,
  Crown,
  Activity,
  AlertTriangle,
  Download,
  Settings,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";
import { useNavigate } from "react-router-dom";

type PaymentHistoryItem = Tables<"payment_history">;

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

interface BillingTabProps {
  profile: any;
  subscriptionDetails: SubscriptionDetails | null;
  isLoading: boolean;
  onCancelSubscription: () => void;
  isCanceling: boolean;
  userId: string;
}

export const BillingTab: React.FC<BillingTabProps> = ({
  profile,
  subscriptionDetails,
  isLoading,
  onCancelSubscription,
  isCanceling,
  userId,
}) => {
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryItem[]>(
    []
  );
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const { toast } = useToast();

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const navigate = useNavigate();
  const handelOnNavigate = (path: string) => {
    navigate(path);
  };
  // Fetch payment history from the payment_history table
  useEffect(() => {
    const fetchPaymentHistory = async () => {
      if (!userId) {
        console.log("No userId provided");
        return;
      }

      console.log("Fetching payment history for userId:", userId);
      setIsLoadingHistory(true);

      try {
        console.log("Fetching payment history for userId:", userId);
        const { data: payment_history, error } = await supabase
          .from("payment_history")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(10);

        console.log("Payment history query result:", {
          payment_history,
          error,
          userId,
          queryLength: payment_history?.length,
        });

        if (error) {
          console.error("Error fetching payment history:", error);

          // Check if it's an RLS policy error
          if (
            error.message?.includes("RLS") ||
            error.message?.includes("policy")
          ) {
            toast({
              title: "Access Error",
              description:
                "Unable to access payment history. RLS policy may need adjustment.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Error",
              description: `Failed to load payment history: ${error.message}`,
              variant: "destructive",
            });
          }
        } else {
          console.log("Setting payment history:", payment_history);
          setPaymentHistory(payment_history || []);
        }
      } catch (error) {
        console.error("Error fetching payment history:", error);
        toast({
          title: "Error",
          description: "Failed to load payment history.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchPaymentHistory();
  }, [userId, toast]);

  // Handle customer portal redirect
  const handleManageBilling = async () => {
    if (!subscriptionDetails?.paddle_subscription_id) {
      toast({
        title: "Error",
        description: "No subscription found to manage.",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingPortal(true);

    try {
      // Get customer ID from profiles table
      const { data: userProfile, error: profileError } = await supabase
        .from("profiles")
        .select("paddle_customer_id")
        .eq("user_id", userId)
        .single();

      if (profileError || !userProfile?.paddle_customer_id) {
        console.error("Error fetching customer ID:", profileError);
        toast({
          title: "Error",
          description: "Unable to find customer information.",
          variant: "destructive",
        });
        return;
      }

      // Call Supabase Edge Function to get customer portal URL
      const { data, error } = await supabase.functions.invoke(
        "get-customer-portal",
        {
          body: {
            userId,
            subscriptionId: subscriptionDetails.paddle_subscription_id,
            customerId: userProfile.paddle_customer_id,
          },
        }
      );

      if (error) {
        console.error("Error invoking get-customer-portal function:", error);
        throw error;
      }

      if (data.success) {
        console.log(data, "customer urls");

        // Redirect to customer portal
        window.open(
          data.portal_url[0].update_subscription_payment_method,
          "_blank"
        );
      } else {
        throw new Error("No portal URL received");
      }
    } catch (error) {
      console.error("Error opening customer portal:", error);
      toast({
        title: "Portal Access Failed",
        description: "Unable to open billing portal. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPortal(false);
    }
  };

  // Download invoice from Paddle
  const handleDownloadInvoice = async (payment: PaymentHistoryItem) => {
    const transactionId = payment.transaction_id;

    if (!transactionId) {
      toast({
        title: "Error",
        description: "Transaction ID not available for this payment.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Verify that the payment belongs to the authenticated user
      const { data: verifiedPayment, error: paymentError } = await supabase
        .from("payment_history")
        .select("*")
        .eq("id", payment.id)
        .eq("user_id", userId)
        .single();

      if (paymentError || !verifiedPayment) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to download this invoice.",
          variant: "destructive",
        });
        return;
      }

      // Call Supabase Edge Function to get invoice download URL
      const { data, error } = await supabase.functions.invoke(
        "download-paddle-invoice",
        {
          body: {
            transactionId: transactionId,
            paymentId: payment.id,
          },
        }
      );

      if (error) {
        throw error;
      }

      if (data.downloadUrl) {
        // Open the download URL in a new tab
        window.open(data.downloadUrl, "_blank");
      } else {
        throw new Error("No download URL received");
      }
    } catch (error) {
      console.error("Error downloading invoice:", error);
      toast({
        title: "Download Failed",
        description: "Unable to download invoice. Please try again later.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white">Billing & Payments</h2>

      <Card className="bg-[#151515] border border-white/[0.08] shadow-lg backdrop-blur-sm overflow-hidden">
        <CardHeader className="pb-3 relative z-10">
          <CardTitle className="text-xl font-semibold flex items-center text-white">
            <CreditCard className="w-5 h-5 mr-2 text-gray-400" />
            Payment Method
          </CardTitle>
        </CardHeader>

        <CardContent className="relative z-10 pt-0">
          {profile?.subscription_plan !== "free" &&
          profile?.subscription_plan !== "Free" ? (
            <div className="p-3 rounded-lg bg-[#181818] border border-white/[0.08]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md bg-[#202020] flex items-center justify-center">
                    <Settings className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white">
                      Billing Management
                    </h3>
                    <p className="text-xs text-white/40">
                      Manage your payment methods and billing details
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManageBilling}
                  disabled={isLoadingPortal}
                  className="border-[#2BA6FF]/30 bg-[#2BA6FF]/10 hover:bg-[#2BA6FF]/20 text-[#2BA6FF] w-full sm:w-auto"
                >
                  {isLoadingPortal ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Settings className="w-4 h-4 mr-2" />
                      Manage Billing
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-[#181818] border border-white/[0.08]">
              <p className="text-white/60 mb-3">No payment method on file</p>
              <Button
                className="w-full sm:w-auto bg-[#2BA6FF]/60 hover:bg-[#2BA6FF]/80 text-white"
                onClick={() => handelOnNavigate("/pricing")}
              >
                Add Payment Method
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscription Details */}
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
              <p className="text-white/60">Loading subscription details...</p>
            </div>
          ) : profile?.subscription_plan !== "Free" ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-[#181818] border border-white/[0.08]">
                  <label className="text-xs text-white/40">
                    Current Period Ends
                  </label>
                  <p className="text-white mt-1">
                    {formatDate(subscriptionDetails?.current_period_end)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-[#181818] border border-white/[0.08]">
                  <label className="text-xs text-white/40">Status</label>
                  <p className="text-white mt-1">
                    {subscriptionDetails?.status || "Active"}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-[#181818] border border-white/[0.08]">
                  <label className="text-xs text-white/40">
                    Next Invoice Date
                  </label>
                  <p className="text-white mt-1">
                    {formatDate(subscriptionDetails?.next_invoice_date)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-[#181818] border border-white/[0.08]">
                  <label className="text-xs text-white/40">Auto-Renewal</label>
                  <p className="text-white mt-1">
                    {subscriptionDetails?.cancel_at_period_end ? "Off" : "On"}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#181818] border border-white/[0.08]">
                <label className="text-xs text-white/40">Plan</label>
                <p className="text-white mt-1">
                  {profile?.subscription_plan ||
                    profile?.subscription_plan ||
                    "-"}
                </p>
              </div>

              {/* Expiry Warning */}
              {subscriptionDetails?.is_expired && (
                <Alert className="border-red-500/30 bg-red-500/10">
                  <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0" />
                  <AlertDescription className="text-red-300 text-sm break-words">
                    Your subscription expired on{" "}
                    {formatDate(subscriptionDetails.current_period_end)}. Please
                    update your payment method to continue using premium
                    features.
                  </AlertDescription>
                </Alert>
              )}

              {/* Days until expiry warning */}
              {subscriptionDetails?.days_until_expiry !== undefined &&
                subscriptionDetails.days_until_expiry <= 7 &&
                subscriptionDetails.days_until_expiry > 0 && (
                  <Alert className="border-orange-500/30 bg-orange-500/10">
                    <AlertTriangle className="h-4 w-4 text-orange-400 flex-shrink-0" />
                    <AlertDescription className="text-orange-300 text-sm break-words">
                      Your subscription will expire in{" "}
                      {subscriptionDetails.days_until_expiry} days. Please
                      ensure your payment method is up to date.
                    </AlertDescription>
                  </Alert>
                )}

              <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
                {/* Only show cancel subscription button for paid users */}
                {profile?.subscription_plan !== "free" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 w-full sm:w-auto text-sm"
                    onClick={onCancelSubscription}
                    disabled={isCanceling}
                  >
                    <span className="truncate">
                      {subscriptionDetails?.cancel_at_period_end
                        ? "Resume Subscription"
                        : isCanceling
                        ? "Canceling..."
                        : "Cancel Subscription"}
                    </span>
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="p-6 text-center">
              <p className="text-white/60 mb-4">
                No subscription details found
              </p>
              <Button className="bg-[#2BA6FF]/60 hover:bg-[#2BA6FF]/80 text-white w-full sm:w-auto">
                Upgrade to Pro
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card className="bg-[#151515] border border-white/[0.08] shadow-lg backdrop-blur-sm overflow-hidden">
        <CardHeader className="pb-3 relative z-10">
          <CardTitle className="text-xl font-semibold flex items-center text-white">
            <Activity className="w-5 h-5 mr-2 text-gray-400" />
            Payment History
          </CardTitle>
        </CardHeader>

        <CardContent className="relative z-10 pt-0">
          {isLoadingHistory ? (
            <div className="p-6 text-center">
              <p className="text-white/60">Loading payment history...</p>
            </div>
          ) : paymentHistory.length > 0 ? (
            <div className="space-y-4">
              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto -mx-4 px-4">
                <div className="min-w-[600px]">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-2 px-1 text-xs font-medium text-white/50 w-[100px]">
                          Invoice
                        </th>
                        <th className="text-left py-2 px-1 text-xs font-medium text-white/50 w-[90px]">
                          Date
                        </th>
                        <th className="text-left py-2 px-1 text-xs font-medium text-white/50 w-[80px]">
                          Plan
                        </th>
                        <th className="text-left py-2 px-1 text-xs font-medium text-white/50 w-[80px]">
                          Amount
                        </th>
                        <th className="text-left py-2 px-1 text-xs font-medium text-white/50 w-[80px]">
                          Status
                        </th>
                        <th className="text-left py-2 px-1 text-xs font-medium text-white/50 w-[80px]">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentHistory.map((payment) => (
                        <tr
                          key={payment.id}
                          className="border-b border-white/5"
                        >
                          <td className="py-2 px-1 text-xs text-white/80">
                            <div className="truncate max-w-[90px]">
                              {payment.transaction_id || payment.id.slice(0, 8)}
                            </div>
                          </td>
                          <td className="py-2 px-1 text-xs text-white/80">
                            <div className="truncate">
                              {formatDate(payment.created_at)}
                            </div>
                          </td>
                          <td className="py-2 px-1 text-xs text-white/80">
                            <div className="truncate">
                              {payment.plan_name || "-"}
                            </div>
                          </td>
                          <td className="py-2 px-1 text-xs text-white/80">
                            <div className="truncate">
                              {payment.amount
                                ? `${payment.amount} ${
                                    payment.currency || "USD"
                                  }`
                                : "-"}
                            </div>
                          </td>
                          <td className="py-2 px-1">
                            <span
                              className={`text-xs py-1 px-1.5 rounded-full whitespace-nowrap ${
                                payment.status === "paid"
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : "bg-orange-500/20 text-orange-400"
                              }`}
                            >
                              {payment.status}
                            </span>
                          </td>
                          <td className="py-2 px-1">
                            {payment.transaction_id && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDownloadInvoice(payment)}
                                className="h-6 px-2 text-xs text-[#2BA6FF] hover:text-[#2BA6FF] hover:bg-[#2BA6FF]/10"
                              >
                                <Download className="w-3 h-3" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="block sm:hidden space-y-3">
                {paymentHistory.map((payment) => (
                  <div
                    key={payment.id}
                    className="p-3 rounded-lg bg-[#181818] border border-white/[0.08]"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-xs font-medium text-white/80 truncate max-w-[150px]">
                        {payment.transaction_id || payment.id.slice(0, 8)}
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs py-1 px-2 rounded-full ${
                            payment.status === "paid"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-orange-500/20 text-orange-400"
                          }`}
                        >
                          {payment.status}
                        </span>
                        {payment.transaction_id && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDownloadInvoice(payment)}
                            className="h-6 w-6 p-0 text-[#2BA6FF] hover:text-[#2BA6FF] hover:bg-[#2BA6FF]/10"
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-white/50">Date:</span>
                        <div className="text-white/80">
                          {formatDate(payment.created_at)}
                        </div>
                      </div>
                      <div>
                        <span className="text-white/50">Amount:</span>
                        <div className="text-white/80">
                          {payment.amount
                            ? `${payment.amount} ${payment.currency || "USD"}`
                            : "-"}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <span className="text-white/50">Plan:</span>
                        <div className="text-white/80 truncate">
                          {payment.plan_name || "-"}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-6 text-center">
              <p className="text-white/60 mb-4">No payment history found</p>
              <Button className="bg-[#2BA6FF]/60 hover:bg-[#2BA6FF]/80 text-white w-full sm:w-auto">
                Upgrade to Pro
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
