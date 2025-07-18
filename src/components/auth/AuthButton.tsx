import React from "react";
import { SignInButton, SignUpButton, useUser } from "@clerk/clerk-react";
import { Button as NeonButton } from "@/components/ui/neon-button";
import { motion } from "framer-motion";
import { LogIn, UserPlus } from "lucide-react";
import UserMenu from "@/components/user/UserMenu";
import { useNavigate } from "react-router-dom";

interface AuthButtonProps {
  mode?: "signin" | "signup" | "user";
  className?: string;
  variant?: "default" | "solid" | "ghost";
  neon?: boolean;
}
const AuthButton: React.FC<AuthButtonProps> = ({
  mode = "signin",
  className = "",
  variant = "default",
  neon = true,
}) => {
  const navigate = useNavigate();
  const { isSignedIn } = useUser();

  const handleRedirect = () => {
    // Navigate to the studio page
    navigate("/studio");
  };
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
          <NeonButton variant={variant} className={className} neon={neon}>
            <UserPlus className="w-4 h-4 mr-2" />
            Sign Up
          </NeonButton>
        </motion.div>
      </SignUpButton>
    );
  }

  return (
    // <SignInButton mode="modal">
    <div onClick={() => handleRedirect()}>
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <NeonButton variant={variant} className={className} neon={neon}>
          Get started
        </NeonButton>
      </motion.div>
    </div>
  );
};

export default AuthButton;
