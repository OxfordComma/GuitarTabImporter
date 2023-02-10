module.exports = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/edit',
        permanent: false,
      },
    ]
  },
}