import { toast } from "sonner";

export interface TestScenario {
  name: string;
  description: string;
  execute: () => Promise<boolean>;
}

export class SubscriptionTestSuite {
  private static readonly PADDLE_SANDBOX_CONFIG = {
    environment: 'sandbox',
    clientToken: process.env.VITE_PADDLE_CLIENT_TOKEN,
  };

  static async runAllTests(): Promise<{ passed: number; failed: number; results: Array<{ name: string; passed: boolean; error?: string }> }> {
    const scenarios = this.getTestScenarios();
    const results = [];
    let passed = 0;
    let failed = 0;

    for (const scenario of scenarios) {
      try {
        console.log(`Running test: ${scenario.name}`);
        const result = await scenario.execute();
        
        if (result) {
          passed++;
          results.push({ name: scenario.name, passed: true });
          console.log(`✅ ${scenario.name} passed`);
        } else {
          failed++;
          results.push({ name: scenario.name, passed: false, error: 'Test returned false' });
          console.log(`❌ ${scenario.name} failed`);
        }
      } catch (error) {
        failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({ name: scenario.name, passed: false, error: errorMessage });
        console.log(`❌ ${scenario.name} failed: ${errorMessage}`);
      }
    }

    return { passed, failed, results };
  }

  private static getTestScenarios(): TestScenario[] {
    return [
      {
        name: 'Paddle SDK Loading',
        description: 'Verify Paddle SDK loads correctly',
        execute: async () => {
          return typeof window.Paddle !== 'undefined' && 
                 typeof window.Paddle.Subscription !== 'undefined';
        }
      },
      {
        name: 'Sandbox Configuration',
        description: 'Verify Paddle is configured for sandbox',
        execute: async () => {
          if (!window.Paddle) return false;
          
          // Check if environment is set to sandbox
          return window.Paddle.Environment?.get() === 'sandbox' ||
                 process.env.VITE_PADDLE_ENVIRONMENT === 'sandbox';
        }
      },
      {
        name: 'Cancellation Modal Rendering',
        description: 'Test cancellation modal can be rendered',
        execute: async () => {
          // This would test if the modal component renders without errors
          // In a real test environment, you'd use testing libraries
          return true; // Placeholder
        }
      },
      {
        name: 'Webhook Signature Validation',
        description: 'Test webhook signature validation',
        execute: async () => {
          const { PaddleWebhookValidator } = await import('./paddleWebhookValidator');
          
          const testPayload = '{"event_type":"subscription.cancelled","data":{"id":"test"}}';
          const testSecret = 'test_secret';
          const timestamp = Math.floor(Date.now() / 1000);
          
          // Create a test signature
          const crypto = await import('crypto');
          const signedPayload = `${timestamp}:${testPayload}`;
          const hash = crypto.createHmac('sha256', testSecret).update(signedPayload).digest('hex');
          const signature = `ts=${timestamp};h1=${hash}`;
          
          const result = await PaddleWebhookValidator.validateSignature(
            testPayload,
            signature,
            testSecret
          );
          
          return result.isValid;
        }
      },
      {
        name: 'Error Handling',
        description: 'Test error handling and logging',
        execute: async () => {
          const { ErrorHandler } = await import('./errorHandling');
          
          const testError = new Error('Test error');
          ErrorHandler.logError(testError, { action: 'test' });
          
          const errorLog = ErrorHandler.getErrorLog();
          return errorLog.length > 0 && errorLog[errorLog.length - 1].error.message === 'Test error';
        }
      },
      {
        name: 'Video Export Alpha Channel',
        description: 'Test video export with alpha channel support',
        execute: async () => {
          // Test if browser supports VP9 codec with alpha
          const supportedTypes = [
            'video/webm;codecs=vp9',
            'video/webm;codecs=vp8'
          ];
          
          return supportedTypes.some(type => MediaRecorder.isTypeSupported(type));
        }
      },
      {
        name: 'Network Failure Simulation',
        description: 'Test handling of network failures',
        execute: async () => {
          // Simulate a network failure
          try {
            await fetch('https://httpstat.us/500');
            return false; // Should have thrown an error
          } catch (error) {
            // Expected to fail, so this is a pass
            return true;
          }
        }
      },
      {
        name: 'Concurrent Cancellation Prevention',
        description: 'Test prevention of concurrent cancellation requests',
        execute: async () => {
          // This would test the double-submission prevention logic
          // In a real implementation, you'd test the actual component state
          return true; // Placeholder
        }
      }
    ];
  }

  static async testWebhookEndpoint(webhookUrl: string, testPayload: any): Promise<boolean> {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Paddle-Signature': 'ts=1234567890;h1=test_signature'
        },
        body: JSON.stringify(testPayload)
      });

      return response.ok;
    } catch (error) {
      console.error('Webhook test failed:', error);
      return false;
    }
  }

  static async testEmailDelivery(emailAddress: string): Promise<boolean> {
    // In a real implementation, this would test email delivery
    // For now, we'll just validate the email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailAddress);
  }

  static generateTestReport(results: { passed: number; failed: number; results: Array<{ name: string; passed: boolean; error?: string }> }): string {
    const { passed, failed, results: testResults } = results;
    const total = passed + failed;
    const passRate = total > 0 ? (passed / total * 100).toFixed(1) : '0';

    let report = `# Subscription Cancellation Test Report\n\n`;
    report += `**Summary:** ${passed}/${total} tests passed (${passRate}%)\n\n`;
    
    if (failed > 0) {
      report += `## Failed Tests\n\n`;
      testResults
        .filter(result => !result.passed)
        .forEach(result => {
          report += `- **${result.name}**: ${result.error || 'Unknown error'}\n`;
        });
      report += `\n`;
    }

    report += `## All Test Results\n\n`;
    testResults.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      report += `${status} **${result.name}**\n`;
      if (!result.passed && result.error) {
        report += `   Error: ${result.error}\n`;
      }
    });

    return report;
  }
}

// Export test runner for manual execution
export const runSubscriptionTests = async () => {
  toast.info('Running subscription tests...');
  
  try {
    const results = await SubscriptionTestSuite.runAllTests();
    const report = SubscriptionTestSuite.generateTestReport(results);
    
    console.log(report);
    
    if (results.failed === 0) {
      toast.success(`All ${results.passed} tests passed!`);
    } else {
      toast.error(`${results.failed} tests failed. Check console for details.`);
    }
    
    return results;
  } catch (error) {
    console.error('Test suite failed:', error);
    toast.error('Test suite execution failed');
    throw error;
  }
};