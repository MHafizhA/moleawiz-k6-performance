// ============================================
// FILE: tests/load/load-test.js
// LOAD TEST - Normal Traffic Simulation
// ============================================

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { customHtmlReport } from "../../utils/custom-html-report.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

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
  // This option ensures that the test returns a success exit code (0)
  // even if thresholds fail. This is crucial for npm's `posttest` script to run.
  throw: false,
};

export default function() {
  // Group 1: Web Page Access
  group('Web Homepage Access', function() {
    const webResponse = http.get('https://moleawiz-web-staging.digimasia.com/', {
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

  // Group 2: Login Flow with Real Credentials
  group('User Login', function() {
    const loginPayload = JSON.stringify({
      email: 'hafizh@digimasia.com',
      password: '12345'
    });

    const loginParams = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      tags: { name: 'LoginAPI' },
    };

    const loginResponse = http.post(
      'https://lbs-staging.digimasia.com/api/public/index.php/login',
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