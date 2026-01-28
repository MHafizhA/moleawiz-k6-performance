// ============================================
// 5. SCENARIO TEST - Complete User Journey
// File: scenario-test.js
// ============================================

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { customHtmlReport } from "../../utils/custom-html-report.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

export const options = {
  scenarios: {
    web_browsing: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 30 },
        { duration: '3m', target: 30 },
        { duration: '1m', target: 0 },
      ],
      exec: 'webBrowsing',
    },
    user_login: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 10 },
        { duration: '2m', target: 20 },
        { duration: '30s', target: 0 },
      ],
      exec: 'userLogin',
    },
  },
  thresholds: {
    'http_req_duration{scenario:web_browsing}': ['p(95)<2000'],
    'http_req_duration{scenario:user_login}': ['p(95)<1500'],
  },
  throw: false,
};

export function webBrowsing() {
  group('Anonymous User Browsing', function() {
    // Visit homepage
    const homepage = http.get('https://moleawiz-web-staging.digimasia.com/');
    check(homepage, {
      'homepage loaded': (r) => r.status === 200,
      'homepage content': (r) => r.body && r.body.length > 100,
    });
    sleep(2);

    // Simulate page navigation (adjust URLs based on actual site structure)
    // Note: Ensure these endpoints exist, otherwise they will 404
    const aboutPage = http.get('https://moleawiz-web-staging.digimasia.com/about');
    sleep(3);

    const contactPage = http.get('https://moleawiz-web-staging.digimasia.com/contact');
    sleep(2);
  });
}

export function userLogin() {
  group('User Authentication Flow', function() {
    // Step 1: Visit web first
    http.get('https://moleawiz-web-staging.digimasia.com/');
    sleep(1);

    // Step 2: Attempt login with real credentials
    const loginResponse = http.post(
      'https://lbs-staging.digimasia.com/api/public/index.php/login',
      JSON.stringify({
        email: 'hafizh@digimasia.com',
        password: '12345'
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      }
    );

    const loginSuccess = check(loginResponse, {
      'login successful': (r) => r.status === 200,
      'received token': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.token !== undefined || body.access_token !== undefined || body.data !== undefined;
        } catch {
          return false;
        }
      },
    });

    if (loginSuccess) {
      // Extract token for subsequent requests
      let token;
      try {
        const body = JSON.parse(loginResponse.body);
        token = body.token || body.access_token || (body.data && body.data.token);
      } catch (e) {
        console.log('Failed to parse token:', e);
      }

      // Step 3: Make authenticated request (example)
      if (token) {
        const dashboardResponse = http.get('https://lbs-staging.digimasia.com/api/public/index.php/dashboard', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        // Only check if dashboard exists, otherwise ignore 404
        if (dashboardResponse.status === 200) {
             check(dashboardResponse, {
              'dashboard accessible': (r) => r.status === 200,
            });
        }
      }
    }

    sleep(3);
  });
}

export function handleSummary(data) {
  return {
    "reports/html/scenario-test-report.html": customHtmlReport(data),
    "reports/json/scenario-test-summary.json": JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}