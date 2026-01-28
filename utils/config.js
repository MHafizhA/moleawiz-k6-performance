export const config = {
  baseURL: 'https://moleawiz-web-staging.digimasia.com',
  apiURL: 'https://lbs-staging.digimasia.com/api/public/index.php',
  credentials: {
    email: 'hafizh@digimasia.com',
    password: '12345'
  },
  thresholds: {
    responseTime: {
      p95: 2000,
      p99: 3000
    },
    errorRate: 0.01,
    throughput: 10
  }
};