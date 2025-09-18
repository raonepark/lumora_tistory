/*
  Lumora — Share/More Dropdown FIX v3 (aggressive)
  증상: 관리자 액션(수정/비공개/삭제)이 버튼 영역 밖에 인라인으로 뿌려져 1줄 흰 박스만 보임.
  해결: 트리거 클릭 시 주변의 텍스트 액션 링크를 감춤(숨김 표시) + 복제하여 팝오버 메뉴로 표시.
  - 원본 링크는 DOM에 남아있지만 data 속성으로 숨김 처리
  - 외부 클릭/ESC/스크롤/리사이즈 시 닫힘
*/
(function(){
  const STYLE_ID = "lumora-dropdown-inline-style-v3";
  if(!document.getElementById(STYLE_ID)){
    const css = `
      #detail_page .container_postbtn, #detail_page .container_postbtn .btn_post, #detail_page .container_postbtn .btn_menu_toolbar{ overflow: visible !important; position: relative; }
      .lumora-open{ display:block !important; opacity:1 !important; visibility:visible !important; }
      /* 인라인 관리자 링크를 숨길 때 사용 */
      [data-lumora-hidden="true"]{ display:none !important; }
      .lumora-menu{ position:absolute !important; top:calc(100% + 10px) !important; left:50% !important; transform:translateX(-50%) !important; z-index:100 !important; background:#222 !important; border:1px solid #444 !important; border-radius:8px !important; padding:8px 0 !important; min-width:168px !important; box-shadow:0 4px 6px rgba(0,0,0,.3) !important; }
      .lumora-menu ul{ list-style:none !important; margin:0 !important; padding:0 !important; }
      .lumora-menu li{ display:block !important; margin:0 !important; }
      .lumora-menu a, .lumora-menu button{ display:block !important; padding:10px 14px !important; color:#ccc !important; font-size:14px !important; line-height:1.3 !important; text-decoration:none !important; white-space:nowrap !important; background:transparent !important; }
      .lumora-menu a:hover, .lumora-menu button:hover{ background:#333 !important; color:#fff !important; border-radius:4px !important; }
    `;
    const st = document.createElement('style'); st.id = STYLE_ID; st.textContent = css; document.head.appendChild(st);
  }

  const qa = (s, r=document) => Array.from(r.querySelectorAll(s));
  const isIconOnly = (el)=>{ const t=(el.textContent||'').trim(); return (!t || t.length===0) && !!el.querySelector('svg,i'); };
  const ACTION_WORDS = ['수정','비공개','비공개로 변경','삭제','통계','숨김','복원','임시저장'];

  function isAction(el){
    if(!el) return false; if(isIconOnly(el)) return false;
    const t=(el.textContent||'').trim(); if(!t) return false;
    if(/공유|좋아요|구독|팔로우/i.test(t)) return false;
    return ACTION_WORDS.some(w=> t.indexOf(w)!==-1) || t.length<=8;
  }

  function collectAndHideInlineActions(trigger){
    const root = trigger.closest('#detail_page') || document;
    // 버튼 그룹 주변에서 텍스트 링크/버튼을 수집 (너무 멀리 가지 않도록 depth 제한)
    const scope = trigger.closest('.container_postbtn') || trigger.parentElement;
    const candidates = qa('a, button', scope ? scope.parentElement || scope : root)
      .filter(el=> el!==trigger && isAction(el));

    const picked = [];
    // 화면상 멀리 떨어진 링크는 제외(가로 위치 차이 600px 이상이면 제외)
    const tb = trigger.getBoundingClientRect();
    for(const el of candidates){
      const r = el.getBoundingClientRect();
      if(Math.abs(r.top - tb.top) < 80 && Math.abs(r.left - tb.left) < 600){
        picked.push(el);
      }
    }
    // 선택한 인라인 액션은 숨김 표시
    picked.forEach(el=> el.setAttribute('data-lumora-hidden','true'));
    return picked;
  }

  function buildMenu(trigger){
    const host = trigger.closest('.btn_menu_toolbar, .btn_post, .postbtn') || trigger.parentElement;
    if(!host) return null;
    let menu = host.querySelector('.lumora-menu');
    if(!menu){ menu = document.createElement('div'); menu.className='lumora-menu'; menu.innerHTML='<ul></ul>'; host.appendChild(menu); }
    const ul = menu.querySelector('ul'); ul.innerHTML='';

    const items = collectAndHideInlineActions(trigger);
    if(items.length===0){ return menu; }

    items.forEach(src=>{
      const li = document.createElement('li');
      const clone = src.cloneNode(true);
      clone.addEventListener('click', (e)=>{
        e.preventDefault(); e.stopPropagation();
        if(src.tagName.toLowerCase()==='a' && src.href){ window.location.href = src.href; }
        else { src.click(); }
        closeAll();
      });
      li.appendChild(clone); ul.appendChild(li);
    });
    return menu;
  }

  function closeAll(except){
    qa('.lumora-menu').forEach(m=>{ if(except && m===except) return; m.classList.remove('lumora-open'); const b=m.__ownerBtn; if(b){ b.setAttribute('aria-expanded','false'); }});
  }

  function wire(btn){
    if(btn.__lumoraWired) return; btn.__lumoraWired=true;
    btn.setAttribute('aria-haspopup','menu'); btn.setAttribute('aria-expanded','false');
    btn.addEventListener('click', (e)=>{
      e.preventDefault(); e.stopPropagation();
      const menu = buildMenu(btn); if(!menu) return; menu.__ownerBtn=btn;
      const open = menu.classList.contains('lumora-open');
      closeAll(open ? null : menu);
      if(!open){ menu.classList.add('lumora-open'); btn.setAttribute('aria-expanded','true'); }
      else { menu.classList.remove('lumora-open'); btn.setAttribute('aria-expanded','false'); }
    }, true);
  }

  function wireAll(root=document){
    const triggers = qa('#detail_page .container_postbtn .btn_menu_toolbar a,\
                         #detail_page .container_postbtn .btn_menu_toolbar button,\
                         #detail_page .container_postbtn .postbtn a,\
                         #detail_page .container_postbtn .postbtn button,\
                         #detail_page .container_postbtn .wrap_btn a,\
                         #detail_page .container_postbtn .wrap_btn button')
                     .filter(el=>/more|menu|설정|더보기|ico_more|toolbar|\.{3}/i.test(el.className + ' ' + el.textContent));
    triggers.forEach(wire);
  }

  document.addEventListener('click', ()=> closeAll());
  window.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeAll(); });
  window.addEventListener('scroll', ()=> closeAll(), true);
  window.addEventListener('resize', ()=> closeAll());
  document.addEventListener('click', (e)=>{ if(e.target.closest('.lumora-menu')) e.stopPropagation(); }, true);

  function init(){ wireAll(document); }
  (document.readyState==='loading') ? document.addEventListener('DOMContentLoaded', init) : init();
  const mo = new MutationObserver((m)=>{ for(const x of m){ if(x.addedNodes && x.addedNodes.length){ wireAll(document); break; } } });
  mo.observe(document.documentElement, {childList:true, subtree:true});
})();
