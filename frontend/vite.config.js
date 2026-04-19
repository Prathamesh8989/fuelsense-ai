export default {
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // your Node backend
        changeOrigin: true,
        secure: false,
      }
    }
  }
}