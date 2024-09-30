/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/video-editor',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
