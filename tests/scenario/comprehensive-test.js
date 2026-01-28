// ============================================
// 6. COMPREHENSIVE TEST - All Features
// File: comprehensive-test.js
// ============================================

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
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

// Custom Metrics
const errorRate = new Rate('errors');
const webLoadTime = new Trend('web_load_time');
const loginDuration = new Trend('login_duration');
const successfulLogins = new Counter('successful_logins');
const failedLogins = new Counter('failed_logins');
const totalRequests = new Counter('total_requests');

export const options = {
  stages: [
    { duration: '1m', target: 10 },
    { duration: '3m', target: 30 },
    { duration: '2m', target: 50 },
    { duration: '5m', target: 50 },
    { duration: '2m', target: 10 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    'http_req_duration': ['p(95)<2000', 'p(99)<3000'],
    'http_req_failed': ['rate<0.05'],
    'errors': ['rate<0.20'],
    'web_load_time': ['p(95)<2500'],
    'login_duration': ['p(95)<1500'],
    'successful_logins': ['count>50'], // Adjusted for staging
  },
  throw: false,
};

export default function() {
  totalRequests.add(1);

  // Test Flow 1: Web Access
  group('Web Application', function() {
    const webStart = Date.now();
    const webResponse = http.get(`${BASE_URL_WEB}/`, {
      tags: { test_type: 'web' },
    });
    webLoadTime.add(Date.now() - webStart);

    const webCheck = check(webResponse, {
      'web: status is 200': (r) => r.status === 200,
      'web: response time OK': (r) => r.timings.duration < 3000,
      'web: has content': (r) => r.body && r.body.length > 100,
    });

    if (!webCheck) {
      errorRate.add(1);
      console.log(`❌ Web test failed - Status: ${webResponse.status}`);
    }

    sleep(1);
  });

  // Test Flow 2: Authentication
  group('Authentication', function() {
    const user = users[Math.floor(Math.random() * users.length)];
    const loginStart = Date.now();

    const loginPayload = JSON.stringify({
      email: user.username,
      password: user.password
    });

    const loginResponse = http.post(
      `${BASE_URL_API}/login`,
      loginPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        tags: { test_type: 'login' },
      }
    );

    loginDuration.add(Date.now() - loginStart);

    const loginCheck = check(loginResponse, {
      'login: status is 200': (r) => r.status === 200,
      'login: response is JSON': (r) => {
        try {
          JSON.parse(r.body);
          return true;
        } catch {
          return false;
        }
      },
      'login: contains auth data': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.token || body.access_token || body.data;
        } catch {
          return false;
        }
      },
      'login: response time OK': (r) => r.timings.duration < 2000,
    });

    if (loginCheck && loginResponse.status === 200) {
      successfulLogins.add(1);
    } else {
      failedLogins.add(1);
      errorRate.add(1);
      console.log(`❌ Login failed - Status: ${loginResponse.status}, Body: ${loginResponse.body.substring(0, 100)}`);
    }

    sleep(2);
  });

  // Random user think time
  sleep(Math.random() * 2 + 1);
}

export function handleSummary(data) {
  const date = new Date().toISOString().split('T')[0];
  const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');

  return {
    [`reports/html/comprehensive-test-${date}-${time}.html`]: customHtmlReport(data),
    "reports/html/comprehensive-test-latest.html": customHtmlReport(data),
    "reports/json/comprehensive-test-summary.json": JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}