export const firebaseCsp =
  "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; script-src 'self' https://apis.google.com https://www.gstatic.com https://www.google.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://lh3.googleusercontent.com https://*.google-analytics.com https://*.googletagmanager.com; media-src 'self'; font-src 'self'; connect-src 'self' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.googleapis.com https://*.firebaseapp.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com; frame-src 'self' https://*.firebaseapp.com https://www.google.com https://recaptcha.google.com; worker-src 'self' blob:; form-action 'self'; upgrade-insecure-requests";
export const securityHeaders: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "X-Frame-Options": "DENY",
  "Content-Security-Policy": firebaseCsp,
  "Strict-Transport-Security": "max-age=31536000",
  "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
  "X-Permitted-Cross-Domain-Policies": "none",
};
