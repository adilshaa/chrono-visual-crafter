"use client";

import React from "react";
import { PlusIcon, ShieldCheckIcon } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "./badge";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { BorderTrail } from "./border-trail";
import { useNavigate } from "react-router-dom";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  discount?: string;
  features: string[];
  paddlePriceId?: string;
  isPopular?: boolean;
  billingCycle: "monthly" | "yearly";
}

interface SimplePricingCardsProps {
  plans: PricingPlan[];
  title?: React.ReactNode;
  subtitle?: string;
}

export function SimplePricingCards({
  plans,
  title,
  subtitle,
}: SimplePricingCardsProps) {
  const navigate = useNavigate();
  const { isSignedIn } = useSupabaseAuth();

  const handlePlanSelect = (plan: PricingPlan) => {
    if (plan.price === 0) {
      // Free plan - redirect to studio
      navigate("/studio");
    } else {
      // Paid plan - redirect to checkout
      if (!isSignedIn) {
        navigate("/login");
        return;
      }

      if (plan.paddlePriceId) {
        navigate(
          `/checkout?priceId=${plan.paddlePriceId}&plan=${encodeURIComponent(
            plan.name
          )}`
        );
      }
    }
  };

  // For demo, we'll show the first two plans (Free and Pro)
  const freePlan = plans.find((plan) => plan.name === "Free") || plans[0];
  const proPlan = plans.find((plan) => plan.name === "Pro") || plans[1];

  return (
    <section className="relative py-24">
      <div className="mx-auto w-full max-w-6xl space-y-16 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="mx-auto max-w-3xl space-y-8 text-center"
        >
          <div className="flex justify-center">
            <div className="rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm px-6 py-1 font-mono text-white text-lg">
              Pricing
            </div>
          </div>
          <h2 className="text-4xl font-bold tracking-tighter md:text-5xl lg:text-6xl text-white">
            {title || (
              <>
                Choose Your <span className="text-cyan-400">Perfect Plan</span>
              </>
            )}
          </h2>
          <p className="text-white/70 text-lg md:text-xl max-w-2xl mx-auto">
            {subtitle ||
              "Unlock powerful features to enhance your timer experience. Start free and upgrade when you're ready."}
          </p>
        </motion.div>

        <div className="relative">
          <div
            className={cn(
              "z--10 pointer-events-none absolute inset-0 size-full",
              "bg-[linear-gradient(to_right,rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.1)_1px,transparent_1px)]",
              "bg-[size:32px_32px]",
              "[mask-image:radial-gradient(ellipse_at_center,black_10%,transparent)]"
            )}
          />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
            className="mx-auto w-full max-w-2xl"
          >
            <div className="bg-black/40 backdrop-blur-sm relative border border-white/20 rounded-lg overflow-hidden">
              <PlusIcon className="absolute -top-3 -left-3 size-5.5 text-white" />
              <PlusIcon className="absolute -top-3 -right-3 size-5.5 text-white" />
              <PlusIcon className="absolute -bottom-3 -left-3 size-5.5 text-white" />
              <PlusIcon className="absolute -right-3 -bottom-3 size-5.5 text-white" />

              {/* Plans Section */}
              <div className="grid md:grid-cols-2 p-6 gap-4">
                {/* Free Plan */}
                <div className="w-full space-y-2 pt-8">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white">
                        {freePlan?.name || "Free"}
                      </h3>
                      <Badge
                        variant="secondary"
                        className="bg-white/20 text-white border-white/30"
                      >
                        Free Forever
                      </Badge>
                    </div>
                    <p className="text-white/70 text-sm">
                      {freePlan?.description || "Perfect for getting started!"}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="text-white/70 flex items-end gap-1 text-xl">
                      <span>$</span>
                      <span className="text-white -mb-0.5 text-4xl font-extrabold tracking-tighter">
                        {freePlan?.price || 0}
                      </span>
                      <span>/month</span>
                    </div>
                    <Button
                      className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30"
                      variant="outline"
                      onClick={() =>
                        handlePlanSelect(
                          freePlan || {
                            id: "1",
                            name: "Free",
                            description: "",
                            price: 0,
                            features: [],
                            billingCycle: "monthly",
                          }
                        )
                      }
                    >
                      Get Started Free
                    </Button>
                  </div>
                </div>

                {/* Pro Plan */}
                <div className="relative w-full rounded-lg border border-cyan-400/50 p-6 bg-gradient-to-br from-cyan-400/10 to-blue-500/10 space-y-1">
                  <BorderTrail
                    style={{
                      boxShadow:
                        "0px 0px 60px 30px rgb(6 182 212 / 20%), 0 0 100px 60px rgb(6 182 212 / 10%)",
                    }}
                    size={100}
                    className="bg-gradient-to-r from-cyan-400 to-blue-500"
                  />

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white">
                        {proPlan?.name || "Pro"}
                      </h3>
                      <Badge className="bg-gradient-to-r from-cyan-400 to-blue-500 text-white border-0">
                        Most Popular
                      </Badge>
                    </div>
                    <p className="text-white/70 text-sm">
                      {proPlan?.description ||
                        "Professional features for creators!"}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="text-white/70 flex items-end gap-1 text-xl">
                      <span>$</span>
                      <span className="text-white -mb-0.5 text-4xl font-extrabold tracking-tighter">
                        {proPlan?.price || 19}
                      </span>
                      <span>/month</span>
                    </div>
                    <Button
                      className="w-full bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-white border-0"
                      onClick={() =>
                        handlePlanSelect(
                          proPlan || {
                            id: "2",
                            name: "Pro",
                            description: "",
                            price: 19,
                            features: [],
                            billingCycle: "monthly",
                            paddlePriceId: "pro_price_id",
                          }
                        )
                      }
                    >
                      Get Started Now
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-white/70 flex items-center justify-center gap-x-2 text-sm mt-8">
              <ShieldCheckIcon className="size-4" />
              <span>Access to all features with no hidden fees</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
