/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  turbopack: {
    // Explicitly set project root so Turbopack can locate Next package
    root: process.cwd(),
  },
}

export default nextConfig
