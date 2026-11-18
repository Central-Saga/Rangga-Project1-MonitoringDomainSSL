/** @type {import('next').NextConfig} */
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy',
            value: "default-src 'self' https: data: 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; script-src 'self' 'unsafe-inline' https:; connect-src 'self' https:; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self';"},
          { key: 'X-Content-Type-Options',
            value: 'nosniff' },
          { key: 'X-Frame-Options',
            value: 'DENY' },
          { key: 'Referrer-Policy',
            value: 'origin-when-cross-origin' },
          { key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload' },
        ],
      },
    ]
  },
]