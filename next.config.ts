import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  distDir: 'dist',
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  serverExternalPackages: [
    'firebase',
    '@firebase/app',
    '@firebase/firestore',
    '@firebase/util',
    '@firebase/component',
    '@firebase/logger',
    '@firebase/webchannel-wrapper',
  ],
  // Allow access to remote image placeholder.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**', // This allows any path under the hostname
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  devIndicators: false,
  transpilePackages: ['motion'],
  async redirects() {
    return [
      {
        source: '/p/:slug',
        destination: '/:slug',
        permanent: false,
      },
    ];
  },
  webpack: (config, {dev}) => {
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = {
        ignored: /.*/,
      };
    }
    return config;
  },
};

export default nextConfig;
