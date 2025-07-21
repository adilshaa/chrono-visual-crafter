import React, { createContext, useContext, useEffect, useState } from "react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { PaddleDebugger } from "@/utils/paddleDebugger";
import { initializePaddle, Paddle } from "@paddle/paddle-js";

interface SubscriptionState {
  status: string;
  plan: string;
  customerId?: string;
  subscriptionId?: string;
}

interface PaddleContextType {
  isLoaded: boolean;
  paddle: Paddle | null;
  subscription: SubscriptionState | null;
  openCheckout: (priceId: string, customData?: any) => void;
  refreshSubscriptionStatus: () => Promise<any>;
  cancelSubscription: () => Promise<boolean>;
  validateSubscription: () => Promise<boolean>;
  cancelSubscriptionAPI: (subscriptionId: string) => Promise<boolean>;
  onSubscriptionUpdate?: (subscriptionData: any) => void;
}

const PaddleContext = createContext<PaddleContextType | undefined>(undefined);

export const usePaddle = () => {
  const context = useContext(PaddleContext);
  if (!context) {
    throw new Error("usePaddle must be used within a PaddleProvider");
  }
  return context;
};

interface PaddleProviderProps {
  children: React.ReactNode;
  onSubscriptionUpdate?: (subscriptionData: any) => void;
}

const PaddleProvider: React.FC<PaddleProviderProps> = ({
  children,
  onSubscriptionUpdate,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [paddle, setPaddle] = useState<Paddle | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionState | null>(
    null
  );
  const { user, isSignedIn } = useSupabaseAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const loadPaddle = async () => {
      try {
        const paddleInstance = await initializePaddle({
          environment:
            (import.meta.env.VITE_PADDLE_ENVIRONMENT as
              | "sandbox"
              | "production") || "sandbox",
          token: import.meta.env.VITE_PADDLE_CLIENT_TOKEN || "",
        });

        if (paddleInstance) {
          setPaddle(paddleInstance);
          setIsLoaded(true);

          // Debug Paddle state in development
          if (process.env.NODE_ENV === "development") {
            setTimeout(() => {
              PaddleDebugger.logPaddleState();
            }, 1000);
          }

          logger.info("Paddle initialized successfully", {
            environment: import.meta.env.VITE_PADDLE_ENVIRONMENT || "sandbox",
          });
        } else {
          throw new Error("Failed to initialize Paddle instance");
        }
      } catch (error) {
        console.error("Failed to initialize Paddle SDK", error);
        logger.error("Paddle initialization failed", { error });
        toast({
          title: "Payment System Error",
          description:
            "Failed to load payment system. Please refresh the page.",
          variant: "destructive",
        });
      }
    };

    loadPaddle();
  }, [toast]);

  useEffect(() => {
    if (isSignedIn) {
      refreshSubscriptionStatus();
    } else {
      setSubscription(null);
    }
  }, [isSignedIn]);

  const refreshSubscriptionStatus = async () => {
    if (!user) return null;

    try {
      logger.info("Refreshing subscription status for user", {
        userId: user.id,
      });

      // First, get user subscription details from Supabase
      const { data: userSubscription, error: subscriptionError } =
        await supabase
          .from("user_subscriptions")
          .select("*, subscription_plans:plan_id(*)")
          .eq("user_id", user.id)
          .maybeSingle();

      if (subscriptionError) {
        logger.error("Error fetching user subscription", {
          error: subscriptionError,
          userId: user.id,
        });
      }

      // Then get profile data
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("subscription_status, subscription_plan, paddle_customer_id")
        .eq("user_id", user.id)
        .single();

      if (error) {
        logger.error("Error refreshing subscription status", {
          error,
          userId: user.id,
        });
        // Set a default free plan status on error
        const defaultSubscription = { status: "free", plan: "free" };
        setSubscription(defaultSubscription);
        if (onSubscriptionUpdate) {
          onSubscriptionUpdate(defaultSubscription);
        }
        return null;
      }

      const subscriptionData = {
        status: profile.subscription_status || "free",
        plan: profile.subscription_plan || "free",
        customerId: profile.paddle_customer_id,
        subscriptionId: userSubscription?.subscription_id,
      };

      setSubscription(subscriptionData);
      logger.info("Subscription status refreshed", {
        subscriptionData,
        userId: user.id,
      });

      if (onSubscriptionUpdate) {
        onSubscriptionUpdate(subscriptionData);
      }

      return subscriptionData;
    } catch (error) {
      logger.error("Error refreshing subscription status", {
        error,
        userId: user.id,
      });
      const defaultSubscription = { status: "free", plan: "free" };
      setSubscription(defaultSubscription);
      if (onSubscriptionUpdate) {
        onSubscriptionUpdate(defaultSubscription);
      }
      return null;
    }
  };

  const validateSubscription = async (): Promise<boolean> => {
    if (!user) return false;
    if (!isLoaded || !paddle) return false;

    try {
      // First check if we have a subscription
      if (!subscription?.subscriptionId || subscription.status !== "active") {
        logger.info("No active subscription to validate", { userId: user.id });
        return false;
      }

      // Get subscription details from Supabase
      const { data: userSubscription, error: subError } = await supabase
        .from("user_subscriptions")
        .select("current_period_end, subscription_id")
        .eq("user_id", user.id)
        .single();

      if (subError || !userSubscription) {
        logger.error("Error fetching subscription details", {
          error: subError,
          userId: user.id,
        });
        return false;
      }

      // Check if subscription has expired
      const currentPeriodEnd = new Date(userSubscription.current_period_end);
      const now = new Date();

      if (currentPeriodEnd < now) {
        logger.warn("Subscription period has ended", {
          userId: user.id,
          currentPeriodEnd,
          now,
        });

        // Attempt to refresh subscription data from Paddle
        // This is just a client-side check - the actual billing would be handled by Paddle
        toast({
          title: "Subscription Expired",
          description:
            "Your subscription period has ended. Please update your payment method.",
          variant: "destructive",
        });

        return false;
      }

      return true;
    } catch (error) {
      logger.error("Error validating subscription", { error, userId: user.id });
      return false;
    }
  };

  const cancelSubscription = async (): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to manage your subscription.",
        variant: "destructive",
      });
      return false;
    }

    if (!isLoaded || !paddle) {
      toast({
        title: "Payment System Not Ready",
        description: "Please wait for the payment system to load.",
        variant: "destructive",
      });
      return false;
    }

    if (!subscription?.subscriptionId) {
      toast({
        title: "No Active Subscription",
        description: "You don't have an active subscription to cancel.",
        variant: "destructive",
      });
      return false;
    }

    try {
      logger.info("Canceling subscription", {
        userId: user.id,
        subscriptionId: subscription.subscriptionId,
      });

      // Open Paddle's cancel flow
      paddle.Subscription?.cancelPreview?.({
        subscriptionId: subscription.subscriptionId,
        eventCallback: async (data: any) => {
          logger.info("Paddle cancel event received", {
            eventName: data.name,
            data,
          });

          if (data.name === "cancel.complete") {
            logger.info("Subscription cancellation completed");
            toast({
              title: "Subscription Canceled",
              description: "Your subscription has been canceled successfully.",
            });

            // Refresh subscription status after cancellation
            await refreshSubscriptionStatus();
            return true;
          }

          if (data.name === "cancel.error") {
            logger.error("Subscription cancellation error", { data });
            toast({
              title: "Cancellation Error",
              description:
                "There was an issue canceling your subscription. Please try again.",
              variant: "destructive",
            });
            return false;
          }
        },
      });

      return true;
    } catch (error) {
      logger.error("Error canceling subscription", { error, userId: user.id });
      toast({
        title: "Cancellation Error",
        description:
          "There was an issue canceling your subscription. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Direct API cancellation without UI
  const cancelSubscriptionAPI = async (
    subscriptionId: string
  ): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to manage your subscription.",
        variant: "destructive",
      });
      return false;
    }

    try {
      console.log("Canceling subscription via API", {
        userId: user.id,
        subscriptionId,
      });

      if (!isLoaded || !paddle) {
        toast({
          title: "Payment System Not Ready",
          description: "Please wait for the payment system to load.",
          variant: "destructive",
        });
        return false;
      }

      // Check if the modern Paddle API is available
      if (
        paddle.Subscription &&
        typeof paddle.Subscription.cancel === "function"
      ) {
        // Use the modern Paddle API
        return new Promise((resolve) => {
          paddle.Subscription?.cancel?.({
            subscriptionId: subscriptionId,
            effectiveFrom: "next_billing_period",
            eventCallback: async (data: any) => {
              console.log("Paddle cancel event received", {
                eventName: data.name,
                data,
              });

              if (
                data.name === "subscription.cancel.completed" ||
                data.name === "cancel.complete"
              ) {
                console.log("Subscription cancellation completed");
                toast({
                  title: "Subscription Canceled",
                  description:
                    "Your subscription has been canceled successfully. The page will reload to update your status.",
                });

                // Import and log cancellation in audit trail
                try {
                  const { SubscriptionAuditLogger } = await import(
                    "@/utils/subscriptionAudit"
                  );
                  await SubscriptionAuditLogger.logCancellation(
                    user.id,
                    subscriptionId,
                    "user_initiated",
                    subscription?.status || "active"
                  );
                } catch (auditError) {
                  console.warn("Failed to log cancellation audit:", auditError);
                }

                // Refresh subscription status after cancellation
                await refreshSubscriptionStatus();

                // Reload the page to ensure all components update with new subscription status
                setTimeout(() => {
                  window.location.reload();
                }, 1500);

                resolve(true);
              } else if (
                data.name === "subscription.cancel.error" ||
                data.name === "cancel.error"
              ) {
                console.error("Subscription cancellation error", { data });
                toast({
                  title: "Cancellation Error",
                  description:
                    data.error?.message ||
                    "There was an issue canceling your subscription. Please try again.",
                  variant: "destructive",
                });
                resolve(false);
              }
            },
          });
        });
      }

      // Fallback: Try the legacy cancelPreview method
      else if (
        paddle.Subscription &&
        typeof paddle.Subscription.cancelPreview === "function"
      ) {
        return new Promise((resolve) => {
          paddle.Subscription?.cancelPreview?.({
            subscriptionId: subscriptionId,
            effectiveFrom: "next_billing_period",
            eventCallback: async (data: any) => {
              console.log("Paddle cancelPreview event received", {
                eventName: data.name,
                data,
              });

              if (data.name === "cancel.complete") {
                console.log("Subscription cancellation completed");
                toast({
                  title: "Subscription Canceled",
                  description:
                    "Your subscription has been canceled successfully. The page will reload to update your status.",
                });

                // Import and log cancellation in audit trail
                try {
                  const { SubscriptionAuditLogger } = await import(
                    "@/utils/subscriptionAudit"
                  );
                  await SubscriptionAuditLogger.logCancellation(
                    user.id,
                    subscriptionId,
                    "user_initiated",
                    subscription?.status || "active"
                  );
                } catch (auditError) {
                  console.warn("Failed to log cancellation audit:", auditError);
                }

                // Refresh subscription status after cancellation
                await refreshSubscriptionStatus();

                // Reload the page to ensure all components update with new subscription status
                setTimeout(() => {
                  window.location.reload();
                }, 1500);

                resolve(true);
              } else if (data.name === "cancel.error") {
                console.error("Subscription cancellation error", { data });
                toast({
                  title: "Cancellation Error",
                  description:
                    data.error?.message ||
                    "There was an issue canceling your subscription. Please try again.",
                  variant: "destructive",
                });
                resolve(false);
              }
            },
          });
        });
      }

      // If neither method is available, use our Supabase Edge Function
      else {
        console.warn(
          "Paddle client-side cancellation methods not available, using server-side approach via Edge Function"
        );

        try {
          // Import the API function
          const { cancelSubscription } = await import("@/api/subscriptions");

          // Call the Edge Function
          const result = await cancelSubscription({
            subscriptionId,
            userId: user.id,
            reason: "user_initiated",
          });

          if (!result.success) {
            // Check if the error indicates the subscription is already cancelled
            const errorMessage = result.error?.message || result.message || "";
            if (
              errorMessage.includes("subscription_update_when_canceled") ||
              errorMessage.includes("subscription is canceled") ||
              errorMessage.includes("already cancelled")
            ) {
              console.log(
                "Subscription was already cancelled, treating as success"
              );
              toast({
                title: "Subscription Already Canceled",
                description:
                  "Your subscription was already canceled. The page will reload to update your status.",
              });

              // Refresh subscription status after cancellation
              await refreshSubscriptionStatus();

              // Reload the page to ensure all components update with new subscription status
              setTimeout(() => {
                window.location.reload();
              }, 1500);

              return true;
            }

            console.error("Edge function cancellation failed", result.error);
            toast({
              title: "Cancellation Error",
              description:
                result.message ||
                "There was an issue canceling your subscription. Please try again.",
              variant: "destructive",
            });
            return false;
          }

          console.log("Edge function cancellation successful");
          toast({
            title: "Subscription Canceled",
            description:
              "Your subscription has been canceled successfully. The page will reload to update your status.",
          });

          // Refresh subscription status after cancellation
          await refreshSubscriptionStatus();

          // Reload the page to ensure all components update with new subscription status
          setTimeout(() => {
            window.location.reload();
          }, 1500);

          return true;
        } catch (error) {
          console.error("Error with Edge function cancellation", error);
          toast({
            title: "Cancellation Error",
            description:
              "There was an issue connecting to our servers. Please try again.",
            variant: "destructive",
          });
          return false;
        }
      }
    } catch (error) {
      console.error("Error canceling subscription via API", {
        error,
        userId: user.id,
      });
      toast({
        title: "Cancellation Error",
        description:
          "There was an issue canceling your subscription. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const openCheckout = (priceId: string, customData?: any) => {
    console.log("Opening Paddle checkout with:", { priceId, customData });

    // Enhanced error handling and validation
    if (!isLoaded || !paddle) {
      console.error("Paddle not loaded:", {
        isLoaded,
        hasPaddle: !!paddle,
      });
      toast({
        title: "Payment System Not Ready",
        description:
          "Please wait for the payment system to load and try again.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      console.error("No user found when trying to open checkout");
      toast({
        title: "Authentication Required",
        description: "Please sign in to continue with payment.",
        variant: "destructive",
      });
      return;
    }

    console.log("Proceeding with checkout, user:", {
      userId: user.id,
      email: user.primaryEmailAddress?.emailAddress,
    });

    // Navigate to the inline checkout page instead of opening overlay
    const checkoutUrl = new URL("/checkout", window.location.origin);
    checkoutUrl.searchParams.set("priceId", priceId);

    // Add custom data as URL parameters
    if (customData?.planName) {
      checkoutUrl.searchParams.set("plan", customData.planName);
    }
    if (customData?.planPrice) {
      checkoutUrl.searchParams.set("price", customData.planPrice);
    }

    // Navigate to checkout page
    navigate(checkoutUrl.pathname + checkoutUrl.search);
  };

  return (
    <PaddleContext.Provider
      value={{
        isLoaded,
        paddle,
        subscription,
        openCheckout,
        refreshSubscriptionStatus,
        cancelSubscription,
        validateSubscription,
        cancelSubscriptionAPI,
        onSubscriptionUpdate,
      }}
    >
      {children}
    </PaddleContext.Provider>
  );
};

export default PaddleProvider;
