/*  Page Editor — редактирование любого блока на любой странице
    Активация: иконка ⚙ в футере → пароль nasledie2026
    Данные хранятся в localStorage, экспорт/импорт JSON
*/
(function(){
  var ADMIN_KEY = 'nasledie_admin';
  var isAdmin = localStorage.getItem(ADMIN_KEY) === '1';
  var PAGE_ID = location.pathname.replace(/.*\//, '').replace('.html','') || 'index';
  var STORAGE_KEY = 'nasledie_page_' + PAGE_ID;

  function loadEdits(){
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch(e){ return {}; }
  }
  function saveEdits(data){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function applyEdits(){
    var data = loadEdits();
    Object.keys(data).forEach(function(id){
      var el = document.querySelector('[data-block-id="'+id+'"]');
      if(el && data[id].html){
        el.innerHTML = data[id].html;
      }
    });
  }

  function makeEditable(){
    var blocks = document.querySelectorAll('.content-block, .info-card, .elder-card, .minor-card, .page-intro, .vtimeline__body, .cal-now, .cal-info-card, .totem-card, .month-card, .week-day');
    var counter = 0;
    blocks.forEach(function(block){
      if(block.closest('.lesson-modal')) return;
      var id = block.getAttribute('data-block-id');
      if(!id){
        id = PAGE_ID + '-block-' + counter;
        block.setAttribute('data-block-id', id);
      }
      counter++;

      block.style.position = 'relative';
      var btn = document.createElement('button');
      btn.className = 'pe-edit-btn';
      btn.innerHTML = '✏️';
      btn.title = 'Редактировать блок';
      btn.onclick = function(e){
        e.stopPropagation();
        e.preventDefault();
        openEditor(block, id);
      };
      block.appendChild(btn);
    });
  }

  function openEditor(block, id){
    var data = loadEdits();
    var existing = data[id] || {};

    var overlay = document.createElement('div');
    overlay.className = 'pe-overlay';

    var modal = document.createElement('div');
    modal.className = 'pe-modal';
    modal.innerHTML =
      '<div class="pe-modal__header">'
      + '<h3>✏️ Редактирование блока</h3>'
      + '<button class="pe-modal__close" id="peClose">✕</button>'
      + '</div>'
      + '<p style="font-size:0.75rem;color:var(--text-muted);margin-bottom:12px">Вставляй текст из Word — форматирование и картинки сохранятся. Скриншоты вставляй через Ctrl+V.</p>'
      + '<div id="peBody" contenteditable="true" class="pe-editor">'
      + (existing.html || block.innerHTML)
      + '</div>'
      + '<div class="pe-actions">'
      + '<button id="peSave" class="btn btn--primary" style="font-size:0.85rem">💾 Сохранить</button>'
      + '<button id="peCancel" class="btn btn--ghost" style="font-size:0.85rem">Отмена</button>'
      + '<button id="peReset" class="btn btn--ghost" style="font-size:0.85rem;color:#c44">🔄 Сбросить</button>'
      + '</div>';

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    var edBody = document.getElementById('peBody');

    edBody.addEventListener('paste', function(e){
      var clipData = e.clipboardData || window.clipboardData;
      if(!clipData) return;

      var imgFiles = [];
      if(clipData.files && clipData.files.length){
        for(var i = 0; i < clipData.files.length; i++){
          if(clipData.files[i].type.indexOf('image/') === 0){
            imgFiles.push(clipData.files[i]);
          }
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

    function closeEditor(){
      overlay.remove();
      document.body.style.overflow = '';
    }

    document.getElementById('peClose').onclick = closeEditor;
    overlay.addEventListener('click', function(e){
      if(e.target === overlay) closeEditor();
    });

    document.getElementById('peSave').onclick = function(){
      var html = edBody.innerHTML.trim();
      var editBtns = edBody.querySelectorAll('.pe-edit-btn');
      editBtns.forEach(function(b){ b.remove(); });
      html = edBody.innerHTML.trim();

      data[id] = { html: html, updated: new Date().toISOString() };
      saveEdits(data);
      block.innerHTML = html;
      closeEditor();
      if(isAdmin) makeEditable();
    };

    document.getElementById('peCancel').onclick = closeEditor;

    document.getElementById('peReset').onclick = function(){
      if(confirm('Сбросить изменения этого блока к оригиналу?')){
        delete data[id];
        saveEdits(data);
        location.reload();
      }
    };
  }

  function addAdminToggle(){
    var footer = document.querySelector('.footer__inner');
    if(!footer) return;
    var existing = footer.querySelector('.pe-admin-toggle');
    if(existing) return;

    var toggle = document.createElement('div');
    toggle.className = 'pe-admin-toggle';
    toggle.style.cssText = 'margin-top:12px;text-align:center';
    toggle.innerHTML = isAdmin
      ? '<span style="font-size:0.7rem;color:var(--gold);cursor:pointer" onclick="window.__peToggleAdmin()">🔓 Режим редактора · <u>Выйти</u></span>'
        + ' <span style="font-size:0.7rem;color:var(--text-muted);cursor:pointer;margin-left:12px" onclick="window.__peExport()">📦 Экспорт</span>'
        + ' <span style="font-size:0.7rem;color:var(--text-muted);cursor:pointer;margin-left:12px" onclick="window.__peImport()">📥 Импорт</span>'
      : '<span style="font-size:0.68rem;color:var(--text-muted);opacity:0.3;cursor:pointer" onclick="window.__peToggleAdmin()">⚙</span>';
    footer.appendChild(toggle);
  }

  window.__peToggleAdmin = function(){
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

  window.__peExport = function(){
    var allData = {};
    for(var i = 0; i < localStorage.length; i++){
      var k = localStorage.key(i);
      if(k.indexOf('nasledie_page_') === 0 || k.indexOf('nasledie_lessons_') === 0){
        allData[k] = JSON.parse(localStorage.getItem(k));
      }
    }
    var blob = new Blob([JSON.stringify(allData, null, 2)], {type:'application/json'});
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'site-edits-export.json';
    a.click();
  };

  window.__peImport = function(){
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

  function injectStyles(){
    var style = document.createElement('style');
    style.textContent =
      '.pe-edit-btn{position:absolute;top:6px;right:6px;width:28px;height:28px;border-radius:50%;border:1px solid rgba(184,148,46,0.3);background:rgba(245,240,232,0.95);cursor:pointer;font-size:0.75rem;display:flex;align-items:center;justify-content:center;opacity:0.4;transition:all 0.3s;z-index:10;padding:0}'
      + '.pe-edit-btn:hover{opacity:1;border-color:var(--gold);transform:scale(1.1)}'
      + '.pe-overlay{position:fixed;inset:0;z-index:500;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);display:flex;align-items:flex-start;justify-content:center;padding:24px;overflow-y:auto}'
      + '.pe-modal{background:var(--bg,#f5f0e8);border:1px solid var(--gold,#b8942e);border-radius:16px;padding:32px;max-width:900px;width:100%;box-shadow:0 24px 80px rgba(0,0,0,0.2);margin:40px auto;max-height:calc(100vh - 80px);overflow-y:auto}'
      + '.pe-modal__header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}'
      + '.pe-modal__header h3{font-family:var(--font-head,Cinzel);color:var(--gold,#b8942e);font-size:1.1rem;margin:0}'
      + '.pe-modal__close{font-size:1.2rem;color:var(--text-muted,#888);cursor:pointer;background:none;border:none;font-family:inherit}'
      + '.pe-modal__close:hover{color:var(--gold,#b8942e)}'
      + '.pe-editor{min-height:300px;max-height:50vh;overflow-y:auto;padding:16px;border:1px solid var(--border,#ddd);border-radius:8px;font-size:0.92rem;font-family:inherit;background:var(--bg-2,#ece5d8);color:var(--text,#2c1e0f);line-height:1.8;outline:none;cursor:text;margin-bottom:16px}'
      + '.pe-editor img{max-width:100%;height:auto;border-radius:8px;margin:8px 0;display:block}'
      + '.pe-actions{display:flex;gap:10px;flex-wrap:wrap}';
    document.head.appendChild(style);
  }

  // Инициализация
  injectStyles();
  applyEdits();
  addAdminToggle();
  if(isAdmin) makeEditable();
})();
