import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useClerkAuth } from "@/hooks/useClerkAuth";
import { usePaddle } from "@/components/payments/PaddleProvider";
import { CancellationModal } from "./CancellationModal";
import { GracePeriodCountdown } from "./GracePeriodCountdown";
import { ReactivationModal } from "./ReactivationModal";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  CreditCard,
  RefreshCw,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SubscriptionData {
  id: string;
  plan_name: string;
  status: 'active' | 'cancelling' | 'cancelled' | 'past_due';
  current_period_start: string;
  current_period_end: string;
  cancelled_at?: string;
  grace_period_ends?: string;
  cancellation_reason?: string;
  paddle_subscription_id: string;
}

export const SubscriptionManager: React.FC = () => {
  const { user, profile, refreshProfile } = useClerkAuth();
  const { subscription, refreshSubscriptionStatus } = usePaddle();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [showReactivationModal, setShowReactivationModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!user?.id) return;

    // In a real implementation, you'd connect to your WebSocket server
    // For now, we'll simulate with periodic polling
    const interval = setInterval(async () => {
      await refreshSubscriptionStatus();
      await refreshProfile();
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, [user?.id, refreshSubscriptionStatus, refreshProfile]);

  // Load subscription data
  useEffect(() => {
    if (subscription && profile) {
      setSubscriptionData({
        id: subscription.subscriptionId || '',
        plan_name: subscription.plan || 'Unknown',
        status: subscription.status as any || 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        paddle_subscription_id: subscription.subscriptionId || '',
      });
    }
  }, [subscription, profile]);

  const handleCancellationComplete = async () => {
    setIsLoading(true);
    try {
      await refreshSubscriptionStatus();
      await refreshProfile();
      
      toast({
        title: "Subscription Updated",
        description: "Your subscription status has been updated.",
      });
    } catch (error) {
      console.error('Error refreshing subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReactivation = async () => {
    if (!subscriptionData?.paddle_subscription_id) return;

    setIsLoading(true);
    try {
      // Use Paddle's reactivation API
      if (window.Paddle) {
        window.Paddle.Subscription.update({
          subscriptionId: subscriptionData.paddle_subscription_id,
          proration_billing_mode: 'prorated_immediately',
          eventCallback: (data: any) => {
            if (data.name === 'subscription.update.completed') {
              toast({
                title: "Subscription Reactivated",
                description: "Your subscription has been reactivated successfully.",
              });
              handleCancellationComplete();
              setShowReactivationModal(false);
            } else if (data.name === 'subscription.update.error') {
              toast({
                title: "Reactivation Failed",
                description: "Unable to reactivate subscription. Please contact support.",
                variant: "destructive",
              });
            }
          }
        });
      }
    } catch (error) {
      console.error('Reactivation error:', error);
      toast({
        title: "Reactivation Failed",
        description: "Unable to reactivate subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </Badge>
        );
      case 'cancelling':
        return (
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
            <Clock className="w-3 h-3 mr-1" />
            Cancelling
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Cancelled
          </Badge>
        );
      case 'past_due':
        return (
          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Past Due
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">
            Unknown
          </Badge>
        );
    }
  };

  const isInGracePeriod = subscriptionData?.status === 'cancelling' && 
    subscriptionData?.grace_period_ends && 
    new Date(subscriptionData.grace_period_ends) > new Date();

  if (!subscriptionData) {
    return (
      <Card className="bg-white/[0.03] border border-white/[0.08]">
        <CardContent className="p-6 text-center">
          <p className="text-white/60">No active subscription found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Subscription Card */}
      <Card className="bg-white/[0.03] border border-white/[0.08]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Subscription Management
            </CardTitle>
            {getStatusBadge(subscriptionData.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Subscription Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-white/60">Current Plan</p>
              <p className="text-white font-medium capitalize">{subscriptionData.plan_name}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-white/60">Next Billing Date</p>
              <p className="text-white font-medium">
                {new Date(subscriptionData.current_period_end).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Grace Period Warning */}
          {isInGracePeriod && subscriptionData.grace_period_ends && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-amber-200 font-medium mb-2">Subscription Cancelling</h3>
                  <p className="text-amber-200/80 text-sm mb-3">
                    Your subscription is scheduled for cancellation. You can still reactivate it before the grace period ends.
                  </p>
                  <GracePeriodCountdown endDate={subscriptionData.grace_period_ends} />
                  {subscriptionData.cancellation_reason && (
                    <p className="text-amber-200/60 text-xs mt-2">
                      Reason: {subscriptionData.cancellation_reason}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Cancelled Status */}
          {subscriptionData.status === 'cancelled' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/30 rounded-lg p-4"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-red-200 font-medium mb-1">Subscription Cancelled</h3>
                  <p className="text-red-200/80 text-sm">
                    Your subscription has been cancelled. You no longer have access to premium features.
                  </p>
                  {subscriptionData.cancelled_at && (
                    <p className="text-red-200/60 text-xs mt-1">
                      Cancelled on: {new Date(subscriptionData.cancelled_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-white/[0.08]">
            {subscriptionData.status === 'active' && (
              <Button
                onClick={() => setShowCancellationModal(true)}
                variant="outline"
                className="border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400"
              >
                Cancel Subscription
              </Button>
            )}

            {isInGracePeriod && (
              <Button
                onClick={() => setShowReactivationModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Shield className="w-4 h-4 mr-2" />
                )}
                Reactivate Subscription
              </Button>
            )}

            <Button
              onClick={handleCancellationComplete}
              variant="outline"
              disabled={isLoading}
              className="border-white/20 bg-white/5 hover:bg-white/10 text-white"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Refresh Status
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <CancellationModal
        open={showCancellationModal}
        onOpenChange={setShowCancellationModal}
        subscription={subscriptionData}
        onCancellationComplete={handleCancellationComplete}
      />

      <ReactivationModal
        open={showReactivationModal}
        onOpenChange={setShowReactivationModal}
        subscription={subscriptionData}
        onReactivation={handleReactivation}
      />
    </div>
  );
};