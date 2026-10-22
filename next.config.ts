import type { NextConfig } from 'next';
const config: NextConfig = {
  serverExternalPackages: ['unpdf'],
  turbopack: { root: process.cwd() },
  experimental: { cpus: 2 },
};
export default config;
