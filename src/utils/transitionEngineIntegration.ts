/**
 * Integration layer for enhanced transition engine with CounterPreview
 */

import { transitionEngine } from "./transitionEngine";
import { performanceMonitor } from "./performanceMonitor";
import { performanceOptimizer } from "./performanceOptimizer";
import { memoryManager } from "./memoryManager";

export interface TransitionIntegrationConfig {
  enablePerformanceMonitoring: boolean;
  enableAutoOptimization: boolean;
  enableMemoryManagement: boolean;
  maxParticleCount: number;
  targetFPS: number;
  qualityThreshold: number;
}

export interface TransitionRenderContext {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  settings: any;
  currentValue: number;
  previousValue: number;
  progress: number;
  timestamp: number;
}

export class TransitionEngineIntegration {
  private config: TransitionIntegrationConfig;
  private isInitialized = false;
  private activeTransitions = new Map<string, any>();
  private renderCallbacks: ((context: TransitionRenderContext) => void)[] = [];

  constructor(config: Partial<TransitionIntegrationConfig> = {}) {
    this.config = {
      enablePerformanceMonitoring: true,
      enableAutoOptimization: true,
      enableMemoryManagement: true,
      maxParticleCount: 1000,
      targetFPS: 60,
      qualityThreshold: 45,
      ...config,
    };
  }

  /**
   * Initialize the integration system
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize performance monitoring
      if (this.config.enablePerformanceMonitoring) {
        performanceMonitor.startMonitoring();
      }

      // Initialize performance optimizer
      if (this.config.enableAutoOptimization) {
        performanceOptimizer.configure({
          autoOptimize: true,
          qualityReduction: true,
          effectsDisabling: true,
          resolutionScaling: true,
          complexityReduction: true,
        });

        performanceOptimizer.setOriginalQuality({
          renderQuality: 1.0,
          enableAntiAliasing: true,
          enableSubPixelRendering: true,
          maxParticles: this.config.maxParticleCount,
          effectComplexity: "high",
          canvasScale: 1.0,
        });

        performanceOptimizer.startOptimization();
      }

      // Initialize memory management
      if (this.config.enableMemoryManagement) {
        memoryManager.startPeriodicCleanup();
      }

      // Initialize transition engine
      await transitionEngine.initialize();

      this.isInitialized = true;
    } catch (error) {
      console.error(
        "Failed to initialize transition engine integration:",
        error
      );
      throw error;
    }
  }

  /**
   * Render transition with integrated performance monitoring
   */
  async renderTransition(context: TransitionRenderContext): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const startTime = performance.now();

    try {
      // Get current quality settings from optimizer
      const qualitySettings = performanceOptimizer.getCurrentQuality();

      // Apply quality optimizations to context
      const optimizedContext = this.applyQualityOptimizations(
        context,
        qualitySettings
      );

      // Render the transition
      await this.executeTransitionRender(optimizedContext);

      // Record performance metrics
      if (this.config.enablePerformanceMonitoring) {
        performanceMonitor.recordRenderTime(startTime);
      }

      // Notify render callbacks
      this.renderCallbacks.forEach((callback) => callback(optimizedContext));
    } catch (error) {
      console.error("Transition render failed:", error);
      throw error;
    }
  }

  /**
   * Apply quality optimizations to render context
   */
  private applyQualityOptimizations(
    context: TransitionRenderContext,
    qualitySettings: any
  ): TransitionRenderContext {
    const optimizedContext = { ...context };

    // Apply canvas scaling
    if (qualitySettings.canvasScale < 1.0) {
      const { canvas, ctx } = context;
      const scaledWidth = Math.floor(
        canvas.width * qualitySettings.canvasScale
      );
      const scaledHeight = Math.floor(
        canvas.height * qualitySettings.canvasScale
      );

      // Create temporary scaled canvas if needed
      if (canvas.width !== scaledWidth || canvas.height !== scaledHeight) {
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = scaledWidth;
        tempCanvas.height = scaledHeight;
        const tempCtx = tempCanvas.getContext("2d");

        if (tempCtx) {
          optimizedContext.canvas = tempCanvas;
          optimizedContext.ctx = tempCtx;
        }
      }
    }

    // Apply rendering quality settings
    const { ctx } = optimizedContext;
    ctx.imageSmoothingEnabled = qualitySettings.enableAntiAliasing;
    ctx.imageSmoothingQuality =
      qualitySettings.renderQuality > 0.8
        ? "high"
        : qualitySettings.renderQuality > 0.5
        ? "medium"
        : "low";

    return optimizedContext;
  }

  /**
   * Execute the actual transition rendering
   */
  private async executeTransitionRender(
    context: TransitionRenderContext
  ): Promise<void> {
    const { settings, currentValue, previousValue, progress } = context;
    const transitionType = settings.transition;

    // Handle different transition types
    switch (transitionType) {
      case "matrix-rain":
        await transitionEngine.renderMatrixRain(context);
        break;
      case "particle-explosion":
        await transitionEngine.renderParticleExplosion(context);
        break;
      case "liquid-morph":
        await transitionEngine.renderLiquidMorph(context);
        break;
      case "hologram-flicker":
        await transitionEngine.renderHologramFlicker(context);
        break;
      default:
        // Fallback to standard transitions
        await this.renderStandardTransition(context);
        break;
    }
  }

  /**
   * Render standard transitions
   */
  private async renderStandardTransition(
    context: TransitionRenderContext
  ): Promise<void> {
    const { ctx, settings, currentValue } = context;

    // Basic text rendering with applied optimizations
    ctx.font = `${settings.fontSize}px ${settings.fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = settings.textColor || "#FFFFFF";

    const text = this.formatNumber(currentValue, settings);
    const x = context.canvas.width / 2;
    const y = context.canvas.height / 2;

    ctx.fillText(text, x, y);
  }

  /**
   * Format number according to settings
   */
  private formatNumber(value: number, settings: any): string {
    let formattedValue = settings.useFloatValues
      ? value.toFixed(2).replace(/\.?0+$/, "")
      : Math.round(value).toString();

    // Apply separator
    if (settings.separator && settings.separator !== "none") {
      const separator =
        settings.separator === "comma"
          ? ","
          : settings.separator === "dot"
          ? "."
          : settings.separator === "space"
          ? " "
          : "";

      if (separator) {
        formattedValue = formattedValue.replace(
          /\B(?=(\d{3})+(?!\d))/g,
          separator
        );
      }
    }

    return `${settings.prefix || ""}${formattedValue}${settings.suffix || ""}`;
  }

  /**
   * Subscribe to render events
   */
  onRender(callback: (context: TransitionRenderContext) => void): () => void {
    this.renderCallbacks.push(callback);
    return () => {
      const index = this.renderCallbacks.indexOf(callback);
      if (index > -1) {
        this.renderCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    if (!this.config.enablePerformanceMonitoring) {
      return null;
    }
    return performanceMonitor.getCurrentMetrics();
  }

  /**
   * Get optimization status
   */
  getOptimizationStatus() {
    if (!this.config.enableAutoOptimization) {
      return null;
    }
    return performanceOptimizer.getOptimizationStatus();
  }

  /**
   * Get memory usage
   */
  getMemoryUsage() {
    if (!this.config.enableMemoryManagement) {
      return null;
    }
    return memoryManager.getMemoryUsage();
  }

  /**
   * Cleanup and destroy integration
   */
  destroy(): void {
    if (this.config.enablePerformanceMonitoring) {
      performanceMonitor.stopMonitoring();
    }

    if (this.config.enableAutoOptimization) {
      performanceOptimizer.stopOptimization();
    }

    if (this.config.enableMemoryManagement) {
      memoryManager.destroy();
    }

    this.activeTransitions.clear();
    this.renderCallbacks = [];
    this.isInitialized = false;
  }
}

// Global integration instance
export const transitionEngineIntegration = new TransitionEngineIntegration();
