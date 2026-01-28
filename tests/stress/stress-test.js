// ============================================
// 3. STRESS TEST - Find Breaking Point
// File: stress-test.js
// ============================================

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';
import { SharedArray } from 'k6/data';
import { customHtmlReport } from "../../utils/custom-html-report.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

// 1. ENVIRONMENT VARIABLES
const BASE_URL_WEB = __ENV.BASE_URL_WEB || 'https://moleawiz-web-staging.digimasia.com';
const BASE_URL_API = __ENV.BASE_URL_API || 'https://lbs-staging.digimasia.com/api/public/index.php';

// 2. DATA DRIVEN TESTING
const users = new SharedArray('users', function () {
  return JSON.parse(open('../../data/users.json'));
});

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '2m', target: 50 },    // Ramp to 50 users
    { duration: '3m', target: 100 },   // Ramp to 100 users
    { duration: '3m', target: 200 },   // Ramp to 200 users (Staging max)
    { duration: '5m', target: 200 },   // Hold at 200 users
    { duration: '3m', target: 0 },     // Ramp down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<5000'], // 5s is acceptable for stress
    'errors': ['rate<0.15'],             // Allow 15% error rate
  },
  throw: false,
};

export default function() {
  // Web access under stress
  const webResponse = http.get(`${BASE_URL_WEB}/`, {
    timeout: '30s',
  });

  check(webResponse, {
    'web accessible under stress': (r) => r.status === 200,
    'web content loaded': (r) => r.body && r.body.length > 100,
  }) || errorRate.add(1);

  sleep(0.5);

  // Login under stress
  const user = users[Math.floor(Math.random() * users.length)];

  const loginResponse = http.post(
    `${BASE_URL_API}/login`,
    JSON.stringify({
      email: user.username,
      password: user.password
    }),
    {
      headers: { 'Content-Type': 'application/json' },
      timeout: '20s',
    }
  );

  check(loginResponse, {
    'login responds under stress': (r) => r.status !== 0,
    'login status acceptable': (r) => r.status === 200 || r.status === 429 || r.status === 503,
  }) || errorRate.add(1);

  sleep(0.5);
}

export function handleSummary(data) {
  return {
    "reports/html/stress-test-report.html": customHtmlReport(data),
    "reports/json/stress-test-summary.json": JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}