const nextConfig = {
  async headers() {
    return [
      {

        source: '/2FAcode',
        headers: [
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
        ],
      },
    ];
  },
  rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://nestjs:3001/api/:path*",
      },
    ];
  },
};

module.exports = nextConfig