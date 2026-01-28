// ============================================
// 4. SPIKE TEST - Sudden Traffic Surge
// File: spike-test.js
// ============================================

import http from 'k6/http';
import { check, sleep } from 'k6';
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

export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Normal load
    { duration: '30s', target: 200 },  // Sudden spike! (Jump to 200 users)
    { duration: '3m', target: 200 },   // Hold spike
    { duration: '30s', target: 10 },   // Back to normal
    { duration: '2m', target: 10 },    // Recovery period
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<5000'], // Relaxed for spike (5s)
    'http_req_failed': ['rate<0.15'],    // Expect some failures during spike (15%)
  },
  throw: false,
};

export default function() {
  const user = users[Math.floor(Math.random() * users.length)];

  const responses = http.batch([
    ['GET', `${BASE_URL_WEB}/`],
    ['POST', `${BASE_URL_API}/login`,
     JSON.stringify({
       email: user.username,
       password: user.password
     }),
     { headers: { 'Content-Type': 'application/json' } }
    ],
  ]);

  check(responses[0], {
    'web survived spike': (r) => r.status === 200,
    'web content loaded': (r) => r.body && r.body.length > 100,
  });

  check(responses[1], {
    'login survived spike': (r) => r.status === 200 || r.status === 429, // 429 Too Many Requests is acceptable during spike
  });

  sleep(1);
}

export function handleSummary(data) {
  return {
    "reports/html/spike-test-report.html": customHtmlReport(data),
    "reports/json/spike-test-summary.json": JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}