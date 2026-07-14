/** @type {import('next').NextConfig} */
const nextConfig = {
  // Single app dir at root — no src confusion
  experimental: {},
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
}
export default nextConfig
