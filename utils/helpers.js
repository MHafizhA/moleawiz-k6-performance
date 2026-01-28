import http from 'k6/http';
import { check } from 'k6';

export function makeLoginRequest(credentials) {
  const payload = JSON.stringify(credentials);
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };

  return http.post(
    'https://lbs-staging.digimasia.com/api/public/index.php/login',
    payload,
    params
  );
}

export function checkResponse(response, name = 'request') {
  return check(response, {
    [`${name}: status is 200`]: (r) => r.status === 200,
    [`${name}: response time OK`]: (r) => r.timings.duration < 3000,
    [`${name}: has body`]: (r) => r.body.length > 0
  });
}