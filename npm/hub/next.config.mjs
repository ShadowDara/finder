const isVercel = process.env.VERCEL === "1";

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    unoptimized: true,
  },

  ...(isVercel ? {} : { output: "standalone" }),

  async rewrites() {
    return [
      { source: "/t/:id.json5", destination: "/t/:id" },
      { source: "/t/:id.jsonc", destination: "/t/:id" },
      { source: "/t/:id.json", destination: "/t/:id" },
      { source: "/t/:username/:slug.json5", destination: "/t/:username/:slug" },
      { source: "/t/:username/:slug.jsonc", destination: "/t/:username/:slug" },
      { source: "/t/:username/:slug.json", destination: "/t/:username/:slug" },
    ];
  },
};

export default nextConfig;
