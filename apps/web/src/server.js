// A small HTTP server for the login prototype.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const auth = require('./auth');
const publicDir = path.join(__dirname, '../public');
const port = Number(process.env.PORT) || 3000;
// A small in-memory limit to slow repeated attempts (resets on server restart).
const attempts = new Map();
function tooManyAttempts(req) {
  const key = req.socket.remoteAddress;
  const now = Date.now();
  let entry = attempts.get(key);
  if (!entry || entry.until < now) entry = { count: 0, until: now + 15 * 60 * 1000 };
  entry.count++;
  attempts.set(key, entry);
  return entry.count > 30;
}


function redirect(res, location) { res.writeHead(303, { Location: location }); res.end(); }
function sendFile(res, filename, type) {
  res.writeHead(200, { 'Content-Type': type, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store' });
  fs.createReadStream(path.join(publicDir, filename)).pipe(res);
}
function showDashboard(res) {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
  // Update the address without another request: embedded browsers may block cookies.
  res.end('<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Dashboard</title></head><body><h1>dashboard</h1><script>history.replaceState(null, "", "/dashboard")</script></body></html>');
}
function sessionFrom(req) {
  const token = (req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith('session='));
  return auth.getSession(token ? token.slice('session='.length) : '');
}
function readForm(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 4096) { reject(new Error('Form too large')); req.destroy(); }
    });
    req.on('end', () => resolve(new URLSearchParams(body)));
    req.on('error', reject);
  });
}
http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (req.method === 'GET' && url.pathname === '/') return sendFile(res, 'index.html', 'text/html; charset=utf-8');
  if (req.method === 'GET' && url.pathname === '/style.css') return sendFile(res, 'style.css', 'text/css; charset=utf-8');
  if (req.method === 'GET' && url.pathname === '/login-background.png') return sendFile(res, 'login-background.png', 'image/png');
  if (req.method === 'GET' && url.pathname === '/dashboard') {
    if (!sessionFrom(req)) return redirect(res, '/?error=' + encodeURIComponent('Your session could not be loaded. Please enable cookies or open the app in a new tab.')); 
    return showDashboard(res);
  }
  if (req.method === 'POST' && ['/login', '/register'].includes(url.pathname)) {
    // Accept only browser forms from this origin, not cross-site requests.
    const origin = req.headers.origin;
    try {
      if (!origin || new URL(origin).host !== req.headers.host || !['http:', 'https:'].includes(new URL(origin).protocol)) {
        res.writeHead(403); return res.end('Forbidden');
      }
    } catch { res.writeHead(403); return res.end('Forbidden'); }
    if (!req.headers['content-type']?.startsWith('application/x-www-form-urlencoded')) {
      res.writeHead(415); return res.end('Unsupported form');
    }
    if (tooManyAttempts(req)) { res.writeHead(429); return res.end('Too many attempts. Please try again later.'); }
    try {
      const form = await readForm(req);
      const name = form.get('name') || '';
      const password = form.get('password') || '';
      if (url.pathname === '/register') {
        const error = auth.createUser(name, password);
        if (error) return redirect(res, '/?mode=register&error=' + encodeURIComponent(error));
      } else if (!auth.checkPassword(name, password)) {
        return redirect(res, '/?error=' + encodeURIComponent('Incorrect username or password.'));
      }
      const token = auth.startSession(name);
      // The preview runs inside a cross-site iframe, which requires SameSite=None
      // and Secure. Plain HTTP on localhost uses Lax instead.
      const https = process.env.NODE_ENV === 'production' || req.headers['x-forwarded-proto']?.split(',')[0].trim() === 'https' || (req.headers.host || '').endsWith('.e2b.app');
      // Partitioned cookies are allowed in embedded previews even when the
      // browser blocks ordinary third-party cookies (CHIPS-capable browsers).
      const cookiePolicy = https ? 'SameSite=None; Secure; Partitioned' : 'SameSite=Lax';
      res.setHeader('Set-Cookie', `session=${token}; HttpOnly; ${cookiePolicy}; Path=/; Max-Age=${auth.SESSION_LIFETIME / 1000}`);
      return showDashboard(res);
    } catch { res.writeHead(400); return res.end('Invalid request'); }
  }
  res.writeHead(404); res.end('Not found');
}).listen(port, '0.0.0.0', () => console.log(`Login app listening on port ${port}`));
