/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Electron will run the Next.js server internally, not use static export
  distDir: '.next',
}

export default nextConfig
