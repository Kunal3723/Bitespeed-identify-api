const fs = require('fs');
const http = require('http');
const { execSync } = require('child_process');

function httpRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: 3000,
        path,
        method,
        headers: {
          'Content-Type': 'application/json'
        }
      },
      res => {
        let body = '';
        res.on('data', chunk => (body += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(body || '{}') });
          } catch (e) {
            resolve({ status: res.statusCode, body });
          }
        });
      }
    );

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function resetDb() {
  try {
    execSync(
      'docker cp scripts/reset-db.sql bit-project-postgres-1:/tmp/reset-db.sql && docker exec bit-project-postgres-1 psql -U postgres -d bitespeed_contacts -f /tmp/reset-db.sql',
      { stdio: 'pipe' }
    );
  } catch (e) {
    // surface minimal info but continue to throw
    console.error('Failed to reset DB:', e.message);
    throw e;
  }
}

function normalizeResponse(resp) {
  if (!resp || !resp.contact) return resp;
  const c = resp.contact;
  return {
    contact: {
      primaryContatctId: c.primaryContatctId,
      emails: [...new Set(c.emails || [])].sort(),
      phoneNumbers: [...new Set(c.phoneNumbers || [])].sort(),
      secondaryContactIds: [...new Set(c.secondaryContactIds || [])].sort((a,b)=>a-b)
    }
  };
}

function applyExpectationsPlaceholders(actual, expected) {
  const errors = [];
  const act = actual.contact;
  const exp = (expected && expected.contact) ? expected.contact : {};

  const isPlaceholder = (v) => {
    const s = String(v);
    return (
      s.includes('_ID') ||
      s.includes('all_') ||
      s.includes('PRIMARY_') ||
      s.includes('first_used') ||
      s.includes('second_used')
    );
  };

  if (Array.isArray(exp.emails) && exp.emails.length) {
    const expNonPlaceholders = exp.emails.filter(v => !isPlaceholder(v));
    for (const e of expNonPlaceholders) {
      if (!act.emails.includes(e)) errors.push(`Missing email ${e}`);
    }
  }
  if (Array.isArray(exp.phoneNumbers) && exp.phoneNumbers.length) {
    const expNonPlaceholders = exp.phoneNumbers.filter(v => !isPlaceholder(v));
    for (const p of expNonPlaceholders) {
      if (!act.phoneNumbers.includes(p)) errors.push(`Missing phone ${p}`);
    }
  }

  if (typeof act.primaryContatctId !== 'number') errors.push('primaryContatctId should be a number');
  if (!Array.isArray(act.secondaryContactIds)) errors.push('secondaryContactIds should be an array');

  return errors;
}

async function ensureHealthy() {
  for (let i = 0; i < 20; i++) {
    try {
      const health = await httpRequest('GET', '/health');
      if (health.status === 200) return;
    } catch {}
    await new Promise(r => setTimeout(r, 250));
  }
  throw new Error('Service not healthy');
}

async function runScenario(testItem) {
  // Determine schema: simple vs complex
  if (testItem.request && testItem.expectedResponse) {
    // simple
    const res = await httpRequest('POST', '/identify', testItem.request);
    return { response: res, expected: testItem.expectedResponse };
  }
  if (Array.isArray(testItem.requests) && testItem.expectedFinalResponse) {
    // complex: run sequentially, compare final
    let lastRes = null;
    for (const req of testItem.requests) {
      lastRes = await httpRequest('POST', '/identify', req);
    }
    return { response: lastRes, expected: testItem.expectedFinalResponse };
  }
  throw new Error('Unknown test item schema');
}

async function main() {
  const filePath = process.argv[2] || 'test.json';
  await ensureHealthy();

  const tests = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let passed = 0;
  let index = 0;

  for (const t of tests) {
    index++;
    try {
      await resetDb();
      const { response, expected } = await runScenario(t);
      const norm = normalizeResponse(response.body);
      const errors = applyExpectationsPlaceholders(norm, expected);
      const ok = response.status === 200 && errors.length === 0;
      if (ok) passed++;

      console.log(`\nTest #${index}: ${t.description}`);
      console.log(`Status: ${response.status} -> ${ok ? 'PASS' : 'FAIL'}`);
      if (!ok) {
        console.log('Errors:', errors);
        console.log('Actual:', JSON.stringify(norm, null, 2));
        console.log('Expected (placeholders allowed):', JSON.stringify(expected, null, 2));
      }
    } catch (e) {
      console.log(`\nTest #${index}: ${t.description}`);
      console.log('Status: ERROR');
      console.log('Error:', e.message);
    }
  }

  console.log(`\nSummary: ${passed}/${tests.length} passed from ${filePath}`);
  process.exit(passed === tests.length ? 0 : 1);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
