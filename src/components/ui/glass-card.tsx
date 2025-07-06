import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  variant?: "pulsing" | "shimmer" | "floating" | "breathing" | "default";
  hoverEffect?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className,
  variant = "default",
  hoverEffect = true,
}) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Base styles using the glass-card class that already has theme support
  const baseStyles = "glass-card relative rounded-xl overflow-hidden";

  const variantStyles = {
    pulsing: isDark ? "animate-pulse-glow" : "animate-pulse-glow",
    shimmer:
      "before:absolute before:inset-0 before:bg-shimmer-gradient before:animate-shimmer before:content-[''] before:z-0",
    floating: "animate-float",
    breathing: "animate-breathe",
    default: "",
  };

  const hoverStyles = hoverEffect
    ? isDark
      ? "hover:border-primary/50 transition-all duration-300"
      : "hover:border-primary/70 transition-all duration-300"
    : "";

  return (
    <div
      className={cn(baseStyles, variantStyles[variant], hoverStyles, className)}
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default GlassCard;
