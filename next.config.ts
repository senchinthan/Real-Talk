import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                net: false,
                tls: false,
                crypto: false,
                child_process: false,
                os: false,
                path: false,
                stream: false,
                util: false,
            };
        }
        
        // Handle @ai-sdk/google and google-auth-library
        config.externals = config.externals || [];
        if (!isServer) {
            config.externals.push({
                'google-auth-library': 'commonjs google-auth-library',
                'child_process': 'commonjs child_process',
                'fs': 'commonjs fs',
                'os': 'commonjs os',
                'path': 'commonjs path',
                'stream': 'commonjs stream',
                'util': 'commonjs util',
            });
        }
        
        return config;
    },
};

export default nextConfig;
