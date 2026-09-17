import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    // /careers is what people type and what job boards link to, so it owns the
    // page. /guild was the earlier URL and is kept alive for anything linking it.
    return [{ source: "/guild", destination: "/careers", permanent: true }];
  },
};

export default nextConfig;
