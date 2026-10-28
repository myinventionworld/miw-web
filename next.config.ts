import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
