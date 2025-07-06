import React from "react";
import { UserManagementDashboard } from "@/components/user/UserManagementDashboard";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { motion } from "framer-motion";

const UserManagement = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Wait for auth to initialize
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="flex flex-col items-center">
          <motion.div
            className="h-12 w-12 rounded-full border-t-2 border-b-2 border-indigo-500"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p className="mt-4 text-white/50">Loading account...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // The UserManagementDashboard now handles its own background, header and styling
  return <UserManagementDashboard />;
};

export default UserManagement;
