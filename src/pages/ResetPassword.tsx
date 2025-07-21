import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/contexts/SupabaseAuthContext";
import { handleAuthError } from "@/lib/auth-errors";
import { logger } from "@/lib/logger";
import { AnimatedForm } from "@/components/ui/modern-animated-sign-in";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { resetPassword } = useAuthContext();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<"request" | "reset">("request");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});

  // Check if we're in password reset mode (callback from email)
  useEffect(() => {
    const handlePasswordResetCallback = async () => {
      // Check if we have URL hash parameters
      if (location.hash) {
        const hashParams = new URLSearchParams(location.hash.substring(1));
        const accessToken = hashParams.get("access_token");
        const type = hashParams.get("type");

        if (accessToken && type === "recovery") {
          logger.info("Password reset callback detected", {
            type,
            hasAccessToken: !!accessToken,
          });

          // Simply switch to reset mode - the session will be handled by Supabase automatically
          // or we'll handle the session in the password update function
          setMode("reset");
          setErrors({});

          logger.info(
            "Switched to reset mode, session will be handled during password update"
          );
        }
      }
    };

    handlePasswordResetCallback();
  }, [location]);

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
      if (field === "email") {
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

  const validateRequestForm = () => {
    const newErrors: typeof errors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateResetForm = () => {
    const newErrors: typeof errors = {};

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

  const handleRequestSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateRequestForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      logger.info("Requesting password reset", { email: formData.email });

      const response = await resetPassword(formData.email);

      if (response.error) {
        const errorMessage = handleAuthError(response.error);
        setErrors({ general: errorMessage });
        logger.error("Password reset request failed", {
          error: response.error,
          email: formData.email,
        });
        return;
      }

      logger.info("Password reset email sent", { email: formData.email });

      toast({
        title: "Reset Email Sent",
        description: "Check your email for password reset instructions.",
      });

      // Show success message
      setErrors({});
      setFormData({ email: "", password: "", confirmPassword: "" });
    } catch (error) {
      const errorMessage = handleAuthError(error as Error);
      setErrors({ general: errorMessage });
      logger.error("Unexpected password reset error", {
        error,
        email: formData.email,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateResetForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      logger.info("Updating password with recovery flow");

      // Get the recovery token from URL hash
      const hashParams = new URLSearchParams(location.hash.substring(1));
      const accessToken = hashParams.get("access_token");
      const type = hashParams.get("type");

      if (!accessToken || type !== "recovery") {
        setErrors({
          general: "Invalid reset link. Please request a new password reset.",
        });
        return;
      }

      // Use the recovery token directly with updateUser
      // First, we need to verify the OTP token to establish the session
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: accessToken,
        type: "recovery",
      });

      if (verifyError) {
        logger.error("Failed to verify recovery token", { error: verifyError });
        setErrors({
          general:
            "Invalid or expired reset link. Please request a new password reset.",
        });
        return;
      }

      if (!data.session) {
        logger.error("No session created from recovery token");
        setErrors({
          general: "Failed to establish reset session. Please try again.",
        });
        return;
      }

      logger.info("Recovery session established", {
        userId: data.session.user?.id,
      });

      // Now update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.password,
      });

      if (updateError) {
        const errorMessage = handleAuthError(updateError);
        setErrors({ general: errorMessage });
        logger.error("Password update failed", { error: updateError });
        return;
      }

      logger.info("Password updated successfully");

      toast({
        title: "Password Updated",
        description: "Your password has been successfully updated.",
      });

      // Clear the URL hash to remove tokens
      window.history.replaceState(null, "", window.location.pathname);

      // Navigate to login page
      navigate("/login");
    } catch (error) {
      const errorMessage = handleAuthError(error as Error);
      setErrors({ general: errorMessage });
      logger.error("Unexpected password update error", { error });
    } finally {
      setIsLoading(false);
    }
  };

  const goToLogin = () => {
    navigate("/login");
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

  // Form fields for password reset request
  const requestFormFields = {
    header: "Reset Password",
    subHeader: "Enter your email address and we'll send you a reset link",
    fields: [
      {
        label: "Email",
        required: true,
        type: "email" as const,
        placeholder: "Enter your email address",
        onChange: handleInputChange("email"),
        error: errors.email,
      },
    ],
    submitButton: isLoading ? "Sending..." : "Send Reset Link",
    textVariantButton: "Back to Sign In",
    errorField: errors.general,
  };

  // Form fields for new password
  const resetFormFields = {
    header: "Set New Password",
    subHeader: "Enter your new password below",
    fields: [
      {
        label: "New Password",
        required: true,
        type: "password" as const,
        placeholder: "Enter your new password",
        onChange: handleInputChange("password"),
        error: errors.password,
      },
      {
        label: "Confirm Password",
        required: true,
        type: "password" as const,
        placeholder: "Confirm your new password",
        onChange: handleInputChange("confirmPassword"),
        error: errors.confirmPassword,
      },
    ],
    submitButton: isLoading ? "Updating..." : "Update Password",
    textVariantButton: "Back to Sign In",
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
              {mode === "reset" ? "Almost There" : "Forgot Password?"}
            </h1>
            <p className="text-xl text-gray-300 italic max-w-md mx-auto">
              {mode === "reset"
                ? "Set your new password and get back to creating amazing content."
                : "Don't worry, it happens to the best of us. Let's get you back on track."}
            </p>
          </motion.div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full md:w-1/2 flex justify-center items-center">
          <AnimatedForm
            {...(mode === "reset" ? resetFormFields : requestFormFields)}
            onSubmit={
              mode === "reset" ? handleResetSubmit : handleRequestSubmit
            }
            goTo={goToLogin}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default ResetPassword;
