export class PaddleDebugger {
  static logPaddleState() {
    
    // Check if Paddle is loaded
    
    
    if (typeof window.Paddle !== 'undefined') {
      
      
      // Check Paddle environment
      if (window.Paddle.Environment) {
        
      }
      
      // Check Subscription methods
      if (window.Paddle.Subscription) {
        
        
        
        // Check specific cancellation methods
        
        
        
      } else {
        console.warn('Paddle.Subscription not available');
      }
      
      // Check Checkout methods
      if (window.Paddle.Checkout) {
        
        
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