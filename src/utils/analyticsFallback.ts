// Fallback cache to track if surprise_analytics table exists in the database
let isSupported: boolean | null = null;

export function checkAnalyticsSupport(): boolean {
  if (typeof window === 'undefined') return true;
  // If we have previously confirmed it's not supported, skip directly to fallback queries
  return isSupported !== false;
}

export function setAnalyticsSupport(supported: boolean) {
  isSupported = supported;
}
