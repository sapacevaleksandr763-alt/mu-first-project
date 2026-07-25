const http = require('http');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const PORT = 3500;
const SITE_ORIGIN = 'http://155.212.208.32';

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function getFilePath(course) {
  const safe = course.replace(/[^a-z0-9_-]/gi, '');
  return path.join(DATA_DIR, safe + '.json');
}

function readJSON(filepath) {
  try { return JSON.parse(fs.readFileSync(filepath, 'utf8')); } catch { return {}; }
}

function sendJSON(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  const url = new URL(req.url, SITE_ORIGIN);

  if (url.pathname === '/api/lessons' && req.method === 'GET') {
    const course = url.searchParams.get('course');
    if (!course) return sendJSON(res, 400, { error: 'missing course' });
    const data = readJSON(getFilePath(course));
    return sendJSON(res, 200, data);
  }

  if (url.pathname === '/api/lessons' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const { course, num, lesson } = JSON.parse(body);
        if (!course || !num) return sendJSON(res, 400, { error: 'missing course or num' });
        const fp = getFilePath(course);
        const data = readJSON(fp);
        if (lesson === null) {
          delete data[num];
        } else {
          data[num] = lesson;
        }
        fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
        return sendJSON(res, 200, { ok: true });
      } catch (e) {
        return sendJSON(res, 500, { error: e.message });
      }
    });
    return;
  }

  sendJSON(res, 404, { error: 'not found' });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('Lessons API running on port ' + PORT);
});
