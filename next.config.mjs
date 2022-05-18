const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/',
        destination: 'https://twitter.com/LearnByVideoDev',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
