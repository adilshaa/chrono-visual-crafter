import React from "react";
import { useNavigate } from "react-router-dom";
import { Button as NeonButton } from "@/components/ui/neon-button";
import { motion } from "framer-motion";
import { LogIn, UserPlus } from "lucide-react";
import UserMenu from "@/components/user/UserMenu";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

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
  const { isSignedIn } = useSupabaseAuth();
  const navigate = useNavigate();

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
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <NeonButton
          variant={variant}
          className={className}
          neon={neon}
          onClick={() => navigate("/register")}
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Sign Up
        </NeonButton>
      </motion.div>
    );
  }

  return (
    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
      <NeonButton
        variant={variant}
        className={className}
        neon={neon}
        onClick={() => navigate("/login")}
      >
        Sign In
      </NeonButton>
    </motion.div>
  );
};

export default AuthButton;
