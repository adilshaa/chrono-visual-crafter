# Theme System Documentation

## Overview

The theme system provides a robust dark and light theme implementation for the application. It features:

- Theme persistence with localStorage
- System preference detection
- Smooth transitions between themes
- CSS variable-based styling
- Support for both dark and light modes
- Utility functions for theme-conditional styling

## Usage

### ThemeContext

The core of the theme system is the `ThemeContext` and `ThemeProvider`. The provider must wrap your application to enable theme functionality.

```tsx
// main.tsx
import { ThemeProvider } from "./contexts/ThemeContext";

root.render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
);
```

### Using the theme in components

You can access the theme context in two ways:

#### 1. Direct context usage

```tsx
import { useTheme } from "@/contexts/ThemeContext";

function MyComponent() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div>
      <p>Current theme: {theme}</p>
      <button onClick={toggleTheme}>Toggle Theme</button>
    </div>
  );
}
```

#### 2. Enhanced hook usage (recommended)

```tsx
import { useTheme } from "@/hooks/useTheme";

function MyComponent() {
  const { isDark, toggleTheme, getThemeClass } = useTheme();

  return (
    <div
      className={getThemeClass("bg-black text-white", "bg-white text-black")}
    >
      <p>This component uses {isDark ? "dark" : "light"} theme</p>
      <button onClick={toggleTheme}>Toggle Theme</button>
    </div>
  );
}
```

### ThemeToggle Component

The application includes a ready-to-use theme toggle component with two variants:

```tsx
import { ThemeToggle } from "@/components/ui/theme-toggle";

// Icon variant (default)
<ThemeToggle />

// Button variant with text
<ThemeToggle variant="button" />
```

## CSS Variables

The theme system uses CSS variables defined in `index.css` for consistent styling. Use these variables in your components for theme-aware styling:

```css
.my-component {
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
  border: 1px solid hsl(var(--border));
}
```

## Utility Classes

Several utility classes are available for common theme-related styling:

- `glass` - Applies a glass-morphism effect based on the current theme
- `glass-card` - A card variant with glass-morphism
- `custom-scrollbar` - Themed scrollbar styles

## Best Practices

1. **Use CSS variables**: Instead of hardcoding colors, use the theme CSS variables.

2. **Use the `cn` utility**: Combine with conditional classes based on theme.

   ```tsx
   import { cn } from "@/lib/utils";
   import { useTheme } from "@/hooks/useTheme";

   function MyComponent() {
     const { isDark } = useTheme();

     return (
       <div
         className={cn(
           "p-4 rounded-lg",
           isDark ? "bg-gray-900 text-white" : "bg-white text-gray-900"
         )}
       >
         Content
       </div>
     );
   }
   ```

3. **Theme transitions**: All elements have a default transition for theme properties. You can customize this for specific components if needed.

4. **Testing both themes**: Always test your components in both dark and light mode to ensure proper styling.

## Adding New Theme Variables

To add new theme variables:

1. Add the variable to both the dark and light theme sections in `index.css`.
2. Use the variable in your components via `hsl(var(--your-variable))`.

## Troubleshooting

- If components don't update with theme changes, ensure they're wrapped by the ThemeProvider.
- For components that need to avoid hydration mismatch, use the mounted state pattern like in ThemeToggle.tsx.
