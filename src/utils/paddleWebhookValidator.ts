import { createHmac } from 'crypto';

export interface WebhookValidationResult {
  isValid: boolean;
  error?: string;
}

export class PaddleWebhookValidator {
  private static readonly TIMESTAMP_TOLERANCE = 300; // 5 minutes in seconds

  static async validateSignature(
    rawBody: string,
    signature: string,
    secret: string
  ): Promise<WebhookValidationResult> {
    try {
      if (!signature || !secret) {
        return { isValid: false, error: 'Missing signature or secret' };
      }

      // Parse signature header
      const parts = signature.split(';');
      const timestampStr = parts
        .find(part => part.startsWith('ts='))
        ?.split('=')[1];
      const h1Hash = parts
        .find(part => part.startsWith('h1='))
        ?.split('=')[1];

      if (!timestampStr || !h1Hash) {
        return { isValid: false, error: 'Invalid signature format' };
      }

      // Validate timestamp
      const timestamp = parseInt(timestampStr, 10);
      if (isNaN(timestamp)) {
        return { isValid: false, error: 'Invalid timestamp' };
      }

      const currentTimestamp = Math.floor(Date.now() / 1000);
      if (Math.abs(currentTimestamp - timestamp) > this.TIMESTAMP_TOLERANCE) {
        return { isValid: false, error: 'Timestamp outside tolerance window' };
      }

      // Verify signature
      const signedPayload = `${timestampStr}:${rawBody}`;
      const expectedHash = createHmac('sha256', secret)
        .update(signedPayload)
        .digest('hex');

      const isValid = this.constantTimeCompare(expectedHash, h1Hash);
      
      return { isValid };
    } catch (error) {
      return { 
        isValid: false, 
        error: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  private static constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }

  static validatePayloadSize(payload: string, maxSizeMB: number = 10): boolean {
    const sizeInBytes = new Blob([payload]).size;
    const maxSizeInBytes = maxSizeMB * 1024 * 1024;
    return sizeInBytes <= maxSizeInBytes;
  }

  static isValidEventType(eventType: string): boolean {
    const validEvents = [
      'subscription.created',
      'subscription.updated', 
      'subscription.cancelled',
      'subscription.paused',
      'subscription.resumed',
      'transaction.completed',
      'customer.created',
      'customer.updated',
      'invoice.paid',
      'invoice.payment_failed'
    ];

    return validEvents.includes(eventType);
  }
}