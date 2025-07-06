import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  variant?: "icon" | "button";
}

export function ThemeToggle({ className, variant = "icon" }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // After mounting, we can safely show the toggle
  // This avoids hydration mismatch issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // If not mounted yet, render a placeholder to avoid layout shift
  if (!mounted) {
    return (
      <div
        className={cn(
          variant === "icon" ? "w-9 h-9" : "px-4 py-2 rounded-md",
          "opacity-0"
        )}
      />
    );
  }

  if (variant === "button") {
    return (
      <Button
        variant="outline"
        size="sm"
        className={cn(
          "gap-2 px-4 py-2 rounded-md",
          theme === "dark"
            ? "bg-gray-900/80 hover:bg-gray-900"
            : "bg-white hover:bg-gray-100",
          className
        )}
        onClick={toggleTheme}
      >
        {theme === "dark" ? (
          <>
            <Sun className="h-4 w-4" />
            <span>Light</span>
          </>
        ) : (
          <>
            <Moon className="h-4 w-4" />
            <span>Dark</span>
          </>
        )}
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "w-9 h-9 rounded-full",
        theme === "dark"
          ? "bg-transparent hover:bg-gray-800"
          : "bg-transparent hover:bg-gray-200",
        className
      )}
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5 transition-all" />
      ) : (
        <Moon className="h-5 w-5 transition-all" />
      )}
    </Button>
  );
}
