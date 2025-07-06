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
    design: string;
    background: string;
    speed: number;
    customFont: string;
    transition: string;
    prefix: string;
    suffix: string;
    separator: string;
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
      };

      return fontMap[fontKey] || '"Inter", sans-serif';
    };

    const applyTransitionEffect = (
      ctx: CanvasRenderingContext2D,
      progress: number,
      x: number,
      y: number,
      fontSize: number,
      counterWidth: number
    ) => {
      // Enhanced transition effects with better visibility
      const effects = {
        none: () => ({ x, y, opacity: 1 }),
        slideUp: () => {
          // Enhanced slide up with improved visibility
          const distance = fontSize * 1.5;
          const offset = (1 - progress) * distance;
          // Start more visible
          const opacity = 0.3 + progress * 0.7;
          return { x, y: y + offset, opacity };
        },
        slideDown: () => {
          // Enhanced slide down with improved visibility
          const distance = fontSize * 1.5;
          const offset = (1 - progress) * -distance;
          const opacity = 0.3 + progress * 0.7;
          return { x, y: y + offset, opacity };
        },
        slideLeft: () => {
          // Enhanced slide left with improved visibility
          const distance = counterWidth / 1.5;
          const offset = (1 - progress) * distance;
          const opacity = 0.3 + progress * 0.7;
          return { x: x + offset, y, opacity };
        },
        slideRight: () => {
          // Enhanced slide right with improved visibility
          const distance = counterWidth / 1.5;
          const offset = (1 - progress) * -distance;
          const opacity = 0.3 + progress * 0.7;
          return { x: x + offset, y, opacity };
        },
        fadeIn: () => {
          // Enhanced fade in with better curve
          const easeInOutCubic =
            progress < 0.5
              ? 4 * progress * progress * progress
              : 1 - Math.pow(-2 * progress + 2, 3) / 2;
          return { x, y, opacity: easeInOutCubic };
        },
        cascade: () => {
          // New cascade effect where numbers flow through each other
          // The new number comes from above and the old number exits below

          // For the incoming number (when progress is low)
          if (progress < 0.5) {
            // Calculate a straight path for the incoming number
            const entryProgress = progress * 2; // Scale to 0-1 range for first half

            // Start from above with straight downward motion
            const entryY = y - fontSize * 2 * (1 - entryProgress);

            // No horizontal movement for straight cascade
            const entryX = x;

            // Gradually increase opacity
            const opacity = 0.3 + entryProgress * 0.7;

            return { x: entryX, y: entryY, opacity };
          }
          // For the outgoing number (when progress is high)
          else {
            // Calculate a straight path for the outgoing number
            const exitProgress = (progress - 0.5) * 2; // Scale to 0-1 range for second half

            // Move straight downward
            const exitY = y + fontSize * 2 * exitProgress;

            // No horizontal movement for straight cascade
            const exitX = x;

            // Gradually decrease opacity but keep somewhat visible
            const opacity = 0.8 - exitProgress * 0.5;

            return { x: exitX, y: exitY, opacity };
          }
        },
        scale: () => {
          // Enhanced scale with better minimum visibility
          const scaleValue = 0.3 + progress * 0.7;
          ctx.save();
          ctx.translate(x, y);
          ctx.scale(scaleValue, scaleValue);
          ctx.translate(-x, -y);
          return { x, y, opacity: 0.3 + progress * 0.7 };
        },
        rotate: () => {
          // Enhanced rotate with fade in
          const rotation = (1 - progress) * Math.PI;
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(rotation);
          ctx.translate(-x, -y);
          return { x, y, opacity: 0.3 + progress * 0.7 };
        },
        bounce: () => {
          // Enhanced bounce with more pronounced effect
          const bounceHeight = Math.sin(progress * Math.PI) * (fontSize / 2);
          return { x, y: y - bounceHeight, opacity: 1 };
        },
        elastic: () => {
          // Enhanced elastic with multiple oscillations
          const p = progress < 0.5 ? progress * 2 : 1;
          const elasticOffset =
            Math.sin(p * Math.PI * 6) * (1 - p) * (fontSize / 3);
          return { x, y: y + elasticOffset, opacity: 0.5 + progress * 0.5 };
        },
        wave: () => {
          // Enhanced wave with smoother motion
          const amplitude = fontSize / 4;
          const frequency = 3;
          const waveOffset =
            Math.sin(progress * Math.PI * frequency) *
            amplitude *
            (1 - progress * 0.5);
          return { x: x + waveOffset, y, opacity: 0.7 + progress * 0.3 };
        },
        spiral: () => {
          // Enhanced spiral with more visible starting point
          const minOpacity = 0.4;
          const angle = progress * Math.PI * 3;
          const startRadius = fontSize / 2;
          const endRadius = 0;
          const radius = startRadius + (endRadius - startRadius) * progress;
          const spiralX = Math.cos(angle) * radius;
          const spiralY = Math.sin(angle) * radius;
          return {
            x: x + spiralX,
            y: y + spiralY,
            opacity: minOpacity + (1 - minOpacity) * progress,
          };
        },
        zoom: () => {
          // Enhanced zoom with better visibility
          const minScale = 0.4;
          const scale = minScale + progress * (1 - minScale);
          ctx.save();
          ctx.translate(x, y);
          ctx.scale(scale, scale);
          ctx.translate(-x, -y);
          return { x, y, opacity: 0.3 + progress * 0.7 };
        },
        flip: () => {
          // Enhanced flip with improved visibility at midpoint
          const flipProgress =
            progress < 0.5 ? progress * 2 : (progress - 0.5) * 2;
          const scaleY = Math.abs(Math.cos(progress * Math.PI));
          const opacity = scaleY < 0.3 ? 0.3 : scaleY;

          ctx.save();
          ctx.translate(x, y);
          ctx.scale(1, Math.max(0.1, scaleY));
          ctx.translate(-x, -y);
          return { x, y, opacity };
        },
        glitch: () => {
          // New glitch effect
          ctx.save();
          if (progress < 0.8 && Math.random() > 0.7) {
            const glitchX = (Math.random() - 0.5) * 10;
            const glitchY = (Math.random() - 0.5) * 10;
            return {
              x: x + glitchX,
              y: y + glitchY,
              opacity: 0.7 + Math.random() * 0.3,
            };
          }
          return { x, y, opacity: 0.7 + progress * 0.3 };
        },
        blur: () => {
          // New blur-in effect (note: actual blur is not available in Canvas API without filters)
          return { x, y, opacity: progress };
        },
        typewriter: () => {
          // The typewriter effect is handled in text rendering
          return { x, y, opacity: 1 };
        },
      };

      const effect = effects[settings.transition] || effects.none;
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
          ctx.fillStyle =
            settings.background === "white" ? "#000000" : "#FFFFFF";
          ctx.fillText(text, x, y);
        },

        neon: () => {
          // Use custom neon color and intensity from designSettings
          const neonColor = designSettings.neonColor || "#00FFFF";
          const intensity = designSettings.neonIntensity || 10;

          // Outer glow
          ctx.shadowColor = neonColor;
          ctx.shadowBlur = intensity * 3;
          ctx.strokeStyle = neonColor;
          ctx.lineWidth = 2;
          ctx.strokeText(text, x, y);

          // Inner fill
          ctx.shadowBlur = intensity;
          ctx.fillStyle = "#FFFFFF";
          ctx.fillText(text, x, y);

          ctx.shadowBlur = 0;
        },

        glow: () => {
          const glowColor =
            designSettings.glowColor ||
            (settings.background === "white" ? "#000000" : "#FFFFFF");
          const intensity = designSettings.glowIntensity || 15;

          // Multiple glow layers
          for (let i = 0; i < 3; i++) {
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = intensity + i * 10;
            ctx.fillStyle = glowColor;
            ctx.fillText(text, x, y);
          }

          ctx.shadowBlur = 0;
        },

        gradient: () => {
          // Use custom gradient colors from designSettings
          const gradientCSS =
            designSettings.gradientColors ||
            "linear-gradient(45deg, #FF6B6B, #4ECDC4, #45B7D1, #96CEB4, #FFEAA7)";

          // Parse CSS gradient to canvas gradient
          const gradient = ctx.createLinearGradient(
            x - fontSize,
            y - fontSize / 2,
            x + fontSize,
            y + fontSize / 2
          );

          // Extract colors from CSS gradient string
          const colorMatches = gradientCSS.match(/#[0-9A-Fa-f]{6}/g);
          if (colorMatches && colorMatches.length > 0) {
            colorMatches.forEach((color, index) => {
              gradient.addColorStop(index / (colorMatches.length - 1), color);
            });
          } else {
            // Fallback gradient
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
          // Use custom fire colors from designSettings
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

          // Extract colors from CSS gradient string
          const colorMatches = fireCSS.match(/#[0-9A-Fa-f]{6}/g);
          if (colorMatches && colorMatches.length > 0) {
            colorMatches.forEach((color, index) => {
              gradient.addColorStop(index / (colorMatches.length - 1), color);
            });
          } else {
            // Fallback fire gradient
            gradient.addColorStop(0, "#FF4444");
            gradient.addColorStop(0.5, "#FF8800");
            gradient.addColorStop(1, "#FFFF00");
          }

          ctx.fillStyle = gradient;
          ctx.fillText(text, x, y);

          // Add fire glow effect
          ctx.shadowColor = "#FF4444";
          ctx.shadowBlur = fireGlow;
          ctx.fillText(text, x, y);
          ctx.shadowBlur = 0;
        },

        rainbow: () => {
          // Use custom rainbow colors from designSettings
          const rainbowCSS =
            designSettings.rainbowColors ||
            "linear-gradient(45deg, #FF0000, #FF8800, #FFFF00, #00FF00, #0088FF, #8800FF, #FF0088)";

          const gradient = ctx.createLinearGradient(
            x - fontSize,
            y - fontSize / 2,
            x + fontSize,
            y + fontSize / 2
          );

          // Extract colors from CSS gradient string
          const colorMatches = rainbowCSS.match(/#[0-9A-Fa-f]{6}/g);
          if (colorMatches && colorMatches.length > 0) {
            colorMatches.forEach((color, index) => {
              gradient.addColorStop(index / (colorMatches.length - 1), color);
            });
          } else {
            // Fallback rainbow gradient
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
          // Use custom chrome colors from designSettings
          const chromeCSS =
            designSettings.chromeColors ||
            "linear-gradient(45deg, #FFFFFF, #CCCCCC, #999999)";

          const gradient = ctx.createLinearGradient(
            x,
            y - fontSize / 2,
            x,
            y + fontSize / 2
          );

          // Extract colors from CSS gradient string
          const colorMatches = chromeCSS.match(/#[0-9A-Fa-f]{6}/g);
          if (colorMatches && colorMatches.length > 0) {
            colorMatches.forEach((color, index) => {
              gradient.addColorStop(index / (colorMatches.length - 1), color);
            });
          } else {
            // Fallback chrome gradient
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

      // Calculate position based on center plus offsets
      const x = canvas.width / 2 + textSettings.offsetX;
      const y = canvas.height / 2 + textSettings.offsetY;

      // Apply opacity
      const previousAlpha = ctx.globalAlpha;
      ctx.globalAlpha = textSettings.opacity;

      // Apply same design effects as counter for consistency
      if (settings.design !== "classic") {
        applyDesignEffects(ctx, textSettings.text, x, y, fontSize);
      } else {
        // Apply color (could be gradient)
        if (textSettings.color.startsWith("gradient-")) {
          const gradientType = textSettings.color.replace("gradient-", "");
          const gradient = createGradient(ctx, x, y, fontSize, gradientType);
          ctx.fillStyle = gradient;
        } else {
          ctx.fillStyle = textSettings.color;
        }
        ctx.fillText(textSettings.text, x, y);
      }

      // Restore alpha
      ctx.globalAlpha = previousAlpha;
    };

    const drawFrame = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Set canvas size
      canvas.width = 800;
      canvas.height = 600;

      // Clear canvas
      if (settings.background === "transparent") {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      } else {
        ctx.fillStyle = settings.background === "white" ? "#FFFFFF" : "#000000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Load custom font if specified
      if (settings.customFont) {
        await loadGoogleFont(settings.customFont);
      }

      // Calculate transition progress
      let transitionProgress = 1;
      const transitionThreshold = 0.05; // Always show at least a bit of the transition for visibility

      if (Math.floor(currentValue) !== Math.floor(lastValueRef.current)) {
        transitionStartTimeRef.current = Date.now();
        lastValueRef.current = Math.floor(currentValue);
      }

      if (settings.transition !== "none") {
        const timeSinceTransition = Date.now() - transitionStartTimeRef.current;
        const transitionDuration = 500; // Increased from 300ms to 500ms for more visible transitions
        transitionProgress = Math.min(
          transitionThreshold +
            (timeSinceTransition / transitionDuration) *
              (1 - transitionThreshold),
          1
        );
      }

      // Draw counter
      const fontSize = settings.fontSize;
      const fontFamily = getFontFamily(
        settings.fontFamily,
        settings.customFont
      );

      ctx.font = `${fontSize}px ${fontFamily}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const counterText = formatNumber(currentValue);

      // Measure counter text width for positioning calculations
      const counterWidth = ctx.measureText(counterText).width;

      // Initial centered position - counter is always drawn at center + any transition effects
      let x = canvas.width / 2;
      let y = canvas.height / 2;

      // Apply transition effects
      ctx.save();

      if (settings.transition !== "none") {
        const newPos = applyTransitionEffect(
          ctx,
          transitionProgress,
          x,
          y,
          fontSize,
          counterWidth
        );
        x = newPos.x;
        y = newPos.y;
        ctx.globalAlpha = newPos.opacity || 1;
      }

      // Apply design effects to counter with formatted text
      applyDesignEffects(ctx, counterText, x, y, fontSize);

      ctx.restore();

      // Draw additional text if enabled
      if (textSettings.enabled && textSettings.text) {
        drawText(ctx, canvas, counterWidth, x, y);
      }
    };

    useEffect(() => {
      const animate = () => {
        drawFrame();
        if (isRecording) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          // Draw frame once when not recording
          drawFrame();
        }
      };

      animate();

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
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
            backgroundColor:
              settings.background === "transparent"
                ? "transparent"
                : settings.background,
          }}
        />
      </div>
    );
  }
);

CounterPreview.displayName = "CounterPreview";

export default CounterPreview;
