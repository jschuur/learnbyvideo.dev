const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/api',
        headers: [
          {
            key: 's-maxage',
            value: '3600',
          },
        ],
      },
    ];
  },
  images: {
    domains: [
      'i.ytimg.com',
      'i1.ytimg.com',
      'i2.ytimg.com',
      'i3.ytimg.com',
      'i4.ytimg.com',
      'i5.ytimg.com',
      'i6.ytimg.com',
      'i7.ytimg.com',
    ],
  },
};

export default nextConfig;
