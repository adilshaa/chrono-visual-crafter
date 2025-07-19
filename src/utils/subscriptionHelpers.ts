/**
 * Utility functions for subscription management
 */

/**
 * Reload the page after a delay to ensure all components update with new subscription status
 * @param delay - Delay in milliseconds before reloading (default: 1500ms)
 * @param message - Optional message to show in console
 */
export function reloadPageAfterSubscriptionChange(
  delay: number = 1500,
  message?: string
): void {
  if (message) {
  }

  setTimeout(() => {
  
    window.location.reload();
  }, delay);
}

/**
 * Navigate to a specific URL after a delay, ensuring subscription status is updated
 * @param url - URL to navigate to
 * @param delay - Delay in milliseconds before navigation (default: 1500ms)
 */
export function navigateAfterSubscriptionChange(
  url: string,
  delay: number = 1500
): void {
  setTimeout(() => {
    window.location.href = url;
  }, delay);
}

/**
 * Normalize subscription status to handle different spelling variants
 * @param status - Raw status from API
 * @returns Normalized status
 */
export function normalizeSubscriptionStatus(status: string): string {
  const normalizedStatus = status.toLowerCase();

  // Handle both US and UK spelling variants
  if (normalizedStatus === "canceled") {
    return "cancelled";
  }

  return normalizedStatus;
}

/**
 * Check if a subscription status indicates an active subscription
 * @param status - Subscription status
 * @returns True if subscription is active
 */
export function isActiveSubscription(status: string): boolean {
  const normalizedStatus = normalizeSubscriptionStatus(status);
  return normalizedStatus === "active";
}

/**
 * Check if a subscription status indicates a cancelled subscription
 * @param status - Subscription status
 * @returns True if subscription is cancelled
 */
export function isCancelledSubscription(status: string): boolean {
  const normalizedStatus = normalizeSubscriptionStatus(status);
  return normalizedStatus === "cancelled";
}

/**
 * Get user-friendly subscription status text
 * @param status - Raw subscription status
 * @returns User-friendly status text
 */
export function getSubscriptionStatusText(status: string): string {
  const normalizedStatus = normalizeSubscriptionStatus(status);

  switch (normalizedStatus) {
    case "active":
      return "Active";
    case "cancelled":
      return "Cancelled";
    case "past_due":
      return "Past Due";
    case "paused":
      return "Paused";
    case "trialing":
      return "Trial";
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

/**
 * Get subscription status color for UI components
 * @param status - Subscription status
 * @returns Color class or color name
 */
export function getSubscriptionStatusColor(status: string): string {
  const normalizedStatus = normalizeSubscriptionStatus(status);

  switch (normalizedStatus) {
    case "active":
      return "green";
    case "cancelled":
      return "orange";
    case "past_due":
      return "red";
    case "paused":
      return "yellow";
    case "trialing":
      return "blue";
    default:
      return "gray";
  }
}
