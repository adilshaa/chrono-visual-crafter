import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Loader2,
  Mail,
  RefreshCw,
  ExternalLink,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/contexts/SupabaseAuthContext";
import { handleAuthError } from "@/lib/auth-errors";
import { logger } from "@/lib/logger";

interface VerificationMessageProps {
  email?: string;
  type?: "signup" | "recovery";
  onSuccess?: () => void;
  onBack?: () => void;
}

const VerificationMessage: React.FC<VerificationMessageProps> = ({
  email: propEmail,
  type: propType = "signup",
  onSuccess,
  onBack,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { resendOTP } = useAuthContext();

  // Get email and type from props or location state
  const email = propEmail || location.state?.email || "";
  const type = propType || location.state?.type || "signup";

  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState("");

  // Redirect if no email provided
  useEffect(() => {
    if (!email) {
      toast({
        title: "Missing Information",
        description:
          "Please start the verification process from the beginning.",
        variant: "destructive",
      });
      navigate("/register");
    }
  }, [email, navigate, toast]);

  // Handle resend cooldown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleResendLink = async () => {
    if (resendCooldown > 0 || isResending) return;

    setIsResending(true);
    setError("");

    try {
      logger.info("Attempting to resend verification link", { email, type });

      const response = await resendOTP(email, type);

      if (response.error) {
        const errorMessage = handleAuthError(response.error);
        setError(errorMessage);
        logger.error("Verification link resend failed", {
          error: response.error,
          email,
          type,
        });

        toast({
          title: "Resend Failed",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      logger.info("Verification link resent successfully", { email, type });
      setResendCooldown(60); // 60 second cooldown

      toast({
        title: "Link Sent!",
        description: "A new verification link has been sent to your email.",
      });
    } catch (error) {
      const errorMessage = handleAuthError(error as Error);
      setError(errorMessage);
      logger.error("Unexpected verification link resend error", {
        error,
        email,
        type,
      });

      toast({
        title: "Resend Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  const successVariants = {
    hidden: { scale: 0 },
    visible: {
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 20,
      },
    },
  };

  if (!email) {
    return null; // Will redirect in useEffect
  }

  return (
    <motion.div
      variants={formVariants}
      initial="hidden"
      animate="visible"
      className="w-full max-w-md mx-auto"
    >
      <Card className="bg-black/40 border border-gray-700 backdrop-blur-xl p-8">
        <div className="text-center mb-8">
          <Mail className="w-16 h-16 text-blue-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">
            Check Your Email
          </h1>
          <p className="text-gray-400 mb-4">
            We've sent a verification link to
          </p>
          <p className="text-white font-medium mb-6">{email}</p>

          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center mb-2">
              <ExternalLink className="w-5 h-5 text-blue-400 mr-2" />
              <span className="text-blue-400 font-medium">Action Required</span>
            </div>
            <p className="text-gray-300 text-sm">
              Click the verification link in your email to{" "}
              {type === "signup"
                ? "activate your account"
                : "reset your password"}
              .
            </p>
          </div>

          <div className="text-left space-y-2 text-sm text-gray-400 mb-6">
            <p className="flex items-start">
              <span className="text-blue-400 mr-2">1.</span>
              Check your inbox for an email from Countflow
            </p>
            <p className="flex items-start">
              <span className="text-blue-400 mr-2">2.</span>
              Click the verification link in the email
            </p>
            <p className="flex items-start">
              <span className="text-blue-400 mr-2">3.</span>
              {type === "signup"
                ? "You'll be automatically signed in"
                : "You'll be able to set a new password"}
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-md mb-4">
            <p className="text-red-400 text-sm text-center">{error}</p>
          </div>
        )}

        {/* Resend Section */}
        <div className="text-center mb-6">
          <p className="text-gray-400 text-sm mb-3">
            Didn't receive the email?
          </p>
          <Button
            variant="outline"
            onClick={handleResendLink}
            disabled={resendCooldown > 0 || isResending}
            className="bg-transparent border-gray-600 text-blue-400 hover:bg-blue-400/10 hover:border-blue-400"
          >
            {isResending ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : resendCooldown > 0 ? (
              `Resend in ${resendCooldown}s`
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Resend Verification Link
              </>
            )}
          </Button>
        </div>

        {/* Additional Help */}
        <div className="text-center text-xs text-gray-500 mb-4">
          <p>Check your spam folder if you don't see the email</p>
        </div>

        {/* Back Button */}
        {onBack && (
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={onBack}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        )}
      </Card>
    </motion.div>
  );
};

export default VerificationMessage;
