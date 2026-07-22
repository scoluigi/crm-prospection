import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 est un module natif : il ne doit jamais être bundlé par Turbopack/Webpack.
  serverExternalPackages: ["better-sqlite3"],
  typedRoutes: false,
};

export default nextConfig;
