import type { NextConfig } from "next";

const ngrokHost = process.env.NGROK_HOST;

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: ngrokHost ? [`https://${ngrokHost}`] : undefined,
};

export default nextConfig;
