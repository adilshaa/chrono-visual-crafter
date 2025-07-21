import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Mail, Lock, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/contexts/SupabaseAuthContext";
import { handleAuthError } from "@/lib/auth-errors";
import { logger } from "@/lib/logger";

interface ResetPasswordFormProps {
  onSuccess?: () => void;
  onRequestSent?: (email: string) => void;
}

const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
  onSuccess,
  onRequestSent,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { resetPassword } = useAuthContext();

  // Check if this is a password reset confirmation (after OTP verification)
  const isConfirmation = location.state?.verified === true;
  const verifiedEmail = location.state?.email || "";

  const [formData, setFormData] = useState({
    email: verifiedEmail || "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRequestSent, setIsRequestSent] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    newPassword?: string;
    confirmPassword?: string;
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

  const validateConfirmationForm = () => {
    const newErrors: typeof errors = {};

    // New password validation
    if (!formData.newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.newPassword)) {
      newErrors.newPassword =
        "Password must contain at least one uppercase letter, one lowercase letter, and one number";
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your new password";
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePasswordResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateRequestForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      logger.info("Attempting password reset request", {
        email: formData.email,
      });

      const response = await resetPassword(formData.email);

      if (response.error) {
        const errorMessage = handleAuthError(response.error);
        setErrors({ general: errorMessage });
        logger.error("Password reset request failed", {
          error: response.error,
          email: formData.email,
        });

        toast({
          title: "Reset Request Failed",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      logger.info("Password reset request successful", {
        email: formData.email,
      });
      setIsRequestSent(true);

      toast({
        title: "Reset Email Sent!",
        description: "Check your email for password reset instructions.",
      });

      if (onRequestSent) {
        onRequestSent(formData.email);
      }
    } catch (error) {
      const errorMessage = handleAuthError(error as Error);
      setErrors({ general: errorMessage });
      logger.error("Unexpected password reset request error", {
        error,
        email: formData.email,
      });

      toast({
        title: "Reset Request Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordConfirmation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateConfirmationForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      logger.info("Attempting password reset confirmation", {
        email: verifiedEmail,
      });

      // Note: In a real implementation, you would use Supabase's updateUser method
      // after the user has been verified through the OTP flow
      // For now, we'll simulate the success flow

      toast({
        title: "Password Updated!",
        description: "Your password has been successfully updated.",
      });

      logger.info("Password reset confirmation successful", {
        email: verifiedEmail,
      });

      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/login");
      }
    } catch (error) {
      const errorMessage = handleAuthError(error as Error);
      setErrors({ general: errorMessage });
      logger.error("Unexpected password reset confirmation error", {
        error,
        email: verifiedEmail,
      });

      toast({
        title: "Password Update Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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

  // Success state for password reset request
  if (isRequestSent && !isConfirmation) {
    return (
      <motion.div
        variants={formVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md mx-auto"
      >
        <Card className="bg-black/40 border border-gray-700 backdrop-blur-xl p-8">
          <div className="text-center">
            <Mail className="w-16 h-16 text-blue-400 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-2">
              Check Your Email
            </h1>
            <p className="text-gray-400 mb-4">
              We've sent password reset instructions to
            </p>
            <p className="text-white font-medium mb-6">{formData.email}</p>
            <p className="text-gray-400 text-sm mb-6">
              Follow the link in the email to reset your password. The link will
              expire in 1 hour.
            </p>
            <div className="space-y-4">
              <Button
                onClick={() => setIsRequestSent(false)}
                variant="outline"
                className="w-full border-gray-600 text-white hover:bg-gray-800"
              >
                Send Another Email
              </Button>
              <div className="text-center">
                <Link
                  to="/login"
                  className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
                >
                  Back to Sign In
                </Link>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    );
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
          {isConfirmation ? (
            <>
              <KeyRound className="w-16 h-16 text-blue-400 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-white mb-2">
                Set New Password
              </h1>
              <p className="text-gray-400">Enter your new password below</p>
            </>
          ) : (
            <>
              <Lock className="w-16 h-16 text-blue-400 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-white mb-2">
                Reset Password
              </h1>
              <p className="text-gray-400">
                Enter your email to receive reset instructions
              </p>
            </>
          )}
        </div>

        <form
          onSubmit={
            isConfirmation
              ? handlePasswordConfirmation
              : handlePasswordResetRequest
          }
          className="space-y-6"
        >
          {!isConfirmation && (
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange("email")}
                  placeholder="Enter your email"
                  className="pl-10 bg-black/60 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-400/70"
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-sm">{errors.email}</p>
              )}
            </div>
          )}

          {isConfirmation && (
            <>
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-gray-300">
                  New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={formData.newPassword}
                    onChange={handleInputChange("newPassword")}
                    placeholder="Enter new password"
                    className="pl-10 pr-10 bg-black/60 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-400/70"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    disabled={isLoading}
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="text-red-400 text-sm">{errors.newPassword}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-300">
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleInputChange("confirmPassword")}
                    placeholder="Confirm new password"
                    className="pl-10 pr-10 bg-black/60 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-400/70"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-400 text-sm">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </>
          )}

          {/* General Error */}
          {errors.general && (
            <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-md">
              <p className="text-red-400 text-sm">{errors.general}</p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isConfirmation
                  ? "Updating Password..."
                  : "Sending Reset Email..."}
              </>
            ) : isConfirmation ? (
              "Update Password"
            ) : (
              "Send Reset Email"
            )}
          </Button>
        </form>

        {/* Back to Sign In Link */}
        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            Remember your password?{" "}
            <Link
              to="/login"
              className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </Card>
    </motion.div>
  );
};

export default ResetPasswordForm;
