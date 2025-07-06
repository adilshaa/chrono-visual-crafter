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

interface PaddleContextType {
  isLoaded: boolean;
  openCheckout: (priceId: string, customData?: any) => void;
  getSubscriptionStatus: () => Promise<any>;
  refreshSubscriptionStatus: () => Promise<any>;
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
  const { user } = useUser();
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

  const refreshSubscriptionStatus = async () => {
    if (!user) return null;

    try {
      logger.info("Refreshing subscription status for user", {
        userId: user.id,
      });

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
        return null;
      }

      const subscriptionData = {
        status: profile.subscription_status || "free",
        plan: profile.subscription_plan || "free",
        customerId: profile.paddle_customer_id,
      };

      logger.info("Subscription status refreshed", {
        subscriptionData,
        userId: user.id,
      });

      // Notify the app of the subscription update
      if (onSubscriptionUpdate) {
        onSubscriptionUpdate(subscriptionData);
      }

      return subscriptionData;
    } catch (error) {
      logger.error("Error refreshing subscription status", {
        error,
        userId: user.id,
      });
      return null;
    }
  };

  const openCheckout = (priceId: string, customData?: any) => {
    if (!isLoaded || !window.Paddle) {
      toast({
        title: "Payment System Not Ready",
        description: "Please wait for the payment system to load.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to continue with payment.",
        variant: "destructive",
      });
      return;
    }

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

  const getSubscriptionStatus = async () => {
    if (!user) return null;

    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("subscription_status, subscription_plan, paddle_customer_id")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;

      return {
        status: profile.subscription_status || "free",
        plan: profile.subscription_plan || "free",
        customerId: profile.paddle_customer_id,
      };
    } catch (error) {
      console.error("Error fetching subscription status:", error);
      return null;
    }
  };

  const value = {
    isLoaded,
    openCheckout,
    getSubscriptionStatus,
    refreshSubscriptionStatus,
    onSubscriptionUpdate,
  };

  return (
    <PaddleContext.Provider value={value}>{children}</PaddleContext.Provider>
  );
};

export default PaddleProvider;
