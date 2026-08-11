export function getURL() {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return window.location.origin;
    }
    return 'https://heartly-five.vercel.app';
  }
  
  let url =
    process.env.NEXT_PUBLIC_SITE_URL ?? // Manual override
    process.env.NEXT_PUBLIC_VERCEL_URL ?? // Set by Vercel automatically
    'http://localhost:3000';
  
  // Ensure protocol is included
  url = url.includes('http') ? url : `https://${url}`;
  // Remove trailing slash
  url = url.endsWith('/') ? url.slice(0, -1) : url;
  
  // Enforce canonical production URL if not localhost/development
  if (!url.includes('localhost') && !url.includes('127.0.0.1')) {
    return 'https://heartly-five.vercel.app';
  }
  return url;
}
