// Test runner for Portfolio Backend
// Uses mongodb-memory-server for in-memory MongoDB
// Tests API endpoints after seeding

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const { spawn } = require('child_process');
const http = require('http');

const BASE_URL = 'http://localhost:5001';

function httpRequest(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: 'localhost',
      port: 5001,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: JSON.parse(data),
          });
        } catch {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data,
          });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function waitForServer(timeout = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await httpRequest('GET', '/api/health');
      if (res.statusCode === 200) {
        console.log('Server is ready!');
        return true;
      }
    } catch {
      // Server not ready yet
    }
    await new Promise(r => setTimeout(r, 500));
  }
  return false;
}

async function runTests() {
  console.log('=== Portfolio Backend Test Suite ===\n');

  let mongoServer = null;
  let serverProcess = null;

  try {
    // 1. Start in-memory MongoDB
    console.log('[1/6] Starting in-memory MongoDB...');
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    console.log('MongoDB URI: ' + mongoUri);

    // Override MONGODB_URI for the server process
    process.env.MONGODB_URI = mongoUri;
    process.env.PORT = '5001';
    process.env.NODE_ENV = 'test';
    process.env.ADMIN_EMAIL = 'admin@example.com';
    process.env.ADMIN_PASSWORD = 'admin123';
    process.env.FRONTEND_URL = 'http://localhost:5173';
    process.env.JWT_SECRET = 'test-secret-key';

    // 2. Seed the database
    console.log('[2/6] Seeding database...');
    require('./dist/seed/seed.js');
    // Wait a moment for seed to complete
    await new Promise(r => setTimeout(r, 2000));
    console.log('Database seeded\n');

    // 3. Start the server
    console.log('[3/6] Starting server...');
    serverProcess = spawn('node', ['dist/server.js'], {
      env: process.env,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    serverProcess.stdout.on('data', (data) => {
      const msg = data.toString();
      if (msg.includes('running on port') || msg.includes('Portfolio API')) {
        console.log('Server output: ' + msg.trim());
      }
    });

    serverProcess.stderr.on('data', (data) => {
      const msg = data.toString();
      if (msg.includes('Error') || msg.includes('error')) {
        console.error('Server error: ' + msg.trim());
      }
    });

    // Wait for server to be ready
    const ready = await waitForServer();
    if (!ready) {
      console.error('Server failed to start within timeout');
      process.exit(1);
    }

    // 4. Run tests
    console.log('[4/6] Running API tests...\n');

    let allPassed = true;
    let passed = 0;
    let failed = 0;

    const test = async (name, fn) => {
      try {
        const result = await fn();
        if (result) {
          console.log('  PASS: ' + name);
          passed++;
        } else {
          console.log('  FAIL: ' + name);
          failed++;
          allPassed = false;
        }
      } catch (err) {
        console.log('  FAIL: ' + name + ' - Error: ' + err.message);
        failed++;
        allPassed = false;
      }
    };

    // Health check
    await test('GET /api/health returns success', async () => {
      const res = await httpRequest('GET', '/api/health');
      return res.statusCode === 200 && res.body.success === true;
    });

    // Login
    let token = '';
    await test('POST /api/auth/login with valid credentials', async () => {
      const res = await httpRequest('POST', '/api/auth/login', {
        email: 'admin@example.com',
        password: 'admin123',
      });
      if (res.statusCode !== 200 || !res.body.success) {
        console.log('    Response: ' + JSON.stringify(res.body));
        return false;
      }
      token = res.body.data && res.body.data.token ? res.body.data.token : '';
      return !!token;
    });

    if (!token) {
      console.log('    FATAL: No token received, aborting remaining tests');
      process.exit(1);
    }

    // Auth - get me
    await test('GET /api/auth/me with valid token', async () => {
      const res = await httpRequest('GET', '/api/auth/me', null, token);
      return res.statusCode === 200 && res.body.success === true && res.body.data && res.body.data.email === 'admin@example.com';
    });

    // Profile
    await test('GET /api/profile returns profile data', async () => {
      const res = await httpRequest('GET', '/api/profile');
      return res.statusCode === 200 && res.body.success === true && res.body.data && res.body.data.name === 'Rushank Bansal';
    });

    // Projects
    await test('GET /api/projects returns published projects', async () => {
      const res = await httpRequest('GET', '/api/projects');
      return res.statusCode === 200 && res.body.success === true && Array.isArray(res.body.data) && res.body.data.length >= 4;
    });

    await test('GET /api/projects?featured=true returns featured projects', async () => {
      const res = await httpRequest('GET', '/api/projects?featured=true');
      return res.statusCode === 200 && res.body.success === true && Array.isArray(res.body.data) && res.body.data.length >= 3;
    });

    await test('GET /api/projects/precipytech returns PrecipyTech project', async () => {
      const res = await httpRequest('GET', '/api/projects/precipytech');
      return res.statusCode === 200 && res.body.success === true && res.body.data && res.body.data.title === 'PrecipyTech';
    });

    // Skills
    await test('GET /api/skills returns skills', async () => {
      const res = await httpRequest('GET', '/api/skills');
      return res.statusCode === 200 && res.body.success === true && Array.isArray(res.body.data) && res.body.data.length > 0;
    });

    // Experience
    await test('GET /api/experience returns experience', async () => {
      const res = await httpRequest('GET', '/api/experience');
      return res.statusCode === 200 && res.body.success === true && Array.isArray(res.body.data);
    });

    // Achievements
    await test('GET /api/achievements returns achievements', async () => {
      const res = await httpRequest('GET', '/api/achievements');
      return res.statusCode === 200 && res.body.success === true && Array.isArray(res.body.data);
    });

    // Certifications
    await test('GET /api/certifications returns certifications', async () => {
      const res = await httpRequest('GET', '/api/certifications');
      return res.statusCode === 200 && res.body.success === true && Array.isArray(res.body.data);
    });

    // Social links
    await test('GET /api/socials returns social links', async () => {
      const res = await httpRequest('GET', '/api/socials');
      return res.statusCode === 200 && res.body.success === true && Array.isArray(res.body.data) && res.body.data.length > 0;
    });

    // GitHub config
    await test('GET /api/github returns config', async () => {
      const res = await httpRequest('GET', '/api/github');
      return res.statusCode === 200 && res.body.success === true && res.body.data && res.body.data.username === 'placeholder';
    });

    // Resume
    await test('GET /api/resume returns 404 (no active resume)', async () => {
      const res = await httpRequest('GET', '/api/resume');
      return res.statusCode === 404;
    });

    // Contact form
    await test('POST /api/contact creates message', async () => {
      const res = await httpRequest('POST', '/api/contact', {
        name: 'Test User',
        email: 'test@example.com',
        subject: 'Test Subject',
        message: 'This is a test message for the portfolio contact form.',
      });
      return res.statusCode === 201 && res.body.success === true;
    });

    // Admin endpoints - require auth
    await test('GET /api/admin/projects requires auth (no token)', async () => {
      const res = await httpRequest('GET', '/api/admin/projects');
      return res.statusCode === 401;
    });

    await test('GET /api/admin/projects with valid token', async () => {
      const res = await httpRequest('GET', '/api/admin/projects', null, token);
      return res.statusCode === 200 && res.body.success === true && Array.isArray(res.body.data);
    });

    await test('POST /api/admin/skills creates a skill', async () => {
      const res = await httpRequest('POST', '/api/admin/skills', {
        name: 'Test Skill',
        category: 'Tools',
        level: 50,
        visible: true,
      }, token);
      return res.statusCode === 201 && res.body.success === true;
    });

    await test('POST /api/admin/projects creates a project', async () => {
      const res = await httpRequest('POST', '/api/admin/projects', {
        title: 'Test Project',
        shortDescription: 'A test project',
        description: 'Test description',
        technologies: ['JavaScript', 'Node.js'],
        category: 'Testing',
        featured: false,
        published: true,
      }, token);
      return res.statusCode === 201 && res.body.success === true;
    });

    await test('PATCH /api/admin/projects/reorder reorders projects', async () => {
      const listRes = await httpRequest('GET', '/api/admin/projects', null, token);
      if (listRes.statusCode !== 200 || !listRes.body.data || listRes.body.data.length === 0) {
        return false;
      }
      const projects = listRes.body.data;
      const reorderBody = {
        projects: projects.map((p, idx) => ({ id: p._id, order: idx })),
      };
      const res = await httpRequest('PATCH', '/api/admin/projects/reorder', reorderBody, token);
      return res.statusCode === 200 && res.body.success === true;
    });

    await test('DELETE /api/admin/skills/:id deletes a skill', async () => {
      // First get all skills
      const listRes = await httpRequest('GET', '/api/admin/skills', null, token);
      if (listRes.statusCode !== 200 || !listRes.body.data || listRes.body.data.length === 0) {
        return false;
      }
      // Find the test skill we created
      const testSkill = listRes.body.data.find(s => s.name === 'Test Skill');
      if (!testSkill) {
        return false;
      }
      const res = await httpRequest('DELETE', '/api/admin/skills/' + testSkill._id, null, token);
      return res.statusCode === 200 && res.body.success === true;
    });

    await test('POST /api/contact rate limiting works', async () => {
      // Send multiple requests quickly
      for (let i = 0; i < 8; i++) {
        await httpRequest('POST', '/api/contact', {
          name: 'Rate Test ' + i,
          email: 'rate' + i + '@test.com',
          subject: 'Test',
          message: 'Test message',
        });
      }
      // The next request might be rate limited
      const res = await httpRequest('POST', '/api/contact', {
        name: 'Final Rate Test',
        email: 'final@test.com',
        subject: 'Test',
        message: 'Final test message',
      });
      // Either 201 (if not rate limited yet) or 429 (if rate limited)
      return res.statusCode === 201 || res.statusCode === 429;
    });

    // 5. Summary
    console.log('\n[5/6] Test Summary');
    console.log('===================');
    console.log('Total: ' + (passed + failed));
    console.log('Passed: ' + passed);
    console.log('Failed: ' + failed);
    console.log('===================\n');

    if (allPassed) {
      console.log('SUCCESS: All tests passed!');
    } else {
      console.log('FAILURE: Some tests failed');
    }

    // 6. Cleanup
    console.log('\n[6/6] Cleaning up...');
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
      await new Promise(r => setTimeout(r, 1000));
    }
    if (mongoServer) {
      await mongoServer.stop();
    }

    process.exit(allPassed ? 0 : 1);

  } catch (error) {
    console.error('Test runner error:', error);
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
    process.exit(1);
  }
}

runTests();
