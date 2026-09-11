/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Für den Docker-Standalone-Build (docker/uploadpage/Dockerfile)
  output: "standalone",
}

export default nextConfig
