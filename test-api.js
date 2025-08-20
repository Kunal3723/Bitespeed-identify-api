const http = require('http');

const baseUrl = 'http://localhost:3000';

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body);
          resolve({ status: res.statusCode, body: jsonBody });
        } catch (e) {
          resolve({ status: res.statusCode, body: body });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testAPI() {
  console.log('🧪 Testing Bitespeed Contact Identifier API...\n');

  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await makeRequest('GET', '/health');
    console.log(`   Status: ${healthResponse.status}`);
    console.log(`   Response: ${JSON.stringify(healthResponse.body, null, 2)}\n`);

    // Test identify endpoint with new contact
    console.log('2. Testing identify endpoint with new contact...');
    const newContactResponse = await makeRequest('POST', '/identify', {
      email: 'test@example.com',
      phoneNumber: '1234567890'
    });
    console.log(`   Status: ${newContactResponse.status}`);
    console.log(`   Response: ${JSON.stringify(newContactResponse.body, null, 2)}\n`);

    // Test identify endpoint with existing email
    console.log('3. Testing identify endpoint with existing email...');
    const existingEmailResponse = await makeRequest('POST', '/identify', {
      email: 'test@example.com',
      phoneNumber: '0987654321'
    });
    console.log(`   Status: ${existingEmailResponse.status}`);
    console.log(`   Response: ${JSON.stringify(existingEmailResponse.body, null, 2)}\n`);

    // Test identify endpoint with existing phone
    console.log('4. Testing identify endpoint with existing phone...');
    const existingPhoneResponse = await makeRequest('POST', '/identify', {
      email: 'another@example.com',
      phoneNumber: '1234567890'
    });
    console.log(`   Status: ${existingPhoneResponse.status}`);
    console.log(`   Response: ${JSON.stringify(existingPhoneResponse.body, null, 2)}\n`);

    console.log('✅ All tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testAPI();
}

module.exports = { makeRequest, testAPI };
