export interface ErrorContext {
  userId?: string;
  subscriptionId?: string;
  action?: string;
  timestamp: string;
  userAgent?: string;
  url?: string;
}

export class ErrorHandler {
  private static errorLog: Array<{
    error: Error;
    context: ErrorContext;
    id: string;
  }> = [];

  static logError(error: Error, context: Partial<ErrorContext> = {}) {
    const errorEntry = {
      error,
      context: {
        ...context,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      },
      id: this.generateErrorId(),
    };

    this.errorLog.push(errorEntry);
    
    // Keep only last 100 errors
    if (this.errorLog.length > 100) {
      this.errorLog.shift();
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error logged:', errorEntry);
    }

    // In production, you might want to send to an error tracking service
    this.sendToErrorTracking(errorEntry);
  }

  private static generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static async sendToErrorTracking(errorEntry: any) {
    try {
      // In a real implementation, send to your error tracking service
      // Example: Sentry, LogRocket, Bugsnag, etc.
      
      // For now, we'll just store in localStorage for debugging
      const existingErrors = JSON.parse(localStorage.getItem('error_log') || '[]');
      existingErrors.push({
        ...errorEntry,
        error: {
          message: errorEntry.error.message,
          stack: errorEntry.error.stack,
          name: errorEntry.error.name,
        }
      });
      
      // Keep only last 50 errors in localStorage
      if (existingErrors.length > 50) {
        existingErrors.splice(0, existingErrors.length - 50);
      }
      
      localStorage.setItem('error_log', JSON.stringify(existingErrors));
    } catch (storageError) {
      console.warn('Failed to store error log:', storageError);
    }
  }

  static getErrorLog() {
    return this.errorLog;
  }

  static clearErrorLog() {
    this.errorLog = [];
    localStorage.removeItem('error_log');
  }

  static getUserFriendlyMessage(error: Error): string {
    const errorMessages: Record<string, string> = {
      'NetworkError': 'Network connection failed. Please check your internet connection.',
      'TimeoutError': 'Request timed out. Please try again.',
      'ValidationError': 'Invalid data provided. Please check your input.',
      'AuthenticationError': 'Authentication failed. Please sign in again.',
      'PermissionError': 'You do not have permission to perform this action.',
      'PaymentError': 'Payment processing failed. Please try again or contact support.',
      'SubscriptionError': 'Subscription operation failed. Please try again.',
    };

    // Check for specific error types
    for (const [errorType, message] of Object.entries(errorMessages)) {
      if (error.name === errorType || error.message.includes(errorType)) {
        return message;
      }
    }

    // Default fallback message
    return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
  }

  static createRetryableError(originalError: Error, retryCount: number = 0): Error & { retryCount: number } {
    const retryableError = new Error(originalError.message) as Error & { retryCount: number };
    retryableError.name = originalError.name;
    retryableError.stack = originalError.stack;
    retryableError.retryCount = retryCount;
    return retryableError;
  }

  static shouldRetry(error: Error, maxRetries: number = 3): boolean {
    const retryableError = error as Error & { retryCount?: number };
    const currentRetries = retryableError.retryCount || 0;
    
    // Don't retry certain types of errors
    const nonRetryableErrors = [
      'ValidationError',
      'AuthenticationError', 
      'PermissionError',
      'PaymentDeclinedError'
    ];

    if (nonRetryableErrors.some(errorType => 
      error.name === errorType || error.message.includes(errorType)
    )) {
      return false;
    }

    return currentRetries < maxRetries;
  }

  static getRetryDelay(retryCount: number): number {
    // Exponential backoff with jitter
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds
    const exponentialDelay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
    
    // Add jitter (±25%)
    const jitter = exponentialDelay * 0.25 * (Math.random() - 0.5);
    
    return Math.max(exponentialDelay + jitter, baseDelay);
  }
}