"use client";
import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Footer() {
  return (
    <footer className="relative w-full max-w-7xl mx-auto flex items-center justify-between  py-4 text-white">
      <div className="bg-white/10 absolute top-0 right-1/2 left-1/2 h-px w-1/3 -translate-x-1/2 -translate-y-1/2 rounded-full blur" />

      {/* Left side - App name and logo */}
      <AnimatedContainer className="flex items-center">
        <div className="flex items-center px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-full ">
            <img src="/favicon.ico" className="font-bold" />
          </div>
          <span className="ml-2 text-xl font-bold text-white">Countflow</span>
        </div>
      </AnimatedContainer>

      {/* Right side - Terms and Privacy */}
      <AnimatedContainer className="flex items-center gap-4" delay={0.2}>
        <Button
          variant="link"
          className="text-white/60 hover:text-cyan-400 p-0 h-auto"
        >
          Terms
        </Button>
        <Button
          variant="link"
          className="text-white/60 hover:text-cyan-400 p-0 h-auto"
        >
          Privacy
        </Button>
      </AnimatedContainer>

      {/* Background gradient */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-40 right-20 h-[10rem] w-[10rem] rounded-full blur-[5rem] bg-gradient-to-br from-pink-500/10 to-transparent"></div>
      </div>
    </footer>
  );
}

type AnimatedContainerProps = {
  delay?: number;
  className?: string;
  children: React.ReactNode;
};

function AnimatedContainer({
  className,
  delay = 0.1,
  children,
}: AnimatedContainerProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ filter: "blur(4px)", translateY: -8, opacity: 0 }}
      whileInView={{ filter: "blur(0px)", translateY: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.8 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
