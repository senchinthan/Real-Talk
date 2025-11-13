/** @type {import('next').NextConfig} */
const nextConfig = {
    // Using Webpack configuration (default)
    // No Turbopack configuration needed
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    webpack: (config, { isServer }) => {
        // Only apply these polyfills on the client side
        if (!isServer) {
            // Provide empty modules for Node.js specific modules
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                child_process: false,
                net: false,
                tls: false,
                os: false,
                path: false,
                stream: false,
                http: false,
                https: false,
                zlib: false,
                crypto: false,
            };
        }
        return config;
    },
};

module.exports = nextConfig;
