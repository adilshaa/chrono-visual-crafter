import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useUser } from "@clerk/clerk-react";
import AuthButton from "@/components/auth/AuthButton";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import UserMenu from "../user/UserMenu";

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
  const location = useLocation();
  const { isSignedIn, user } = useUser();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Check if we're on the landing page
  const isLandingPage = location.pathname === "/";

  return (
    <header
      className={cn(
        "w-full",
        isLandingPage
          ? "absolute top-0 z-50" // Static positioning for landing page
          : "sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" // Sticky with background for other pages
      )}
    >
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
        <div className="flex items-center">
          <a className="mr-6 flex items-center space-x-2" href="/">
            <span className="font-bold sm:inline-block">Countable</span>
          </a>
        </div>

        <div className="flex items-center space-x-4">
          {showNavLinks && (
            <Button
              variant="ghost"
              className="px-0 hover:bg-transparent hover:text-foreground"
              onClick={() => navigate("/studio")}
            >
              Go to Studio
            </Button>
          )}
          <ThemeToggle />
          {isSignedIn ? (
            <UserMenu />
          ) : (
            <motion.button
              onClick={() => navigate("/auth")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-2 rounded-full bg-gradient-to-r from-indigo-500 to-rose-500 text-white font-medium shadow-lg shadow-indigo-500/20"
            >
              Sign In
            </motion.button>
          )}
        </div>
      </div>
    </header>
  );
}

export default SiteHeader;
