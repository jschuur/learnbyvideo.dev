import BundleAnalyzer from '@next/bundle-analyzer';
import { withSentryConfig } from '@sentry/nextjs';

const withBundleAnalyzer = BundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  reactStrictMode: true,
  images: {
    /* cspell:disable */
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
    /* cspell:enable */
  },
};

export default withSentryConfig(
  withBundleAnalyzer(nextConfig),
  {
    silent: true,
    org: 'joost-schuur',
    project: 'learnbyvideo-dev',
  },
  {
    widenClientFileUpload: true,
    transpileClientSDK: false,
    tunnelRoute: '/monitoring',
    hideSourceMaps: true,
    disableLogger: true,
    automaticVercelMonitors: true,
  }
);
