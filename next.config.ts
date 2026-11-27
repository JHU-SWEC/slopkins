import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Keeps the dev indicator off the bottom nav and the theme toggle.
  devIndicators: { position: "top-left" },
  // The Search tab became Explore. Old links (and ?q= searches) still work.
  async redirects() {
    return [{ source: "/search", destination: "/explore", permanent: false }];
  },
  experimental: {
    agentUpgrade: "security",
  },
  images: {
    // Allow images from Supabase Storage's public buckets.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/avatars/**",
      },
      // Meal photos on the feed, from the public "meal-photos" bucket.
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/meal-photos/**",
      },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
