import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/SupabaseAuthContext";

interface PublicRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * Public route component that redirects authenticated users to a specified route
 * Used for pages like login and register that should only be accessible to non-authenticated users
 */
const PublicRoute: React.FC<PublicRouteProps> = ({
  children,
  redirectTo = "/studio",
}) => {
  const { user, loading } = useAuthContext();

  // While checking authentication status, show nothing or a loading indicator
  if (loading) {
    return null; // Or return a loading spinner
  }

  // If user is authenticated, redirect to the specified route
  if (user) {
    return <Navigate to={redirectTo} replace />;
  }

  // Otherwise, render the children (the public page)
  return <>{children}</>;
};

export default PublicRoute;
