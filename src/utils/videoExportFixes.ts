import { toast } from "sonner";
import {
  TransparentExportOptimizer,
  TransparentExportSettings,
  ResolutionScaling,
} from "./transparentExportOptimizer";

export interface VideoExportOptions {
  canvas: HTMLCanvasElement;
  settings: {
    background: string;
    design: string;
    backgroundGradient?: string;
    customBackgroundColor?: string;
  };
  duration: number;
  fps?: number;
  quality?: "low" | "medium" | "high" | "ultra";
}

export interface FormatCapability {
  mimeType: string;
  supportsTransparency: boolean;
  quality: "excellent" | "good" | "fair" | "poor";
  browserSupport: "universal" | "modern" | "limited";
  description: string;
  limitations: string[];
}

export interface ExportValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  recommendedFormat?: string;
  fallbackOptions: string[];
}

export class VideoExportManager {
  // Enhanced codec preferences with transparency support prioritization
  private static readonly TRANSPARENCY_CODECS = [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
  ];

  private static readonly STANDARD_CODECS = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm;codecs=h264,opus",
    "video/webm",
    "video/mp4;codecs=h264,aac",
    "video/mp4",
  ];

  private static readonly QUALITY_SETTINGS = {
    low: { videoBitsPerSecond: 2500000, audioBitsPerSecond: 128000 },
    medium: { videoBitsPerSecond: 5000000, audioBitsPerSecond: 192000 },
    high: { videoBitsPerSecond: 8000000, audioBitsPerSecond: 256000 },
    ultra: { videoBitsPerSecond: 15000000, audioBitsPerSecond: 320000 },
  };

  // Format capability database
  private static readonly FORMAT_CAPABILITIES: FormatCapability[] = [
    {
      mimeType: "video/webm;codecs=vp9",
      supportsTransparency: true,
      quality: "excellent",
      browserSupport: "modern",
      description: "WebM VP9 - Best quality with transparency support",
      limitations: ["Not supported in Safari < 14", "Requires modern browser"],
    },
    {
      mimeType: "video/webm;codecs=vp8",
      supportsTransparency: true,
      quality: "good",
      browserSupport: "modern",
      description: "WebM VP8 - Good quality with transparency support",
      limitations: [
        "Lower compression than VP9",
        "Not supported in Safari < 14",
      ],
    },
    {
      mimeType: "video/webm",
      supportsTransparency: true,
      quality: "good",
      browserSupport: "modern",
      description: "WebM - Standard web video format",
      limitations: ["Codec depends on browser", "Not supported in Safari < 14"],
    },
    {
      mimeType: "video/mp4;codecs=h264,aac",
      supportsTransparency: false,
      quality: "good",
      browserSupport: "universal",
      description: "MP4 H.264 - Universal compatibility",
      limitations: ["No transparency support", "Larger file sizes"],
    },
    {
      mimeType: "video/mp4",
      supportsTransparency: false,
      quality: "fair",
      browserSupport: "universal",
      description: "MP4 - Universal video format",
      limitations: ["No transparency support", "Codec depends on browser"],
    },
  ];

  /**
   * Get the best supported MIME type based on requirements
   */
  static getSupportedMimeType(requiresTransparency: boolean = false): string {
    const codecList = requiresTransparency
      ? this.TRANSPARENCY_CODECS
      : this.STANDARD_CODECS;

    for (const mimeType of codecList) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        return mimeType;
      }
    }

    console.warn("No preferred codecs supported, falling back to default");
    return "video/webm";
  }

  /**
   * Detect format capabilities for the current browser
   */
  static detectFormatCapabilities(): FormatCapability[] {
    return this.FORMAT_CAPABILITIES.filter((capability) =>
      MediaRecorder.isTypeSupported(capability.mimeType)
    );
  }

  /**
   * Get the best format for given requirements
   */
  static getBestFormat(
    requiresTransparency: boolean,
    prioritizeQuality: boolean = true
  ): FormatCapability | null {
    const supportedFormats = this.detectFormatCapabilities();

    // Filter by transparency requirement
    const compatibleFormats = supportedFormats.filter(
      (format) => !requiresTransparency || format.supportsTransparency
    );

    if (compatibleFormats.length === 0) {
      return null;
    }

    // Sort by quality if prioritizing quality, otherwise by browser support
    if (prioritizeQuality) {
      const qualityOrder = { excellent: 4, good: 3, fair: 2, poor: 1 };
      return compatibleFormats.sort(
        (a, b) => qualityOrder[b.quality] - qualityOrder[a.quality]
      )[0];
    } else {
      const supportOrder = { universal: 3, modern: 2, limited: 1 };
      return compatibleFormats.sort(
        (a, b) =>
          supportOrder[b.browserSupport] - supportOrder[a.browserSupport]
      )[0];
    }
  }

  /**
   * Validate export settings and provide recommendations
   */
  static validateExportSettings(
    hasTransparency: boolean,
    hasComplexEffects: boolean,
    targetFormat?: string
  ): ExportValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const fallbackOptions: string[] = [];

    // Check if any formats are supported
    const supportedFormats = this.detectFormatCapabilities();
    if (supportedFormats.length === 0) {
      errors.push("No supported video formats detected in this browser");
      return { isValid: false, errors, warnings, fallbackOptions };
    }

    // Check transparency requirements
    if (hasTransparency) {
      const transparencyFormats = supportedFormats.filter(
        (f) => f.supportsTransparency
      );
      if (transparencyFormats.length === 0) {
        errors.push(
          "Transparency required but no supported formats support alpha channel"
        );
        fallbackOptions.push("Consider using PNG sequence export instead");
        fallbackOptions.push("Switch to non-transparent background");
      } else if (
        transparencyFormats.length === 1 &&
        transparencyFormats[0].quality === "fair"
      ) {
        warnings.push("Limited transparency support - quality may be reduced");
      }
    }

    // Check target format compatibility
    if (targetFormat) {
      const targetCapability = supportedFormats.find((f) =>
        f.mimeType.includes(targetFormat)
      );
      if (!targetCapability) {
        errors.push(
          `Target format ${targetFormat} is not supported in this browser`
        );
        const alternatives = supportedFormats
          .slice(0, 2)
          .map((f) => f.description);
        fallbackOptions.push(...alternatives);
      } else if (hasTransparency && !targetCapability.supportsTransparency) {
        warnings.push(
          `${targetFormat} format does not support transparency - background will be opaque`
        );
      }
    }

    // Check for complex effects
    if (hasComplexEffects) {
      const highQualityFormats = supportedFormats.filter(
        (f) => f.quality === "excellent" || f.quality === "good"
      );
      if (highQualityFormats.length === 0) {
        warnings.push(
          "Complex effects may not render optimally with available formats"
        );
      }
    }

    // Provide recommendations
    let recommendedFormat: string | undefined;
    if (errors.length === 0) {
      const bestFormat = this.getBestFormat(hasTransparency, true);
      recommendedFormat = bestFormat?.mimeType;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      recommendedFormat,
      fallbackOptions,
    };
  }

  /**
   * Get format information for user guidance
   */
  static getFormatInfo(mimeType: string): FormatCapability | null {
    return (
      this.FORMAT_CAPABILITIES.find(
        (capability) =>
          capability.mimeType === mimeType ||
          capability.mimeType.includes(mimeType)
      ) || null
    );
  }

  /**
   * Get user-friendly format recommendations
   */
  static getFormatRecommendations(
    hasTransparency: boolean,
    hasComplexEffects: boolean,
    userPriority: "quality" | "compatibility" | "size" = "quality"
  ): { primary: FormatCapability | null; alternatives: FormatCapability[] } {
    const supportedFormats = this.detectFormatCapabilities();
    const compatibleFormats = supportedFormats.filter(
      (format) => !hasTransparency || format.supportsTransparency
    );

    if (compatibleFormats.length === 0) {
      return { primary: null, alternatives: [] };
    }

    let primary: FormatCapability | null = null;

    switch (userPriority) {
      case "quality":
        primary = this.getBestFormat(hasTransparency, true);
        break;
      case "compatibility":
        primary = this.getBestFormat(hasTransparency, false);
        break;
      case "size":
        // VP9 generally provides better compression
        primary =
          compatibleFormats.find((f) => f.mimeType.includes("vp9")) ||
          compatibleFormats[0];
        break;
    }

    const alternatives = compatibleFormats
      .filter((f) => f !== primary)
      .slice(0, 3); // Limit to top 3 alternatives

    return { primary, alternatives };
  }

  static getRecorderOptions(
    hasTransparency: boolean,
    hasEffects: boolean,
    quality: "low" | "medium" | "high" | "ultra" = "high"
  ): MediaRecorderOptions {
    // Use enhanced format detection
    const mimeType = this.getSupportedMimeType(hasTransparency);
    const qualitySettings = this.QUALITY_SETTINGS[quality];

    const options: MediaRecorderOptions = {
      mimeType,
      ...qualitySettings,
    };

    // Enhanced bitrate calculation for transparency and effects
    if (hasTransparency) {
      // VP9 handles transparency better, so adjust bitrate accordingly
      const isVP9 = mimeType.includes("vp9");
      const multiplier = isVP9 ? 1.3 : 1.5; // VP9 is more efficient
      options.videoBitsPerSecond =
        (options.videoBitsPerSecond || 8000000) * multiplier;
    }

    if (hasEffects) {
      // Complex effects need higher bitrate to maintain quality
      options.videoBitsPerSecond =
        (options.videoBitsPerSecond || 8000000) * 1.2;
    }

    // Ensure minimum bitrate for transparency
    if (hasTransparency && (options.videoBitsPerSecond || 0) < 5000000) {
      options.videoBitsPerSecond = 5000000; // Minimum 5Mbps for transparency
    }

    return options;
  }

  static setupCanvasForExport(canvas: HTMLCanvasElement, settings: any): void {
    const ctx = canvas.getContext("2d", {
      alpha: settings.background === "transparent",
      premultipliedAlpha: false,
      preserveDrawingBuffer: true,
    }) as CanvasRenderingContext2D;

    if (!ctx) return;

    // Set canvas size to ensure crisp rendering
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    ctx.scale(dpr, dpr);

    // Configure context for better quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
  }

  static validateEffectBoundaries(
    canvas: HTMLCanvasElement,
    settings: any
  ): boolean {
    const ctx = canvas.getContext("2d");
    if (!ctx) return false;

    // Check if effects are properly contained within canvas bounds
    const hasGlowEffects = ["neon", "glow"].includes(settings.design);

    if (hasGlowEffects) {
      // Ensure glow effects don't exceed canvas boundaries
      const glowRadius = settings.designSettings?.glowIntensity || 15;
      const margin = glowRadius * 2;

      if (canvas.width < margin || canvas.height < margin) {
        console.warn(
          "Canvas too small for glow effects, effects may be clipped"
        );
        return false;
      }
    }

    return true;
  }

  static async createOptimizedStream(
    canvas: HTMLCanvasElement,
    fps: number = 60
  ): Promise<MediaStream> {
    // Validate canvas state
    if (!canvas.getContext("2d")) {
      throw new Error("Canvas context not available");
    }

    try {
      // Create stream with specified frame rate
      const stream = canvas.captureStream(fps);

      // Verify stream tracks
      const videoTracks = stream.getVideoTracks();
      if (videoTracks.length === 0) {
        throw new Error("No video tracks in canvas stream");
      }

      // Configure video track settings
      const videoTrack = videoTracks[0];
      const capabilities = videoTrack.getCapabilities();

      if (capabilities.frameRate) {
        await videoTrack.applyConstraints({
          frameRate: { ideal: fps, max: fps },
        });
      }

      return stream;
    } catch (error) {
      console.error("Error creating optimized stream:", error);
      throw error;
    }
  }

  /**
   * Enhanced export with comprehensive validation and fallback handling
   */
  static async exportWithAlphaChannel(
    canvas: HTMLCanvasElement,
    options: VideoExportOptions
  ): Promise<Blob> {
    const { settings, duration, fps = 60, quality = "high" } = options;

    const hasTransparency = settings.background === "transparent";
    const hasEffects = [
      "neon",
      "glow",
      "fire",
      "rainbow",
      "matrixRain",
      "particleExplosion",
      "liquidMorph",
      "hologramFlicker",
    ].includes(settings.design);

    // Validate export settings before starting
    const validation = this.validateExportSettings(hasTransparency, hasEffects);

    if (!validation.isValid) {
      const errorMessage = validation.errors.join("; ");
      throw new Error(`Export validation failed: ${errorMessage}`);
    }

    // Show warnings to user
    if (validation.warnings.length > 0) {
      validation.warnings.forEach((warning) => {
        toast.warning(warning);
      });
    }

    // Setup canvas for optimal export
    this.setupCanvasForExport(canvas, settings);

    // Validate effect boundaries
    if (!this.validateEffectBoundaries(canvas, settings)) {
      toast.warning("Effects may be clipped in export due to canvas size");
    }

    // Get optimized recorder options with fallback handling
    let recorderOptions: MediaRecorderOptions;
    try {
      recorderOptions = this.getRecorderOptions(
        hasTransparency,
        hasEffects,
        quality
      );
    } catch (error) {
      // Fallback to basic options if advanced options fail
      console.warn("Advanced recorder options failed, using fallback:", error);
      recorderOptions = {
        mimeType: this.getSupportedMimeType(false), // Fallback without transparency requirement
        videoBitsPerSecond: this.QUALITY_SETTINGS[quality].videoBitsPerSecond,
      };
      toast.warning(
        "Using fallback export settings due to browser limitations"
      );
    }

    // Create optimized stream with error handling
    let stream: MediaStream;
    try {
      stream = await this.createOptimizedStream(canvas, fps);
    } catch (error) {
      console.error("Failed to create optimized stream:", error);
      throw new Error(
        "Failed to initialize video recording. Please check your browser compatibility."
      );
    }

    return new Promise((resolve, reject) => {
      const chunks: Blob[] = [];
      let recorder: MediaRecorder;

      try {
        recorder = new MediaRecorder(stream, recorderOptions);
      } catch (error) {
        // Final fallback - try with minimal options
        console.warn(
          "MediaRecorder creation failed, trying minimal options:",
          error
        );
        try {
          recorder = new MediaRecorder(stream, {
            mimeType: "video/webm",
          });
          toast.warning("Using basic export settings for compatibility");
        } catch (fallbackError) {
          stream.getTracks().forEach((track) => track.stop());
          reject(
            new Error(
              "Your browser does not support video recording. Please try a different browser."
            )
          );
          return;
        }
      }

      let recordingTimeout: NodeJS.Timeout;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        clearTimeout(recordingTimeout);

        try {
          const blob = new Blob(chunks, {
            type: recorderOptions.mimeType || "video/webm",
          });

          // Enhanced blob validation
          if (blob.size === 0) {
            reject(
              new Error(
                "Export failed: Generated video is empty. Please try again with different settings."
              )
            );
            return;
          }

          if (blob.size < 1000) {
            // Less than 1KB is suspicious
            reject(
              new Error(
                "Export failed: Generated video is too small and may be corrupted."
              )
            );
            return;
          }

       
          resolve(blob);
        } catch (error) {
          reject(
            new Error(
              `Export failed during video processing: ${
                error instanceof Error ? error.message : "Unknown error"
              }`
            )
          );
        }
      };

      recorder.onerror = (event) => {
        clearTimeout(recordingTimeout);
        console.error("MediaRecorder error:", event);

        // Provide specific error messages based on the error
        const error = (event as any).error;
        let errorMessage = "Recording failed due to an unknown error.";

        if (error) {
          if (error.name === "NotSupportedError") {
            errorMessage =
              "Recording format not supported. Please try a different browser or export settings.";
          } else if (error.name === "SecurityError") {
            errorMessage =
              "Recording blocked by browser security settings. Please check your browser permissions.";
          } else if (error.name === "InvalidStateError") {
            errorMessage =
              "Recording failed due to invalid state. Please refresh the page and try again.";
          } else {
            errorMessage = `Recording failed: ${error.message || error.name}`;
          }
        }

        reject(new Error(errorMessage));
      };

      // Enhanced recording start with error handling
      try {
        recorder.start(100); // Collect data every 100ms

        // Set up recording timeout with cleanup
        recordingTimeout = setTimeout(() => {
          try {
            if (recorder.state === "recording") {
              recorder.stop();
            }
          } catch (error) {
            console.warn("Error stopping recorder:", error);
          }

          // Stop all tracks
          stream.getTracks().forEach((track) => {
            try {
              track.stop();
            } catch (error) {
              console.warn("Error stopping track:", error);
            }
          });
        }, duration * 1000 + 1000); // Add 1 second buffer
      } catch (error) {
        clearTimeout(recordingTimeout);
        stream.getTracks().forEach((track) => track.stop());
        reject(
          new Error(
            `Failed to start recording: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          )
        );
      }
    });
  }

  static async validateExportedVideo(blob: Blob): Promise<boolean> {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      const url = URL.createObjectURL(blob);

      video.onloadedmetadata = () => {
        const isValid =
          video.duration > 0 && video.videoWidth > 0 && video.videoHeight > 0;
        URL.revokeObjectURL(url);
        resolve(isValid);
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(false);
      };

      video.src = url;
    });
  }

  static getFileExtension(mimeType: string): string {
    const extensions: Record<string, string> = {
      "video/webm": "webm",
      "video/mp4": "mp4",
      "video/ogg": "ogv",
    };

    for (const [type, ext] of Object.entries(extensions)) {
      if (mimeType.includes(type)) {
        return ext;
      }
    }

    return "webm"; // Default fallback
  }

  static async downloadVideo(blob: Blob, filename?: string): Promise<void> {
    // Validate video before download
    const isValid = await this.validateExportedVideo(blob);
    if (!isValid) {
      throw new Error("Exported video is invalid or corrupted");
    }

    const extension = this.getFileExtension(blob.type);
    const finalFilename =
      filename || `counter-animation-${Date.now()}.${extension}`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = finalFilename;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Clean up
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    toast.success(`Video downloaded: ${finalFilename}`);
  }
}
