export class PaddleDebugger {
  static logPaddleState() {
    console.group('🏓 Paddle SDK Debug Information');
    
    // Check if Paddle is loaded
    console.log('Paddle loaded:', typeof window.Paddle !== 'undefined');
    
    if (typeof window.Paddle !== 'undefined') {
      console.log('Paddle object:', window.Paddle);
      
      // Check Paddle environment
      if (window.Paddle.Environment) {
        console.log('Paddle environment:', window.Paddle.Environment.get?.());
      }
      
      // Check Subscription methods
      if (window.Paddle.Subscription) {
        console.log('Subscription object:', window.Paddle.Subscription);
        console.log('Available methods:', Object.getOwnPropertyNames(window.Paddle.Subscription));
        
        // Check specific cancellation methods
        console.log('cancel method available:', typeof window.Paddle.Subscription.cancel === 'function');
        console.log('cancelPreview method available:', typeof window.Paddle.Subscription.cancelPreview === 'function');
        console.log('update method available:', typeof window.Paddle.Subscription.update === 'function');
      } else {
        console.warn('Paddle.Subscription not available');
      }
      
      // Check Checkout methods
      if (window.Paddle.Checkout) {
        console.log('Checkout object available:', true);
        console.log('Checkout methods:', Object.getOwnPropertyNames(window.Paddle.Checkout));
      } else {
        console.warn('Paddle.Checkout not available');
      }
    } else {
      console.error('Paddle SDK not loaded');
    }
    
    console.groupEnd();
  }

  static async testPaddleConnection(): Promise<boolean> {
    try {
      if (!window.Paddle) {
        console.error('Paddle SDK not loaded');
        return false;
      }

      // Test basic Paddle functionality
      const environment = window.Paddle.Environment?.get?.();
      console.log('Paddle environment test:', environment);

      return true;
    } catch (error) {
      console.error('Paddle connection test failed:', error);
      return false;
    }
  }

  static getAvailableMethods(): string[] {
    if (!window.Paddle) return [];
    
    const methods: string[] = [];
    
    if (window.Paddle.Subscription) {
      const subscriptionMethods = Object.getOwnPropertyNames(window.Paddle.Subscription)
        .filter(name => typeof window.Paddle.Subscription[name] === 'function')
        .map(name => `Subscription.${name}`);
      methods.push(...subscriptionMethods);
    }
    
    if (window.Paddle.Checkout) {
      const checkoutMethods = Object.getOwnPropertyNames(window.Paddle.Checkout)
        .filter(name => typeof window.Paddle.Checkout[name] === 'function')
        .map(name => `Checkout.${name}`);
      methods.push(...checkoutMethods);
    }
    
    return methods;
  }

  static async waitForPaddle(timeout: number = 10000): Promise<boolean> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const checkPaddle = () => {
        if (window.Paddle && window.Paddle.Subscription) {
          console.log('Paddle SDK loaded successfully');
          resolve(true);
          return;
        }
        
        if (Date.now() - startTime > timeout) {
          console.error('Paddle SDK loading timeout');
          resolve(false);
          return;
        }
        
        setTimeout(checkPaddle, 100);
      };
      
      checkPaddle();
    });
  }
}

// Auto-debug in development
if (process.env.NODE_ENV === 'development') {
  // Wait for Paddle to load, then debug
  setTimeout(() => {
    PaddleDebugger.logPaddleState();
  }, 2000);
}