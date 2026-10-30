import type { NextConfig } from "next";

/**
 * Sent with every response. HSTS for the domain and its subdomains, no
 * framing of the site by anyone, no MIME sniffing, a referrer that stops at
 * the origin on other sites, its own browsing context group, and no access to
 * camera, microphone or location, which nothing here uses.
 */
const SECURITY_HEADERS = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

const nextConfig: NextConfig = {
  images: {
    // AVIF first, WebP for the browsers without it.
    formats: ["image/avif", "image/webp"],
    // 480 fills the gap between 384 and 640: a phone screenshot drawn ~240px
    // wide on a 2x screen used to get the 640px file.
    imageSizes: [32, 48, 64, 96, 128, 256, 384, 480],
  },

  experimental: {
    // Tailwind's CSS goes into the page instead of two render-blocking
    // requests: most visitors arrive once, from a link, with nothing cached.
    inlineCss: true,
  },

  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },

  async redirects() {
    // Redirects run before the proxy, so the bare forms below still resolve —
    // `/guild` becomes `/about`, which the proxy then prefixes with a locale.
    // The prefixed forms are listed too, for the links that already carry a
    // language.
    const legacy = [
      // The careers page is gone; the team lives on /about now. Both old URLs
      // land there rather than on a 404.
      { from: "/careers", to: "/about" },
      { from: "/guild", to: "/about" },
      // /systems held the case studies while they were framed as our own
      // infrastructure. They are now the work, at /work. The slugs changed with
      // them, so the deep links land on the index rather than on a 404 —
      // pretending `/systems/meridian` maps to something would be worse.
      { from: "/systems", to: "/work" },
      { from: "/systems/:slug", to: "/work" },
    ];

    return legacy.flatMap(({ from, to }) => [
      { source: from, destination: to, permanent: true },
      {
        source: `/:locale(en|ru|cs)${from}`,
        destination: `/:locale${to}`,
        permanent: true,
      },
    ]);
  },
};

export default nextConfig;
