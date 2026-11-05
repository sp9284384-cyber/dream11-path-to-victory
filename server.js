// server.js - Lightweight local dev server (Zero external dependencies)
// Enables running and testing /api/sports and /api/explain directly on localhost
const http = require('http');
const fs   = require('fs');
const path = require('path');
const url  = require('url');

// Load environment variables from .env.local if present
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const k = trimmed.slice(0, idx).trim();
      const v = trimmed.slice(idx + 1).trim();
      process.env[k] = v;
    }
  }
}

// Default model
process.env.GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";

const sportsHandler  = require('./api/sports.js');
const explainHandler = require('./api/explain.js');

const PORT = process.env.PORT || 3000;

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname  = parsedUrl.pathname;

  // Add Vercel-like helper methods to res
  res.status = function(code) {
    res.statusCode = code;
    return res;
  };
  res.json = function(data) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(data));
    return res;
  };

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  // Parse body for POST requests
  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        req.body = body ? JSON.parse(body) : {};
      } catch (e) {
        req.body = {};
      }
      req.query = parsedUrl.query;
      route(pathname, req, res);
    });
  } else {
    req.query = parsedUrl.query;
    route(pathname, req, res);
  }
});

function route(pathname, req, res) {
  if (pathname === '/api/sports') {
    return sportsHandler(req, res);
  }
  if (pathname === '/api/explain') {
    return explainHandler(req, res);
  }

  // Serve static files
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(__dirname, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js':   'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.css':  'text/css; charset=utf-8',
    '.png':  'image/png',
    '.jpg':  'image/jpeg',
    '.svg':  'image/svg+xml'
  };

  const contentType = mimeTypes[ext] || 'text/plain';
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.statusCode = 500;
      return res.end(`Server Error: ${err.message}`);
    }
    res.statusCode = 200;
    res.setHeader('Content-Type', contentType);
    res.end(content);
  });
}

server.listen(PORT, () => {
  console.log(`\n🚀 Local Dream11 Explainer Server running!`);
  console.log(`👉 Open: http://localhost:${PORT}`);
  console.log(`   (Live SerpAPI & Gemini API endpoints are active)\n`);
});
