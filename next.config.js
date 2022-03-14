module.exports = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/import',
        permanent: true,
      },
    ]
  },
}