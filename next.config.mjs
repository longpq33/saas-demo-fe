import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    // Force Turbopack to treat this folder as the root to avoid lockfile root warnings
    root: __dirname,
  },
  compiler: {
    styledComponents: true,
  },
};

export default nextConfig;

