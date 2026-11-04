import type { NextConfig } from "next";

/**
 * Allow next/image to optimize media served by Strapi (local /uploads or
 * a remote provider such as Cloudinary/S3 in production).
 */
const strapiHost = (() => {
  try {
    return new URL(
      process.env.NEXT_PUBLIC_STRAPI_URL ?? "http://localhost:1337"
    ).hostname;
  } catch {
    return "localhost";
  }
})();

const isLocalStrapi = ["localhost", "127.0.0.1"].includes(strapiHost);

const nextConfig: NextConfig = {
  images: {
    // Next 16 blocks optimization of URLs resolving to private IPs (SSRF
    // protection). Only bypass when the CMS really is local — production
    // Strapi on a public domain keeps the protection enabled.
    dangerouslyAllowLocalIP: isLocalStrapi,
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "1337" },
      { protocol: "http", hostname: "127.0.0.1", port: "1337" },
      { protocol: "https", hostname: strapiHost },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "**.amazonaws.com" },
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
