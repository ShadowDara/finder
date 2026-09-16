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
    ];
  },
};

export default nextConfig;
