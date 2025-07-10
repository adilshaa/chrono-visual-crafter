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
import { LandingHeader } from "@/components/ui/landing-header";
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

      const filtered = data.filter((plan) =>
        ["Free", "Pro"].includes(plan.name)
      );

      const formattedPlans = filtered.map((plan, index) => {
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin border-white"></div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      {/* Background effects */}
      <div className="absolute inset-0 z-0">
        <div className="flex flex-col items-end absolute -right-60 -top-10 blur-xl z-0">
          <div className="h-[10rem] rounded-full w-[60rem] z-1 bg-gradient-to-b blur-[6rem] from-[#1FB4FF] to-sky-400"></div>
          <div className="h-[10rem] rounded-full w-[90rem] z-1 bg-gradient-to-b blur-[6rem] from-[#1FB4FF]/10 to-sky-400"></div>
          <div className="h-[10rem] rounded-full w-[60rem] z-1 bg-gradient-to-b blur-[6rem] from-[#1FB4FF]/10 to-sky-400"></div>
        </div>
        <div className="absolute inset-0 z-0 bg-noise opacity-30"></div>

        {/* Additional gradients for more visual interest */}
        <div className="absolute bottom-0 left-0 h-[30rem] w-[30rem] rounded-full blur-[8rem] bg-gradient-to-tr from-purple-600/10 to-transparent"></div>
        <div className="absolute top-1/2 left-1/4 h-[20rem] w-[20rem] rounded-full blur-[7rem] bg-gradient-to-br from-cyan-500/10 to-transparent"></div>

        {/* Deep black overlay to maintain deep black background */}
        <div className="absolute inset-0 z-1 bg-black/50"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <LandingHeader />

        <ModernPricingPage
          title={
            <>
              Choose Your <span className="text-cyan-400">Perfect Plan</span>
            </>
          }
          subtitle="Unlock powerful features to enhance your timer experience. Start free and upgrade when you're ready."
          plans={plans}
          showAnimatedBackground={false}
        />
      </div>
    </div>
  );
};

export default Pricing;
