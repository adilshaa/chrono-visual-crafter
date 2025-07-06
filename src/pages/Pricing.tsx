import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ModernPricingPage,
  PricingCardProps,
} from "@/components/ui/animated-glassy-pricing";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import SiteHeader from "@/components/ui/site-header";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

const Pricing = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [plans, setPlans] = useState<PricingCardProps[]>([]);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .order("price", { ascending: true });

      if (error) throw error;

      console.log("Raw plans data from database:", data);

      const formattedPlans = data.map((plan, index) => {
        const features = Array.isArray(plan.features)
          ? plan.features
          : JSON.parse((plan.features as string) || "[]");

        console.log(`Processing plan ${plan.name}:`, {
          price_id: plan.paddle_price_id,
          product_id: plan.paddle_product_id,
        });

        return {
          planName: plan.name,
          description: plan.description || "",
          price: plan.price.toString(),
          features: features,
          buttonText: plan.name === "Free" ? "Get Started" : "Subscribe Now",
          isPopular: index === 1, // Make the middle plan popular
          buttonVariant: (plan.name === "Free" ? "secondary" : "primary") as
            | "secondary"
            | "primary",
          paddlePriceId: plan.paddle_price_id || undefined,
        };
      });

      console.log("All formatted plans:", formattedPlans);
      setPlans(formattedPlans);
    } catch (error: any) {
      toast({
        title: "Error loading plans",
        description: error.message,
        variant: "destructive",
      });

      // Use fallback plans if database fails
      setPlans([
        {
          planName: "Basic",
          description: "Perfect for personal projects and hobbyists.",
          price: "0",
          features: ["1 Project", "Basic Transitions", "Export as GIF"],
          buttonText: "Get Started",
          buttonVariant: "secondary" as const,
        },
        {
          planName: "Pro",
          description: "Professional features for creators.",
          price: "19",
          features: [
            "Unlimited Projects",
            "All Transitions",
            "HD Video Export",
            "Priority Support",
          ],
          buttonText: "Subscribe Now",
          isPopular: true,
          buttonVariant: "primary" as const,
        },
        {
          planName: "Team",
          description: "For teams and businesses.",
          price: "49",
          features: [
            "Everything in Pro",
            "Team Collaboration",
            "White Label Export",
            "API Access",
          ],
          buttonText: "Subscribe Now",
          buttonVariant: "primary" as const,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        className={cn(
          "min-h-screen flex items-center justify-center",
          isDark
            ? "bg-gradient-to-br from-gray-950 via-gray-900 to-black"
            : "bg-gradient-to-br from-gray-100 via-gray-50 to-white"
        )}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className={cn(
            "w-8 h-8 border-2 border-t-transparent rounded-full",
            isDark ? "border-white" : "border-gray-800"
          )}
        />
      </div>
    );
  }

  return (
    <>
      <SiteHeader showNavLinks={false} />

      <ModernPricingPage
        title={
          <>
            Choose Your <span className="text-cyan-400">Perfect Plan</span>
          </>
        }
        subtitle="Unlock powerful features to enhance your timer experience. Start free and upgrade when you're ready."
        plans={plans}
        showAnimatedBackground={true}
      />
    </>
  );
};

export default Pricing;
