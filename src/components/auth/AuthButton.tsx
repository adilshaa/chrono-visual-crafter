import React from "react";
import { SignInButton, SignUpButton, useUser } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { LogIn, UserPlus } from "lucide-react";
import UserMenu from "@/components/user/UserMenu";

interface AuthButtonProps {
  mode?: "signin" | "signup" | "user";
  className?: string;
  variant?: "default" | "outline" | "ghost";
}

const AuthButton: React.FC<AuthButtonProps> = ({
  mode = "signin",
  className = "",
  variant = "default",
}) => {
  const { isSignedIn } = useUser();

  if (isSignedIn) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className={className}
      >
        <UserMenu />
      </motion.div>
    );
  }

  if (mode === "signup") {
    return (
      <SignUpButton mode="modal">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button variant={variant} className={className}>
            <UserPlus className="w-4 h-4 mr-2" />
            Sign Up
          </Button>
        </motion.div>
      </SignUpButton>
    );
  }

  return (
    <SignInButton mode="modal">
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button variant={variant} className={className}>
          <LogIn className="w-4 h-4 mr-2" />
          Sign In
        </Button>
      </motion.div>
    </SignInButton>
  );
};

export default AuthButton;
