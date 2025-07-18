import React, { Suspense, lazy } from "react";
import { motion } from "framer-motion";

import { Hero2 } from "@/components/ui/hero-2-1";
import { Footer } from "@/components/ui/footer-section";
import { BackgroundEffects } from "@/components/landing/BackgroundEffects";
import { SimplePricingCards } from "@/components/ui/simple-pricing-cards";
import { usePricingPlans } from "@/hooks/usePricingPlans";

// Lazy load components that are not immediately visible
const FeaturesSection = lazy(() =>
  import("@/components/landing/FeaturesSection").then((module) => ({
    default: module.FeaturesSection,
  }))
);

// Loading component for lazy-loaded sections
const SectionLoader = () => (
  <div className="flex items-center justify-center py-20">
    <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin border-white/30"></div>
  </div>
);

const Landing = () => {
  // const { plans, loading } = usePricingPlans();

  // if (loading) {
  //   return (
  //     <div className="min-h-screen bg-black flex items-center justify-center">
  //       <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin border-white"></div>
  //     </div>
  //   );
  // }

  return (
    <div className="flex flex-col min-h-screen relative bg-black overflow-hidden">
      {/* Unified Blue Background Design for All Sections */}
      <div className="absolute inset-0 z-0">
        {/* Multiple gradient elements positioned across the page */}
        <div className="absolute -right-60 -top-10 blur-xl">
          <div className="h-[10rem] rounded-full w-[60rem] bg-gradient-to-b blur-[6rem] from-[#1FB4FF]/10 to-[#1FB4FF]/10"></div>
          <div className="h-[10rem] rounded-full w-[90rem] bg-gradient-to-b blur-[6rem] from-[#1FB4FF] to-[#1FB4FF]/40"></div>
          <div className="h-[10rem] rounded-full w-[60rem] bg-gradient-to-b blur-[6rem] from-[#1FB4FF]/50 to-[#1FB4FF]/10"></div>
        </div>

        {/* Additional gradient elements for better coverage */}
        <div className="absolute -left-60 top-1/3 blur-xl">
          <div className="h-[8rem] rounded-full w-[50rem] bg-gradient-to-b blur-[6rem] from-[#1FB4FF]/15 to-[#1FB4FF]/5"></div>
          <div className="h-[12rem] rounded-full w-[70rem] bg-gradient-to-b blur-[6rem] from-[#1FB4FF]/30 to-[#1FB4FF]/10"></div>
        </div>

        <div className="absolute -right-40 top-2/3 blur-xl">
          <div className="h-[9rem] rounded-full w-[55rem] bg-gradient-to-b blur-[6rem] from-[#1FB4FF]/20 to-[#1FB4FF]/5"></div>
          <div className="h-[11rem] rounded-full w-[65rem] bg-gradient-to-b blur-[6rem] from-[#1FB4FF]/35 to-[#1FB4FF]/15"></div>
        </div>

        {/* Noise texture and dark overlay */}
        <div className="absolute inset-0 bg-noise opacity-30"></div>
        <div className="absolute inset-0 bg-black/50"></div>
      </div>

      {/* Hero section */}
      <motion.div
        className="relative z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
      >
        <Hero2 />
      </motion.div>

      <Suspense fallback={<SectionLoader />}>
        <FeaturesSection />
      </Suspense>

      {/* Pricing section */}
      {/* <div className="relative z-10">
        <SimplePricingCards plans={plans} />
      </div> */}
      
      {/* Footer */}
      <div className="border-t border-gray/10 relative z-10 mt-20">
        <Footer />
      </div>
    </div>
  );
};

export default Landing;
