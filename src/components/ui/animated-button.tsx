import React, { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AnimatedButtonProps {
  children: ReactNode;
  variant?: "glow" | "shimmer" | "outline" | "ghost" | "default";
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  fullWidth?: boolean;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  variant = "default",
  size = "md",
  className,
  onClick,
  disabled = false,
  type = "button",
  fullWidth = false,
}) => {
  const baseStyles =
    "relative font-medium transition-all duration-300 overflow-hidden";

  const sizeStyles = {
    sm: "py-1.5 px-3 text-sm",
    md: "py-2 px-4",
    lg: "py-3 px-6 text-lg",
  };

  const variantStyles = {
    glow: "bg-black text-white border border-islandblue-400 hover:bg-islandblue-900 animate-pulse-glow",
    shimmer:
      "bg-black text-white border border-gray-700 hover:border-islandblue-400/50 before:absolute before:inset-0 before:bg-shimmer-gradient before:animate-shimmer before:content-[''] before:z-0",
    outline:
      "bg-transparent text-white border border-islandblue-400/50 hover:bg-islandblue-900/30 hover:border-islandblue-400",
    ghost:
      "bg-transparent text-white hover:bg-white/5 hover:text-islandblue-300",
    default: "bg-islandblue-600 text-white hover:bg-islandblue-700",
  };

  const fullWidthStyle = fullWidth ? "w-full" : "";

  return (
    <Button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        fullWidthStyle,
        className
      )}
    >
      <span className="relative z-10">{children}</span>
    </Button>
  );
};

export default AnimatedButton;
