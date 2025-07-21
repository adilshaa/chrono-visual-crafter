import { AuthError } from "@supabase/supabase-js";

export interface AuthErrorInfo {
  code: string;
  message: string;
  details?: any;
}

export const handleAuthError = (error: AuthError | Error): string => {
  // Handle Supabase AuthError
  if ("status" in error && "message" in error) {
    const authError = error as AuthError;

    switch (authError.message) {
      case "Invalid login credentials":
        return "Invalid email or password. Please check your credentials and try again.";
      case "Email not confirmed":
        return "Please check your email and confirm your account before signing in.";
      case "Signup disabled":
        return "Account registration is currently disabled. Please contact support.";
      case "User already registered":
        return "An account with this email already exists. Please sign in instead.";
      case "Password should be at least 6 characters":
        return "Password must be at least 6 characters long.";
      case "Unable to validate email address: invalid format":
        return "Please enter a valid email address.";
      case "Token has expired or is invalid":
        return "The verification code has expired. Please request a new one.";
      case "Email rate limit exceeded":
        return "Too many emails sent. Please wait before requesting another verification code.";
      case "For security purposes, you can only request this once every 60 seconds":
        return "Please wait 60 seconds before requesting another verification code.";
      default:
        return (
          authError.message ||
          "An authentication error occurred. Please try again."
        );
    }
  }

  // Handle generic errors
  return error.message || "An unexpected error occurred. Please try again.";
};

export const getAuthErrorCode = (error: AuthError | Error): string => {
  if ("status" in error) {
    return `AUTH_${error.status}`;
  }
  return "AUTH_UNKNOWN";
};

export const isAuthError = (error: any): error is AuthError => {
  return (
    error &&
    typeof error === "object" &&
    "status" in error &&
    "message" in error
  );
};
