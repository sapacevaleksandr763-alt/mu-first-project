const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const Busboy = require('busboy');

const DATA_DIR = path.join(__dirname, 'data');
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'courses');
const PORT = 3500;
const SITE_ORIGIN = 'http://155.212.208.32';
const MAX_FILE_SIZE = 1024 * 1024 * 1024;

[DATA_DIR, UPLOAD_DIR].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

function getFilePath(course) {
  const safe = course.replace(/[^a-z0-9_-]/gi, '');
  return path.join(DATA_DIR, safe + '.json');
}

function readJSON(filepath) {
  try { return JSON.parse(fs.readFileSync(filepath, 'utf8')); } catch { return {}; }
}

function sendJSON(res, code, obj) {
  if (res.headersSent) return;
  const body = JSON.stringify(obj);
  res.writeHead(code, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(body);
}

function convertToMp4(inputPath, cb) {
  const ext = path.extname(inputPath).toLowerCase();
  if (ext === '.mp4') return cb(null, inputPath);
  const outPath = inputPath.replace(/\.[^.]+$/, '.mp4');
  execFile('ffmpeg', [
    '-i', inputPath, '-c:v', 'libx264', '-c:a', 'aac',
    '-preset', 'fast', '-movflags', '+faststart', '-y', outPath
  ], { timeout: 600000 }, (err) => {
    if (err) return cb(err);
    fs.unlink(inputPath, () => {});
    cb(null, outPath);
  });
}

const crypto = require('crypto');
const LESSON_IMG_DIR = path.join(__dirname, '..', 'uploads', 'lesson-images');
if (!fs.existsSync(LESSON_IMG_DIR)) fs.mkdirSync(LESSON_IMG_DIR, { recursive: true });

function extractBase64Images(body, course, num) {
  if (!body || !body.includes('data:image/')) return body;
  return body.replace(/data:image\/([^;]+);base64,([A-Za-z0-9+\/=]+)/g, (match, ext, b64) => {
    try {
      const hash = crypto.createHash('md5').update(b64.slice(0, 100)).digest('hex').slice(0, 12);
      const imgExt = ext.replace('jpeg', 'jpg');
      const imgName = course + '-' + num + '-' + hash + '.' + imgExt;
      const imgPath = path.join(LESSON_IMG_DIR, imgName);
      fs.writeFileSync(imgPath, Buffer.from(b64, 'base64'));
      return '/uploads/lesson-images/' + imgName;
    } catch (e) {
      return match;
    }
  });
}

function handleUpload(req, res) {
  const fields = {};
  let savedPath = null;
  let origFilename = '';
  let fileSize = 0;
  let aborted = false;

  const bb = Busboy({
    headers: req.headers,
    limits: { fileSize: MAX_FILE_SIZE, files: 1 }
  });

  bb.on('field', (name, val) => {
    fields[name] = val;
  });

  bb.on('file', (name, stream, info) => {
    origFilename = info.filename || 'file.bin';
    const tmpName = 'tmp-' + Date.now() + '-' + Math.random().toString(36).slice(2);
    const origExt = path.extname(origFilename).toLowerCase() || '.bin';
    savedPath = path.join(UPLOAD_DIR, tmpName + origExt);

    const ws = fs.createWriteStream(savedPath);

    stream.on('data', (chunk) => {
      fileSize += chunk.length;
    });

    stream.on('limit', () => {
      aborted = true;
      ws.destroy();
      fs.unlink(savedPath, () => {});
      sendJSON(res, 413, { error: 'File too large (max 500MB)' });
    });

    stream.pipe(ws);

    ws.on('error', (err) => {
      aborted = true;
      console.error('Write error:', err.message);
      sendJSON(res, 500, { error: 'Write error' });
    });
  });

  bb.on('finish', () => {
    if (aborted) return;

    const course = fields.course || '';
    const num = fields.num || '';
    const type = fields.type || '';

    if (!course || !num || !savedPath) {
      if (savedPath) fs.unlink(savedPath, () => {});
      return sendJSON(res, 400, { error: 'missing course, num, or file' });
    }

    const safeCourse = course.replace(/[^a-z0-9_-]/gi, '');
    const safeNum = String(num).replace(/[^0-9]/g, '');
    const courseDir = path.join(UPLOAD_DIR, safeCourse);
    if (!fs.existsSync(courseDir)) fs.mkdirSync(courseDir, { recursive: true });

    const origExt = path.extname(origFilename).toLowerCase() || '.bin';
    const baseName = type + '-' + safeNum + '-' + Date.now();
    const finalPath = path.join(courseDir, baseName + origExt);

    fs.rename(savedPath, finalPath, (renameErr) => {
      if (renameErr) {
        fs.unlink(savedPath, () => {});
        return sendJSON(res, 500, { error: 'Move error' });
      }

      const videoExts = ['.avi', '.mov', '.mkv', '.wmv', '.flv', '.webm', '.mp4'];
      if (type === 'video' && videoExts.includes(origExt)) {
        if (origExt === '.mp4') {
          const publicUrl = '/uploads/courses/' + safeCourse + '/' + baseName + origExt;
          return sendJSON(res, 200, { ok: true, url: publicUrl });
        }
        const pendingUrl = '/uploads/courses/' + safeCourse + '/' + baseName + '.mp4';
        sendJSON(res, 200, { ok: true, url: pendingUrl, converting: true });
        convertToMp4(finalPath, (err, mp4Path) => {
          if (err) {
            console.error('Conversion error:', err.message);
            return;
          }
          const finalUrl = '/uploads/courses/' + safeCourse + '/' + path.basename(mp4Path);
          const fp = getFilePath(course);
          const data = readJSON(fp);
          if (data[num]) {
            data[num].videoUrl = finalUrl;
            fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
          }
          console.log('Converted:', finalUrl);
        });
        return;
      }

      const publicUrl = '/uploads/courses/' + safeCourse + '/' + baseName + origExt;
      return sendJSON(res, 200, { ok: true, url: publicUrl });
    });
  });

  bb.on('error', (err) => {
    aborted = true;
    console.error('Busboy error:', err.message);
    if (savedPath) fs.unlink(savedPath, () => {});
    sendJSON(res, 500, { error: 'Upload error' });
  });

  req.pipe(bb);
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
          if (lesson.body) {
            lesson.body = extractBase64Images(lesson.body, course, num);
          }
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

  if (url.pathname === '/api/upload' && req.method === 'POST') {
    return handleUpload(req, res);
  }

  sendJSON(res, 404, { error: 'not found' });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('Lessons API + Streaming Upload on port ' + PORT);
});
