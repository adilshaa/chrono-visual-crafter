import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/contexts/SupabaseAuthContext";
import { handleAuthError } from "@/lib/auth-errors";
import { logger } from "@/lib/logger";
import { AnimatedForm } from "@/components/ui/modern-animated-sign-in";
import { supabase } from "@/integrations/supabase/client";

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [referralId, setReferralId] = useState<string | null>(null);
  const { signUp } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
  });
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    fullName?: string;
    general?: string;
  }>({});

  // Extract referral ID from URL parameters
  useEffect(() => {
    const refParam = searchParams.get("ref");
    if (refParam) {
      setReferralId(refParam);
      console.log("Referral ID detected:", refParam);
    }
  }, [searchParams]);

  const handleInputChange =
    (field: keyof typeof formData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));

      // Real-time validation
      const newErrors: typeof errors = { ...errors };

      // Clear the current field error first
      delete newErrors[field];

      // Real-time validation for each field
      if (field === "fullName") {
        if (value.trim() && value.trim().length < 2) {
          newErrors.fullName = "Full name must be at least 2 characters";
        }
      } else if (field === "email") {
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors.email = "Please enter a valid email address";
        }
      } else if (field === "password") {
        if (value) {
          if (value.length < 6) {
            newErrors.password = "Password must be at least 6 characters";
          } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
            newErrors.password =
              "Password must contain at least one uppercase letter, one lowercase letter, and one number";
          }
        }
        // Also check confirm password if it exists
        if (formData.confirmPassword && value !== formData.confirmPassword) {
          newErrors.confirmPassword = "Passwords do not match";
        } else if (
          formData.confirmPassword &&
          value === formData.confirmPassword
        ) {
          delete newErrors.confirmPassword;
        }
      } else if (field === "confirmPassword") {
        if (value && formData.password !== value) {
          newErrors.confirmPassword = "Passwords do not match";
        }
      }

      setErrors(newErrors);
    };

  const validateForm = () => {
    const newErrors: typeof errors = {};

    // Full name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = "Full name must be at least 2 characters";
    }

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
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password =
        "Password must contain at least one uppercase letter, one lowercase letter, and one number";
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Track if a registration request is in progress to prevent duplicates
  const [isRegistering, setIsRegistering] = useState(false);
  // Track emails that have been checked to prevent duplicate requests
  const [checkedEmails, setCheckedEmails] = useState<Set<string>>(new Set());

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Prevent multiple concurrent requests
    if (isRegistering) {
      return;
    }

    // Check if we've already determined this email exists
    if (checkedEmails.has(formData.email)) {
      setErrors({
        email:
          "This email is already registered. Please use a different email or sign in.",
        general: undefined,
      });
      return;
    }

    setIsLoading(true);
    setIsRegistering(true);
    setErrors({});

    try {
      logger.info("Checking if email already exists", {
        email: formData.email,
      });

      // Check if the email exists in the profiles table
      const { data: existingProfiles, error: profileError } = await supabase
        .from("profiles")
        .select("email")
        .eq("email", formData.email)
        .limit(1);

      if (profileError) {
        logger.error("Error checking existing profiles", {
          error: profileError,
        });
      }

      // If the email already exists in the profiles table, show an error
      if (existingProfiles && existingProfiles.length > 0) {
        // Add this email to our checked emails set to prevent future requests
        setCheckedEmails((prev) => new Set(prev).add(formData.email));

        setErrors({
          email:
            "This email is already registered. Please use a different email or sign in.",
          general: undefined,
        });
        setIsLoading(false);
        setIsRegistering(false);
        return;
      }

      logger.info("Attempting sign up", {
        email: formData.email,
        fullName: formData.fullName,
      });

      const response = await signUp(formData.email, formData.password, {
        full_name: formData.fullName.trim(),
        referral_id: referralId,
      });
      logger.info("Sign up response", {
        response,
        email: formData.email,
      });
      if (response.error) {
        const errorMessage = handleAuthError(response.error);

        // Check if the error is about an existing user
        if (
          response.error.message?.includes("already registered") ||
          response.error.message?.includes("already in use") ||
          response.error.message?.includes("User already registered")
        ) {
          setErrors({
            email:
              "This email is already registered. Please use a different email or sign in.",
            general: undefined,
          });
        } else {
          setErrors({ general: errorMessage });
        }

        logger.error("Sign up failed", {
          error: response.error,
          email: formData.email,
        });
        return;
      }

      logger.info("Sign up successful", {
        email: formData.email,
        userId: response.data.user?.id,
        needsConfirmation: !response.data.session,
      });

      // Check if email confirmation is required
      if (
        !response.data.session &&
        response.data.user &&
        !response.data.user.email_confirmed_at
      ) {
        // Navigate to OTP verification
        navigate("/verify-otp", {
          state: {
            email: formData.email,
            type: "signup",
          },
        });
      } else {
        // User is automatically signed in (email confirmation disabled)
        navigate("/studio");
      }
    } catch (error) {
      const errorMessage = handleAuthError(error as Error);
      setErrors({ general: errorMessage });
      logger.error("Unexpected sign up error", {
        error,
        email: formData.email,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const goToLogin = () => {
    navigate("/login");
  };

  // Handle Google Sign Up
  const handleGoogleSignUp = async () => {
    // If referral ID is present, block Google signup and show error
    if (referralId) {
      setErrors({
        general:
          "Google signup is not available when using a referral link. Please sign up manually to claim your referral bonus.",
      });
      return;
    }

    // Prevent multiple concurrent requests
    if (isRegistering) {
      return;
    }

    setIsLoading(true);
    setIsRegistering(true);
    setErrors({});

    try {
      logger.info("Attempting Google sign up");

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

        // Provide more specific error messages for Google sign-up failures
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
        } else if (
          error.message?.includes("already registered") ||
          error.message?.includes("already in use")
        ) {
          setErrors({
            general:
              "This Google account is already registered. Please sign in instead.",
          });
        } else {
          setErrors({ general: errorMessage });
        }

        logger.error("Google sign up failed", { error });
      }
    } catch (error) {
      const errorMessage = handleAuthError(error as Error);
      setErrors({ general: errorMessage });
      logger.error("Unexpected Google sign up error", { error });
    } finally {
      setIsLoading(false);
      setIsRegistering(false);
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
    header: "Create Account",
    subHeader: "Sign up to get started with your account",
    fields: [
      {
        label: "Full Name",
        required: true,
        type: "text" as const,
        placeholder: "Enter your full name",
        onChange: handleInputChange("fullName"),
        error: errors.fullName,
      },
      {
        label: "Email",
        required: true,
        type: "email" as const,
        placeholder: "Enter your email address",
        onChange: handleInputChange("email"),
        error: errors.email,
      },
      {
        label: "Password",
        required: true,
        type: "password" as const,
        placeholder: "Create a password",
        onChange: handleInputChange("password"),
        error: errors.password,
      },
      {
        label: "Confirm Password",
        required: true,
        type: "password" as const,
        placeholder: "Confirm your password",
        onChange: handleInputChange("confirmPassword"),
        error: errors.confirmPassword,
      },
    ],
    submitButton: isLoading ? "Creating Account..." : "Create Account",
    textVariantButton: "Already have an account? Sign in",
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
              Start Creating Today
            </h1>
            <p className="text-xl text-gray-300 italic max-w-md mx-auto">
              "Join our community and bring your creative visions to life with
              powerful tools and endless possibilities."
            </p>
          </motion.div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full md:w-1/2 flex justify-center items-center">
          <AnimatedForm
            {...formFields}
            onSubmit={handleSubmit}
            goTo={goToLogin}
            googleLogin={referralId ? undefined : "Sign up with Google"}
            onGoogleClick={referralId ? undefined : handleGoogleSignUp}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default Register;
