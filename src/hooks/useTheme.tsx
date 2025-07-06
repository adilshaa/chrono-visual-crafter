import { useTheme as useThemeContext } from "@/contexts/ThemeContext";

/**
 * Custom hook for using theme functionality throughout the application
 * This exports the theme and toggleTheme function from ThemeContext
 * Additionally provides helper functions and values
 */
export function useTheme() {
  const context = useThemeContext();

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  const { theme, toggleTheme } = context;
  const isDark = theme === "dark";
  const isLight = theme === "light";

  // Helper function to get theme-conditional classes
  const getThemeClass = (darkClass: string, lightClass: string) => {
    return isDark ? darkClass : lightClass;
  };

  // Helper function to get conditional styles
  const getThemeStyle = <T,>(darkStyle: T, lightStyle: T) => {
    return isDark ? darkStyle : lightStyle;
  };

  return {
    theme,
    toggleTheme,
    isDark,
    isLight,
    getThemeClass,
    getThemeStyle,
  };
}

export default useTheme;
