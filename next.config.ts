import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,   // the engine must survive a double mount
  poweredByHeader: false,
  // the dev server only allows localhost by default; 127.0.0.1 and the LAN IP
  // would otherwise be blocked from the client bundle
  allowedDevOrigins: ["127.0.0.1", "10.99.138.103"],
};

export default nextConfig;
