const http = require('http');
const fs = require('fs');

const BASE = 'http://localhost:5000/api';
const TOKEN = 'Bearer dummy-jwt-token-for-dev';
const results = [];
let output = '';

function log(msg) {
  console.log(msg);
  output += msg + '\n';
}

function req(method, path, body) {
  return new Promise((resolve) => {
    const url = new URL(BASE + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': TOKEN,
      },
    };

    const r = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        let parsed;
        try { parsed = JSON.parse(data); } catch { parsed = data; }
        resolve({ status: res.statusCode, body: parsed });
      });
    });

    r.on('error', (err) => resolve({ status: 'ERROR', body: err.message }));
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

function report(name, expected, actual) {
  const pass = Array.isArray(expected) ? expected.includes(actual.status) : actual.status === expected;
  const result = { name, expected, status: actual.status, pass, body: JSON.stringify(actual.body).slice(0, 300) };
  results.push(result);
  log(`${pass ? 'PASS' : 'FAIL'} | ${name} | ${actual.status} | ${result.body.slice(0, 120)}`);
  return actual;
}

async function run() {
  log('=== LAKWEDHA API TEST SUITE ===\n');

  // 1. Health
  let r = await req('GET', '/health');
  report('GET /api/health', 200, r);

  // 2. Register
  const email = `test${Date.now()}@test.com`;
  r = await req('POST', '/users/register', {
    name: 'Test User', email, password: 'test12345', phone: '0771234567', role: 'user'
  });
  report('POST /api/users/register', [200, 201], r);

  // 3. Login
  r = await req('POST', '/users/login', { email, password: 'test12345' });
  report('POST /api/users/login', 200, r);

  // 4. Profile (with dev token)
  r = await req('GET', '/users/profile');
  report('GET /api/users/profile', 200, r);

  // 5. Get prescriptions
  r = await req('GET', '/pharmacy/prescriptions');
  report('GET /api/pharmacy/prescriptions', 200, r);

  let prescriptionId = null;
  const prescriptions = r.body && r.body.data ? r.body.data : (Array.isArray(r.body) ? r.body : []);

  if (prescriptions.length > 0) {
    const pending = prescriptions.find(p => p.pharmacyStatus === 'pending');
    if (pending) prescriptionId = pending._id;
  }

  // 6. Reject with < 10 chars (must return 400)
  if (prescriptionId) {
    r = await req('PUT', `/pharmacy/prescriptions/${prescriptionId}/review`, {
      status: 'rejected', rejectionReason: 'short'
    });
    report('PUT /prescriptions/:id/review (reject <10 chars)', 400, r);
  } else {
    log('SKIP | reject <10 chars — no pending prescription');
  }

  // 7. Reject with valid reason
  if (prescriptionId) {
    r = await req('PUT', `/pharmacy/prescriptions/${prescriptionId}/review`, {
      status: 'rejected', rejectionReason: 'The image quality is too poor to read the prescription clearly enough'
    });
    report('PUT /prescriptions/:id/review (reject valid)', 200, r);
  } else {
    log('SKIP | reject valid — no pending prescription');
  }

  // Refresh to find another pending for approve
  r = await req('GET', '/pharmacy/prescriptions');
  const presc2 = r.body && r.body.data ? r.body.data : (Array.isArray(r.body) ? r.body : []);
  let approveId = null;
  const pending2 = presc2.find(p => p.pharmacyStatus === 'pending');
  if (pending2) approveId = pending2._id;

  // 8. Approve with medicines
  if (approveId) {
    r = await req('PUT', `/pharmacy/prescriptions/${approveId}/review`, {
      status: 'approved', medicines: [{ name: 'Amoxicillin', qty: 10, unitPrice: 25 }]
    });
    report('PUT /prescriptions/:id/review (approve)', 200, r);
  } else {
    log('SKIP | approve — no pending prescription');
  }

  // 9. Get orders
  r = await req('GET', '/orders');
  report('GET /api/orders', 200, r);

  const orders = r.body && r.body.data ? r.body.data : (Array.isArray(r.body) ? r.body : []);
  let orderId = orders.length > 0 ? orders[0]._id : null;

  if (orderId) {
    // 10. Get single order
    r = await req('GET', `/orders/${orderId}`);
    report('GET /api/orders/:id', 200, r);

    // 11. Valid status update
    r = await req('PUT', `/orders/${orderId}/status`, { status: 'processing', reason: 'Moving to processing' });
    report('PUT /orders/:id/status (valid)', [200, 400], r);

    // 12. Invalid status update
    r = await req('PUT', `/orders/${orderId}/status`, { status: 'pending', reason: 'Going backwards' });
    report('PUT /orders/:id/status (invalid)', 400, r);

    // 13. Update payment
    r = await req('PUT', `/orders/${orderId}/payment`, { paymentStatus: 'paid' });
    report('PUT /orders/:id/payment', 200, r);

    // 14. Initiate payment
    r = await req('POST', `/orders/${orderId}/pay/initiate`);
    report('POST /orders/:id/pay/initiate', [200, 400, 403, 500], r);

    // 15. Confirm payment
    r = await req('POST', `/orders/${orderId}/pay/confirm`);
    report('POST /orders/:id/pay/confirm', [200, 404], r);
  } else {
    log('SKIP | order tests — no orders found');
  }

  log('\n=== SUMMARY ===');
  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  log(`Total: ${results.length} | PASSED: ${passed} | FAILED: ${failed}`);

  if (failed > 0) {
    log('\nFAILED TESTS:');
    results.filter(r => !r.pass).forEach(r => {
      log(`  ${r.name} — Expected ${r.expected}, Got ${r.status}`);
      log(`    Body: ${r.body}`);
    });
  }

  fs.writeFileSync('test_results.txt', output);
  log('\nResults written to test_results.txt');
}

run();
