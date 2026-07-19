/*  Lesson Editor — localStorage + JSON export/import
    Подключается на каждой course-*.html
    Атрибут data-course="drevnerusskiy" на <body> определяет курс
*/
(function(){
  var COURSE = document.body.getAttribute('data-course') || 'default';
  var STORAGE_KEY = 'nasledie_lessons_' + COURSE;
  var ADMIN_KEY = 'nasledie_admin';
  var isAdmin = localStorage.getItem(ADMIN_KEY) === '1';

  function loadLessons(){
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch(e){ return {}; }
  }
  function saveLessons(data){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

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
    });
  }

  function buildModalContent(num){
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
      if(d.videoUrl) html += '<div style="margin:16px 0"><video controls style="max-width:100%;border-radius:8px"><source src="'+escHtml(d.videoUrl)+'"></video></div>';
      if(d.videoEmbed) html += '<div style="margin:16px 0">'+d.videoEmbed+'</div>';
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
      ce.innerHTML = '';
      ce.classList.remove('has-content');
      tgBlock.style.display = '';
      if(tgBtn) tgBtn.style.display = '';
    }

    var oldBar = document.getElementById('adminBar');
    if(oldBar) oldBar.remove();

    if(isAdmin){
      var bar = document.createElement('div');
      bar.id = 'adminBar';
      bar.style.cssText = 'margin-top:20px;padding-top:16px;border-top:1px dashed var(--gold);text-align:center';
      bar.innerHTML = '<button onclick="window.__editLesson('+num+')" class="btn btn--ghost" style="font-size:0.8rem">✏️ Редактировать урок</button>';
      document.querySelector('.lesson-modal__box').appendChild(bar);
    }
  }

  function escHtml(s){
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  window.__editLesson = function(num){
    var data = loadLessons();
    var d = data[num] || {};
    var box = document.querySelector('.lesson-modal__box');

    box.innerHTML = '<button class="lesson-modal__close" onclick="closeLesson()">✕</button>'
      + '<div style="text-align:left;max-height:70vh;overflow-y:auto;padding:4px">'
      + '<h3 style="font-family:var(--font-head);color:var(--gold);margin-bottom:16px">✏️ Редактирование — Урок ' + num + '</h3>'
      + '<label style="display:block;font-size:0.78rem;color:var(--text-muted);margin-bottom:4px">Название урока</label>'
      + '<input id="edTitle" value="'+escHtml(d.title||'')+'" placeholder="Тема урока" style="width:100%;padding:10px 14px;border:1px solid var(--border);border-radius:8px;font-size:0.92rem;margin-bottom:16px;font-family:inherit;background:var(--bg-2);color:var(--text)">'
      + '<label style="display:block;font-size:0.78rem;color:var(--text-muted);margin-bottom:4px">Текст лекции (HTML разрешён)</label>'
      + '<textarea id="edBody" rows="12" placeholder="Текст урока..." style="width:100%;padding:10px 14px;border:1px solid var(--border);border-radius:8px;font-size:0.88rem;margin-bottom:16px;font-family:inherit;resize:vertical;background:var(--bg-2);color:var(--text);line-height:1.7">'+escHtml(d.body||'')+'</textarea>'
      + '<label style="display:block;font-size:0.78rem;color:var(--text-muted);margin-bottom:4px">Ссылка на видео (путь к файлу или URL)</label>'
      + '<input id="edVideo" value="'+escHtml(d.videoUrl||'')+'" placeholder="../videos/lesson1.mp4" style="width:100%;padding:10px 14px;border:1px solid var(--border);border-radius:8px;font-size:0.88rem;margin-bottom:16px;font-family:inherit;background:var(--bg-2);color:var(--text)">'
      + '<label style="display:block;font-size:0.78rem;color:var(--text-muted);margin-bottom:4px">Embed-код видео (YouTube iframe)</label>'
      + '<textarea id="edEmbed" rows="3" placeholder=\'<iframe src="..."></iframe>\' style="width:100%;padding:10px 14px;border:1px solid var(--border);border-radius:8px;font-size:0.82rem;margin-bottom:16px;font-family:monospace;resize:vertical;background:var(--bg-2);color:var(--text)">'+escHtml(d.videoEmbed||'')+'</textarea>'
      + '<label style="display:block;font-size:0.78rem;color:var(--text-muted);margin-bottom:4px">Ссылка на PDF</label>'
      + '<input id="edPdf" value="'+escHtml(d.pdfUrl||'')+'" placeholder="../files/lesson1.pdf" style="width:100%;padding:10px 14px;border:1px solid var(--border);border-radius:8px;font-size:0.88rem;margin-bottom:20px;font-family:inherit;background:var(--bg-2);color:var(--text)">'
      + '<div style="display:flex;gap:10px;flex-wrap:wrap">'
      + '<button id="edSave" class="btn btn--primary" style="font-size:0.85rem">💾 Сохранить</button>'
      + '<button id="edCancel" class="btn btn--ghost" style="font-size:0.85rem">Отмена</button>'
      + '<button id="edDelete" class="btn btn--ghost" style="font-size:0.85rem;color:#c44">🗑 Очистить урок</button>'
      + '</div></div>';

    document.getElementById('edSave').onclick = function(){
      var t = document.getElementById('edTitle').value.trim();
      var b = document.getElementById('edBody').value.trim();
      var v = document.getElementById('edVideo').value.trim();
      var em = document.getElementById('edEmbed').value.trim();
      var p = document.getElementById('edPdf').value.trim();
      if(!t && !b){ alert('Введите хотя бы название или текст'); return; }
      data[num] = {title:t, body:b, videoUrl:v, videoEmbed:em, pdfUrl:p};
      saveLessons(data);
      updateListStatuses();
      closeLesson();
      openLesson(num);
    };
    document.getElementById('edCancel').onclick = function(){
      closeLesson();
      openLesson(num);
    };
    document.getElementById('edDelete').onclick = function(){
      if(confirm('Очистить содержимое урока '+num+'?')){
        delete data[num];
        saveLessons(data);
        updateListStatuses();
        closeLesson();
        openLesson(num);
      }
    };
  };

  var origOpen = window.openLesson;
  window.openLesson = function(num){
    origOpen(num);
    buildModalContent(num);
  };

  function addAdminToggle(){
    var footer = document.querySelector('.footer__inner');
    if(!footer) return;
    var toggle = document.createElement('div');
    toggle.style.cssText = 'margin-top:12px;text-align:center';
    toggle.innerHTML = isAdmin
      ? '<span style="font-size:0.7rem;color:var(--gold);cursor:pointer" onclick="window.__toggleAdmin()">🔓 Режим редактора · <u>Выйти</u></span>'
        + ' <span style="font-size:0.7rem;color:var(--text-muted);cursor:pointer;margin-left:12px" onclick="window.__exportLessons()">📦 Экспорт</span>'
        + ' <span style="font-size:0.7rem;color:var(--text-muted);cursor:pointer;margin-left:12px" onclick="window.__importLessons()">📥 Импорт</span>'
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

  window.__exportLessons = function(){
    var allData = {};
    for(var i = 0; i < localStorage.length; i++){
      var k = localStorage.key(i);
      if(k.indexOf('nasledie_lessons_') === 0){
        allData[k] = JSON.parse(localStorage.getItem(k));
      }
    }
    var blob = new Blob([JSON.stringify(allData, null, 2)], {type:'application/json'});
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'lessons-export.json';
    a.click();
  };

  window.__importLessons = function(){
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(){
      var file = input.files[0];
      if(!file) return;
      var reader = new FileReader();
      reader.onload = function(){
        try {
          var imported = JSON.parse(reader.result);
          Object.keys(imported).forEach(function(k){
            localStorage.setItem(k, JSON.stringify(imported[k]));
          });
          alert('Импорт завершён! Страница обновится.');
          location.reload();
        } catch(e){
          alert('Ошибка чтения файла: ' + e.message);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // Auto-load from bundled JSON if exists
  function loadBundled(){
    var script = document.querySelector('script[data-lessons-json]');
    if(!script) return;
    var url = script.getAttribute('data-lessons-json');
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onload = function(){
      if(xhr.status === 200){
        try {
          var json = JSON.parse(xhr.responseText);
          var key = 'nasledie_lessons_' + COURSE;
          if(json[key] && !localStorage.getItem(key)){
            localStorage.setItem(key, JSON.stringify(json[key]));
            updateListStatuses();
          }
        } catch(e){}
      }
    };
    xhr.send();
  }

  updateListStatuses();
  addAdminToggle();
  loadBundled();
})();
