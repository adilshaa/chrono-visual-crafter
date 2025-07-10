
export interface AuditLogEntry {
  id?: string;
  user_id: string;
  subscription_id: string;
  action: 'created' | 'updated' | 'cancelled' | 'reactivated' | 'payment_failed' | 'payment_succeeded';
  old_status?: string;
  new_status: string;
  metadata?: Record<string, any>;
  timestamp: string;
  ip_address?: string;
  user_agent?: string;
}

export class SubscriptionAuditLogger {
  static async logAction(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) {
    try {
      const auditEntry: AuditLogEntry = {
        ...entry,
        timestamp: new Date().toISOString(),
        ip_address: await this.getClientIP(),
        user_agent: navigator.userAgent,
      };

      // TODO: Implement audit logging when subscription_audit_logs table is created
      console.log('Audit log entry:', auditEntry);
    } catch (error) {
      console.error('Error logging audit entry:', error);
    }
  }

  static async getAuditHistory(userId: string, subscriptionId?: string) {
    try {
      // TODO: Implement audit history retrieval when subscription_audit_logs table is created
      console.log('Getting audit history for user:', userId, 'subscription:', subscriptionId);
      return [];
    } catch (error) {
      console.error('Error fetching audit history:', error);
      return [];
    }
  }

  private static async getClientIP(): Promise<string> {
    try {
      // In a real implementation, you might want to get the client IP
      // from your backend or a service like ipify
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip || 'unknown';
    } catch {
      return 'unknown';
    }
  }

  static async logCancellation(
    userId: string,
    subscriptionId: string,
    reason: string,
    oldStatus: string
  ) {
    await this.logAction({
      user_id: userId,
      subscription_id: subscriptionId,
      action: 'cancelled',
      old_status: oldStatus,
      new_status: 'cancelling',
      metadata: {
        cancellation_reason: reason,
        grace_period_ends: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });
  }

  static async logReactivation(
    userId: string,
    subscriptionId: string,
    oldStatus: string
  ) {
    await this.logAction({
      user_id: userId,
      subscription_id: subscriptionId,
      action: 'reactivated',
      old_status: oldStatus,
      new_status: 'active',
      metadata: {
        reactivated_from_grace_period: true,
      },
    });
  }

  static async logStatusUpdate(
    userId: string,
    subscriptionId: string,
    oldStatus: string,
    newStatus: string,
    metadata?: Record<string, any>
  ) {
    await this.logAction({
      user_id: userId,
      subscription_id: subscriptionId,
      action: 'updated',
      old_status: oldStatus,
      new_status: newStatus,
      metadata,
    });
  }
}
