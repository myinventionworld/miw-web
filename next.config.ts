import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // /careers is what people type and what job boards link to, so it owns the
      // page. /guild was the earlier URL and is kept alive for anything linking it.
      { source: "/guild", destination: "/careers", permanent: true },
      // /systems held the case studies while they were framed as our own
      // infrastructure. They are now the work, at /work. The slugs changed with
      // them, so the deep links land on the index rather than on a 404 —
      // pretending `/systems/meridian` maps to something would be worse.
      { source: "/systems", destination: "/work", permanent: true },
      { source: "/systems/:slug", destination: "/work", permanent: true },
    ];
  },
};

export default nextConfig;
