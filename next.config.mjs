// next.config.mjs
import withPWAInit from "next-pwa";

/**
 * Configuration PWA pour next-pwa
 */
const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  buildExcludes: [
    /middleware-manifest\.json$/,
    /middleware-runtime\.js$/,
    /_middleware\.js$/,
    /dynamic-css-manifest\.json$/,
  ],
});

/**
 * Configuration principale Next.js
 */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: import.meta.dirname, // ✅ pour ESM (au lieu de __dirname)
};

/**
 * Export final (ESM compatible)
 */
export default withPWA(nextConfig);
