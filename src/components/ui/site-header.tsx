import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useUser } from "@clerk/clerk-react";
import AuthButton from "@/components/auth/AuthButton";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

interface SiteHeaderProps {
  className?: string;
  transparent?: boolean;
  showThemeToggle?: boolean;
  showAuthButton?: boolean;
  showNavLinks?: boolean;
}

export function SiteHeader({
  className,
  transparent = false,
  showThemeToggle = true,
  showAuthButton = true,
  showNavLinks = true,
}: SiteHeaderProps) {
  const navigate = useNavigate();
  const { isSignedIn } = useUser();
  const { theme } = useTheme();

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative z-20 flex justify-between items-center p-6",
        transparent
          ? "bg-transparent"
          : theme === "dark"
          ? "bg-black/40 backdrop-blur-md border-b border-white/5"
          : "bg-white/40 backdrop-blur-md border-b border-black/5",
        className
      )}
    >
      <motion.div
        whileHover={{ scale: 1.05 }}
        onClick={() => navigate("/")}
        className={cn(
          "text-2xl font-bold bg-clip-text text-transparent cursor-pointer",
          theme === "dark"
            ? "bg-gradient-to-r from-white to-white/80"
            : "bg-gradient-to-r from-gray-800 to-gray-600"
        )}
      >
        Timer Studio
      </motion.div>

      {showNavLinks && (
        <div className="hidden md:flex items-center space-x-8">
          <motion.a
            whileHover={{ y: -2 }}
            className={cn(
              "hover:text-primary text-sm transition-colors",
              theme === "dark" ? "text-white/70" : "text-gray-700"
            )}
            href="#features"
          >
            Features
          </motion.a>
          <motion.a
            whileHover={{ y: -2 }}
            className={cn(
              "hover:text-primary text-sm transition-colors",
              theme === "dark" ? "text-white/70" : "text-gray-700"
            )}
            href="#pricing"
          >
            Pricing
          </motion.a>
          <motion.a
            whileHover={{ y: -2 }}
            className={cn(
              "hover:text-primary text-sm transition-colors",
              theme === "dark" ? "text-white/70" : "text-gray-700"
            )}
            href="#testimonials"
          >
            Testimonials
          </motion.a>
        </div>
      )}

      <div className="flex items-center space-x-4">
        {showThemeToggle && <ThemeToggle />}

        {showAuthButton && (
          <AuthButton
            mode="signin"
            variant="outline"
            className={cn(
              "backdrop-blur-sm text-sm",
              theme === "dark"
                ? "border border-white/10 bg-white/5 text-white hover:bg-white/10"
                : "border border-black/10 bg-black/5 text-gray-800 hover:bg-black/10"
            )}
          />
        )}
      </div>
    </motion.nav>
  );
}

export default SiteHeader;
