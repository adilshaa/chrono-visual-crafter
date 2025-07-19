import React, {
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";

interface CounterPreviewProps {
  settings: {
    startValue: number;
    endValue: number;
    duration: number;
    fontFamily: string;
    fontSize: number;
    fontWeight?: number;
    letterSpacing?: number;
    design: string;
    background: string;
    speed: number;
    customFont: string;
    transition: string;
    easing: string;
    prefix: string;
    suffix: string;
    separator: string;
    backgroundGradient?: string;
    customBackgroundColor?: string;
    textColor?: string;
    countDirection?: string;
    useFloatValues: boolean;
    fontStretch?: number;
    strokeWidth?: number;
    strokeColor?: string;
    counterOpacity?: number;
  };
  textSettings: {
    enabled: boolean;
    text: string;
    position: string;
    fontSize: number;
    fontFamily: string;
    color: string;
    offsetX: number;
    offsetY: number;
    opacity: number;
  };
  designSettings: {
    neonColor: string;
    neonIntensity: number;
    glowColor: string;
    glowIntensity: number;
    gradientColors: string;
    fireColors: string;
    fireGlow: number;
    rainbowColors: string;
    chromeColors: string;
  };
  currentValue: number;
  isRecording: boolean;
  formatNumber: (value: number) => string;
}

// Import shared utilities for consistency
import { easingFunctions } from "../utils/sharedCounterUtils";
import { performanceMonitor } from "../utils/performanceMonitor";
import { performanceOptimizer } from "../utils/performanceOptimizer";

const CounterPreview = forwardRef<HTMLCanvasElement, CounterPreviewProps>(
  (
    {
      settings,
      textSettings,
      designSettings,
      currentValue,
      isRecording,
      formatNumber,
    },
    ref
  ) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>();
    const lastValueRef = useRef<number>(settings.startValue);
    const transitionStartTimeRef = useRef<number>(0);
    const digitTransitionsRef = useRef<
      Map<number, { oldDigit: string; newDigit: string; startTime: number }>
    >(new Map());

    // Performance monitoring refs
    const frameCountRef = useRef<number>(0);
    const lastFPSCheckRef = useRef<number>(0);
    const currentFPSRef = useRef<number>(60);
    const performanceOptimizedRef = useRef<boolean>(false);
    const renderStartTimeRef = useRef<number>(0);

    useImperativeHandle(ref, () => canvasRef.current!);

    const loadGoogleFont = (fontName: string) => {
      if (!fontName) return Promise.resolve();

      const link = document.createElement("link");
      link.href = `https://fonts.googleapis.com/css2?family=${fontName
        .replace(/\s+/g, "+")
        .replace(/[^a-zA-Z0-9+]/g, "")}:wght@400;700&display=swap`;
      link.rel = "stylesheet";

      if (!document.querySelector(`link[href="${link.href}"]`)) {
        document.head.appendChild(link);
      }

      return new Promise<void>((resolve) => {
        setTimeout(resolve, 100);
      });
    };

    const getFontFamily = (fontKey: string, customFont: string) => {
      if (customFont) return `"${customFont}", sans-serif`;

      const fontMap = {
        inter: '"Inter", sans-serif',
        mono: '"Roboto Mono", monospace',
        poppins: '"Poppins", sans-serif',
        orbitron: '"Orbitron", monospace',
        rajdhani: '"Rajdhani", sans-serif',
        exo: '"Exo 2", sans-serif',
        play: '"Play", sans-serif',
        russo: '"Russo One", sans-serif',
        audiowide: '"Audiowide", monospace',
        michroma: '"Michroma", monospace',
        roboto: '"Roboto", sans-serif',
        montserrat: '"Montserrat", sans-serif',
        arial: '"Arial", sans-serif',
      };

      return fontMap[fontKey] || '"Inter", sans-serif';
    };

    const updateDigitTransitions = (newValue: number) => {
      const currentText = formatNumber(newValue);
      const previousText = formatNumber(lastValueRef.current);
      const currentTime = Date.now();

      // Clear old transitions that are complete
      const transitionsToRemove: number[] = [];
      digitTransitionsRef.current.forEach((transition, index) => {
        if (currentTime - transition.startTime > 500) {
          // 500ms transition duration
          transitionsToRemove.push(index);
        }
      });
      transitionsToRemove.forEach((index) =>
        digitTransitionsRef.current.delete(index)
      );

      // Add new transitions for changed digits
      const maxLength = Math.max(currentText.length, previousText.length);
      for (let i = 0; i < maxLength; i++) {
        const currentDigit = currentText[i] || "";
        const previousDigit = previousText[i] || "";

        if (
          currentDigit !== previousDigit &&
          !digitTransitionsRef.current.has(i)
        ) {
          digitTransitionsRef.current.set(i, {
            oldDigit: previousDigit,
            newDigit: currentDigit,
            startTime: currentTime,
          });
        }
      }
    };

    const applyDigitTransition = (
      ctx: CanvasRenderingContext2D,
      digit: string,
      x: number,
      y: number,
      fontSize: number,
      transitionProgress: number,
      transitionType: string
    ): { x: number; y: number; opacity: number } => {
      const effects = {
        none: () => ({ x, y, opacity: 1 }),

        fadeIn: () => {
          const easeInOutCubic =
            transitionProgress < 0.5
              ? 4 * transitionProgress * transitionProgress * transitionProgress
              : 1 - Math.pow(-2 * transitionProgress + 2, 3) / 2;
          return { x, y, opacity: easeInOutCubic };
        },

        glitch: () => {
          if (transitionProgress < 0.8 && Math.random() > 0.7) {
            const glitchX = (Math.random() - 0.5) * 10;
            const glitchY = (Math.random() - 0.5) * 10;
            return {
              x: x + glitchX,
              y: y + glitchY,
              opacity: 0.7 + Math.random() * 0.3,
            };
          }
          return { x, y, opacity: 0.7 + transitionProgress * 0.3 };
        },

        blur: () => {
          return { x, y, opacity: transitionProgress };
        },

        typewriter: () => {
          return { x, y, opacity: 1 };
        },

        "hologram-flicker": () => {
          // Hologram flicker effect with scan lines
          const time = Date.now() * 0.01;
          const flicker = Math.sin(time * 3) * 0.2 + 0.8;
          const scanLine = Math.sin(y * 0.1 + time) * 0.1;

          // RGB separation effect
          const separation = (1 - transitionProgress) * 2;
          ctx.save();

          // Red channel
          ctx.globalCompositeOperation = "screen";
          ctx.fillStyle = `rgba(255, 0, 0, ${0.3 * flicker})`;
          ctx.fillText(digit, x - separation, y);

          // Blue channel
          ctx.fillStyle = `rgba(0, 0, 255, ${0.3 * flicker})`;
          ctx.fillText(digit, x + separation, y);

          ctx.restore();

          return {
            x,
            y: y + scanLine,
            opacity: flicker * transitionProgress,
          };
        },
      };

      const effect =
        effects[transitionType as keyof typeof effects] || effects.none;
      return effect();
    };

    const createGradient = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      fontSize: number,
      type: string
    ) => {
      let gradient;

      switch (type) {
        case "rainbow":
          gradient = ctx.createLinearGradient(
            x - fontSize,
            y - fontSize / 2,
            x + fontSize,
            y + fontSize / 2
          );
          gradient.addColorStop(0, "#FF0000");
          gradient.addColorStop(0.17, "#FF8800");
          gradient.addColorStop(0.33, "#FFFF00");
          gradient.addColorStop(0.5, "#00FF00");
          gradient.addColorStop(0.67, "#0088FF");
          gradient.addColorStop(0.83, "#8800FF");
          gradient.addColorStop(1, "#FF0088");
          break;
        case "fire":
          gradient = ctx.createLinearGradient(
            x,
            y - fontSize / 2,
            x,
            y + fontSize / 2
          );
          gradient.addColorStop(0, "#FF4444");
          gradient.addColorStop(0.5, "#FF8800");
          gradient.addColorStop(1, "#FFFF00");
          break;
        case "ocean":
          gradient = ctx.createLinearGradient(
            x,
            y - fontSize / 2,
            x,
            y + fontSize / 2
          );
          gradient.addColorStop(0, "#00AAFF");
          gradient.addColorStop(0.5, "#0066CC");
          gradient.addColorStop(1, "#003388");
          break;
        case "sunset":
          gradient = ctx.createLinearGradient(
            x,
            y - fontSize / 2,
            x,
            y + fontSize / 2
          );
          gradient.addColorStop(0, "#FF6B6B");
          gradient.addColorStop(0.5, "#FF8E53");
          gradient.addColorStop(1, "#FF6B9D");
          break;
        default:
          gradient = ctx.createLinearGradient(
            x - fontSize,
            y - fontSize / 2,
            x + fontSize,
            y + fontSize / 2
          );
          gradient.addColorStop(0, "#FF6B6B");
          gradient.addColorStop(0.25, "#4ECDC4");
          gradient.addColorStop(0.5, "#45B7D1");
          gradient.addColorStop(0.75, "#96CEB4");
          gradient.addColorStop(1, "#FFEAA7");
      }

      return gradient;
    };

    const applyDesignEffects = (
      ctx: CanvasRenderingContext2D,
      text: string,
      x: number,
      y: number,
      fontSize: number
    ) => {
      const effects = {
        classic: () => {
          // Use the custom text color if provided, otherwise use default based on background
          ctx.fillStyle =
            settings.textColor ||
            (settings.background === "white" ? "#000000" : "#FFFFFF");
          ctx.fillText(text, x, y);
        },

        neon: () => {
          const neonColor = designSettings.neonColor || "#00FFFF";
          const intensity = designSettings.neonIntensity || 10;
          const currentAlpha = ctx.globalAlpha; // Preserve current opacity

          ctx.save();
          ctx.shadowBlur = 0;
          ctx.shadowColor = "rgba(0,0,0,0)";

          if (settings.background === "transparent") {
            // Apply relative opacity while preserving the user-set opacity
            const relativeOpacity = currentAlpha;
            ctx.globalAlpha = 0.7 * relativeOpacity;
            ctx.fillStyle = "#FFFFFF";
            ctx.fillText(text, x, y);

            ctx.globalAlpha = 0.9 * relativeOpacity;
            ctx.shadowColor = neonColor;
            ctx.shadowBlur = Math.max(5, intensity * 1.5);
            ctx.strokeStyle = neonColor;
            ctx.lineWidth = 2;
            ctx.strokeText(text, x, y);

            ctx.shadowBlur = Math.max(3, intensity * 0.8);
            ctx.fillStyle = neonColor;
            ctx.fillText(text, x, y);

            ctx.shadowBlur = 0;
            ctx.globalAlpha = relativeOpacity; // Maintain the user-set opacity
            ctx.fillStyle = "#FFFFFF";
            ctx.fillText(text, x, y);
          } else {
            // For non-transparent backgrounds, maintain the user-set opacity
            ctx.shadowColor = neonColor;
            ctx.shadowBlur = intensity * 3;
            ctx.strokeStyle = neonColor;
            ctx.lineWidth = 2;
            ctx.strokeText(text, x, y);

            ctx.shadowBlur = intensity;
            ctx.fillStyle = "#FFFFFF";
            ctx.fillText(text, x, y);
          }

          ctx.restore();
        },

        glow: () => {
          const glowColor =
            designSettings.glowColor ||
            (settings.background === "white" ? "#000000" : "#FFFFFF");
          const intensity = designSettings.glowIntensity || 15;
          const currentAlpha = ctx.globalAlpha; // Preserve current opacity

          ctx.save();

          if (settings.background === "transparent") {
            // Use relative opacity values that respect the user-set opacity
            const relativeOpacity = currentAlpha;

            ctx.globalAlpha = 0.4 * relativeOpacity;
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = intensity * 2;
            ctx.fillStyle = glowColor;
            ctx.fillText(text, x, y);

            ctx.globalAlpha = 0.6 * relativeOpacity;
            ctx.shadowBlur = intensity * 1.3;
            ctx.fillText(text, x, y);

            ctx.globalAlpha = 0.8 * relativeOpacity;
            ctx.shadowBlur = intensity * 0.8;
            ctx.fillText(text, x, y);

            ctx.globalAlpha = relativeOpacity; // Maintain user-set opacity
            ctx.shadowBlur = intensity * 0.4;
            ctx.fillText(text, x, y);

            ctx.shadowBlur = 0;
            ctx.fillText(text, x, y);
          } else {
            // For non-transparent backgrounds, maintain the user-set opacity
            for (let i = 0; i < 3; i++) {
              ctx.shadowColor = glowColor;
              ctx.shadowBlur = intensity + i * 10;
              ctx.fillStyle = glowColor;
              ctx.fillText(text, x, y);
            }
          }

          ctx.restore();
        },

        gradient: () => {
          const gradientCSS =
            designSettings.gradientColors ||
            "linear-gradient(45deg, #FF6B6B, #4ECDC4, #45B7D1, #96CEB4, #FFEAA7)";

          const gradient = ctx.createLinearGradient(
            x - fontSize,
            y - fontSize / 2,
            x + fontSize,
            y + fontSize / 2
          );

          const colorMatches = gradientCSS.match(/#[0-9A-Fa-f]{6}/g);
          if (colorMatches && colorMatches.length > 0) {
            colorMatches.forEach((color, index) => {
              gradient.addColorStop(index / (colorMatches.length - 1), color);
            });
          } else {
            gradient.addColorStop(0, "#FF6B6B");
            gradient.addColorStop(0.25, "#4ECDC4");
            gradient.addColorStop(0.5, "#45B7D1");
            gradient.addColorStop(0.75, "#96CEB4");
            gradient.addColorStop(1, "#FFEAA7");
          }

          ctx.fillStyle = gradient;
          ctx.fillText(text, x, y);
        },

        fire: () => {
          const fireCSS =
            designSettings.fireColors ||
            "linear-gradient(45deg, #FF4444, #FF8800, #FFFF00)";
          const fireGlow = designSettings.fireGlow || 10;

          const gradient = ctx.createLinearGradient(
            x,
            y - fontSize / 2,
            x,
            y + fontSize / 2
          );

          const colorMatches = fireCSS.match(/#[0-9A-Fa-f]{6}/g);
          if (colorMatches && colorMatches.length > 0) {
            colorMatches.forEach((color, index) => {
              gradient.addColorStop(index / (colorMatches.length - 1), color);
            });
          } else {
            gradient.addColorStop(0, "#FF4444");
            gradient.addColorStop(0.5, "#FF8800");
            gradient.addColorStop(1, "#FFFF00");
          }

          ctx.fillStyle = gradient;
          ctx.fillText(text, x, y);

          ctx.shadowColor = "#FF4444";
          ctx.shadowBlur = fireGlow;
          ctx.fillText(text, x, y);
          ctx.shadowBlur = 0;
        },

        rainbow: () => {
          const rainbowCSS =
            designSettings.rainbowColors ||
            "linear-gradient(45deg, #FF0000, #FF8800, #FFFF00, #00FF00, #0088FF, #8800FF, #FF0088)";

          const gradient = ctx.createLinearGradient(
            x - fontSize,
            y - fontSize / 2,
            x + fontSize,
            y + fontSize / 2
          );

          const colorMatches = rainbowCSS.match(/#[0-9A-Fa-f]{6}/g);
          if (colorMatches && colorMatches.length > 0) {
            colorMatches.forEach((color, index) => {
              gradient.addColorStop(index / (colorMatches.length - 1), color);
            });
          } else {
            gradient.addColorStop(0, "#FF0000");
            gradient.addColorStop(0.17, "#FF8800");
            gradient.addColorStop(0.33, "#FFFF00");
            gradient.addColorStop(0.5, "#00FF00");
            gradient.addColorStop(0.67, "#0088FF");
            gradient.addColorStop(0.83, "#8800FF");
            gradient.addColorStop(1, "#FF0088");
          }

          ctx.fillStyle = gradient;
          ctx.fillText(text, x, y);
        },

        chrome: () => {
          const chromeCSS =
            designSettings.chromeColors ||
            "linear-gradient(45deg, #FFFFFF, #CCCCCC, #999999)";

          const gradient = ctx.createLinearGradient(
            x,
            y - fontSize / 2,
            x,
            y + fontSize / 2
          );

          const colorMatches = chromeCSS.match(/#[0-9A-Fa-f]{6}/g);
          if (colorMatches && colorMatches.length > 0) {
            colorMatches.forEach((color, index) => {
              gradient.addColorStop(index / (colorMatches.length - 1), color);
            });
          } else {
            gradient.addColorStop(0, "#FFFFFF");
            gradient.addColorStop(0.5, "#CCCCCC");
            gradient.addColorStop(1, "#999999");
          }

          ctx.fillStyle = gradient;
          ctx.fillText(text, x, y);
        },
      };

      const effect = effects[settings.design] || effects.classic;
      effect();
    };

    const drawText = (
      ctx: CanvasRenderingContext2D,
      canvas: HTMLCanvasElement,
      counterWidth: number,
      counterX: number,
      counterY: number
    ) => {
      if (!textSettings.enabled || !textSettings.text) return;

      const fontSize = textSettings.fontSize;
      const fontFamily = getFontFamily(textSettings.fontFamily, "");

      ctx.font = `${fontSize}px ${fontFamily}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const x = canvas.width / 2 + textSettings.offsetX;
      const y = canvas.height / 2 + textSettings.offsetY;

      const previousAlpha = ctx.globalAlpha;
      ctx.globalAlpha = textSettings.opacity;

      if (settings.design !== "classic") {
        applyDesignEffects(ctx, textSettings.text, x, y, fontSize);
      } else {
        if (textSettings.color.startsWith("gradient-")) {
          const gradientType = textSettings.color.replace("gradient-", "");
          const gradient = createGradient(ctx, x, y, fontSize, gradientType);
          ctx.fillStyle = gradient;
        } else {
          ctx.fillStyle = textSettings.color;
        }
        ctx.fillText(textSettings.text, x, y);
      }

      ctx.globalAlpha = previousAlpha;
    };

    const drawMultiDigitCounter = (
      ctx: CanvasRenderingContext2D,
      canvas: HTMLCanvasElement,
      value: number
    ) => {
      const counterText = formatNumber(value);
      const fontSize = settings.fontSize;
      const fontFamily = getFontFamily(
        settings.fontFamily,
        settings.customFont
      );
      const letterSpacing = settings.letterSpacing || 0;
      const fontWeight = settings.fontWeight || 400;
      const counterOpacity = settings.counterOpacity ?? 1;

      // Save the current context state
      ctx.save();

      // Apply counter opacity
      ctx.globalAlpha = counterOpacity;

      ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Calculate total width for centering
      let totalWidth = 0;
      for (let i = 0; i < counterText.length; i++) {
        const char = counterText[i];
        const charWidth = ctx.measureText(char).width;
        totalWidth +=
          charWidth + (i < counterText.length - 1 ? letterSpacing : 0);
      }

      // Use display dimensions instead of canvas dimensions for proper scaling
      const centerX = 800 / 2; // displayWidth / 2
      const centerY = 600 / 2; // displayHeight / 2
      let currentX = centerX - totalWidth / 2;

      // Check if we should use multi-digit transitions
      const isMultiDigitTransition = ["odometer", "hologram-flicker"].includes(
        settings.transition
      );

      if (settings.transition === "odometer") {
        // Enhanced odometer animation that handles digit length changes
        const absValue = Math.abs(value);
        const absEndValue = Math.abs(settings.endValue);
        const decimals = settings.useFloatValues ? 2 : 0;

        // Use the maximum length between current and end value for consistent positioning
        const maxValue = Math.max(absValue, absEndValue);
        const maxInteger = Math.floor(maxValue);
        let maxIntegerStr = maxInteger.toString();
        if (settings.separator === "comma") {
          maxIntegerStr = maxIntegerStr.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }

        // Calculate the maximum number of digits needed
        const maxDigits = maxIntegerStr.replace(/[^\d]/g, "").length;

        // Format current value with proper padding
        const integer = Math.floor(absValue);
        let integerStr = integer.toString();
        if (settings.separator === "comma") {
          integerStr = integerStr.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }

        let decimalStr = "";
        if (decimals > 0) {
          decimalStr = Math.floor((absValue - integer) * Math.pow(10, decimals))
            .toString()
            .padStart(decimals, "0");
        }

        let numericStr = integerStr;
        if (decimals > 0) numericStr += "." + decimalStr;
        const sign = value < 0 ? "-" : "";
        const fullStr = settings.prefix + sign + numericStr + settings.suffix;

        // Create a template string with maximum width for consistent positioning
        const maxNumericStr =
          maxIntegerStr + (decimals > 0 ? "." + "0".repeat(decimals) : "");
        const maxFullStr =
          settings.prefix +
          (value < 0 ? "-" : "") +
          maxNumericStr +
          settings.suffix;

        // Calculate total width based on maximum possible string
        let totalWidth = 0;
        for (let i = 0; i < maxFullStr.length; i++) {
          const charWidth = ctx.measureText(maxFullStr[i]).width;
          totalWidth +=
            charWidth + (i < maxFullStr.length - 1 ? letterSpacing : 0);
        }

        let currentX = centerX - totalWidth / 2;

        // Find all digit positions in the max string
        const maxDigitIndices = [];
        for (let i = 0; i < maxFullStr.length; i++) {
          if (/\d/.test(maxFullStr[i])) {
            maxDigitIndices.push(i);
          }
        }

        // Calculate digit locals for all possible positions
        const digitLocals = new Array(maxDigits).fill(0);
        let pos = decimals > 0 ? -decimals : 0;

        for (let j = maxDigits - 1; j >= 0; j--) {
          const place = Math.pow(10, pos);
          const local = (absValue / place) % 10;
          digitLocals[j] = local;
          pos += 1;
        }

        // Check if we're at the end value
        const isEndValue = Math.abs(value - settings.endValue) < 0.001;
        const endValueStr = formatNumber(settings.endValue);

        // Draw each character in the max template
        for (let i = 0; i < maxFullStr.length; i++) {
          const templateChar = maxFullStr[i];
          const charWidth = ctx.measureText(templateChar).width;
          const charX = currentX + charWidth / 2;
          const charY = centerY;

          if (/\d/.test(templateChar)) {
            // This is a digit position
            const digitIndex = maxDigitIndices.indexOf(i);
            const digitLocal = digitLocals[digitIndex];

            // Check if this digit position exists in current value
            const currentDigitIndices = [];
            for (let k = 0; k < fullStr.length; k++) {
              if (/\d/.test(fullStr[k])) {
                currentDigitIndices.push(k);
              }
            }

            // Map from max digit index to current digit index
            const currentDigitIndex =
              digitIndex - (maxDigits - currentDigitIndices.length);
            const hasCurrentDigit = currentDigitIndex >= 0;

            // Enhanced clipping region
            ctx.save();
            const clipHeight = fontSize * 1.2;
            const clipWidth = charWidth + 8;
            const clipY = charY - clipHeight / 2;
            const clipX = charX - clipWidth / 2;

            ctx.beginPath();
            if (ctx.roundRect) {
              ctx.roundRect(clipX, clipY, clipWidth, clipHeight, 2);
            } else {
              ctx.rect(clipX, clipY, clipWidth, clipHeight);
            }
            ctx.clip();

            if (isEndValue) {
              // Snap to final position
              const endDigits = endValueStr.replace(/[^\d]/g, "");
              const endDigit = endDigits[digitIndex] || "0";
              applyDesignEffects(ctx, endDigit, charX, charY, fontSize);
            } else if (!hasCurrentDigit) {
              // This digit doesn't exist in current value - handle new digit animation
              const floor = Math.floor(digitLocal);
              const frac = digitLocal - floor;

              // For new digits (like the "1" in 100), they should roll down from above
              if (floor > 0) {
                if (frac < 0.001) {
                  // Snap to the digit
                  applyDesignEffects(
                    ctx,
                    floor.toString(),
                    charX,
                    charY,
                    fontSize
                  );
                } else {
                  // Rolling animation for new digit - it comes from above
                  const offset = frac * fontSize;

                  // The new digit rolls down from above
                  applyDesignEffects(
                    ctx,
                    floor.toString(),
                    charX,
                    charY - fontSize + offset,
                    fontSize
                  );

                  // Previous state was empty/0, so we can show a fading 0 or nothing
                  if (floor > 1) {
                    const prevDigit = (floor - 1).toString();
                    ctx.save();
                    ctx.globalAlpha = 1 - frac; // Fade out the previous digit
                    applyDesignEffects(
                      ctx,
                      prevDigit,
                      charX,
                      charY + offset,
                      fontSize
                    );
                    ctx.restore();
                  }
                }
              }
            } else {
              // Normal rolling animation
              const floor = Math.floor(digitLocal);
              const frac = digitLocal - floor;
              const next = (floor + 1) % 10;

              if (frac < 0.001) {
                // Snap to current digit
                applyDesignEffects(
                  ctx,
                  floor.toString(),
                  charX,
                  charY,
                  fontSize
                );
              } else {
                // Rolling animation
                const offset = frac * fontSize;

                // Draw next digit (coming from top)
                applyDesignEffects(
                  ctx,
                  next.toString(),
                  charX,
                  charY - fontSize + offset,
                  fontSize
                );

                // Draw current digit (moving down)
                applyDesignEffects(
                  ctx,
                  floor.toString(),
                  charX,
                  charY + offset,
                  fontSize
                );
              }
            }

            ctx.restore();
          } else {
            // Non-digit character - check if it exists in current string
            const currentChar = i < fullStr.length ? fullStr[i] : "";
            if (currentChar && currentChar === templateChar) {
              applyDesignEffects(ctx, currentChar, charX, charY, fontSize);
            } else if (templateChar === " " || i >= fullStr.length) {
              // Empty space or beyond current string length
              // Don't draw anything
            } else {
              // Draw the template character (for consistent spacing)
              ctx.save();
              ctx.globalAlpha = 0; // Make it invisible but maintain spacing
              applyDesignEffects(ctx, templateChar, charX, charY, fontSize);
              ctx.restore();
            }
          }

          currentX += charWidth + letterSpacing;
        }
      } else if (isMultiDigitTransition) {
        // Draw each digit with individual transitions
        for (let i = 0; i < counterText.length; i++) {
          const char = counterText[i];
          const charWidth = ctx.measureText(char).width;
          const digitX = currentX + charWidth / 2;

          // Check if this digit has a transition
          const transition = digitTransitionsRef.current.get(i);
          let digitProgress = 1; // Default to fully visible

          if (transition) {
            const elapsed = Date.now() - transition.startTime;
            digitProgress = Math.min(elapsed / 500, 1); // 500ms transition

            // Apply easing
            if (settings.easing && settings.easing in easingFunctions) {
              digitProgress =
                easingFunctions[
                  settings.easing as keyof typeof easingFunctions
                ](digitProgress);
            }
          }

          // Apply digit-specific transition
          ctx.save();
          const {
            x: tX,
            y: tY,
            opacity: tOpacity,
          } = applyDigitTransition(
            ctx,
            char,
            digitX,
            centerY,
            fontSize,
            digitProgress,
            settings.transition
          );

          // Combine the transition opacity with the user-set opacity
          ctx.globalAlpha = tOpacity * counterOpacity;
          applyDesignEffects(ctx, char, tX, tY, fontSize);
          ctx.restore();

          currentX += charWidth + letterSpacing;
        }
      } else {
        // Use traditional whole-counter transitions
        const totalRange = settings.endValue - settings.startValue;
        const rawProgress =
          totalRange !== 0 ? (value - settings.startValue) / totalRange : 1;
        const transitionProgress = Math.min(Math.max(rawProgress, 0), 1);

        ctx.save();
        const {
          x: tX,
          y: tY,
          opacity: tOpacity,
        } = applyDigitTransition(
          ctx,
          counterText,
          centerX,
          centerY,
          fontSize,
          transitionProgress,
          settings.transition
        );

        // Combine the transition opacity with the user-set opacity
        ctx.globalAlpha = tOpacity * counterOpacity;

        if (letterSpacing !== 0) {
          // Draw each character with spacing
          currentX = centerX - totalWidth / 2;
          for (let i = 0; i < counterText.length; i++) {
            const char = counterText[i];
            const charWidth = ctx.measureText(char).width;
            applyDesignEffects(
              ctx,
              char,
              currentX + charWidth / 2,
              tY,
              fontSize
            );
            currentX += charWidth + letterSpacing;
          }
        } else {
          applyDesignEffects(ctx, counterText, tX, tY, fontSize);
        }

        ctx.restore();
      }

      // Restore the context state (including opacity)
      ctx.restore();
    };

    // Enhanced performance monitoring function
    const updatePerformanceMetrics = (currentTime: number) => {
      // Record render time for performance monitoring
      if (renderStartTimeRef.current > 0) {
        performanceMonitor.recordRenderTime(renderStartTimeRef.current);
      }

      frameCountRef.current++;

      if (currentTime - lastFPSCheckRef.current >= 1000) {
        currentFPSRef.current = frameCountRef.current;
        frameCountRef.current = 0;
        lastFPSCheckRef.current = currentTime;

        // Auto-optimize if performance is poor
        if (currentFPSRef.current < 45 && !performanceOptimizedRef.current) {
          performanceOptimizedRef.current = true;
         
        }
      }
    };

    const drawFrame = async (currentTime: number = performance.now()) => {
      // Record render start time for performance monitoring
      renderStartTimeRef.current = performance.now();

      // Update performance metrics
      updatePerformanceMetrics(currentTime);
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Enhanced canvas context with optimizations
      const ctx = canvas.getContext("2d", {
        alpha: settings.background === "transparent",
        desynchronized: true, // Allow async rendering
        willReadFrequently: false, // Optimize for write operations
      });
      if (!ctx) return;

      // Set canvas size with device pixel ratio for crisp rendering
      const devicePixelRatio = performanceOptimizedRef.current
        ? 1
        : window.devicePixelRatio || 1;
      const displayWidth = 800;
      const displayHeight = 600;

      // Only resize canvas if dimensions changed to avoid unnecessary operations
      if (
        canvas.width !== displayWidth * devicePixelRatio ||
        canvas.height !== displayHeight * devicePixelRatio
      ) {
        canvas.width = displayWidth * devicePixelRatio;
        canvas.height = displayHeight * devicePixelRatio;
        canvas.style.width = displayWidth + "px";
        canvas.style.height = displayHeight + "px";
      }

      // Scale context to match device pixel ratio
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);

      // Enable anti-aliasing and sub-pixel rendering (with performance consideration)
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = performanceOptimizedRef.current
        ? "medium"
        : "high";

      // Set text rendering optimization
      if ("textRenderingOptimization" in ctx) {
        (ctx as any).textRenderingOptimization = performanceOptimizedRef.current
          ? "optimizeSpeed"
          : "optimizeQuality";
      }

      ctx.clearRect(0, 0, displayWidth, displayHeight);

      const extractColors = (gradientStr: string): string[] => {
        const matches = gradientStr.match(/#[0-9a-fA-F]{3,6}/g);
        return matches || ["#000000", "#ffffff"];
      };

      // Draw background
      if (settings.background === "transparent") {
        // Keep transparent
      } else if (
        settings.background === "gradient" &&
        settings.backgroundGradient
      ) {
        // Calculate gradient direction based on angle
        const angle = (settings.gradientAngle ?? 45) * (Math.PI / 180);
        const centerX = displayWidth / 2;
        const centerY = displayHeight / 2;
        const radius = Math.max(displayWidth, displayHeight) / 2;

        const x1 = centerX - Math.cos(angle) * radius;
        const y1 = centerY - Math.sin(angle) * radius;
        const x2 = centerX + Math.cos(angle) * radius;
        const y2 = centerY + Math.sin(angle) * radius;

        const grad = ctx.createLinearGradient(x1, y1, x2, y2);
        const colors = extractColors(settings.backgroundGradient);
        const step = colors.length > 1 ? 1 / (colors.length - 1) : 1;
        colors.forEach((color, i) => grad.addColorStop(i * step, color));
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, displayWidth, displayHeight);
      } else if (
        settings.background === "custom" &&
        settings.customBackgroundColor
      ) {
        ctx.fillStyle = settings.customBackgroundColor;
        ctx.fillRect(0, 0, displayWidth, displayHeight);
      } else {
        ctx.fillStyle = settings.background === "white" ? "#FFFFFF" : "#000000";
        ctx.fillRect(0, 0, displayWidth, displayHeight);
      }

      // Set text color
      ctx.fillStyle =
        settings.textColor ||
        (settings.background === "white" ? "#000000" : "#FFFFFF");

      // Draw multi-digit counter
      drawMultiDigitCounter(ctx, canvas, currentValue);

      // Draw additional text if enabled
      if (textSettings.enabled) {
        drawText(
          ctx,
          canvas,
          ctx.measureText(formatNumber(currentValue)).width,
          displayWidth / 2,
          displayHeight / 2
        );
      }
    };

    // Track value changes for digit transitions
    useEffect(() => {
      if (currentValue !== lastValueRef.current) {
        updateDigitTransitions(currentValue);
        lastValueRef.current = currentValue;
        transitionStartTimeRef.current = Date.now();
      }
    }, [currentValue]);

    // Load fonts
    useEffect(() => {
      const loadFontForKey = async (key: string) => {
        if (!key || key === "custom" || key === "arial") return;
        const googleName = key.charAt(0).toUpperCase() + key.slice(1);
        await loadGoogleFont(googleName);
      };

      loadFontForKey(settings.fontFamily);
      loadFontForKey(textSettings.fontFamily);
    }, [settings.fontFamily, textSettings.fontFamily]);

    useEffect(() => {
      let lastFrameTime = 0;
      const targetFPS = 60;
      const frameInterval = 1000 / targetFPS;

      // Start performance monitoring when animation begins
      performanceMonitor.startMonitoring();

      // Configure performance optimizer with current settings
      performanceOptimizer.setOriginalQuality({
        renderQuality: 1.0,
        enableAntiAliasing: true,
        enableSubPixelRendering: true,
        maxParticles: 1000,
        effectComplexity: "high",
        canvasScale: 1.0,
      });

      performanceOptimizer.startOptimization();

      const animate = (currentTime: number) => {
        // Throttle to target FPS for consistent performance
        if (currentTime - lastFrameTime >= frameInterval) {
          drawFrame(currentTime);
          lastFrameTime = currentTime;
        }

        // Always request next frame for smooth animations
        animationRef.current = requestAnimationFrame(animate);
      };

      // Start animation loop
      animationRef.current = requestAnimationFrame(animate);

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }

        // Stop performance monitoring when component unmounts
        performanceMonitor.stopMonitoring();
        performanceOptimizer.stopOptimization();
      };
    }, [
      settings,
      textSettings,
      designSettings,
      currentValue,
      isRecording,
      formatNumber,
    ]);

    return (
      <div className="w-full h-full flex items-center justify-center">
        <canvas
          ref={canvasRef}
          className="w-full h-full object-contain rounded-lg"
          style={{
            background:
              settings.background === "gradient"
                ? settings.backgroundGradient || designSettings.gradientColors
                : settings.background === "custom"
                ? settings.customBackgroundColor || "#000000"
                : settings.background,
          }}
        />
      </div>
    );
  }
);

CounterPreview.displayName = "CounterPreview";

export default CounterPreview;
