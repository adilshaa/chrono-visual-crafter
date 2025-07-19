import { toast } from "sonner";
import JSZip from "jszip";
import {
  easingFunctions,
  getFontFamily,
  formatNumber,
} from "./sharedCounterUtils";
import {
  TransparentExportOptimizer,
  TransparentExportSettings,
  ResolutionScaling,
} from "./transparentExportOptimizer";

export interface TransparentExportOptions {
  // Content options
  includeCounter: boolean;
  includeText: boolean;

  // Format options
  format: "png-sequence" | "webm-alpha" | "both";

  // Quality options
  width: number;
  height: number;
  frameRate: number;
  duration: number;

  // Scaling options
  scale: number; // 0.5 to 4.0

  // Animation options
  preserveAnimations: boolean;
  transitionType: string;
  easingFunction: string;
}

export interface CounterSettings {
  startValue: number;
  endValue: number;
  duration: number;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  letterSpacing: number;
  design: string;
  transition: string;
  easing: string;
  prefix: string;
  suffix: string;
  separator: string;
  useFloatValues: boolean;
  counterOpacity?: number; // Added counterOpacity property
}

export interface TextSettings {
  enabled: boolean;
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  offsetX: number;
  offsetY: number;
  opacity: number;
}

export interface DesignSettings {
  neonColor: string;
  neonIntensity: number;
  glowColor: string;
  glowIntensity: number;
  gradientColors: string;
  fireColors: string;
  fireGlow: number;
  rainbowColors: string;
  chromeColors: string;
}

// Import shared utilities to ensure consistency with CounterPreview

export interface ExportProgressCallback {
  (progress: number, status: string): void;
}

export class TransparentCounterExporter {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private exportOptions: TransparentExportOptions;
  private counterSettings: CounterSettings;
  private textSettings: TextSettings;
  private designSettings: DesignSettings;
  private previousValue: number = 0;
  private progressCallback?: ExportProgressCallback;
  private digitTransitions: Map<
    number,
    { oldDigit: string; newDigit: string; progress: number }
  > = new Map();

  constructor(
    exportOptions: TransparentExportOptions,
    counterSettings: CounterSettings,
    textSettings: TextSettings,
    designSettings: DesignSettings
  ) {
    this.exportOptions = exportOptions;
    this.counterSettings = counterSettings;
    this.textSettings = textSettings;
    this.designSettings = designSettings;

    // Create high-resolution canvas for export with enhanced alpha support
    this.canvas = document.createElement("canvas");
    this.canvas.width = exportOptions.width * exportOptions.scale;
    this.canvas.height = exportOptions.height * exportOptions.scale;

    // Enhanced context configuration for optimal transparency
    const ctx = this.canvas.getContext("2d", {
      alpha: true,
      premultipliedAlpha: false,
      preserveDrawingBuffer: true,
      colorSpace: "display-p3", // Enhanced color space for better quality
      desynchronized: false,
      willReadFrequently: false,
    }) as CanvasRenderingContext2D;

    if (!ctx) {
      throw new Error("Could not create canvas context");
    }

    this.ctx = ctx;

    // Configure context for high quality rendering with transparency optimization
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = "high";
    this.ctx.scale(exportOptions.scale, exportOptions.scale);
  }

  private formatNumber(value: number): string {
    return formatNumber(value, {
      prefix: this.counterSettings.prefix,
      suffix: this.counterSettings.suffix,
      separator: this.counterSettings.separator,
      useFloatValues: this.counterSettings.useFloatValues,
    });
  }

  private getFontFamily(fontKey: string): string {
    return getFontFamily(fontKey);
  }

  private applyDesignEffects(
    text: string,
    x: number,
    y: number,
    fontSize: number
  ): void {
    const effects = {
      classic: () => {
        this.ctx.fillStyle = "#FFFFFF";
        this.ctx.fillText(text, x, y);
      },

      neon: () => {
        const neonColor = this.designSettings.neonColor || "#00FFFF";
        const intensity = this.designSettings.neonIntensity || 10;

        // Use contained rendering for transparent exports
        if (this.exportOptions.format === "png-sequence") {
          // Create a temporary canvas for contained neon effect
          const tempCanvas = document.createElement("canvas");
          tempCanvas.width = this.canvas.width;
          tempCanvas.height = this.canvas.height;
          const tempCtx = tempCanvas.getContext("2d", { alpha: true });

          if (tempCtx) {
            // Clear temp canvas
            tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);

            // Set up text properties
            tempCtx.font = this.ctx.font;
            tempCtx.textAlign = "center";
            tempCtx.textBaseline = "middle";

            // Draw base text first (no glow)
            tempCtx.fillStyle = neonColor;
            tempCtx.fillText(text, x, y);

            // Apply controlled blur
            const blurredCanvas = this.applyControlledBlur(
              tempCanvas,
              Math.min(intensity * 1.5, 12), // Limit blur radius
              neonColor
            );

            // Draw the blurred result onto main canvas
            this.ctx.drawImage(blurredCanvas, 0, 0);

            // Draw sharp text on top for clarity
            this.ctx.fillStyle = "#FFFFFF";
            this.ctx.fillText(text, x, y);
          } else {
            // Fallback to standard rendering if temp canvas fails
            this.ctx.save();
            this.ctx.shadowColor = neonColor;
            this.ctx.shadowBlur = intensity;
            this.ctx.fillStyle = neonColor;
            this.ctx.fillText(text, x, y);
            this.ctx.shadowBlur = 0;
            this.ctx.fillStyle = "#FFFFFF";
            this.ctx.fillText(text, x, y);
            this.ctx.restore();
          }
        } else {
          // Standard rendering for WebM or other formats
          this.ctx.save();

          // Exact same rendering as DesignPreview component
          this.ctx.shadowColor = neonColor;
          this.ctx.shadowBlur = intensity;
          this.ctx.fillStyle = neonColor;
          this.ctx.fillText(text, x, y);

          // Additional glow layers to match DesignPreview exactly
          this.ctx.shadowBlur = intensity * 2;
          this.ctx.fillText(text, x, y);

          this.ctx.shadowBlur = intensity * 3;
          this.ctx.fillStyle = "#FFFFFF";
          this.ctx.fillText(text, x, y);

          this.ctx.restore();
        }
      },

      glow: () => {
        const glowColor = this.designSettings.glowColor || "#FFFFFF";
        const intensity = this.designSettings.glowIntensity || 15;

        // Use contained rendering for transparent exports
        if (this.exportOptions.format === "png-sequence") {
          // Create a temporary canvas for contained glow effect
          const tempCanvas = document.createElement("canvas");
          tempCanvas.width = this.canvas.width;
          tempCanvas.height = this.canvas.height;
          const tempCtx = tempCanvas.getContext("2d", { alpha: true });

          if (tempCtx) {
            // Clear temp canvas
            tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);

            // Set up text properties
            tempCtx.font = this.ctx.font;
            tempCtx.textAlign = "center";
            tempCtx.textBaseline = "middle";

            // Draw base text first (no glow)
            tempCtx.fillStyle = glowColor;
            tempCtx.fillText(text, x, y);

            // Apply controlled blur
            const blurredCanvas = this.applyControlledBlur(
              tempCanvas,
              Math.min(intensity, 10), // Limit blur radius
              glowColor
            );

            // Draw the blurred result onto main canvas
            this.ctx.drawImage(blurredCanvas, 0, 0);

            // Draw sharp text on top for clarity
            this.ctx.fillStyle = glowColor;
            this.ctx.fillText(text, x, y);
          } else {
            // Fallback to standard rendering if temp canvas fails
            this.ctx.save();
            this.ctx.shadowColor = glowColor;
            this.ctx.shadowBlur = intensity;
            this.ctx.fillStyle = glowColor;
            this.ctx.fillText(text, x, y);
            this.ctx.restore();
          }
        } else {
          // Standard rendering for WebM or other formats
          this.ctx.save();

          // Exact same rendering as DesignPreview component
          this.ctx.shadowColor = glowColor;
          this.ctx.shadowBlur = intensity;
          this.ctx.fillStyle = glowColor;
          this.ctx.fillText(text, x, y);

          // Additional glow layer to match DesignPreview exactly
          this.ctx.shadowBlur = intensity * 1.5;
          this.ctx.fillText(text, x, y);

          this.ctx.restore();
        }
      },

      gradient: () => {
        const gradient = this.ctx.createLinearGradient(
          x - fontSize,
          y - fontSize / 2,
          x + fontSize,
          y + fontSize / 2
        );

        // Use exact same gradient as DesignPreview
        const gradientValue =
          this.designSettings.gradientColors ||
          "linear-gradient(45deg, #FF6B6B, #4ECDC4, #45B7D1, #96CEB4, #FFEAA7)";

        const colorMatches = gradientValue.match(/#[0-9A-Fa-f]{6}/g);
        if (colorMatches && colorMatches.length > 0) {
          colorMatches.forEach((color, index) => {
            gradient.addColorStop(index / (colorMatches.length - 1), color);
          });
        }

        this.ctx.fillStyle = gradient;
        this.ctx.fillText(text, x, y);
      },

      fire: () => {
        const gradient = this.ctx.createLinearGradient(
          x,
          y - fontSize / 2,
          x,
          y + fontSize / 2
        );

        // Use exact same gradient as DesignPreview
        const fireValue =
          this.designSettings.fireColors ||
          "linear-gradient(45deg, #FF4444, #FF8800, #FFFF00)";

        const colorMatches = fireValue.match(/#[0-9A-Fa-f]{6}/g);
        if (colorMatches && colorMatches.length > 0) {
          colorMatches.forEach((color, index) => {
            gradient.addColorStop(index / (colorMatches.length - 1), color);
          });
        }

        this.ctx.fillStyle = gradient;
        this.ctx.fillText(text, x, y);

        // Exact same fire glow as DesignPreview
        const fireGlow = this.designSettings.fireGlow || 10;
        this.ctx.save();
        this.ctx.shadowColor = "#FF4444";
        this.ctx.shadowBlur = fireGlow;
        this.ctx.fillText(text, x, y);
        this.ctx.restore();
      },

      rainbow: () => {
        const gradient = this.ctx.createLinearGradient(
          x - fontSize,
          y - fontSize / 2,
          x + fontSize,
          y + fontSize / 2
        );

        // Use exact same gradient as DesignPreview
        const rainbowValue =
          this.designSettings.rainbowColors ||
          "linear-gradient(45deg, #FF0000, #FF8800, #FFFF00, #00FF00, #0088FF, #8800FF, #FF0088)";

        const colorMatches = rainbowValue.match(/#[0-9A-Fa-f]{6}/g);
        if (colorMatches && colorMatches.length > 0) {
          colorMatches.forEach((color, index) => {
            gradient.addColorStop(index / (colorMatches.length - 1), color);
          });
        }

        this.ctx.fillStyle = gradient;
        this.ctx.fillText(text, x, y);
      },

      chrome: () => {
        const gradient = this.ctx.createLinearGradient(
          x,
          y - fontSize / 2,
          x,
          y + fontSize / 2
        );

        // Use exact same gradient as DesignPreview
        const chromeValue =
          this.designSettings.chromeColors ||
          "linear-gradient(45deg, #FFFFFF, #CCCCCC, #999999)";

        const colorMatches = chromeValue.match(/#[0-9A-Fa-f]{6}/g);
        if (colorMatches && colorMatches.length > 0) {
          colorMatches.forEach((color, index) => {
            gradient.addColorStop(index / (colorMatches.length - 1), color);
          });
        }

        this.ctx.fillStyle = gradient;
        this.ctx.fillText(text, x, y);
      },
    };

    const effect =
      effects[this.counterSettings.design as keyof typeof effects] ||
      effects.classic;
    effect();
  }

  private applyDigitTransition(
    digit: string,
    x: number,
    y: number,
    fontSize: number,
    transitionProgress: number,
    transitionType: string
  ): { x: number; y: number; opacity: number; transform?: () => void } {
    const effects = {
      none: () => ({ x, y, opacity: 1 }),

      fadeIn: () => {
        const easeInOutCubic =
          transitionProgress < 0.5
            ? 4 * transitionProgress * transitionProgress * transitionProgress
            : 1 - Math.pow(-2 * transitionProgress + 2, 3) / 2;
        return { x, y, opacity: easeInOutCubic };
      },

      "fade-roll": () => {
        const rollDistance = fontSize * 0.3;
        const rollY = y - (1 - transitionProgress) * rollDistance;
        const opacity = transitionProgress;
        return {
          x,
          y: rollY,
          opacity,
          transform: () => {
            this.ctx.save();
            this.ctx.translate(x, rollY);
            this.ctx.rotate((1 - transitionProgress) * Math.PI * 0.1);
            this.ctx.translate(-x, -rollY);
          },
        };
      },

      "flip-down": () => {
        const scaleY = Math.abs(Math.cos(transitionProgress * Math.PI));
        const opacity = scaleY > 0.1 ? 1 : 0;
        return {
          x,
          y,
          opacity,
          transform: () => {
            this.ctx.save();
            this.ctx.translate(x, y);
            this.ctx.scale(1, Math.max(0.1, scaleY));
            this.ctx.translate(-x, -y);
          },
        };
      },

      "slide-vertical": () => {
        const slideDistance = fontSize * 1.2;
        const slideY = y + (1 - transitionProgress) * slideDistance;
        return { x, y: slideY, opacity: transitionProgress };
      },

      bounce: () => {
        const bounceHeight =
          Math.sin(transitionProgress * Math.PI) * (fontSize * 0.3);
        const bounceY = y - bounceHeight;
        return { x, y: bounceY, opacity: 1 };
      },

      scale: () => {
        const scaleValue = 0.3 + transitionProgress * 0.7;
        return {
          x,
          y,
          opacity: transitionProgress,
          transform: () => {
            this.ctx.save();
            this.ctx.translate(x, y);
            this.ctx.scale(scaleValue, scaleValue);
            this.ctx.translate(-x, -y);
          },
        };
      },

      slideUp: () => {
        const distance = fontSize * 1.5;
        const offset = (1 - transitionProgress) * distance;
        return { x, y: y + offset, opacity: 0.3 + transitionProgress * 0.7 };
      },

      slideDown: () => {
        const distance = fontSize * 1.5;
        const offset = (1 - transitionProgress) * -distance;
        return { x, y: y + offset, opacity: 0.3 + transitionProgress * 0.7 };
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

      odometer: () => {
        return {
          x,
          y,
          opacity: 1,
          // No transform needed as we'll handle odometer animation separately
        };
      },
    };

    const effect =
      effects[transitionType as keyof typeof effects] || effects.none;
    return effect();
  }

  private updateDigitTransitions(
    currentValue: number,
    frameProgress: number
  ): void {
    const currentText = this.formatNumber(currentValue);
    const previousText = this.formatNumber(this.previousValue);

    // Clear old transitions
    this.digitTransitions.clear();

    // Find digit changes
    const maxLength = Math.max(currentText.length, previousText.length);
    for (let i = 0; i < maxLength; i++) {
      const currentDigit = currentText[i] || "";
      const previousDigit = previousText[i] || "";

      if (currentDigit !== previousDigit) {
        this.digitTransitions.set(i, {
          oldDigit: previousDigit,
          newDigit: currentDigit,
          progress: frameProgress,
        });
      }
    }

    this.previousValue = currentValue;
  }

  /**
   * Apply a controlled blur effect to prevent color bleeding in transparent exports
   * This method creates a more contained glow/neon effect than standard shadowBlur
   */
  private applyControlledBlur(
    sourceCanvas: HTMLCanvasElement,
    blurRadius: number,
    color: string
  ): HTMLCanvasElement {
    // Create a new canvas for the blurred result
    const blurredCanvas = document.createElement("canvas");
    blurredCanvas.width = sourceCanvas.width;
    blurredCanvas.height = sourceCanvas.height;

    const blurCtx = blurredCanvas.getContext("2d", {
      alpha: true,
      premultipliedAlpha: false,
    });

    if (!blurCtx) {
      return sourceCanvas; // Fallback if context creation fails
    }

    // Clear with full transparency
    blurCtx.clearRect(0, 0, blurredCanvas.width, blurredCanvas.height);

    // Apply multiple passes of smaller blurs for better quality
    const passes = 3;
    const passRadius = blurRadius / passes;

    // First pass - draw original content
    blurCtx.drawImage(sourceCanvas, 0, 0);

    // Create a temporary canvas for multi-pass blur
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = sourceCanvas.width;
    tempCanvas.height = sourceCanvas.height;
    const tempCtx = tempCanvas.getContext("2d", { alpha: true });

    if (!tempCtx) {
      return blurredCanvas;
    }

    // Apply multiple blur passes with decreasing intensity
    for (let i = 0; i < passes; i++) {
      // Copy current state to temp canvas
      tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
      tempCtx.drawImage(blurredCanvas, 0, 0);

      // Apply blur with decreasing radius
      const currentRadius = (passRadius * (passes - i)) / passes;

      // Use CSS filter for blur
      blurCtx.filter = `blur(${currentRadius}px)`;
      blurCtx.clearRect(0, 0, blurredCanvas.width, blurredCanvas.height);
      blurCtx.drawImage(tempCanvas, 0, 0);
      blurCtx.filter = "none";
    }

    // Apply alpha threshold to remove very faint edges that cause bleeding
    const imageData = blurCtx.getImageData(
      0,
      0,
      blurredCanvas.width,
      blurredCanvas.height
    );
    const data = imageData.data;

    // Threshold to remove very faint glow that causes bleeding
    const threshold = 10;

    for (let i = 0; i < data.length; i += 4) {
      // If pixel is very faint, make it fully transparent
      if (data[i + 3] < threshold) {
        data[i + 3] = 0;
      }
      // Otherwise enhance the alpha slightly for better visibility
      else if (data[i + 3] < 200) {
        data[i + 3] = Math.min(255, data[i + 3] * 1.2);
      }
    }

    blurCtx.putImageData(imageData, 0, 0);

    return blurredCanvas;
  }

  private drawMultiDigitCounter(
    value: number,
    centerX: number,
    centerY: number,
    frameProgress: number
  ): void {
    const counterText = this.formatNumber(value);
    const fontSize = this.counterSettings.fontSize;
    const fontFamily = this.getFontFamily(this.counterSettings.fontFamily);
    const letterSpacing = this.counterSettings.letterSpacing || 0;

    // Save the current context state
    this.ctx.save();

    // Apply counter opacity if specified
    if (this.counterSettings.counterOpacity !== undefined) {
      this.ctx.globalAlpha = this.counterSettings.counterOpacity;
    }

    this.ctx.font = `${
      this.counterSettings.fontWeight || 400
    } ${fontSize}px ${fontFamily}`;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";

    // Calculate total width for centering
    let totalWidth = 0;
    for (let i = 0; i < counterText.length; i++) {
      const char = counterText[i];
      const charWidth = this.ctx.measureText(char).width;
      totalWidth +=
        charWidth + (i < counterText.length - 1 ? letterSpacing : 0);
    }

    // frameProgress is already eased, no need to apply easing again
    const easedProgress = frameProgress;

    // Special handling for odometer animation
    if (this.counterSettings.transition === "odometer") {
      // Calculate the current value based on eased progress
      const startValue = this.counterSettings.startValue;
      const endValue = this.counterSettings.endValue;
      const currentValue = startValue + (endValue - startValue) * easedProgress;

      // Calculate absolute value and handle decimals
      const absValue = Math.abs(currentValue);
      const decimals = this.counterSettings.useFloatValues ? 2 : 0;
      const integer = Math.floor(absValue);

      // Format the integer part with separators if needed
      let integerStr = integer.toString();
      if (this.counterSettings.separator === "comma") {
        integerStr = integerStr.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      }

      // Handle decimal part if needed
      let decimalStr = "";
      if (decimals > 0) {
        decimalStr = Math.floor((absValue - integer) * Math.pow(10, decimals))
          .toString()
          .padStart(decimals, "0");
      }

      // Combine parts
      let numericStr = integerStr;
      if (decimals > 0) numericStr += "." + decimalStr;
      const sign = currentValue < 0 ? "-" : "";
      const fullStr =
        this.counterSettings.prefix +
        sign +
        numericStr +
        this.counterSettings.suffix;

      // Recalculate total width for the formatted string
      totalWidth = 0;
      for (let i = 0; i < fullStr.length; i++) {
        const charWidth = this.ctx.measureText(fullStr[i]).width;
        totalWidth += charWidth + (i < fullStr.length - 1 ? letterSpacing : 0);
      }

      let currentX = centerX - totalWidth / 2;

      // Find digit positions and calculate locals
      const digitIndices = [];
      for (let i = 0; i < fullStr.length; i++) {
        if (/\d/.test(fullStr[i])) {
          digitIndices.push(i);
        }
      }

      const numDigits = digitIndices.length;
      const integerDigits = decimals > 0 ? numDigits - decimals : numDigits;

      // Calculate local for each digit from right to left
      const digitLocals = [];
      let pos = decimals > 0 ? -decimals : 0;
      for (let j = numDigits - 1; j >= 0; j--) {
        const place = Math.pow(10, pos);
        const local = (absValue / place) % 10;
        digitLocals.unshift(local); // unshift to keep left to right
        pos += 1;
      }

      // Draw each character
      for (let i = 0; i < fullStr.length; i++) {
        const char = fullStr[i];
        const charWidth = this.ctx.measureText(char).width;
        const charX = currentX + charWidth / 2;
        const charY = centerY;

        if (/\d/.test(char)) {
          // Animate rolling digit
          const local = digitLocals.shift()!;
          const floor = Math.floor(local);
          const frac = local - floor;
          const next = (floor + 1) % 10;

          // Check if we're at the end value
          const isEndValue = currentValue >= endValue;

          // Clip to digit area
          this.ctx.save();
          const clipHeight = fontSize * 1.1; // slight extra to avoid cutoff
          const clipY = charY - clipHeight / 2;
          this.ctx.beginPath();
          this.ctx.rect(
            charX - charWidth / 2 - 2,
            clipY,
            charWidth + 4,
            clipHeight
          );
          this.ctx.clip();

          if (isEndValue || frac < 0.001) {
            // Snap to final position
            this.applyDesignEffects(floor.toString(), charX, charY, fontSize);
          } else {
            // Normal rolling
            // Offset for rolling up (next comes from top)
            const offset = frac * fontSize;

            // Draw next digit
            this.applyDesignEffects(
              next.toString(),
              charX,
              charY - fontSize + offset,
              fontSize
            );

            // Draw current digit
            this.applyDesignEffects(
              floor.toString(),
              charX,
              charY + offset,
              fontSize
            );
          }

          this.ctx.restore();
        } else {
          // Draw fixed character
          this.applyDesignEffects(char, charX, charY, fontSize);
        }

        currentX += charWidth + letterSpacing;
      }
    } else {
      // Original code for other transitions
      let currentX = centerX - totalWidth / 2;

      for (let i = 0; i < counterText.length; i++) {
        const char = counterText[i];
        const charWidth = this.ctx.measureText(char).width;
        const digitX = currentX + charWidth / 2;

        // Check if this digit has a transition
        const transition = this.digitTransitions.get(i);
        let digitProgress = easedProgress;

        if (transition && this.exportOptions.preserveAnimations) {
          // Use transition-specific progress
          digitProgress = transition.progress;
        }

        // Apply digit-specific transition
        const {
          x: tX,
          y: tY,
          opacity: tOpacity,
          transform,
        } = this.applyDigitTransition(
          char,
          digitX,
          centerY,
          fontSize,
          digitProgress,
          this.counterSettings.transition
        );

        // Save context for this digit
        this.ctx.save();

        // Apply transform if provided
        if (transform) {
          transform();
        }

        // Apply opacity - combine transition opacity with counter opacity
        const counterOpacity =
          this.counterSettings.counterOpacity !== undefined
            ? this.counterSettings.counterOpacity
            : 1;
        this.ctx.globalAlpha = tOpacity * counterOpacity;

        // Draw the digit with design effects
        this.applyDesignEffects(char, tX, tY, fontSize);

        // Restore context
        this.ctx.restore();

        currentX += charWidth + letterSpacing;
      }
    }

    // Restore the context state to reset opacity
    this.ctx.restore();
  }

  private drawFrame(value: number, progress: number): void {
    // Clear canvas with full transparency
    this.ctx.clearRect(
      0,
      0,
      this.exportOptions.width,
      this.exportOptions.height
    );

    const centerX = this.exportOptions.width / 2;
    const centerY = this.exportOptions.height / 2;

    // Update digit transitions
    this.updateDigitTransitions(value, progress);

    // Draw counter if enabled
    if (this.exportOptions.includeCounter) {
      this.drawMultiDigitCounter(value, centerX, centerY, progress);
    }

    // Draw text if enabled
    if (
      this.exportOptions.includeText &&
      this.textSettings.enabled &&
      this.textSettings.text
    ) {
      const textX = centerX + this.textSettings.offsetX;
      const textY = centerY + this.textSettings.offsetY;
      const textFontSize = this.textSettings.fontSize;
      const textFontFamily = this.getFontFamily(this.textSettings.fontFamily);

      this.ctx.font = `${textFontSize}px ${textFontFamily}`;
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";

      const previousAlpha = this.ctx.globalAlpha;
      this.ctx.globalAlpha = this.textSettings.opacity;

      // Apply same design effects as counter for consistency
      this.applyDesignEffects(
        this.textSettings.text,
        textX,
        textY,
        textFontSize
      );

      this.ctx.globalAlpha = previousAlpha;
    }
  }

  private async generatePNGSequence(
    checkCancellation?: () => boolean
  ): Promise<Blob> {
    const zip = new JSZip();
    const frameCount = Math.ceil(
      this.exportOptions.frameRate * this.exportOptions.duration
    );

    // Report initial progress
    if (this.progressCallback) {
      this.progressCallback(0, "Initializing PNG sequence generation...");
    }

    toast.info(
      `Generating optimized PNG sequence with enhanced transparency...`
    );

    // Configure transparency optimization settings
    const transparentSettings: TransparentExportSettings = {
      preserveAlphaChannel: true,
      alphaChannelQuality:
        this.exportOptions.scale > 2
          ? "ultra"
          : this.exportOptions.scale > 1.5
          ? "high"
          : "standard",
      antiAliasing: true,
      subPixelRendering: true,
      premultipliedAlpha: false,
      colorSpaceCorrection: true,
      edgeSmoothing: true,
    };

    // Initialize transition progress tracking
    const transitionDuration = Math.ceil(frameCount * 0.15);
    this.digitTransitions.clear();

    // Pre-calculate all values for smoother animation with consistent easing
    const values = [];
    const easedProgresses = [];

    for (let frame = 0; frame < frameCount; frame++) {
      const progress = frame / Math.max(1, frameCount - 1);
      const easedProgress =
        this.counterSettings.easing &&
        this.counterSettings.easing in easingFunctions
          ? easingFunctions[
              this.counterSettings.easing as keyof typeof easingFunctions
            ](progress)
          : progress;

      const value =
        this.counterSettings.startValue +
        easedProgress *
          (this.counterSettings.endValue - this.counterSettings.startValue);

      values.push(value);
      easedProgresses.push(easedProgress);
    }

    // Determine if we have special effects that need optimization
    const hasSpecialEffects =
      [
        "neon",
        "glow",
        "matrixRain",
        "particleExplosion",
        "liquidMorph",
        "hologramFlicker",
      ].includes(this.counterSettings.design) ||
      [
        "matrixRain",
        "particleExplosion",
        "liquidMorph",
        "hologramFlicker",
      ].includes(this.counterSettings.transition);

    for (let frame = 0; frame < frameCount; frame++) {
      // Check for cancellation
      if (checkCancellation && checkCancellation()) {
        toast.info("PNG sequence generation cancelled");
        if (frame > 0) {
          return await zip.generateAsync({ type: "blob" });
        }
        throw new Error("Export cancelled");
      }

      // Report progress - only update every few frames to avoid excessive UI updates
      if (
        this.progressCallback &&
        (frame % 5 === 0 || frame === frameCount - 1)
      ) {
        const progress = Math.round((frame / frameCount) * 100);
        this.progressCallback(
          progress,
          `Generating frame ${frame + 1} of ${frameCount}...`
        );
      }

      const value = values[frame];
      const easedProgress = easedProgresses[frame];

      // Update digit transitions with the pre-calculated eased progress
      this.updateDigitTransitions(value, easedProgress);

      // Clear canvas for each frame with enhanced transparency
      this.ctx.clearRect(
        0,
        0,
        this.exportOptions.width,
        this.exportOptions.height
      );

      // Draw frame with pre-calculated eased progress
      this.drawFrame(value, easedProgress);

      // Apply transparency optimizations
      let optimizedCanvas = this.canvas;

      // First enhance alpha channel preservation
      optimizedCanvas =
        TransparentExportOptimizer.enhanceAlphaChannelPreservation(
          optimizedCanvas,
          transparentSettings
        );

      // Apply special handling for neon and glow effects to prevent bleeding
      if (["neon", "glow"].includes(this.counterSettings.design)) {
        // Use our new fixGlowBleeding method for these specific effects
        optimizedCanvas = TransparentExportOptimizer.fixGlowBleeding(
          optimizedCanvas,
          transparentSettings
        );

        // Apply additional alpha threshold to completely eliminate any remaining bleeding
        const imageData = optimizedCanvas
          .getContext("2d")
          ?.getImageData(0, 0, optimizedCanvas.width, optimizedCanvas.height);

        if (imageData) {
          const data = imageData.data;
          // Use more aggressive threshold for neon effects which tend to bleed more
          const threshold = this.counterSettings.design === "neon" ? 20 : 15;

          // Apply more aggressive threshold for very faint pixels
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];

            // If this is a very faint pixel (likely bleeding from glow/neon)
            if (a > 0 && a < threshold) {
              // Check if it's an isolated pixel (more likely to be bleeding)
              const x = (i / 4) % optimizedCanvas.width;
              const y = Math.floor(i / 4 / optimizedCanvas.width);
              let isIsolated = true;

              // Check surrounding pixels in a small radius
              const checkRadius = 2;
              for (
                let dy = -checkRadius;
                dy <= checkRadius && isIsolated;
                dy++
              ) {
                for (let dx = -checkRadius; dx <= checkRadius; dx++) {
                  if (dx === 0 && dy === 0) continue;

                  const nx = x + dx;
                  const ny = y + dy;

                  if (
                    nx >= 0 &&
                    nx < optimizedCanvas.width &&
                    ny >= 0 &&
                    ny < optimizedCanvas.height
                  ) {
                    const ni = (ny * optimizedCanvas.width + nx) * 4;
                    if (imageData.data[ni + 3] > 100) {
                      isIsolated = false;
                      break;
                    }
                  }
                }
              }

              // Remove isolated faint pixels completely
              if (isIsolated) {
                data[i + 3] = 0;
              }
            }
          }

          optimizedCanvas.getContext("2d")?.putImageData(imageData, 0, 0);
        }
      }
      // Optimize other special effects if present
      else if (hasSpecialEffects) {
        optimizedCanvas =
          TransparentExportOptimizer.optimizeSpecialEffectsTransparency(
            optimizedCanvas,
            this.counterSettings.design || this.counterSettings.transition,
            transparentSettings
          );
      }

      // Apply resolution scaling if needed
      if (this.exportOptions.scale !== 1.0) {
        const scalingSettings: ResolutionScaling = {
          baseResolution: {
            width: this.exportOptions.width,
            height: this.exportOptions.height,
          },
          targetResolution: {
            width: Math.round(
              this.exportOptions.width * this.exportOptions.scale
            ),
            height: Math.round(
              this.exportOptions.height * this.exportOptions.scale
            ),
          },
          scalingAlgorithm:
            this.exportOptions.scale > 2 ? "bicubic" : "bilinear",
          maintainAspectRatio: true,
          sharpening: this.exportOptions.scale > 1.5 ? 0.3 : 0,
        };

        optimizedCanvas = TransparentExportOptimizer.scaleForResolution(
          optimizedCanvas,
          scalingSettings,
          transparentSettings
        );
      }

      // Convert optimized canvas to PNG blob with maximum quality
      const blob = await new Promise<Blob>((resolve) => {
        optimizedCanvas.toBlob(
          (blob) => {
            resolve(blob!);
          },
          "image/png",
          1.0 // Maximum quality for PNG
        );
      });

      // Add to zip with zero-padded frame number
      const frameNumber = frame.toString().padStart(6, "0");
      const arrayBuffer = await blob.arrayBuffer();
      zip.file(`frame${frameNumber}.png`, arrayBuffer);

      // Update progress less frequently for performance
      if (frame % 20 === 0 || frame === frameCount - 1) {
        toast.info(`Generated ${frame + 1}/${frameCount} optimized frames`);
      }
    }

    // Add enhanced metadata file with optimization details
    const metadata = {
      frameRate: this.exportOptions.frameRate,
      duration: this.exportOptions.duration,
      width: this.canvas.width,
      height: this.canvas.height,
      frameCount: frameCount,
      counterSettings: this.counterSettings,
      textSettings: this.textSettings,
      designSettings: this.designSettings,
      exportOptions: this.exportOptions,
      transparencyOptimizations: {
        alphaChannelQuality: transparentSettings.alphaChannelQuality,
        antiAliasing: transparentSettings.antiAliasing,
        subPixelRendering: transparentSettings.subPixelRendering,
        edgeSmoothing: transparentSettings.edgeSmoothing,
        specialEffectsOptimized: hasSpecialEffects,
      },
      generatedAt: new Date().toISOString(),
      version: "2.0-optimized",
    };

    zip.file("metadata.json", JSON.stringify(metadata, null, 2));

    toast.info("Compressing optimized PNG sequence...");
    return await zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 6 }, // Balanced compression
    });
  }

  // Special drawing method with explicit transition progress
  private drawFrameWithExplicitTransition(
    value: number,
    transitionProgress: number
  ): void {
    const centerX = this.exportOptions.width / 2;
    const centerY = this.exportOptions.height / 2;

    // Draw counter with explicit transition progress
    if (this.exportOptions.includeCounter) {
      this.drawTransitioningCounter(
        value,
        centerX,
        centerY,
        transitionProgress
      );
    }

    // Draw text with explicit transition if enabled
    if (
      this.exportOptions.includeText &&
      this.textSettings.enabled &&
      this.textSettings.text
    ) {
      const textX = centerX + this.textSettings.offsetX;
      const textY = centerY + this.textSettings.offsetY;
      const textFontSize = this.textSettings.fontSize;
      const textFontFamily = this.getFontFamily(this.textSettings.fontFamily);

      this.ctx.font = `${textFontSize}px ${textFontFamily}`;
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";

      // Apply fade transition to text
      const previousAlpha = this.ctx.globalAlpha;
      this.ctx.globalAlpha = this.textSettings.opacity * transitionProgress;

      // Apply design effects
      this.applyDesignEffects(
        this.textSettings.text,
        textX,
        textY,
        textFontSize
      );

      this.ctx.globalAlpha = previousAlpha;
    }
  }

  // Special counter drawing method with explicit transition
  private drawTransitioningCounter(
    value: number,
    centerX: number,
    centerY: number,
    transitionProgress: number
  ): void {
    const counterText = this.formatNumber(value);
    const fontSize = this.counterSettings.fontSize;
    const fontFamily = this.getFontFamily(this.counterSettings.fontFamily);
    const letterSpacing = this.counterSettings.letterSpacing || 0;
    const fontWeight = this.counterSettings.fontWeight || 400;

    this.ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";

    // Calculate total width for centering
    let totalWidth = 0;
    for (let i = 0; i < counterText.length; i++) {
      const char = counterText[i];
      const charWidth = this.ctx.measureText(char).width;
      totalWidth +=
        charWidth + (i < counterText.length - 1 ? letterSpacing : 0);
    }

    // Add special handling for odometer transition
    if (this.counterSettings.transition === "odometer") {
      // Use the same odometer drawing logic as regular frames
      const absValue = Math.abs(value);
      const decimals = this.counterSettings.useFloatValues ? 2 : 0;
      const integer = Math.floor(absValue);
      let integerStr = integer.toString();
      if (this.counterSettings.separator === "comma") {
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
      const fullStr =
        this.counterSettings.prefix +
        sign +
        numericStr +
        this.counterSettings.suffix;

      // Re-compute totalWidth for odometer string
      totalWidth = 0;
      for (let i = 0; i < fullStr.length; i++) {
        const charWidth = this.ctx.measureText(fullStr[i]).width;
        totalWidth += charWidth + (i < fullStr.length - 1 ? letterSpacing : 0);
      }

      let currentX = centerX - totalWidth / 2;

      // Find digit locals
      const digitLocals: number[] = [];
      const numDigits = Array.from(fullStr).filter((ch) =>
        /\d/.test(ch)
      ).length;
      let pos = decimals > 0 ? -decimals : 0;
      for (let j = numDigits - 1; j >= 0; j--) {
        const place = Math.pow(10, pos);
        const local = (absValue / place) % 10;
        digitLocals.unshift(local);
        pos += 1;
      }

      for (let i = 0; i < fullStr.length; i++) {
        const char = fullStr[i];
        const charWidth = this.ctx.measureText(char).width;
        const charX = currentX + charWidth / 2;
        const charY = centerY;

        if (/\d/.test(char)) {
          const local = digitLocals.shift()!;
          const floorD = Math.floor(local);
          const frac = local - floorD;
          const next = (floorD + 1) % 10;

          // Clip region for digit
          this.ctx.save();
          const clipHeight = fontSize * 1.1;
          const clipY = charY - clipHeight / 2;
          this.ctx.beginPath();
          this.ctx.rect(
            charX - charWidth / 2 - 2,
            clipY,
            charWidth + 4,
            clipHeight
          );
          this.ctx.clip();

          // Offset
          const offset = frac * fontSize;
          // Draw next and current digits
          this.applyDesignEffects(
            next.toString(),
            charX,
            charY - fontSize + offset,
            fontSize
          );
          this.applyDesignEffects(
            floorD.toString(),
            charX,
            charY + offset,
            fontSize
          );

          this.ctx.restore();
        } else {
          this.applyDesignEffects(char, charX, charY, fontSize);
        }
        currentX += charWidth + letterSpacing;
      }
      return; // Skip the rest of original method for odometer
    }

    // Apply easing to transition progress if specified
    const easedProgress =
      this.counterSettings.easing &&
      this.counterSettings.easing in easingFunctions
        ? easingFunctions[
            this.counterSettings.easing as keyof typeof easingFunctions
          ](transitionProgress)
        : transitionProgress;

    // Draw each digit with explicit transition progress
    let currentX = centerX - totalWidth / 2;

    for (let i = 0; i < counterText.length; i++) {
      const char = counterText[i];
      const charWidth = this.ctx.measureText(char).width;
      const digitX = currentX + charWidth / 2;

      // Force the transition progress for initial fade
      const {
        x: tX,
        y: tY,
        opacity: tOpacity,
        transform,
      } = this.applyDigitTransition(
        char,
        digitX,
        centerY,
        fontSize,
        easedProgress,
        this.counterSettings.transition
      );

      // Save context for this digit
      this.ctx.save();

      // Apply transform if provided
      if (transform) {
        transform();
      }

      // Apply opacity
      this.ctx.globalAlpha = tOpacity;

      // Draw the digit with design effects
      this.applyDesignEffects(char, tX, tY, fontSize);

      // Restore context
      this.ctx.restore();

      currentX += charWidth + letterSpacing;
    }
  }

  private async generateWebMWithAlpha(
    checkCancellation?: () => boolean
  ): Promise<Blob> {
    // Report initial progress
    if (this.progressCallback) {
      this.progressCallback(
        0,
        "Initializing WebM with alpha channel generation..."
      );
    }

    toast.info("Generating optimized WebM with enhanced alpha channel...");

    // Configure transparency optimization settings for WebM
    const transparentSettings: TransparentExportSettings = {
      preserveAlphaChannel: true,
      alphaChannelQuality: "high", // WebM works best with high quality
      antiAliasing: true,
      subPixelRendering: true,
      premultipliedAlpha: false,
      colorSpaceCorrection: true,
      edgeSmoothing: true,
    };

    // Determine if we have special effects that need optimization
    const hasSpecialEffects =
      [
        "neon",
        "glow",
        "matrixRain",
        "particleExplosion",
        "liquidMorph",
        "hologramFlicker",
      ].includes(this.counterSettings.design) ||
      [
        "matrixRain",
        "particleExplosion",
        "liquidMorph",
        "hologramFlicker",
      ].includes(this.counterSettings.transition);

    // Get optimized WebM settings
    const recorderOptions = TransparentExportOptimizer.getOptimizedWebMSettings(
      true, // hasTransparency
      hasSpecialEffects,
      "high"
    );

    const stream = this.canvas.captureStream(this.exportOptions.frameRate);
    const recorder = new MediaRecorder(stream, recorderOptions);
    const chunks: Blob[] = [];

    return new Promise((resolve, reject) => {
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: recorderOptions.mimeType });
        toast.info("WebM with alpha channel generated successfully");
        resolve(blob);
      };

      recorder.onerror = (event) => {
        console.error("WebM recording error:", event);
        reject(new Error("WebM recording failed"));
      };

      recorder.start(100); // Collect data every 100ms

      // Animate the counter with enhanced alpha preservation
      const frameCount = Math.ceil(
        this.exportOptions.frameRate * this.exportOptions.duration
      );
      let currentFrame = 0;

      // Pre-calculate all values for consistent animation
      const values = [];
      const easedProgresses = [];

      for (let frame = 0; frame < frameCount; frame++) {
        const progress = frame / Math.max(1, frameCount - 1);
        const easedProgress =
          this.counterSettings.easing &&
          this.counterSettings.easing in easingFunctions
            ? easingFunctions[
                this.counterSettings.easing as keyof typeof easingFunctions
              ](progress)
            : progress;

        const value =
          this.counterSettings.startValue +
          easedProgress *
            (this.counterSettings.endValue - this.counterSettings.startValue);

        values.push(value);
        easedProgresses.push(easedProgress);
      }

      const animate = () => {
        // Check for cancellation
        if (checkCancellation && checkCancellation()) {
          recorder.stop();
          stream.getTracks().forEach((track) => track.stop());
          toast.info("WebM generation cancelled");
          resolve(new Blob(chunks, { type: recorderOptions.mimeType }));
          return;
        }

        if (currentFrame >= frameCount) {
          recorder.stop();
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        // Report progress - only update every few frames to avoid excessive UI updates
        if (
          this.progressCallback &&
          (currentFrame % 5 === 0 || currentFrame === frameCount - 1)
        ) {
          const progress = Math.round((currentFrame / frameCount) * 100);
          this.progressCallback(
            progress,
            `Generating WebM frame ${currentFrame + 1} of ${frameCount}...`
          );
        }

        const value = values[currentFrame];
        const easedProgress = easedProgresses[currentFrame];

        // Clear canvas with full transparency before each frame
        this.ctx.clearRect(
          0,
          0,
          this.exportOptions.width,
          this.exportOptions.height
        );

        // Draw the frame with enhanced alpha preservation
        this.drawFrameWithEnhancedAlpha(
          value,
          easedProgress,
          transparentSettings,
          hasSpecialEffects
        );

        currentFrame++;

        // Update progress toast occasionally
        if (currentFrame % Math.floor(frameCount / 10) === 0) {
          toast.info(`WebM frames: ${currentFrame}/${frameCount}`);
        }

        setTimeout(animate, 1000 / this.exportOptions.frameRate);
      };

      animate();
    });
  }

  // Enhanced method for drawing with optimized alpha preservation
  private drawFrameWithEnhancedAlpha(
    value: number,
    progress: number,
    transparentSettings: TransparentExportSettings,
    hasSpecialEffects: boolean
  ): void {
    const centerX = this.exportOptions.width / 2;
    const centerY = this.exportOptions.height / 2;

    // Update digit transitions
    this.updateDigitTransitions(value, progress);

    // Draw counter if enabled
    if (this.exportOptions.includeCounter) {
      this.drawMultiDigitCounter(value, centerX, centerY, progress);
    }

    // Draw text if enabled
    if (
      this.exportOptions.includeText &&
      this.textSettings.enabled &&
      this.textSettings.text
    ) {
      const textX = centerX + this.textSettings.offsetX;
      const textY = centerY + this.textSettings.offsetY;
      const textFontSize = this.textSettings.fontSize;
      const textFontFamily = this.getFontFamily(this.textSettings.fontFamily);

      this.ctx.font = `${textFontSize}px ${textFontFamily}`;
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";

      const previousAlpha = this.ctx.globalAlpha;
      this.ctx.globalAlpha = this.textSettings.opacity;

      // Apply design effects with enhanced alpha preservation
      this.applyDesignEffects(
        this.textSettings.text,
        textX,
        textY,
        textFontSize
      );

      this.ctx.globalAlpha = previousAlpha;
    }
  }

  // Method for optimizing transparent GIF exports
  private async generateOptimizedTransparentGIF(
    checkCancellation?: () => boolean
  ): Promise<Blob> {
    toast.info("Generating optimized transparent GIF...");

    // Configure transparency optimization settings for GIF
    const transparentSettings: TransparentExportSettings = {
      preserveAlphaChannel: true,
      alphaChannelQuality: "standard", // GIF works best with standard quality
      antiAliasing: false, // Disable for GIF to prevent artifacts
      subPixelRendering: false,
      premultipliedAlpha: false,
      colorSpaceCorrection: false,
      edgeSmoothing: false, // Disable for GIF
    };

    // Get optimized GIF settings
    const { optimizedCanvas, gifOptions } =
      TransparentExportOptimizer.optimizeTransparentGIF(
        this.canvas,
        transparentSettings
      );

    // Use the optimized canvas for GIF generation
    // Note: This would integrate with a GIF library like gif.js
    // For now, we'll return a placeholder blob
    return new Blob([], { type: "image/gif" });
  }

  // New method for drawing with improved alpha containment
  private drawFrameWithAlphaContainment(value: number, progress: number): void {
    const centerX = this.exportOptions.width / 2;
    const centerY = this.exportOptions.height / 2;

    // Update digit transitions
    this.updateDigitTransitions(value, progress);

    // For glow and neon effects, use a special rendering approach to prevent bleeding
    const hasGlowEffect = ["neon", "glow"].includes(
      this.counterSettings.design
    );

    if (hasGlowEffect) {
      // For glow effects, use a more contained approach
      if (this.exportOptions.includeCounter) {
        // Draw each digit with contained glow
        this.drawMultiDigitCounterWithContainedEffects(
          value,
          centerX,
          centerY,
          progress
        );
      }

      // Draw text with contained glow if enabled
      if (
        this.exportOptions.includeText &&
        this.textSettings.enabled &&
        this.textSettings.text
      ) {
        const textX = centerX + this.textSettings.offsetX;
        const textY = centerY + this.textSettings.offsetY;
        const textFontSize = this.textSettings.fontSize;
        const textFontFamily = this.getFontFamily(this.textSettings.fontFamily);

        this.ctx.font = `${textFontSize}px ${textFontFamily}`;
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";

        const previousAlpha = this.ctx.globalAlpha;
        this.ctx.globalAlpha = this.textSettings.opacity;

        // Apply contained effect
        this.applyContainedDesignEffect(
          this.textSettings.text,
          textX,
          textY,
          textFontSize
        );

        this.ctx.globalAlpha = previousAlpha;
      }
    } else {
      // Use regular drawing for non-glow effects
      this.drawFrame(value, progress);
    }
  }

  // Special method for drawing digits with contained glow/neon effects
  private drawMultiDigitCounterWithContainedEffects(
    value: number,
    centerX: number,
    centerY: number,
    frameProgress: number
  ): void {
    const counterText = this.formatNumber(value);
    const fontSize = this.counterSettings.fontSize;
    const fontFamily = this.getFontFamily(this.counterSettings.fontFamily);
    const letterSpacing = this.counterSettings.letterSpacing || 0;

    this.ctx.font = `${
      this.counterSettings.fontWeight || 400
    } ${fontSize}px ${fontFamily}`;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";

    // Calculate total width for centering
    let totalWidth = 0;
    for (let i = 0; i < counterText.length; i++) {
      const char = counterText[i];
      const charWidth = this.ctx.measureText(char).width;
      totalWidth +=
        charWidth + (i < counterText.length - 1 ? letterSpacing : 0);
    }

    // Apply easing to frame progress
    const easedProgress =
      this.counterSettings.easing &&
      this.counterSettings.easing in easingFunctions
        ? easingFunctions[
            this.counterSettings.easing as keyof typeof easingFunctions
          ](frameProgress)
        : frameProgress;

    // Add special handling for odometer transition
    if (this.counterSettings.transition === "odometer") {
      // Use the same odometer drawing logic as regular frames
      const absValue = Math.abs(value);
      const decimals = this.counterSettings.useFloatValues ? 2 : 0;
      const integer = Math.floor(absValue);
      let integerStr = integer.toString();
      if (this.counterSettings.separator === "comma") {
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
      const fullStr =
        this.counterSettings.prefix +
        sign +
        numericStr +
        this.counterSettings.suffix;

      // Re-compute totalWidth for odometer string
      totalWidth = 0;
      for (let i = 0; i < fullStr.length; i++) {
        const charWidth = this.ctx.measureText(fullStr[i]).width;
        totalWidth += charWidth + (i < fullStr.length - 1 ? letterSpacing : 0);
      }

      let currentX = centerX - totalWidth / 2;

      // Find digit locals
      const digitLocals: number[] = [];
      const numDigits = Array.from(fullStr).filter((ch) =>
        /\d/.test(ch)
      ).length;
      let pos = decimals > 0 ? -decimals : 0;
      for (let j = numDigits - 1; j >= 0; j--) {
        const place = Math.pow(10, pos);
        const local = (absValue / place) % 10;
        digitLocals.unshift(local);
        pos += 1;
      }

      for (let i = 0; i < fullStr.length; i++) {
        const char = fullStr[i];
        const charWidth = this.ctx.measureText(char).width;
        const charX = currentX + charWidth / 2;
        const charY = centerY;

        if (/\d/.test(char)) {
          const local = digitLocals.shift()!;
          const floorD = Math.floor(local);
          const frac = local - floorD;
          const next = (floorD + 1) % 10;

          // Clip region for digit
          this.ctx.save();
          const clipHeight = fontSize * 1.1;
          const clipY = charY - clipHeight / 2;
          this.ctx.beginPath();
          this.ctx.rect(
            charX - charWidth / 2 - 2,
            clipY,
            charWidth + 4,
            clipHeight
          );
          this.ctx.clip();

          // Offset
          const offset = frac * fontSize;
          // Draw next and current digits
          this.applyDesignEffects(
            next.toString(),
            charX,
            charY - fontSize + offset,
            fontSize
          );
          this.applyDesignEffects(
            floorD.toString(),
            charX,
            charY + offset,
            fontSize
          );

          this.ctx.restore();
        } else {
          this.applyDesignEffects(char, charX, charY, fontSize);
        }
        currentX += charWidth + letterSpacing;
      }
      return; // Skip the rest of original method for odometer
    }

    // Draw each digit with individual transitions
    let currentX = centerX - totalWidth / 2;

    for (let i = 0; i < counterText.length; i++) {
      const char = counterText[i];
      const charWidth = this.ctx.measureText(char).width;
      const digitX = currentX + charWidth / 2;

      // Check if this digit has a transition
      const transition = this.digitTransitions.get(i);
      let digitProgress = easedProgress;

      if (transition && this.exportOptions.preserveAnimations) {
        // Use transition-specific progress
        digitProgress = transition.progress;
      }

      // Apply digit-specific transition
      const {
        x: tX,
        y: tY,
        opacity: tOpacity,
        transform,
      } = this.applyDigitTransition(
        char,
        digitX,
        centerY,
        fontSize,
        digitProgress,
        this.counterSettings.transition
      );

      // Save context for this digit
      this.ctx.save();

      // Apply transform if provided
      if (transform) {
        transform();
      }

      // Apply opacity
      this.ctx.globalAlpha = tOpacity;

      // Draw the digit with contained design effects
      this.applyContainedDesignEffect(char, tX, tY, fontSize);

      // Restore context
      this.ctx.restore();

      currentX += charWidth + letterSpacing;
    }
  }

  // New method specifically for neon and glow effects with zero bleeding
  private applyContainedDesignEffect(
    text: string,
    x: number,
    y: number,
    fontSize: number
  ): void {
    if (this.counterSettings.design === "neon") {
      const neonColor = this.designSettings.neonColor || "#00FFFF";
      const intensity = Math.min(this.designSettings.neonIntensity || 10, 8); // Further reduced intensity

      this.ctx.save();

      // Create a temporary canvas for the glow effect
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = this.canvas.width;
      tempCanvas.height = this.canvas.height;
      const tempCtx = tempCanvas.getContext("2d")!;

      // Set font properties on temp canvas
      tempCtx.font = this.ctx.font;
      tempCtx.textAlign = "center";
      tempCtx.textBaseline = "middle";

      // Draw the glow effect on temp canvas
      tempCtx.fillStyle = neonColor;
      tempCtx.shadowColor = neonColor;
      tempCtx.shadowBlur = intensity * 2;
      tempCtx.fillText(text, x, y);

      // Draw the sharp text on top
      tempCtx.shadowBlur = 0;
      tempCtx.fillStyle = "#FFFFFF";
      tempCtx.fillText(text, x, y);

      // Draw the temp canvas onto main canvas with proper alpha
      this.ctx.globalCompositeOperation = "source-over";
      this.ctx.drawImage(tempCanvas, 0, 0);

      this.ctx.restore();
    } else if (this.counterSettings.design === "glow") {
      const glowColor = this.designSettings.glowColor || "#FFFFFF";
      const intensity = Math.min(this.designSettings.glowIntensity || 15, 12); // Further reduced intensity

      this.ctx.save();

      // Create a temporary canvas for the glow effect
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = this.canvas.width;
      tempCanvas.height = this.canvas.height;
      const tempCtx = tempCanvas.getContext("2d")!;

      // Set font properties on temp canvas
      tempCtx.font = this.ctx.font;
      tempCtx.textAlign = "center";
      tempCtx.textBaseline = "middle";

      // Draw the glow effect on temp canvas
      tempCtx.fillStyle = glowColor;
      tempCtx.shadowColor = glowColor;
      tempCtx.shadowBlur = intensity * 1.5;
      tempCtx.fillText(text, x, y);

      // Draw the sharp text on top
      tempCtx.shadowBlur = 0;
      tempCtx.fillStyle = glowColor;
      tempCtx.fillText(text, x, y);

      // Draw the temp canvas onto main canvas with proper alpha
      this.ctx.globalCompositeOperation = "source-over";
      this.ctx.drawImage(tempCanvas, 0, 0);

      this.ctx.restore();
    } else {
      // Use normal effects for other styles
      this.applyDesignEffects(text, x, y, fontSize);
    }
  }

  async export(
    checkCancellation?: () => boolean,
    progressCallback?: ExportProgressCallback
  ): Promise<{ pngSequence?: Blob; webmAlpha?: Blob }> {
    // Store the progress callback for use in other methods
    this.progressCallback = progressCallback;

    // Initialize progress
    if (this.progressCallback) {
      this.progressCallback(0, "Starting export process...");
    }
    const results: { pngSequence?: Blob; webmAlpha?: Blob } = {};

    try {
      if (
        this.exportOptions.format === "png-sequence" ||
        this.exportOptions.format === "both"
      ) {
        if (this.progressCallback) {
          this.progressCallback(0, "Starting PNG sequence generation...");
        }
        toast.info("Generating PNG sequence with alpha channel...");
        results.pngSequence = await this.generatePNGSequence(checkCancellation);

        // Check for cancellation after PNG generation
        if (checkCancellation && checkCancellation()) {
          return results;
        }

        // Report progress for PNG completion
        if (this.progressCallback && this.exportOptions.format === "both") {
          this.progressCallback(
            50,
            "PNG sequence completed. Starting WebM generation..."
          );
        } else if (this.progressCallback) {
          this.progressCallback(
            90,
            "PNG sequence completed. Finalizing export..."
          );
        }
      }

      if (
        this.exportOptions.format === "webm-alpha" ||
        this.exportOptions.format === "both"
      ) {
        // If we're only generating WebM, start from 0%
        if (
          this.exportOptions.format === "webm-alpha" &&
          this.progressCallback
        ) {
          this.progressCallback(0, "Starting WebM video generation...");
        }

        toast.info("Generating WebM video with alpha channel...");
        results.webmAlpha = await this.generateWebMWithAlpha(checkCancellation);

        // Report progress for WebM completion
        if (this.progressCallback) {
          this.progressCallback(
            90,
            "WebM video completed. Finalizing export..."
          );
        }
      }

      return results;
    } catch (error) {
      console.error("Export failed:", error);
      throw error;
    }
  }

  static async downloadExports(
    exports: { pngSequence?: Blob; webmAlpha?: Blob },
    baseName: string = "transparent-counter"
  ): Promise<void> {
    const timestamp = Date.now();

    if (exports.pngSequence) {
      const url = URL.createObjectURL(exports.pngSequence);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${baseName}-png-sequence-${timestamp}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    if (exports.webmAlpha) {
      const url = URL.createObjectURL(exports.webmAlpha);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${baseName}-alpha-${timestamp}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    toast.success("Transparent counter exports downloaded successfully!");
  }
}
