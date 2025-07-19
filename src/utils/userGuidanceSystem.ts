/**
 * User guidance system for transition effects and performance optimization
 */

export interface GuidanceMessage {
  id: string;
  type: "info" | "warning" | "error" | "success" | "tip";
  title: string;
  message: string;
  action?: {
    label: string;
    callback: () => void;
  };
  dismissible: boolean;
  priority: number; // 1-5, higher is more important
  category: "transition" | "performance" | "export" | "general";
}

export interface UserContext {
  isRecording: boolean;
  currentTransition: string;
  performanceMetrics?: {
    fps: number;
    memoryUsage: number;
    renderTime: number;
  };
  deviceCapabilities: {
    isMobile: boolean;
    hasGoodPerformance: boolean;
    supportsAdvancedEffects: boolean;
  };
  userExperience: "beginner" | "intermediate" | "advanced";
}

export class UserGuidanceSystem {
  private activeMessages = new Map<string, GuidanceMessage>();
  private messageCallbacks: ((messages: GuidanceMessage[]) => void)[] = [];
  private userContext: UserContext;
  private guidanceRules: Map<
    string,
    (context: UserContext) => GuidanceMessage[]
  > = new Map();

  constructor() {
    this.userContext = {
      isRecording: false,
      currentTransition: "none",
      deviceCapabilities: {
        isMobile: false,
        hasGoodPerformance: true,
        supportsAdvancedEffects: true,
      },
      userExperience: "beginner",
    };

    this.initializeGuidanceRules();
  }

  /**
   * Initialize guidance rules
   */
  private initializeGuidanceRules(): void {
    // Transition guidance rules
    this.guidanceRules.set("transition-selection", (context) => {
      const messages: GuidanceMessage[] = [];

      if (
        context.currentTransition === "none" &&
        context.userExperience === "beginner"
      ) {
        messages.push({
          id: "first-transition-tip",
          type: "tip",
          title: "Try a Transition Effect",
          message:
            'Add visual flair to your counter by selecting a transition effect from the sidebar. Start with "Fade In" for a smooth introduction.',
          dismissible: true,
          priority: 3,
          category: "transition",
        });
      }

      if (
        context.deviceCapabilities.isMobile &&
        ["matrix-rain", "particle-explosion"].includes(
          context.currentTransition
        )
      ) {
        messages.push({
          id: "mobile-performance-warning",
          type: "warning",
          title: "Performance Notice",
          message:
            "Advanced effects may impact performance on mobile devices. Consider using simpler transitions for better results.",
          action: {
            label: "Switch to Simple Effect",
            callback: () => this.suggestSimpleTransition(),
          },
          dismissible: true,
          priority: 4,
          category: "performance",
        });
      }

      return messages;
    });

    // Performance guidance rules
    this.guidanceRules.set("performance-optimization", (context) => {
      const messages: GuidanceMessage[] = [];

      if (context.performanceMetrics) {
        const { fps, memoryUsage, renderTime } = context.performanceMetrics;

        if (fps < 30) {
          messages.push({
            id: "low-fps-warning",
            type: "warning",
            title: "Low Frame Rate Detected",
            message: `Current FPS: ${fps.toFixed(
              1
            )}. Consider reducing quality settings or switching to a simpler transition.`,
            action: {
              label: "Auto-Optimize",
              callback: () => this.applyPerformanceOptimizations(),
            },
            dismissible: false,
            priority: 5,
            category: "performance",
          });
        } else if (fps < 45) {
          messages.push({
            id: "moderate-fps-info",
            type: "info",
            title: "Performance Could Be Better",
            message: `Current FPS: ${fps.toFixed(
              1
            )}. Your animation is running smoothly, but there's room for improvement.`,
            action: {
              label: "Optimize",
              callback: () => this.applyPerformanceOptimizations(),
            },
            dismissible: true,
            priority: 2,
            category: "performance",
          });
        }

        if (memoryUsage > 80) {
          messages.push({
            id: "high-memory-warning",
            type: "warning",
            title: "High Memory Usage",
            message: `Memory usage: ${memoryUsage.toFixed(
              1
            )}%. Consider reducing particle count or effect complexity.`,
            action: {
              label: "Reduce Effects",
              callback: () => this.reduceEffectComplexity(),
            },
            dismissible: true,
            priority: 4,
            category: "performance",
          });
        }

        if (renderTime > 16.67) {
          messages.push({
            id: "slow-render-info",
            type: "info",
            title: "Render Time Notice",
            message: `Render time: ${renderTime.toFixed(
              1
            )}ms. For 60fps, aim for under 16.7ms per frame.`,
            dismissible: true,
            priority: 2,
            category: "performance",
          });
        }
      }

      return messages;
    });

    // Export guidance rules
    this.guidanceRules.set("export-guidance", (context) => {
      const messages: GuidanceMessage[] = [];

      if (context.isRecording && context.currentTransition !== "none") {
        messages.push({
          id: "recording-tip",
          type: "tip",
          title: "Recording in Progress",
          message:
            "Your transition effect is being recorded. The final video will include all visual effects and animations.",
          dismissible: true,
          priority: 3,
          category: "export",
        });
      }

      if (
        [
          "matrix-rain",
          "particle-explosion",
          "liquid-morph",
          "hologram-flicker",
        ].includes(context.currentTransition)
      ) {
        messages.push({
          id: "advanced-export-tip",
          type: "tip",
          title: "Advanced Effect Export",
          message:
            "Advanced effects work best with High or Ultra quality export settings for optimal visual fidelity.",
          dismissible: true,
          priority: 3,
          category: "export",
        });
      }

      return messages;
    });

    // General usage guidance
    this.guidanceRules.set("general-usage", (context) => {
      const messages: GuidanceMessage[] = [];

      if (context.userExperience === "beginner") {
        messages.push({
          id: "welcome-tip",
          type: "info",
          title: "Welcome to Countable!",
          message:
            "Create stunning animated counters with various transition effects. Start by adjusting the counter values and selecting a transition.",
          dismissible: true,
          priority: 1,
          category: "general",
        });
      }

      return messages;
    });
  }

  /**
   * Update user context and refresh guidance
   */
  updateContext(updates: Partial<UserContext>): void {
    this.userContext = { ...this.userContext, ...updates };
    this.refreshGuidance();
  }

  /**
   * Refresh guidance messages based on current context
   */
  private refreshGuidance(): void {
    const newMessages: GuidanceMessage[] = [];

    // Apply all guidance rules
    this.guidanceRules.forEach((rule) => {
      const ruleMessages = rule(this.userContext);
      newMessages.push(...ruleMessages);
    });

    // Update active messages
    this.activeMessages.clear();
    newMessages.forEach((message) => {
      this.activeMessages.set(message.id, message);
    });

    // Notify subscribers
    this.notifySubscribers();
  }

  /**
   * Get current guidance messages sorted by priority
   */
  getGuidanceMessages(): GuidanceMessage[] {
    const messages = Array.from(this.activeMessages.values());
    return messages.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Get messages by category
   */
  getMessagesByCategory(
    category: GuidanceMessage["category"]
  ): GuidanceMessage[] {
    return this.getGuidanceMessages().filter(
      (msg) => msg.category === category
    );
  }

  /**
   * Dismiss a message
   */
  dismissMessage(messageId: string): void {
    const message = this.activeMessages.get(messageId);
    if (message && message.dismissible) {
      this.activeMessages.delete(messageId);
      this.notifySubscribers();
    }
  }

  /**
   * Subscribe to guidance updates
   */
  subscribe(callback: (messages: GuidanceMessage[]) => void): () => void {
    this.messageCallbacks.push(callback);
    return () => {
      const index = this.messageCallbacks.indexOf(callback);
      if (index > -1) {
        this.messageCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Notify all subscribers
   */
  private notifySubscribers(): void {
    const messages = this.getGuidanceMessages();
    this.messageCallbacks.forEach((callback) => callback(messages));
  }

  /**
   * Suggest simple transition for performance
   */
  private suggestSimpleTransition(): void {
    // This would be implemented to suggest and apply a simple transition
  }

  /**
   * Apply performance optimizations
   */
  private applyPerformanceOptimizations(): void {
    // This would be implemented to apply automatic optimizations
  }

  /**
   * Reduce effect complexity
   */
  private reduceEffectComplexity(): void {
    // This would be implemented to reduce particle counts and effect complexity
  }

  /**
   * Add custom guidance message
   */
  addCustomMessage(message: Omit<GuidanceMessage, "id">): string {
    const id = `custom-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const fullMessage: GuidanceMessage = { ...message, id };

    this.activeMessages.set(id, fullMessage);
    this.notifySubscribers();

    return id;
  }

  /**
   * Clear all messages
   */
  clearAllMessages(): void {
    this.activeMessages.clear();
    this.notifySubscribers();
  }

  /**
   * Get guidance for specific transition
   */
  getTransitionGuidance(transitionName: string): GuidanceMessage[] {
    const transitionGuidance: Record<string, GuidanceMessage> = {
      "matrix-rain": {
        id: "matrix-rain-info",
        type: "info",
        title: "Matrix Rain Effect",
        message:
          "Creates falling character animation. Adjust speed and density in the design settings for best results.",
        dismissible: true,
        priority: 2,
        category: "transition",
      },
      "particle-explosion": {
        id: "particle-explosion-info",
        type: "info",
        title: "Particle Explosion Effect",
        message:
          "Numbers explode into particles and reform. Higher particle counts create more dramatic effects but may impact performance.",
        dismissible: true,
        priority: 2,
        category: "transition",
      },
      "liquid-morph": {
        id: "liquid-morph-info",
        type: "info",
        title: "Liquid Morph Effect",
        message:
          "Smooth fluid-like transformation between numbers. Works best with larger font sizes for visible detail.",
        dismissible: true,
        priority: 2,
        category: "transition",
      },
      "hologram-flicker": {
        id: "hologram-flicker-info",
        type: "info",
        title: "Hologram Flicker Effect",
        message:
          "Sci-fi holographic appearance with scan lines and interference. Combine with neon colors for authentic look.",
        dismissible: true,
        priority: 2,
        category: "transition",
      },
    };

    const guidance = transitionGuidance[transitionName];
    return guidance ? [guidance] : [];
  }
}

// Global guidance system instance
export const userGuidanceSystem = new UserGuidanceSystem();
