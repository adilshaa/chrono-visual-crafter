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
    const message = authError.message || "";

    // Check for common error patterns
    if (message.includes("Invalid login credentials")) {
      return "Invalid email or password. Please check your credentials and try again.";
    } else if (message.includes("Email not confirmed")) {
      return "Please check your email and confirm your account before signing in.";
    } else if (message.includes("Signup disabled")) {
      return "Account registration is currently disabled. Please contact support.";
    } else if (
      message.includes("User already registered") ||
      message.includes("already in use")
    ) {
      return "An account with this email already exists. Please sign in instead.";
    } else if (message.includes("Password should be at least 6 characters")) {
      return "Password must be at least 6 characters long.";
    } else if (message.includes("Unable to validate email address")) {
      return "Please enter a valid email address.";
    } else if (
      message.includes("Token has expired") ||
      message.includes("invalid token")
    ) {
      return "The verification code has expired. Please request a new one.";
    } else if (message.includes("Email rate limit exceeded")) {
      return "Too many emails sent. Please wait before requesting another verification code.";
    } else if (
      message.includes(
        "For security purposes, you can only request this once every 60 seconds"
      )
    ) {
      return "Please wait 60 seconds before requesting another verification code.";
    } else if (message.includes("OAuth provider error")) {
      return "There was an error connecting to the authentication provider. Please try again.";
    } else if (message.includes("User not found")) {
      return "No account found with this email. Please sign up first.";
    } else {
      return message || "An authentication error occurred. Please try again.";
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
