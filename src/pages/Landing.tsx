import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import {
  Zap,
  Palette,
  Download,
  ChevronRight,
  Play,
  CheckCircle,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { Hero2 } from "@/components/ui/hero-2-1";
import { Footer } from "@/components/ui/footer-section";
import { BentoGrid, BentoItem } from "@/components/ui/bento-grid";
import {
  ModernPricingPage,
  PricingCardProps,
} from "@/components/ui/animated-glassy-pricing";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Landing = () => {
  const navigate = useNavigate();
  const { isSignedIn } = useUser();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { toast } = useToast();
  const [plans, setPlans] = React.useState<PricingCardProps[]>([]);
  const [loading, setLoading] = React.useState(true);

  const handleGetStarted = () => {
    if (isSignedIn) {
      navigate("/studio");
    } else {
      navigate("/auth");
    }
  };

  React.useEffect(() => {
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

      const filtered = data.filter((plan) =>
        ["Free", "Pro"].includes(plan.name)
      );

      const formattedPlans = filtered.map((plan, index) => {
        const features = Array.isArray(plan.features)
          ? plan.features
          : JSON.parse((plan.features as string) || "[]");

        return {
          planName: plan.name,
          description: plan.description || "",
          price: plan.price.toString(),
          features: features,
          buttonText: plan.name === "Free" ? "Get Started" : "Subscribe Now",
          isPopular: index === 1, // Make the Pro plan popular
          buttonVariant: (plan.name === "Free" ? "secondary" : "primary") as
            | "secondary"
            | "primary",
          paddlePriceId: plan.paddle_price_id || undefined,
        };
      });

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
          planName: "Free",
          description: "Perfect for personal projects and hobbyists.",
          price: "0",
          features: ["1 Project", "Basic Transitions", "720p Export"],
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
            "4K Export",
            "Priority Support",
          ],
          buttonText: "Subscribe Now",
          isPopular: true,
          buttonVariant: "primary" as const,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Define BentoGrid items for features
  const featureItems: BentoItem[] = [
    {
      title: "Transition Effects",
      meta: "20+ Styles",
      description:
        "From smooth slides to dramatic flips, create stunning counter animations for your videos",
      icon: <Zap className="w-4 h-4 text-purple-400" />,
      status: "Popular",
      tags: ["Animations", "Effects"],
      colSpan: 2,
      hasPersistentHover: true,
    },
    {
      title: "Professional Designs",
      meta: "Unlimited Options",
      description:
        "Neon glows, gradients, fire effects and more built-in designs",
      icon: <Palette className="w-4 h-4 text-pink-400" />,
      status: "Designer",
      tags: ["UI", "Styling"],
    },
    {
      title: "Export Ready",
      meta: "Multiple Formats",
      description: "Download as high-quality videos or optimized GIFs",
      icon: <Download className="w-4 h-4 text-sky-400" />,
      tags: ["Export", "Share"],
      colSpan: 1,
    },
    {
      title: "Real-time Preview",
      meta: "Instant Feedback",
      description:
        "See your counter animation exactly as it will appear in your final export",
      icon: <Play className="w-4 h-4 text-green-400" />,
      status: "Fast",
      tags: ["Preview", "Real-time"],
      colSpan: 1,
    },
    {
      title: "Customization",
      meta: "Complete Control",
      description:
        "Adjust every aspect of your counter: fonts, colors, speed, timing, and more",
      icon: <Sparkles className="w-4 h-4 text-amber-400" />,
      tags: ["Control", "Options"],
      colSpan: 1,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin border-white"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen relative bg-black overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 z-0">
        <div className="flex flex-col items-end absolute -right-60 -top-10 blur-xl z-0">
          <div className="h-[10rem] rounded-full w-[60rem] z-1 bg-gradient-to-b blur-[6rem] from-purple-600 to-sky-600"></div>
          <div className="h-[10rem] rounded-full w-[90rem] z-1 bg-gradient-to-b blur-[6rem] from-pink-900 to-yellow-400"></div>
          <div className="h-[10rem] rounded-full w-[60rem] z-1 bg-gradient-to-b blur-[6rem] from-yellow-600 to-sky-500"></div>
        </div>
        <div className="absolute inset-0 z-0 bg-noise opacity-30"></div>

        {/* Additional gradients for more visual interest */}
        <div className="absolute bottom-0 left-0 h-[30rem] w-[30rem] rounded-full blur-[8rem] bg-gradient-to-tr from-purple-600/10 to-transparent"></div>
        <div className="absolute top-1/2 left-1/4 h-[20rem] w-[20rem] rounded-full blur-[7rem] bg-gradient-to-br from-cyan-500/10 to-transparent"></div>

        {/* Deep black overlay to maintain deep black background */}
        <div className="absolute inset-0 z-1 bg-black/50"></div>
      </div>

      {/* Hero section */}
      <div className="relative z-10">
        <Hero2 />
      </div>

      {/* Features Section with BentoGrid */}
      <section id="features" className="relative z-10 py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">
              Powerful Features
            </h2>
            <p className="max-w-xl mx-auto text-white/40">
              Everything you need to create professional animated counters for
              your projects.
            </p>
          </motion.div>

          <BentoGrid items={featureItems} />
        </div>
      </section>

      {/* Pricing Section using ModernPricingPage */}
      <section id="pricing" className="relative z-10 py-0 md:py-12">
        <div className="container mx-auto px-4">
          <div className="relative">
            <div className="absolute inset-0 z-0 opacity-60">
              <div className="h-[20rem] rounded-full w-[40rem] absolute -right-20 -top-40 blur-[6rem] bg-gradient-to-b from-purple-600/20 to-transparent"></div>
              <div className="h-[20rem] rounded-full w-[40rem] absolute -left-20 top-40 blur-[6rem] bg-gradient-to-b from-cyan-500/20 to-transparent"></div>
            </div>

            <div className="relative z-10">
              <ModernPricingPage
                title={
                  <>
                    Simple, <span className="text-cyan-400">Transparent</span>{" "}
                    Pricing
                  </>
                }
                subtitle="No hidden fees. Start free and upgrade when you need more."
                plans={plans}
                showAnimatedBackground={false}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Footer with matched color theme */}
      <div className=" border-t border-gray/10 relative z-10 mt-20">
        <Footer />
      </div>
    </div>
  );
};

export default Landing;
