/*  Lesson Editor — серверное хранение + загрузка файлов + localStorage-бэкап
    Подключается на каждой course-*.html
    Атрибут data-course="drevnerusskiy" на <body> определяет курс
*/
(function(){
  var COURSE = document.body.getAttribute('data-course') || 'default';
  var API = '/api/lessons';
  var UPLOAD_API = '/api/upload';
  var ADMIN_KEY = 'nasledie_admin';
  var LOCAL_KEY = 'nasledie_lessons_' + COURSE;
  var ACCESS_KEY = 'nasledie_access_' + COURSE;
  var isAdmin = localStorage.getItem(ADMIN_KEY) === '1';
  var lessonsCache = {};

  var FREE_LESSONS = 4;
  var LESSON_PRICE = 100;
  var FREE_COURSES = ['rita'];

  function isPaidLesson(num){
    if(FREE_COURSES.indexOf(COURSE) !== -1) return false;
    return parseInt(num) > FREE_LESSONS;
  }

  function getAccessMap(){
    try { return JSON.parse(localStorage.getItem(ACCESS_KEY)) || {}; } catch(e){ return {}; }
  }
  function saveAccess(num){
    var map = getAccessMap();
    map[String(num)] = true;
    try { localStorage.setItem(ACCESS_KEY, JSON.stringify(map)); } catch(e){}
  }
  function hasAccess(num){
    if(isAdmin) return true;
    if(!isPaidLesson(num)) return true;
    return getAccessMap()[String(num)] === true;
  }

  function localSave(data){
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(data)); } catch(e){}
  }
  function localLoad(){
    try { return JSON.parse(localStorage.getItem(LOCAL_KEY)) || {}; } catch(e){ return {}; }
  }

  function mergeLessons(server, local){
    var merged = {};
    var keys = {};
    Object.keys(server).forEach(function(k){ keys[k] = true; });
    Object.keys(local).forEach(function(k){ keys[k] = true; });
    Object.keys(keys).forEach(function(k){
      merged[k] = server[k] || local[k];
    });
    return merged;
  }

  function loadLessonsFromServer(cb){
    var local = localLoad();
    if(Object.keys(local).length > 0){
      lessonsCache = local;
      updateListStatuses();
    }
    var xhr = new XMLHttpRequest();
    xhr.open('GET', API + '?course=' + encodeURIComponent(COURSE) + '&t=' + Date.now(), true);
    xhr.timeout = 30000;
    xhr.onload = function(){
      if(xhr.status === 200){
        try {
          var serverData = JSON.parse(xhr.responseText);
          lessonsCache = mergeLessons(serverData, local);
          localSave(lessonsCache);
          var localOnlyKeys = Object.keys(local).filter(function(k){ return !serverData[k]; });
          if(localOnlyKeys.length > 0){
            localOnlyKeys.forEach(function(k){ syncToServer(k, local[k]); });
          }
        } catch(e){ lessonsCache = local; }
      } else { lessonsCache = local; }
      if(cb) cb(lessonsCache);
    };
    xhr.onerror = function(){ lessonsCache = local; if(cb) cb(lessonsCache); };
    xhr.ontimeout = function(){ lessonsCache = local; if(cb) cb(lessonsCache); };
    xhr.send();
  }

  function syncToServer(num, lesson){
    var xhr = new XMLHttpRequest();
    xhr.open('POST', API, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({ course: COURSE, num: num, lesson: lesson }));
  }

  function uploadBase64Image(num, dataUri, cb){
    var m = dataUri.match(/^data:image\/([^;]+);base64,(.+)$/);
    if(!m) return cb(dataUri);
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload-base64', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.timeout = 60000;
    xhr.onload = function(){
      if(xhr.status === 200){
        try { var r = JSON.parse(xhr.responseText); cb(r.url || dataUri); } catch(e){ cb(dataUri); }
      } else { cb(dataUri); }
    };
    xhr.onerror = function(){ cb(dataUri); };
    xhr.ontimeout = function(){ cb(dataUri); };
    xhr.send(JSON.stringify({ course: COURSE, num: String(num), data: m[2], ext: m[1] }));
  }

  function extractImages(html, num, done){
    var re = /data:image\/[^;]+;base64,[A-Za-z0-9+\/=]+/g;
    var matches = html.match(re);
    if(!matches || matches.length === 0) return done(html);
    var pending = matches.length;
    var map = {};
    matches.forEach(function(uri){
      if(map[uri] !== undefined){ pending--; if(!pending) finish(); return; }
      map[uri] = null;
      uploadBase64Image(num, uri, function(url){
        map[uri] = url;
        pending--;
        if(!pending) finish();
      });
    });
    function finish(){
      var result = html;
      Object.keys(map).forEach(function(orig){
        if(map[orig] && map[orig] !== orig){
          while(result.indexOf(orig) !== -1) result = result.replace(orig, map[orig]);
        }
      });
      done(result);
    }
  }

  function saveLessonToServer(num, lesson, cb){
    if(lesson === null){ delete lessonsCache[num]; }
    else { lessonsCache[num] = lesson; }
    localSave(lessonsCache);

    function doSave(lessonData){
      var payload = JSON.stringify({ course: COURSE, num: String(num), lesson: lessonData });
      console.log('Saving lesson', num, 'payload size:', payload.length, 'bytes');

      var xhr = new XMLHttpRequest();
      xhr.open('POST', API, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.timeout = 120000;
      xhr.onload = function(){
        if(xhr.status === 200){
          showNotice('Урок ' + num + ' сохранён на сервере', 'success');
        } else {
          var errMsg = '';
          try { errMsg = JSON.parse(xhr.responseText).error; } catch(e){ errMsg = xhr.statusText; }
          showNotice('Ошибка сервера ' + xhr.status + ': ' + errMsg, 'warn');
          console.error('Save error:', xhr.status, xhr.responseText);
        }
        if(cb) cb();
      };
      xhr.onerror = function(){
        showNotice('Нет связи — сохранено локально', 'warn');
        console.error('Save XHR error');
        if(cb) cb();
      };
      xhr.ontimeout = function(){
        showNotice('Сервер не ответил — сохранено локально', 'warn');
        console.error('Save timeout, payload was', payload.length, 'bytes');
        if(cb) cb();
      };
      xhr.send(payload);
    }

    if(lesson && lesson.body && lesson.body.indexOf('data:image/') !== -1){
      extractImages(lesson.body, num, function(cleanBody){
        lesson.body = cleanBody;
        lessonsCache[num] = lesson;
        localSave(lessonsCache);
        doSave(lesson);
      });
    } else {
      doSave(lesson);
    }
  }

  function uploadFile(num, file, type, cb){
    var fd = new FormData();
    fd.append('course', COURSE);
    fd.append('num', String(num));
    fd.append('type', type);
    fd.append('file', file);

    var xhr = new XMLHttpRequest();
    xhr.open('POST', UPLOAD_API, true);
    xhr.timeout = 300000;

    xhr.upload.onprogress = function(e){
      if(e.lengthComputable){
        var pct = Math.round(e.loaded / e.total * 100);
        var bar = document.getElementById('uploadProgress');
        if(bar) bar.textContent = type === 'video' ? '🎬 Загрузка: ' + pct + '%' : '📄 Загрузка: ' + pct + '%';
      }
    };

    xhr.onload = function(){
      try {
        var resp = JSON.parse(xhr.responseText);
        if(resp.ok || resp.converting){
          if(resp.converting){
            showNotice('Видео загружено! Конвертация в MP4 идёт на сервере...', 'success');
          }
          cb(null, resp);
        } else {
          cb(resp.error || 'Upload error');
        }
      } catch(e){ cb('Parse error'); }
    };
    xhr.onerror = function(){ cb('Нет связи с сервером'); };
    xhr.ontimeout = function(){ cb('Таймаут загрузки'); };
    xhr.send(fd);
  }

  function showNotice(text, type){
    var existing = document.getElementById('lessonNotice');
    if(existing) existing.remove();
    var div = document.createElement('div');
    div.id = 'lessonNotice';
    var bg = type === 'success' ? 'rgba(46,125,50,0.95)' : 'rgba(180,120,20,0.95)';
    div.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);padding:12px 24px;border-radius:8px;font-size:0.88rem;color:#fff;z-index:9999;font-family:var(--font-body);box-shadow:0 4px 20px rgba(0,0,0,0.3);max-width:90vw;text-align:center;background:' + bg;
    div.textContent = text;
    document.body.appendChild(div);
    setTimeout(function(){ div.style.opacity = '0'; div.style.transition = 'opacity 0.5s'; }, 4000);
    setTimeout(function(){ div.remove(); }, 4500);
  }

  function loadLessons(){ return lessonsCache; }

  function updateListStatuses(){
    var data = loadLessons();
    var items = document.querySelectorAll('.lesson-item');
    items.forEach(function(item){
      var num = item.querySelector('.lesson-item__num').textContent.trim();
      var status = item.querySelector('.lesson-item__status');
      var d = data[num];
      if(d && d.title){
        status.textContent = d.title;
        status.style.opacity = '1';
        status.style.color = 'var(--gold)';
      }
      if(isPaidLesson(num)){
        var arrow = item.querySelector('.lesson-item__arrow');
        if(hasAccess(num)){
          if(!item.querySelector('.lesson-item__unlocked')){
            var tag = document.createElement('span');
            tag.className = 'lesson-item__unlocked';
            tag.style.cssText = 'font-size:0.68rem;color:var(--green,#3a7d44);opacity:0.7;margin-left:auto;white-space:nowrap';
            tag.textContent = '✓ Доступ открыт';
            if(arrow) item.insertBefore(tag, arrow);
            else item.appendChild(tag);
          }
        } else {
          if(!item.querySelector('.lesson-item__price')){
            var price = document.createElement('span');
            price.className = 'lesson-item__price';
            price.style.cssText = 'font-size:0.78rem;color:var(--gold);font-weight:600;margin-left:auto;white-space:nowrap';
            price.textContent = '🔒 ' + LESSON_PRICE + ' ₽';
            if(arrow) item.insertBefore(price, arrow);
            else item.appendChild(price);
          }
        }
      }
    });
  }

  function buildPaywall(num){
    var ce = document.getElementById('lmContent');
    var title = document.getElementById('lmTitle');
    var tgBlock = document.querySelector('.lesson-modal__text');
    var tgBtn = document.querySelector('.lesson-modal__box > .btn--primary');

    title.textContent = 'Урок ' + num + ' · Платный доступ';
    if(tgBlock) tgBlock.style.display = 'none';
    if(tgBtn) tgBtn.style.display = 'none';

    ce.innerHTML = '<div style="text-align:center;padding:24px 0">'
      + '<div style="font-size:2.5rem;margin-bottom:12px">🔒</div>'
      + '<div style="font-family:var(--font-head);font-size:1.1rem;color:var(--text);margin-bottom:8px">Платный урок</div>'
      + '<div style="font-size:0.9rem;color:var(--text-muted);margin-bottom:20px;line-height:1.7">'
      + 'Для доступа к этому уроку оплатите <strong style="color:var(--gold)">' + LESSON_PRICE + ' ₽</strong><br>'
      + 'и введите полученный код ниже.'
      + '</div>'
      + '<div style="max-width:320px;margin:0 auto">'
      + '<input id="payCodeInput" placeholder="Введите код доступа" '
      + 'style="width:100%;padding:12px 16px;border:2px solid var(--border);border-radius:8px;font-size:1rem;font-family:inherit;text-align:center;letter-spacing:0.15em;text-transform:uppercase;background:var(--bg-2);color:var(--text);box-sizing:border-box;margin-bottom:10px">'
      + '<button id="payCodeBtn" style="width:100%;padding:12px;border:none;border-radius:8px;background:linear-gradient(135deg,var(--gold),var(--gold-dark));color:#fff;font-family:var(--font-head);font-size:0.9rem;cursor:pointer;letter-spacing:0.05em;transition:opacity 0.2s">'
      + 'Активировать доступ</button>'
      + '<div id="payCodeError" style="font-size:0.8rem;color:#c44;margin-top:8px;display:none"></div>'
      + '</div>'
      + '<div style="margin-top:24px;padding:16px;background:var(--bg-2);border:1px solid var(--border);border-radius:10px;font-size:0.82rem;color:var(--text-muted);line-height:1.8">'
      + '<div style="font-family:var(--font-head);font-size:0.75rem;color:var(--gold);margin-bottom:6px;letter-spacing:0.08em">Как оплатить:</div>'
      + '1. Переведите <strong style="color:var(--text)">' + LESSON_PRICE + ' ₽</strong> на карту:<br>'
      + '<span style="font-family:monospace;font-size:1rem;color:var(--text);letter-spacing:0.12em;font-weight:600">5469 9801 5259 1729</span><br>'
      + '2. Напишите в Telegram: <a href="https://t.me/nasledieariev" target="_blank" style="color:var(--gold)">@nasledieariev</a><br>'
      + '3. Получите код и введите его выше'
      + '</div>'
      + '</div>';
    ce.classList.add('has-content');

    document.getElementById('payCodeBtn').onclick = function(){
      var code = document.getElementById('payCodeInput').value.trim();
      if(!code){ document.getElementById('payCodeError').textContent = 'Введите код'; document.getElementById('payCodeError').style.display = 'block'; return; }
      var btn = document.getElementById('payCodeBtn');
      btn.textContent = 'Проверка...';
      btn.disabled = true;
      var xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/lesson-redeem', true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.timeout = 10000;
      xhr.onload = function(){
        try {
          var resp = JSON.parse(xhr.responseText);
          if(resp.ok){
            saveAccess(num);
            showNotice('Доступ открыт! Урок ' + num + ' доступен навсегда.', 'success');
            closeLesson();
            updateListStatuses();
            setTimeout(function(){ openLesson(parseInt(num)); }, 300);
          } else {
            document.getElementById('payCodeError').textContent = resp.error || 'Ошибка';
            document.getElementById('payCodeError').style.display = 'block';
            btn.textContent = 'Активировать доступ';
            btn.disabled = false;
          }
        } catch(e){
          document.getElementById('payCodeError').textContent = 'Ошибка связи';
          document.getElementById('payCodeError').style.display = 'block';
          btn.textContent = 'Активировать доступ';
          btn.disabled = false;
        }
      };
      xhr.onerror = function(){
        document.getElementById('payCodeError').textContent = 'Нет связи с сервером';
        document.getElementById('payCodeError').style.display = 'block';
        btn.textContent = 'Активировать доступ';
        btn.disabled = false;
      };
      xhr.send(JSON.stringify({ code: code }));
    };

    document.getElementById('payCodeInput').addEventListener('keydown', function(e){
      if(e.key === 'Enter') document.getElementById('payCodeBtn').click();
    });
  }

  function buildModalContent(num){
    if(isPaidLesson(num) && !hasAccess(num)){
      buildPaywall(num);
      var oldBar = document.getElementById('adminBar');
      if(oldBar) oldBar.remove();
      if(isAdmin){
        var bar = document.createElement('div');
        bar.id = 'adminBar';
        bar.style.cssText = 'margin-top:20px;padding-top:16px;border-top:1px dashed var(--gold);text-align:center';
        bar.innerHTML = '<button onclick="window.__editLesson('+num+')" class="btn btn--ghost" style="font-size:0.8rem">✏️ Редактировать урок</button>'
          + ' <button onclick="window.__genLessonCodes('+num+')" class="btn btn--ghost" style="font-size:0.8rem;margin-left:8px">🎟️ Коды доступа</button>';
        document.querySelector('.lesson-modal__box').appendChild(bar);
      }
      return;
    }

    var data = loadLessons();
    var d = data[num];
    var ce = document.getElementById('lmContent');
    var title = document.getElementById('lmTitle');
    var tgBlock = document.querySelector('.lesson-modal__text');
    var tgBtn = document.querySelector('.lesson-modal__box > .btn--primary');

    if(d && (d.body || d.title)){
      title.textContent = d.title || ('Урок ' + num);
      var html = '';
      if(d.body) html += '<div class="lesson-body">' + d.body + '</div>';
      if(d.videoUrl) {
        html += '<div class="lesson-video">'
          + '<div class="lesson-video__label">🎬 Видеоурок</div>'
          + '<video controls preload="metadata" playsinline style="display:block;width:100%;background:#000;position:relative;z-index:1">'
          + '<source src="'+escHtml(d.videoUrl)+'" type="video/mp4">'
          + 'Ваш браузер не поддерживает видео.'
          + '</video>'
          + '</div>';
      }
      if(d.videoEmbed) {
        html += '<div class="lesson-video">'
          + '<div class="lesson-video__label">🎬 Видеоурок</div>'
          + '<div class="lesson-video__embed"><iframe src="'+extractYoutubeEmbed(d.videoEmbed)+'" allowfullscreen allow="fullscreen"></iframe></div>'
          + '</div>';
      }
      if(d.pdfUrl) html += '<a href="'+escHtml(d.pdfUrl)+'" target="_blank" class="pdf-link">📄 Скачать PDF-материал</a>';
      if(d.pdfFiles && d.pdfFiles.length){
        d.pdfFiles.forEach(function(f){
          html += '<a href="'+escHtml(f.url)+'" target="_blank" class="pdf-link">📄 '+escHtml(f.name)+'</a>';
        });
      }
      ce.innerHTML = html;
      ce.classList.add('has-content');
      tgBlock.style.display = 'none';
      if(tgBtn) tgBtn.style.display = 'none';
    } else {
      title.textContent = 'Урок ' + num;
      ce.innerHTML = ''; ce.classList.remove('has-content');
      tgBlock.style.display = '';
      if(tgBtn) tgBtn.style.display = '';
    }

    var oldBar = document.getElementById('adminBar');
    if(oldBar) oldBar.remove();

    if(isAdmin){
      var bar = document.createElement('div');
      bar.id = 'adminBar';
      bar.style.cssText = 'margin-top:20px;padding-top:16px;border-top:1px dashed var(--gold);text-align:center';
      var btns = '<button onclick="window.__editLesson('+num+')" class="btn btn--ghost" style="font-size:0.8rem">✏️ Редактировать урок</button>';
      if(isPaidLesson(num)){
        btns += ' <button onclick="window.__genLessonCodes('+num+')" class="btn btn--ghost" style="font-size:0.8rem;margin-left:8px">🎟️ Коды доступа</button>';
      }
      bar.innerHTML = btns;
      document.querySelector('.lesson-modal__box').appendChild(bar);
    }
  }

  window.__genLessonCodes = function(num){
    var box = document.querySelector('.lesson-modal__box');
    box.innerHTML = '<button class="lesson-modal__close" onclick="closeLesson()">✕</button>'
      + '<div style="text-align:left;padding:4px">'
      + '<h3 style="font-family:var(--font-head);color:var(--gold);margin-bottom:16px">🎟️ Коды доступа — Урок ' + num + '</h3>'
      + '<div style="display:flex;gap:10px;align-items:center;margin-bottom:16px">'
      + '<label style="font-size:0.85rem;color:var(--text)">Количество кодов:</label>'
      + '<input id="codeCount" type="number" value="5" min="1" max="100" style="width:80px;padding:8px;border:1px solid var(--border);border-radius:6px;font-size:0.9rem;background:var(--bg-2);color:var(--text)">'
      + '<button id="genCodesBtn" class="btn btn--primary" style="font-size:0.82rem">Сгенерировать</button>'
      + '</div>'
      + '<div id="codesResult" style="font-size:0.82rem;color:var(--text-muted)">Загрузка существующих кодов...</div>'
      + '<div style="margin-top:16px"><button onclick="closeLesson();openLesson('+num+')" class="btn btn--ghost" style="font-size:0.8rem">← Назад к уроку</button></div>'
      + '</div>';

    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/api/lesson-codes?course=' + encodeURIComponent(COURSE) + '&lessonNum=' + num, true);
    xhr.onload = function(){
      try {
        var list = JSON.parse(xhr.responseText);
        renderCodesList(list);
      } catch(e){ document.getElementById('codesResult').textContent = 'Ошибка загрузки'; }
    };
    xhr.send();

    document.getElementById('genCodesBtn').onclick = function(){
      var count = parseInt(document.getElementById('codeCount').value) || 5;
      var btn = document.getElementById('genCodesBtn');
      btn.textContent = 'Генерация...';
      btn.disabled = true;
      var xhr2 = new XMLHttpRequest();
      xhr2.open('POST', '/api/lesson-codes', true);
      xhr2.setRequestHeader('Content-Type', 'application/json');
      xhr2.onload = function(){
        btn.textContent = 'Сгенерировать';
        btn.disabled = false;
        try {
          var resp = JSON.parse(xhr2.responseText);
          if(resp.ok){
            showNotice('Сгенерировано ' + resp.codes.length + ' кодов', 'success');
            var xhr3 = new XMLHttpRequest();
            xhr3.open('GET', '/api/lesson-codes?course=' + encodeURIComponent(COURSE) + '&lessonNum=' + num, true);
            xhr3.onload = function(){
              try { renderCodesList(JSON.parse(xhr3.responseText)); } catch(e){}
            };
            xhr3.send();
          }
        } catch(e){}
      };
      xhr2.send(JSON.stringify({ course: COURSE, lessonNum: String(num), count: count }));
    };
  };

  function renderCodesList(list){
    var res = document.getElementById('codesResult');
    if(!list.length){ res.innerHTML = '<div style="padding:12px;text-align:center;color:var(--text-muted)">Кодов пока нет</div>'; return; }
    var unused = list.filter(function(c){ return !c.used; });
    var used = list.filter(function(c){ return c.used; });
    var html = '<div style="margin-bottom:8px;font-size:0.78rem;color:var(--text-muted)">Всего: ' + list.length + ' · Свободных: ' + unused.length + ' · Использованных: ' + used.length + '</div>';
    if(unused.length){
      html += '<div style="background:var(--bg-2);border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:8px">';
      html += '<div style="font-size:0.75rem;color:var(--gold);margin-bottom:6px;font-weight:600">Свободные коды (можно копировать):</div>';
      html += '<div style="font-family:monospace;font-size:0.85rem;line-height:2;word-break:break-all;user-select:all">';
      unused.forEach(function(c){ html += '<span style="display:inline-block;padding:2px 8px;background:rgba(46,125,50,0.1);border:1px solid rgba(46,125,50,0.2);border-radius:4px;margin:2px">' + c.code + '</span> '; });
      html += '</div></div>';
    }
    if(used.length){
      html += '<details style="margin-top:8px"><summary style="font-size:0.75rem;color:var(--text-muted);cursor:pointer">Использованные (' + used.length + ')</summary>';
      html += '<div style="margin-top:6px;font-family:monospace;font-size:0.78rem;line-height:1.8;color:var(--text-muted)">';
      used.forEach(function(c){ html += '<span style="text-decoration:line-through;opacity:0.5">' + c.code + '</span> '; });
      html += '</div></details>';
    }
    res.innerHTML = html;
  }

  function extractYoutubeEmbed(val){
    if(val.indexOf('<iframe') !== -1){
      var m = val.match(/src="([^"]+)"/);
      return m ? m[1] : '';
    }
    var ym = val.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/);
    if(ym) return 'https://www.youtube.com/embed/' + ym[1];
    return val;
  }

  function escHtml(s){
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function formatFileSize(bytes){
    if(bytes < 1024) return bytes + ' B';
    if(bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    if(bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
    return (bytes / 1073741824).toFixed(2) + ' GB';
  }

  window.__editLesson = function(num){
    var data = loadLessons();
    var d = data[num] || {};
    var box = document.querySelector('.lesson-modal__box');

    var videoInfo = '';
    if(d.videoUrl) videoInfo = '<div id="edVideoPreview" style="margin-bottom:8px;padding:8px 12px;background:rgba(46,125,50,0.1);border:1px solid rgba(46,125,50,0.3);border-radius:6px;font-size:0.8rem;color:var(--text)">🎬 Прикреплено: <a href="'+escHtml(d.videoUrl)+'" target="_blank" style="color:var(--gold)">'+escHtml(d.videoUrl.split('/').pop())+'</a> <span onclick="document.getElementById(\'edVideoPreview\').remove();document.getElementById(\'edVideo\').value=\'\'" style="cursor:pointer;color:#c44;margin-left:8px">✕ Убрать</span></div>';

    var pdfInfo = '';
    if(d.pdfUrl) pdfInfo += '<div class="ed-pdf-item" style="margin-bottom:4px;padding:6px 10px;background:rgba(180,120,20,0.08);border:1px solid rgba(180,120,20,0.2);border-radius:6px;font-size:0.8rem">📄 <a href="'+escHtml(d.pdfUrl)+'" target="_blank" style="color:var(--gold)">'+escHtml(d.pdfUrl.split('/').pop())+'</a></div>';
    if(d.pdfFiles && d.pdfFiles.length){
      d.pdfFiles.forEach(function(f, i){
        pdfInfo += '<div class="ed-pdf-item" style="margin-bottom:4px;padding:6px 10px;background:rgba(180,120,20,0.08);border:1px solid rgba(180,120,20,0.2);border-radius:6px;font-size:0.8rem">📄 <a href="'+escHtml(f.url)+'" target="_blank" style="color:var(--gold)">'+escHtml(f.name)+'</a></div>';
      });
    }

    box.innerHTML = '<button class="lesson-modal__close" onclick="closeLesson()">✕</button>'
      + '<div style="text-align:left;padding:4px">'
      + '<h3 style="font-family:var(--font-head);color:var(--gold);margin-bottom:16px">✏️ Редактирование — Урок ' + num + '</h3>'

      + '<label class="ed-label">Название урока</label>'
      + '<input id="edTitle" value="'+escHtml(d.title||'')+'" placeholder="Тема урока" class="ed-input">'

      + '<label class="ed-label">Текст лекции <span style="opacity:0.6">(вставляй из Word — форматирование сохранится)</span></label>'
      + '<div id="edBody" contenteditable="true" class="ed-body">'+(d.body||'<p style="color:var(--text-muted);opacity:0.5">Вставь текст урока сюда...</p>')+'</div>'

      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">'

      + '<div style="border:1px dashed var(--border);border-radius:8px;padding:14px;text-align:center">'
      + '<div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:8px">🎬 Видео</div>'
      + videoInfo
      + '<input id="edVideo" value="'+escHtml(d.videoUrl||'')+'" placeholder="Ссылка или YouTube URL" class="ed-input" style="margin-bottom:8px;font-size:0.82rem">'
      + '<div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap">'
      + '<button id="btnUploadVideo" class="ed-upload-btn">📁 Загрузить файл</button>'
      + '</div>'
      + '<div id="uploadProgress" style="font-size:0.75rem;color:var(--gold);margin-top:6px"></div>'
      + '</div>'

      + '<div style="border:1px dashed var(--border);border-radius:8px;padding:14px;text-align:center">'
      + '<div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:8px">📄 PDF-материалы</div>'
      + '<div id="edPdfList">' + pdfInfo + '</div>'
      + '<input id="edPdf" value="'+escHtml(d.pdfUrl||'')+'" placeholder="Ссылка на PDF" class="ed-input" style="margin-bottom:8px;font-size:0.82rem">'
      + '<button id="btnUploadPdf" class="ed-upload-btn">📁 Загрузить PDF</button>'
      + '</div>'

      + '</div>'

      + '<label class="ed-label">YouTube embed <span style="opacity:0.6">(ссылка или iframe-код)</span></label>'
      + '<input id="edEmbed" value="'+escHtml(d.videoEmbed||'')+'" placeholder="https://youtube.com/watch?v=... или iframe" class="ed-input" style="font-size:0.82rem">'

      + '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px">'
      + '<button id="edSave" class="btn btn--primary" style="font-size:0.85rem">💾 Сохранить</button>'
      + '<button id="edCancel" class="btn btn--ghost" style="font-size:0.85rem">Отмена</button>'
      + '<button id="edDelete" class="btn btn--ghost" style="font-size:0.85rem;color:#c44">🗑 Очистить урок</button>'
      + '</div></div>';

    var edBody = document.getElementById('edBody');

    edBody.addEventListener('focus', function(){
      if(edBody.querySelector('p[style*="opacity:0.5"]')) edBody.innerHTML = '';
    });

    edBody.addEventListener('paste', function(e){
      if(edBody.querySelector('p[style*="opacity:0.5"]')) edBody.innerHTML = '';
      var clipData = e.clipboardData || window.clipboardData;
      if(!clipData) return;

      var imgFiles = [];
      if(clipData.files && clipData.files.length){
        for(var i = 0; i < clipData.files.length; i++){
          if(clipData.files[i].type.indexOf('image/') === 0) imgFiles.push(clipData.files[i]);
        }
      }
      var hasHtml = false;
      if(clipData.types){
        for(var j = 0; j < clipData.types.length; j++){
          if(clipData.types[j] === 'text/html') hasHtml = true;
        }
      }

      if(imgFiles.length && !hasHtml){
        e.preventDefault();
        imgFiles.forEach(function(file){
          var reader = new FileReader();
          reader.onload = function(ev){
            document.execCommand('insertHTML', false,
              '<img src="'+ev.target.result+'" style="max-width:100%;border-radius:8px;margin:8px 0;display:block">');
          };
          reader.readAsDataURL(file);
        });
        return;
      }

      if(hasHtml){
        e.preventDefault();
        var htmlContent = clipData.getData('text/html');
        htmlContent = htmlContent
          .replace(/<!--[\s\S]*?-->/g, '')
          .replace(/<o:p>[\s\S]*?<\/o:p>/gi, '')
          .replace(/class="Mso[^"]*"/gi, '')
          .replace(/style="mso-[^"]*"/gi, '');
        htmlContent = htmlContent.replace(/<img[^>]*src="file:\/\/\/[^"]*"[^>]*\/?>/gi, '');
        htmlContent = htmlContent.replace(/<v:[^>]*>[\s\S]*?<\/v:[^>]*>/gi, '');
        htmlContent = htmlContent.replace(/<!\[if[^>]*>[\s\S]*?<!\[endif\]>/gi, '');

        if(imgFiles.length){
          var imgPromises = [];
          imgFiles.forEach(function(file){
            imgPromises.push(new Promise(function(resolve){
              var reader = new FileReader();
              reader.onload = function(ev){ resolve(ev.target.result); };
              reader.readAsDataURL(file);
            }));
          });
          Promise.all(imgPromises).then(function(srcs){
            var imgTags = srcs.map(function(s){
              return '<img src="'+s+'" style="max-width:100%;border-radius:8px;margin:8px 0;display:block">';
            }).join('');
            document.execCommand('insertHTML', false, imgTags + htmlContent);
          });
        } else {
          document.execCommand('insertHTML', false, htmlContent);
        }
      }
    });

    document.getElementById('btnUploadVideo').onclick = function(){
      var input = document.createElement('input');
      input.type = 'file';
      input.accept = 'video/*,.avi,.mov,.mkv,.wmv,.flv,.webm,.mp4';
      input.onchange = function(){
        var file = input.files[0];
        if(!file) return;
        document.getElementById('uploadProgress').textContent = '🎬 Загрузка: 0% (' + formatFileSize(file.size) + ')';
        document.getElementById('btnUploadVideo').disabled = true;
        document.getElementById('btnUploadVideo').textContent = '⏳ Загружается...';
        uploadFile(num, file, 'video', function(err, resp){
          document.getElementById('btnUploadVideo').disabled = false;
          document.getElementById('btnUploadVideo').textContent = '📁 Загрузить файл';
          if(err){
            document.getElementById('uploadProgress').textContent = '❌ Ошибка: ' + err;
            return;
          }
          document.getElementById('edVideo').value = resp.url;
          if(resp.converting){
            document.getElementById('uploadProgress').textContent = '✅ Загружено! Конвертация в MP4 на сервере...';
          } else {
            document.getElementById('uploadProgress').textContent = '✅ Видео загружено!';
          }
        });
      };
      input.click();
    };

    document.getElementById('btnUploadPdf').onclick = function(){
      var input = document.createElement('input');
      input.type = 'file';
      input.accept = '.pdf,application/pdf';
      input.onchange = function(){
        var file = input.files[0];
        if(!file) return;
        document.getElementById('btnUploadPdf').disabled = true;
        document.getElementById('btnUploadPdf').textContent = '⏳ Загрузка...';
        uploadFile(num, file, 'pdf', function(err, resp){
          document.getElementById('btnUploadPdf').disabled = false;
          document.getElementById('btnUploadPdf').textContent = '📁 Загрузить PDF';
          if(err){
            showNotice('Ошибка загрузки PDF: ' + err, 'warn');
            return;
          }
          document.getElementById('edPdf').value = resp.url;
          var list = document.getElementById('edPdfList');
          list.innerHTML += '<div class="ed-pdf-item" style="margin-bottom:4px;padding:6px 10px;background:rgba(46,125,50,0.1);border:1px solid rgba(46,125,50,0.2);border-radius:6px;font-size:0.8rem">📄 '+escHtml(file.name)+' ✅</div>';
          showNotice('PDF загружен!', 'success');
        });
      };
      input.click();
    };

    document.getElementById('edSave').onclick = function(){
      var t = document.getElementById('edTitle').value.trim();
      var b = edBody.innerHTML.trim();
      if(b.indexOf('opacity:0.5') !== -1 && b.indexOf('Вставь текст') !== -1) b = '';
      var v = document.getElementById('edVideo').value.trim();
      var em = document.getElementById('edEmbed').value.trim();
      var p = document.getElementById('edPdf').value.trim();
      if(!t && !b){ alert('Введите хотя бы название или текст'); return; }

      var pdfFiles = d.pdfFiles ? d.pdfFiles.slice() : [];
      var lesson = {title:t, body:b, videoUrl:v, videoEmbed:em, pdfUrl:p, pdfFiles:pdfFiles};
      var btn = document.getElementById('edSave');
      btn.textContent = '⏳ Сохранение...';
      btn.disabled = true;
      saveLessonToServer(num, lesson, function(){
        updateListStatuses();
        closeLesson();
        openLesson(num);
      });
    };
    document.getElementById('edCancel').onclick = function(){
      closeLesson(); openLesson(num);
    };
    document.getElementById('edDelete').onclick = function(){
      if(confirm('Очистить содержимое урока '+num+'?')){
        saveLessonToServer(num, null, function(){
          updateListStatuses(); closeLesson(); openLesson(num);
        });
      }
    };
  };

  var origOpen = window.openLesson;
  window.openLesson = function(num){
    origOpen(num);
    buildModalContent(num);
  };

  function showLoadingState(){
    var items = document.querySelectorAll('.lesson-item');
    items.forEach(function(item){
      var status = item.querySelector('.lesson-item__status');
      if(status && status.textContent === 'Ожидает публикации'){
        status.textContent = 'Загрузка...';
        status.style.opacity = '0.5';
      }
    });
  }
  function hideLoadingState(){
    var items = document.querySelectorAll('.lesson-item');
    items.forEach(function(item){
      var status = item.querySelector('.lesson-item__status');
      if(status && status.textContent === 'Загрузка...'){
        status.textContent = 'Ожидает публикации';
        status.style.opacity = '';
      }
    });
  }
  function addEditorStyles(){
    var s = document.createElement('style');
    s.textContent = '.ed-label{display:block;font-size:0.78rem;color:var(--text-muted);margin-bottom:4px}'
      + '.ed-input{width:100%;padding:10px 14px;border:1px solid var(--border);border-radius:8px;font-size:0.92rem;margin-bottom:12px;font-family:inherit;background:var(--bg-2);color:var(--text);box-sizing:border-box}'
      + '.ed-body{width:100%;min-height:250px;max-height:45vh;overflow-y:auto;padding:14px;border:1px solid var(--border);border-radius:8px;font-size:0.92rem;margin-bottom:16px;font-family:inherit;background:var(--bg-2);color:var(--text);line-height:1.8;box-sizing:border-box;outline:none;cursor:text}'
      + '.ed-body img{max-width:100%;height:auto;border-radius:8px;margin:8px 0;display:block}'
      + '.ed-upload-btn{padding:6px 14px;border:1px solid var(--border);border-radius:6px;background:var(--bg-2);color:var(--text);font-size:0.78rem;cursor:pointer;font-family:inherit;transition:all 0.2s}'
      + '.ed-upload-btn:hover{border-color:var(--gold);color:var(--gold)}'
      + '.ed-upload-btn:disabled{opacity:0.5;cursor:wait}'
      + '.lesson-video{margin:24px 0;border:1px solid var(--border);border-radius:12px;background:#000}'
      + '.lesson-video__label{padding:12px 16px;background:var(--bg-2);font-family:var(--font-head);font-size:0.82rem;color:var(--gold);letter-spacing:0.05em}'
      + '.lesson-video video{display:block;width:100%;background:#000;position:relative;z-index:1}'
      + '.lesson-video__embed{position:relative;padding-bottom:56.25%;height:0;overflow:hidden}'
      + '.lesson-video__embed iframe{position:absolute;top:0;left:0;width:100%;height:100%;border:none}';
    document.head.appendChild(s);
  }

  function addAdminToggle(){
    var footer = document.querySelector('.footer__inner');
    if(!footer) return;
    var toggle = document.createElement('div');
    toggle.style.cssText = 'margin-top:12px;text-align:center';
    toggle.innerHTML = isAdmin
      ? '<span style="font-size:0.7rem;color:var(--gold);cursor:pointer" onclick="window.__toggleAdmin()">🔓 Режим редактора · <u>Выйти</u></span>'
      : '<span style="font-size:0.68rem;color:var(--text-muted);opacity:0.3;cursor:pointer" onclick="window.__toggleAdmin()">⚙</span>';
    footer.appendChild(toggle);
  }

  window.__toggleAdmin = function(){
    if(isAdmin){
      localStorage.removeItem(ADMIN_KEY);
      location.reload();
    } else {
      var pwd = prompt('Введите пароль редактора:');
      if(pwd === 'nasledie2026'){
        localStorage.setItem(ADMIN_KEY, '1');
        location.reload();
      } else if(pwd !== null){
        alert('Неверный пароль');
      }
    }
  };

  addEditorStyles();
  showLoadingState();
  loadLessonsFromServer(function(){ updateListStatuses(); hideLoadingState(); });
  addAdminToggle();
})();
