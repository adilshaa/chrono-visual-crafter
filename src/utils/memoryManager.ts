/**
 * Memory management utilities for performance optimization
 */

export interface MemoryCleanupOptions {
  clearCanvasCache: boolean;
  clearImageCache: boolean;
  clearFontCache: boolean;
  forceGarbageCollection: boolean;
}

export interface MemoryUsageInfo {
  canvasMemory: number;
  imageMemory: number;
  fontMemory: number;
  totalMemory: number;
  availableMemory: number;
}

export class MemoryManager {
  private canvasCache = new Map<string, HTMLCanvasElement>();
  private imageCache = new Map<string, HTMLImageElement>();
  private fontCache = new Set<string>();
  private cleanupInterval?: number;
  private maxCacheSize = 50; // Maximum number of cached items
  private isCleanupRunning = false;

  constructor() {
    this.bindMethods();
    this.startPeriodicCleanup();
  }

  private bindMethods() {
    this.cleanup = this.cleanup.bind(this);
    this.periodicCleanup = this.periodicCleanup.bind(this);
  }

  /**
   * Start periodic memory cleanup
   */
  startPeriodicCleanup(intervalMs: number = 30000): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.cleanupInterval = window.setInterval(this.periodicCleanup, intervalMs);
  }

  /**
   * Stop periodic memory cleanup
   */
  stopPeriodicCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
  }

  /**
   * Add canvas to cache with automatic cleanup
   */
  cacheCanvas(key: string, canvas: HTMLCanvasElement): void {
    if (this.canvasCache.size >= this.maxCacheSize) {
      // Remove oldest entry
      const firstKey = this.canvasCache.keys().next().value;
      if (firstKey) {
        this.canvasCache.delete(firstKey);
      }
    }

    this.canvasCache.set(key, canvas);
  }

  /**
   * Get cached canvas
   */
  getCachedCanvas(key: string): HTMLCanvasElement | undefined {
    return this.canvasCache.get(key);
  }

  /**
   * Add image to cache with automatic cleanup
   */
  cacheImage(key: string, image: HTMLImageElement): void {
    if (this.imageCache.size >= this.maxCacheSize) {
      // Remove oldest entry
      const firstKey = this.imageCache.keys().next().value;
      if (firstKey) {
        this.imageCache.delete(firstKey);
      }
    }

    this.imageCache.set(key, image);
  }

  /**
   * Get cached image
   */
  getCachedImage(key: string): HTMLImageElement | undefined {
    return this.imageCache.get(key);
  }

  /**
   * Track loaded font
   */
  trackFont(fontFamily: string): void {
    this.fontCache.add(fontFamily);
  }

  /**
   * Get memory usage information
   */
  getMemoryUsage(): MemoryUsageInfo {
    const canvasMemory = this.estimateCanvasMemory();
    const imageMemory = this.estimateImageMemory();
    const fontMemory = this.estimateFontMemory();
    const totalMemory = canvasMemory + imageMemory + fontMemory;

    // Try to get available memory from performance API
    let availableMemory = 0;
    if ("memory" in performance) {
      const memory = (performance as any).memory;
      availableMemory = memory.jsHeapSizeLimit - memory.usedJSHeapSize;
    }

    return {
      canvasMemory,
      imageMemory,
      fontMemory,
      totalMemory,
      availableMemory,
    };
  }

  /**
   * Check if memory cleanup is needed
   */
  shouldCleanup(): boolean {
    const usage = this.getMemoryUsage();

    // Cleanup if total cached memory exceeds 50MB or available memory is low
    return (
      usage.totalMemory > 50 * 1024 * 1024 || // 50MB
      (usage.availableMemory > 0 && usage.availableMemory < 100 * 1024 * 1024) // Less than 100MB available
    );
  }

  /**
   * Perform memory cleanup
   */
  cleanup(options: Partial<MemoryCleanupOptions> = {}): void {
    if (this.isCleanupRunning) return;

    this.isCleanupRunning = true;

    const defaultOptions: MemoryCleanupOptions = {
      clearCanvasCache: true,
      clearImageCache: true,
      clearFontCache: false, // Don't clear fonts as they're harder to reload
      forceGarbageCollection: false,
    };

    const cleanupOptions = { ...defaultOptions, ...options };

    try {
      if (cleanupOptions.clearCanvasCache) {
        this.clearCanvasCache();
      }

      if (cleanupOptions.clearImageCache) {
        this.clearImageCache();
      }

      if (cleanupOptions.clearFontCache) {
        this.clearFontCache();
      }

      if (cleanupOptions.forceGarbageCollection && "gc" in window) {
        // Force garbage collection if available (Chrome with --enable-precise-memory-info)
        (window as any).gc();
      }
    } catch (error) {
      console.warn("Memory cleanup failed:", error);
    } finally {
      this.isCleanupRunning = false;
    }
  }

  /**
   * Clear canvas cache
   */
  private clearCanvasCache(): void {
    // Clear canvas contexts to free GPU memory
    this.canvasCache.forEach((canvas) => {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    });

    this.canvasCache.clear();
  }

  /**
   * Clear image cache
   */
  private clearImageCache(): void {
    // Remove image references to allow garbage collection
    this.imageCache.forEach((image) => {
      image.src = "";
    });

    this.imageCache.clear();
  }

  /**
   * Clear font cache
   */
  private clearFontCache(): void {
    this.fontCache.clear();
  }

  /**
   * Estimate canvas memory usage
   */
  private estimateCanvasMemory(): number {
    let totalMemory = 0;

    this.canvasCache.forEach((canvas) => {
      // Estimate: width * height * 4 bytes per pixel (RGBA)
      totalMemory += canvas.width * canvas.height * 4;
    });

    return totalMemory;
  }

  /**
   * Estimate image memory usage
   */
  private estimateImageMemory(): number {
    let totalMemory = 0;

    this.imageCache.forEach((image) => {
      // Estimate: width * height * 4 bytes per pixel (RGBA)
      if (image.naturalWidth && image.naturalHeight) {
        totalMemory += image.naturalWidth * image.naturalHeight * 4;
      }
    });

    return totalMemory;
  }

  /**
   * Estimate font memory usage
   */
  private estimateFontMemory(): number {
    // Rough estimate: 100KB per font family
    return this.fontCache.size * 100 * 1024;
  }

  /**
   * Periodic cleanup based on memory usage
   */
  private periodicCleanup(): void {
    if (this.shouldCleanup()) {
      this.cleanup({
        clearCanvasCache: true,
        clearImageCache: true,
        clearFontCache: false,
        forceGarbageCollection: false,
      });
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    canvasCacheSize: number;
    imageCacheSize: number;
    fontCacheSize: number;
    memoryUsage: MemoryUsageInfo;
  } {
    return {
      canvasCacheSize: this.canvasCache.size,
      imageCacheSize: this.imageCache.size,
      fontCacheSize: this.fontCache.size,
      memoryUsage: this.getMemoryUsage(),
    };
  }

  /**
   * Optimize memory usage by reducing cache sizes
   */
  optimizeMemory(): void {
    // Reduce cache sizes for better memory efficiency
    const targetCacheSize = Math.floor(this.maxCacheSize * 0.5);

    // Clear excess canvas cache entries
    while (this.canvasCache.size > targetCacheSize) {
      const firstKey = this.canvasCache.keys().next().value;
      if (firstKey) {
        this.canvasCache.delete(firstKey);
      } else {
        break;
      }
    }

    // Clear excess image cache entries
    while (this.imageCache.size > targetCacheSize) {
      const firstKey = this.imageCache.keys().next().value;
      if (firstKey) {
        this.imageCache.delete(firstKey);
      } else {
        break;
      }
    }
  }

  /**
   * Destroy memory manager and cleanup resources
   */
  destroy(): void {
    this.stopPeriodicCleanup();
    this.cleanup({
      clearCanvasCache: true,
      clearImageCache: true,
      clearFontCache: true,
      forceGarbageCollection: true,
    });
  }
}

// Global memory manager instance
export const memoryManager = new MemoryManager();
