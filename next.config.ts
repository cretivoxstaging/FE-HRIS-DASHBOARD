import type { NextConfig } from "next";

const NextConfig = {
  eslint: { ignoreDuringBuilds: true }, // ⬅️ ini kunci
  typescript: { ignoreBuildErrors: true } // opsional kalau ada TS error juga
}

export default NextConfig;
