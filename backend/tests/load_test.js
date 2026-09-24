import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 }, // ramp up to 20 virtual users
    { duration: '1m', target: 20 },  // stay at 20 users for 1 min
    { duration: '10s', target: 0 },  // ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should complete within 500ms
    http_req_failed: ['rate<0.01'],    // less than 1% failure rate
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:8000/api';

export default function () {
  // Test 1: Health liveness check endpoint
  const healthRes = http.get(`${BASE_URL}/healthz/`);
  check(healthRes, {
    'health check status is 200': (r) => r.status === 200,
  });

  // Test 2: Level tier pricing endpoint
  const pricingRes = http.get(`${BASE_URL}/billing/level-tiers/`);
  check(pricingRes, {
    'pricing endpoint status is 200 or 401': (r) => r.status === 200 || r.status === 401,
  });

  sleep(1);
}
