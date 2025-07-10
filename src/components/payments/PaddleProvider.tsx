import React, { createContext, useContext, useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

declare global {
  interface Window {
    Paddle: any;
  }
}

interface SubscriptionState {
  status: string;
  plan: string;
  customerId?: string;
  subscriptionId?: string;
}

interface PaddleContextType {
  isLoaded: boolean;
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
  const [subscription, setSubscription] = useState<SubscriptionState | null>(
    null
  );
  const { user, isSignedIn } = useUser();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const loadPaddle = () => {
      if (window.Paddle) {
        setIsLoaded(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
      script.async = true;
      script.onload = () => {
        if (window.Paddle) {
          window.Paddle.Environment.set(
            import.meta.env.VITE_PADDLE_ENVIRONMENT || "sandbox"
          );
          window.Paddle.Setup({
            token: import.meta.env.VITE_PADDLE_CLIENT_TOKEN,
          });
          setIsLoaded(true);
        }
      };
      script.onerror = () => {
        console.error("Failed to load Paddle SDK");
        toast({
          title: "Payment System Error",
          description:
            "Failed to load payment system. Please refresh the page.",
          variant: "destructive",
        });
      };
      document.head.appendChild(script);
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
    if (!isLoaded || !window.Paddle) return false;

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

    if (!isLoaded || !window.Paddle) {
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
      window.Paddle.Subscription.cancelPreview({
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

      // IMPORTANT: Direct API calls to Paddle from the browser will fail due to:
      // 1. CORS restrictions - Paddle doesn't allow browser-based API calls
      // 2. API keys should never be exposed in client-side code
      // 3. OPTIONS preflight requests are not supported by Paddle API

      // Instead, we should use Paddle's client-side SDK or create a server-side proxy

      // For now, we'll use the client-side SDK approach:
      if (!isLoaded || !window.Paddle) {
        toast({
          title: "Payment System Not Ready",
          description: "Please wait for the payment system to load.",
          variant: "destructive",
        });
        return false;
      }

      // Use Paddle's cancelPreview method instead of direct API call
      window.Paddle.Subscription.cancelPreview({
        subscriptionId: subscriptionId,
        eventCallback: async (data: any) => {
          console.log("Paddle cancel event received", {
            eventName: data.name,
            data,
          });

          if (data.name === "cancel.complete") {
            console.log("Subscription cancellation completed");
            toast({
              title: "Subscription Canceled",
              description: "Your subscription has been canceled successfully.",
            });

            // Refresh subscription status after cancellation
            await refreshSubscriptionStatus();
            return true;
          }

          if (data.name === "cancel.error") {
            console.error("Subscription cancellation error", { data });
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

      /* 
      // PROPER SOLUTION: Create a server-side proxy endpoint
      // This would be implemented in your backend API:
      
      const response = await fetch(
        `/api/subscriptions/${subscriptionId}/cancel`, // Your server endpoint
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ effective_from: "immediately" }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Subscription cancellation API error", { 
          status: response.status, 
          statusText: response.statusText,
          errorData 
        });
        
        toast({
          title: "Cancellation Error",
          description: "There was an issue canceling your subscription. Please try again.",
          variant: "destructive",
        });
        return false;
      }

      console.log("Subscription cancellation API success");
      toast({
        title: "Subscription Canceled",
        description: "Your subscription has been canceled successfully.",
      });

      // Refresh subscription status after cancellation
      await refreshSubscriptionStatus();
      return true;
      */
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

    if (!isLoaded || !window.Paddle) {
      console.error("Paddle not loaded:", {
        isLoaded,
        hasPaddle: !!window.Paddle,
      });
      toast({
        title: "Payment System Not Ready",
        description: "Please wait for the payment system to load.",
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

    window.Paddle.Checkout.open({
      items: [{ priceId }],
      customer: {
        email: user.primaryEmailAddress?.emailAddress,
      },
      customData: {
        userId: user.id,
        email: user.primaryEmailAddress?.emailAddress,
        full_name: user.fullName,
        ...customData,
      },
      settings: {
        displayMode: "overlay",
        theme: "dark",
        locale: "en",
        successUrl: `${window.location.origin}/studio?payment=success`,
      },

      eventCallback: (data: any) => {
        logger.info("Paddle event received", { eventName: data.name, data });

        if (data.name === "checkout.completed") {
          logger.info("Payment completed, processing subscription update");
          toast({
            title: "Payment Successful!",
            description:
              "Your subscription has been activated. Redirecting to studio...",
          });

          // Wait a moment for webhook processing, then refresh and navigate
          setTimeout(async () => {
            const updatedSubscription = await refreshSubscriptionStatus();
            if (updatedSubscription) {
              logger.info("Subscription updated after payment", {
                updatedSubscription,
              });
            }
            navigate("/studio?payment=success");
          }, 2000);
        }

        if (data.name === "checkout.closed") {
          logger.info("Checkout was closed");
        }

        if (data.name === "checkout.error") {
          logger.error("Checkout error occurred", { data });
          toast({
            title: "Payment Error",
            description:
              "There was an issue processing your payment. Please try again.",
            variant: "destructive",
          });
        }
      },
    });
  };

  return (
    <PaddleContext.Provider
      value={{
        isLoaded,
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
