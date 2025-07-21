import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/contexts/SupabaseAuthContext";
import { handleAuthError } from "@/lib/auth-errors";
import { logger } from "@/lib/logger";
import { AnimatedForm } from "@/components/ui/modern-animated-sign-in";
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const navigate = useNavigate();
  const { signIn } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    general?: string;
  }>({});

  const handleInputChange =
    (field: keyof typeof formData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));

      // Clear field-specific error when user starts typing
      if (errors[field]) {
        setErrors((prev) => ({
          ...prev,
          [field]: undefined,
        }));
      }
    };

  const validateForm = () => {
    const newErrors: typeof errors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      logger.info("Attempting sign in", { email: formData.email });

      const response = await signIn(formData.email, formData.password);

      if (response.error) {
        const errorMessage = handleAuthError(response.error);

        // Check for specific error types to provide better feedback
        if (
          response.error.message?.includes("Invalid login credentials") ||
          response.error.message?.includes("Invalid email or password")
        ) {
          setErrors({
            general:
              "Invalid email or password. Please check your credentials and try again.",
          });
        } else if (response.error.message?.includes("Email not confirmed")) {
          setErrors({
            general:
              "Please verify your email address before signing in. Check your inbox for a verification link.",
          });
        } else {
          setErrors({ general: errorMessage });
        }

        logger.error("Sign in failed", {
          error: response.error,
          email: formData.email,
        });
        return;
      }

      logger.info("Sign in successful", {
        email: formData.email,
        userId: response.data.user?.id,
      });

      // Navigate to studio on successful login
      navigate("/studio");
    } catch (error) {
      const errorMessage = handleAuthError(error as Error);
      setErrors({ general: errorMessage });
      logger.error("Unexpected sign in error", {
        error,
        email: formData.email,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const goToForgotPassword = () => {
    navigate("/reset-password");
  };

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrors({});

    try {
      logger.info("Attempting Google sign in");

      // Clear any previous stored referral ID to avoid confusion
      localStorage.removeItem("referralId");

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin + "/studio",
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        const errorMessage = handleAuthError(error);

        // Provide more specific error messages for Google sign-in failures
        if (
          error.message?.includes("popup_closed_by_user") ||
          error.message?.includes("popup closed")
        ) {
          setErrors({
            general: "Authentication was cancelled. Please try again.",
          });
        } else if (error.message?.includes("network")) {
          setErrors({
            general:
              "Network error. Please check your internet connection and try again.",
          });
        } else {
          setErrors({ general: errorMessage });
        }

        logger.error("Google sign in failed", { error });
      }
    } catch (error) {
      const errorMessage = handleAuthError(error as Error);
      setErrors({ general: errorMessage });
      logger.error("Unexpected Google sign in error", { error });
    } finally {
      setIsLoading(false);
    }
  };

  const pageVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  const formFields = {
    header: "Welcome Back",
    subHeader: "Sign in to your account to continue",
    fields: [
      {
        label: "Email",
        required: true,
        type: "email" as const,
        placeholder: "Enter your email address",
        onChange: handleInputChange("email"),
      },
      {
        label: "Password",
        required: true,
        type: "password" as const,
        placeholder: "Enter your password",
        onChange: handleInputChange("password"),
      },
    ],
    submitButton: isLoading ? "Signing In..." : "Sign In",
    textVariantButton: "Forgot your password?",
    errorField: errors.general,
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="relative min-h-screen overflow-hidden bg-black flex items-center justify-center p-4"
    >
      {/* Background effects - matching the existing Auth page design */}
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

      {/* Back to Home Button */}
      <div className="absolute top-6 left-6 z-20">
        <Button
          variant="ghost"
          className="text-white hover:text-blue-300 flex items-center gap-2"
          onClick={() => navigate("/")}
        >
          <ArrowLeft size={16} />
          Back to Home
        </Button>
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full flex flex-col md:flex-row">
        {/* Left Side - Header and Quote */}
        <div className="hidden md:flex md:w-1/2 md:flex-col md:justify-center md:items-center md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent mb-6">
              Welcome Back
            </h1>
            <p className="text-xl text-gray-300 italic max-w-md mx-auto">
              "Continue your creative journey and bring your ideas to life with
              our powerful tools."
            </p>
          </motion.div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full md:w-1/2 flex justify-center items-center">
          <AnimatedForm
            {...formFields}
            onSubmit={handleSubmit}
            goTo={goToForgotPassword}
            googleLogin="Sign in with Google"
            onGoogleClick={handleGoogleSignIn}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default Login;
