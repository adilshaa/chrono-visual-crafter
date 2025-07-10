import React, { useState } from "react";
import { SignIn, SignUp } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();

  const cardVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeInOut",
      },
    },
  };

  // Elegant shape component from landing page
  const ElegantShape = ({
    className,
    delay = 0,
    width = 400,
    height = 100,
    rotate = 0,
    gradient = "from-white/[0.08]",
  }: {
    className?: string;
    delay?: number;
    width?: number;
    height?: number;
    rotate?: number;
    gradient?: string;
  }) => {
    return (
      <motion.div
        initial={{
          opacity: 0,
          y: -150,
          rotate: rotate - 15,
        }}
        animate={{
          opacity: 1,
          y: 0,
          rotate: rotate,
        }}
        transition={{
          duration: 2.4,
          delay,
          ease: [0.23, 0.86, 0.39, 0.96],
          opacity: { duration: 1.2 },
        }}
        className={cn("absolute", className)}
      >
        <motion.div
          animate={{
            y: [0, 15, 0],
          }}
          transition={{
            duration: 12,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
          style={{
            width,
            height,
          }}
          className="relative"
        >
          <div
            className={cn(
              "absolute inset-0 rounded-full",
              "bg-gradient-to-r to-transparent",
              gradient,
              "backdrop-blur-[2px] border-2 border-white/[0.15]",
              "shadow-[0_8px_32px_0_rgba(255,255,255,0.1)]",
              "after:absolute after:inset-0 after:rounded-full",
              "after:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_70%)]"
            )}
          />
        </motion.div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-[#030303] text-white overflow-hidden flex items-center justify-center p-4">
      {/* Background gradients */}
      <div className="absolute inset-0 blur-3xl bg-gradient-to-br from-indigo-500/[0.05] via-transparent to-rose-500/[0.05]" />

      {/* Elegant shapes background */}
      <div className="absolute inset-0 overflow-hidden">
        <ElegantShape
          delay={0.3}
          width={600}
          height={140}
          rotate={12}
          gradient="from-indigo-500/[0.15]"
          className="left-[-10%] md:left-[-5%] top-[15%] md:top-[20%]"
        />

        <ElegantShape
          delay={0.5}
          width={500}
          height={120}
          rotate={-15}
          gradient="from-rose-500/[0.15]"
          className="right-[-5%] md:right-[0%] top-[70%] md:top-[75%]"
        />

        <ElegantShape
          delay={0.4}
          width={300}
          height={80}
          rotate={-8}
          gradient="from-violet-500/[0.15]"
          className="left-[5%] md:left-[10%] bottom-[5%] md:bottom-[10%]"
        />

        <ElegantShape
          delay={0.6}
          width={200}
          height={60}
          rotate={20}
          gradient="from-amber-500/[0.15]"
          className="right-[15%] md:right-[20%] top-[10%] md:top-[15%]"
        />

        <ElegantShape
          delay={0.7}
          width={150}
          height={40}
          rotate={-25}
          gradient="from-cyan-500/[0.15]"
          className="left-[20%] md:left-[25%] top-[5%] md:top-[10%]"
        />
      </div>

      <div className="absolute top-6 left-6 z-20">
        <Button
          variant="ghost"
          className="text-white hover:text-islandblue-300 flex items-center gap-2"
          onClick={() => navigate("/")}
        >
          <ArrowLeft size={16} />
          Back to Home
        </Button>
      </div>

      <motion.div
        className="w-full max-w-md relative z-10"
        variants={cardVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="relative z-10">
          {isSignUp ? (
            <SignUp
              // appearance={{
              //   elements: {
              //     formButtonPrimary:
              //       "bg-islandblue-600 hover:bg-islandblue-700 text-sm normal-case w-full",
              //     footerActionLink:
              //       "text-islandblue-400 hover:text-islandblue-300",
              //     card: "bg-transparent shadow-none",
              //     headerTitle: "hidden",
              //     headerSubtitle: "hidden",
              //     socialButtonsBlockButton:
              //       "border border-gray-700 bg-black hover:bg-islandblue-900/30 text-white",
              //     formFieldInput:
              //       "bg-black/60 border-gray-700 text-white focus:border-islandblue-400/70",
              //     formFieldLabel: "text-gray-300",
              //   },
              // }}
              afterSignUpUrl="/studio"
              routing="virtual"
            />
          ) : (
            <SignIn
              // appearance={{
              //   elements: {
              //     formButtonPrimary:
              //       "bg-islandblue-600 hover:bg-islandblue-700 text-sm normal-case w-full",
              //     footerActionLink:
              //       "text-islandblue-400 hover:text-islandblue-300",
              //     card: "bg-transparent shadow-none",
              //     headerTitle: "hidden",
              //     headerSubtitle: "hidden",
              //     socialButtonsBlockButton:
              //       "border border-gray-700 bg-black hover:bg-islandblue-900/30 text-white",
              //     formFieldInput:
              //       "bg-black/60 border-gray-700 text-white focus:border-islandblue-400/70",
              //     formFieldLabel: "text-gray-300",
              //     identityPreview: "bg-black/40 border border-gray-700",
              //   },
              // }}
              afterSignInUrl="/studio"
              routing="virtual"
            />
          )}
          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              {isSignUp
                ? "Already have an account? Sign In"
                : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
