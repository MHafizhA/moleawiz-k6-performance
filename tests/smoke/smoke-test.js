// ============================================
// FILE: tests/smoke/smoke-test.js
// SMOKE TEST - Basic Health Check
// ============================================

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';
import { customHtmlReport } from "../../utils/custom-html-report.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '30s', target: 5 },  // Ramp up to 5 users
    { duration: '1m', target: 5 },   // Stay at 5 users
    { duration: '30s', target: 0 },  // Ramp down to 0
  ],
  thresholds: {
    'http_req_duration': ['p(95)<3000'], // 95% of requests under 3s
    'http_req_failed': ['rate<0.01'],    // Error rate under 1%
    'errors': ['rate<0.1'],
  },
  throw: false,
};

export default function() {
  // Test 1: Access Web Homepage
  const webResponse = http.get('https://moleawiz-web-staging.digimasia.com/');

  check(webResponse, {
    'web status is 200': (r) => r.status === 200,
    'web response time < 3s': (r) => r.timings.duration < 3000,
    'web has content': (r) => r.body && r.body.length > 100,
  }) || errorRate.add(1);

  sleep(1);

  // Test 2: Login API with real credentials
  const loginPayload = JSON.stringify({
    email: 'hafizh@digimasia.com',
    password: '12345'
  });

  const loginParams = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const loginResponse = http.post(
    'https://lbs-staging.digimasia.com/api/public/index.php/login',
    loginPayload,
    loginParams
  );

  check(loginResponse, {
    'login status is 200': (r) => r.status === 200,
    'login response time < 2s': (r) => r.timings.duration < 2000,
    'login returns token': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.token !== undefined || body.access_token !== undefined || body.data !== undefined;
      } catch {
        return false;
      }
    },
  }) || errorRate.add(1);

  sleep(2);
}

export function handleSummary(data) {
  return {
    "reports/html/smoke-test-report.html": customHtmlReport(data),
    "reports/json/smoke-test-summary.json": JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}