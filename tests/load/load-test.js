// ============================================
// FILE: tests/load/load-test.js
// LOAD TEST - Normal Traffic Simulation
// ============================================

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { SharedArray } from 'k6/data';
import { customHtmlReport } from "../../utils/custom-html-report.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

// 1. ENVIRONMENT VARIABLES
// Default to staging if not provided via -e BASE_URL=...
const BASE_URL_WEB = __ENV.BASE_URL_WEB || 'https://moleawiz-web-staging.digimasia.com';
const BASE_URL_API = __ENV.BASE_URL_API || 'https://lbs-staging.digimasia.com/api/public/index.php';

// 2. DATA DRIVEN TESTING
// Load users from JSON file efficiently
const users = new SharedArray('users', function () {
  return JSON.parse(open('../../data/users.json'));
});

const errorRate = new Rate('errors');
const webLoadTime = new Trend('web_load_time');
const loginDuration = new Trend('login_duration');
const successfulLogins = new Counter('successful_logins');
const failedLogins = new Counter('failed_logins');

export const options = {
  stages: [
    { duration: '10s', target: 20 },   // Ramp up to 20 users
    { duration: '10s', target: 50 },   // Increase to 50 users
    { duration: '10s', target: 50 },  // Stay at 50 users
    { duration: '5s', target: 0 },    // Ramp down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<2000', 'p(99)<3000'],
    'http_req_failed': ['rate<0.10'], // Relaxed to 10% for staging
    'errors': ['rate<0.30'],          // Relaxed to 30% for staging
    'web_load_time': ['p(95)<2500'],
    'login_duration': ['p(95)<1500'],
  },
  throw: false,
};

export default function() {
  // Group 1: Web Page Access
  group('Web Homepage Access', function() {
    const webResponse = http.get(`${BASE_URL_WEB}/`, {
      tags: { name: 'WebHomepage' },
    });

    webLoadTime.add(webResponse.timings.duration);

    const webCheckResult = check(webResponse, {
      'web status is 200': (r) => r.status === 200,
      'web content loaded': (r) => r.body && r.body.length > 100,
      'web no errors': (r) => r.body && !r.body.includes('error') && !r.body.includes('Error'),
    });

    if (!webCheckResult) {
      errorRate.add(1);
    }

    sleep(1);
  });

  // Group 2: Login Flow with Dynamic Users
  group('User Login', function() {
    // Pick a random user from the list
    const user = users[Math.floor(Math.random() * users.length)];

    const loginPayload = JSON.stringify({
      email: user.username, // Using username from JSON (assuming it's email or username field)
      password: user.password
    });

    const loginParams = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      tags: { name: 'LoginAPI' },
    };

    const loginResponse = http.post(
      `${BASE_URL_API}/login`,
      loginPayload,
      loginParams
    );

    loginDuration.add(loginResponse.timings.duration);

    const loginCheckResult = check(loginResponse, {
      'login status is 200': (r) => r.status === 200,
      'login response is JSON': (r) => {
        try {
          JSON.parse(r.body);
          return true;
        } catch {
          return false;
        }
      },
      'login has token': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.token !== undefined || body.access_token !== undefined || body.data !== undefined;
        } catch {
          return false;
        }
      },
    });

    if (loginResponse.status === 200) {
      successfulLogins.add(1);
    } else {
      failedLogins.add(1);
    }

    if (!loginCheckResult) {
      errorRate.add(1);
      // Optional: Log which user failed
      // console.log(`Login failed for user ${user.username}: ${loginResponse.status}`);
    }

    sleep(2);
  });

  sleep(Math.random() * 3 + 2);
}

export function handleSummary(data) {
  return {
    "reports/html/load-test-report.html": customHtmlReport(data),
    "reports/json/load-test-summary.json": JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}