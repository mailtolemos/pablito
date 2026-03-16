/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { domains: [] },
  experimental: { esmExternals: "loose" }
}
module.exports = nextConfig
