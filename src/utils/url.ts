export function getURL() {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  let url =
    process.env.NEXT_PUBLIC_SITE_URL ?? // Manual override
    process.env.NEXT_PUBLIC_VERCEL_URL ?? // Set by Vercel automatically
    'http://localhost:3000';
  
  // Ensure protocol is included
  url = url.includes('http') ? url : `https://${url}`;
  // Remove trailing slash
  url = url.endsWith('/') ? url.slice(0, -1) : url;
  return url;
}
