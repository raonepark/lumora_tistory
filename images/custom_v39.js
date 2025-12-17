// Lumora custom script v39
$(document).ready(function () {
  var list = $(".list_content");

  /* --- (기존 썸네일 텍스트 대체 로직, 미사용) ---
  var thumbImg = list.find(".list_img_box");
  if (list.length > 0) {
    for (var i = 0; i < list.length; i++) {
      var current = list.eq(i).find(".list_img_box");
      if (current.find("img").length == 0) {
        var cuttxt = current.next().next().text();
        current.text(cuttxt);
      }
    }
  }
  */

  // ==============================
  // Mobile list: category label on top bar
  // ==============================
  (function () {
    if (!document.body || document.body.id === "tt-body-page") return;
    if (!window.matchMedia || !window.matchMedia("(max-width:1024px)").matches) return;

    var labelEl = document.querySelector(".m-topbar__text");
    if (!labelEl) return;

    var bodyId = document.body.id || "";
    var currentPath = String(location.pathname || "").replace(/\/+$/, "");
    var isCategoryPage =
      bodyId === "tt-body-category" || currentPath === "/category" || currentPath.indexOf("/category/") === 0;
    if (!isCategoryPage) return;

    function normalizeText(text) {
      return String(text || "")
        .replace(/\s+/g, " ")
        .trim();
    }

    function safeDecode(value) {
      try {
        return decodeURIComponent(String(value || ""));
      } catch (e) {
        return String(value || "");
      }
    }

    function normalizePath(href) {
      if (!href) return "";
      try {
        var u = new URL(href, location.origin);
        return String(u.pathname || "").replace(/\/+$/, "");
      } catch (e) {
        var s = String(href || "").split(/[?#]/)[0];
        if (s.indexOf(location.origin) === 0) s = s.slice(location.origin.length);
        return s.replace(/\/+$/, "");
      }
    }

    function getCategoryNameFromLink(a) {
      if (!a) return "";
      var clone = a.cloneNode(true);
      var remove = clone.querySelectorAll(".c_cnt, img, svg");
      for (var i = 0; i < remove.length; i++) {
        if (remove[i] && remove[i].parentNode) remove[i].parentNode.removeChild(remove[i]);
      }
      var text = normalizeText(clone.textContent);
      return text;
    }

    var currentDecoded = safeDecode(currentPath);
    var links = document.querySelectorAll(".m-cat-body a[href], #sidebar .tt_category a[href], #sidebar .category a[href]");
    if (!links || !links.length) return;

    var bestText = "";
    var bestLen = 0;

    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      var p = normalizePath(a.getAttribute("href") || a.href);
      if (!p) continue;

      var decoded = safeDecode(p);
      if (decoded === "/category") continue;

      var matches = currentDecoded === decoded || currentDecoded.indexOf(decoded + "/") === 0;
      if (!matches) continue;

      if (decoded.length <= bestLen) continue;
      var name = getCategoryNameFromLink(a);
      if (!name) continue;

      bestText = name;
      bestLen = decoded.length;
    }

    if (bestText) {
      labelEl.textContent = bestText;
    }
  })();

  // ==============================
  // TOC 생성/스크롤 하이라이트 (겹침 방지 클램프 포함)
  // ==============================
  var toc = $("#detail_page .article .tableofcontents");
  var tableOfContent = $(".article .contents_style");
  var content = $("#detail_page .comment");
  var cb = content.offset() ? content.offset().top : 0;
  var tocheight = 100;
  var scrollOffset = 0; // 목차 클릭 시 제목이 화면 상단에서 떨어질 여백(px)

  if (tableOfContent.length > 0 && toc.length) {
    // 대상으로 쓸 heading 들에 공통 클래스 부여
    tableOfContent.find("h1").addClass("target");
    tableOfContent.find("h2").addClass("target");
    tableOfContent.find("h3").addClass("target");
    tableOfContent.find("h4").addClass("target");

    var target = tableOfContent.find(".target");
    if (target.length > 0) {
      var targetHight = [];

      // 목차 p 요소 생성 + 각 heading 의 문서 내 Y 위치 기록
      for (var i = 0; i < target.length; i++) {
        var $heading = target.eq(i);
        var tagName = $heading.prop("tagName").toLowerCase(); // h1, h2, ...
        toc.append("<p class='toc-" + tagName + "'>" + $heading.text() + "</p>");
        targetHight.push($heading.offset().top);
      }

      var targetp = toc.find("p");
      if (targetp.length) targetp.eq(0).addClass("on");
      tocheight = toc.innerHeight();

      // --- 클릭 시 해당 제목 위치로 스크롤 (여백 포함) ---
      $(targetp).on("click", function () {
        var idx = $(this).index();
        targetp.removeClass("on");
        $(this).addClass("on");

        // 클릭 시점에 현재 위치를 다시 계산(광고/이미지 로딩으로 밀리는 문제 방지)
        var $h = target.eq(idx);
        if ($h.length) {
          var nowTop = $h.offset().top;
          var dst = nowTop - scrollOffset;          if (dst < 0) dst = 0;
          $("html, body").animate({ scrollTop: dst }, 500);
        }
      });

      // 로딩 완료/리사이즈 때도 좌표 갱신(하이라이트 정확도 개선)
      function refreshTargetHeights() {
        targetHight = [];
        target.each(function () {
          targetHight.push($(this).offset().top);
        });
        tocheight = toc.innerHeight();
        cb = content.offset() ? content.offset().top : 0;
      }
      $(window).on("load resize", refreshTargetHeights);      

      // --- 스크롤 시 TOC 위치/하이라이트 업데이트 ---
      $(window).on("scroll", function () {
        var scroll = $(window).scrollTop();
        var maxTop = cb ? Math.max(0, cb - tocheight) : 0; // 댓글 박스 위까지만

        // 우측 TOC 박스 자체의 top 값(위아래 이동) 조정
        if (cb) {
          if (scroll < maxTop) {
            toc.css("top", scroll);
          } else {
            toc.css("top", maxTop);
          }
        }

        // 현재 스크롤 위치에 맞춰 on 클래스 갱신
        if (targetHight.length > 0) {
          // 화면 기준으로는 "현재 스크롤 + scrollOffset" 시점을 기준으로 판단
          var current = scroll + scrollOffset;

          if (current <= targetHight[0] - 50 && current >= 0) {
            targetp.removeClass("on");
            targetp.eq(0).addClass("on");
          }
          for (var j = 1; j < targetp.length; j++) {
            if (current <= targetHight[j] && current >= targetHight[j - 1]) {
              targetp.removeClass("on");
              targetp.eq(j).addClass("on");
            }
          }
        }
      });
    }
  }

  // ==============================
  // 날짜만 표시 (시간 제거)
  // - 목록 카드 .txt_bar
  // - 상세 상단 .author 내부 .js-date (있다면)
  // ==============================
  function toDateOnly(raw) {
    if (!raw) return "";
    var t = String(raw).trim();
    // 케이스 예: "2025. 9. 15. 21:10", "2025.09.15 21:10", "2025-09-15 21:10", "2025/09/15" 등
    var m = t.match(/(\d{4})[.\-/]\s*(\d{1,2})[.\-/]\s*(\d{1,2})/);
    if (m) {
      var y = m[1];
      var mo = ("0" + m[2]).slice(-2);
      var d = ("0" + m[3]).slice(-2);
      return y + "." + mo + "." + d;
    }
    // 공백으로 날짜/시간이 분리된 일반 케이스는 첫 토큰 사용
    return t.split(/\s+/)[0];
  }

  // 1) 목록 카드 날짜 처리
  $("#content .list_content .detail_info .txt_bar").each(function () {
    var dateOnly = toDateOnly($(this).text());
    if (dateOnly) $(this).text(dateOnly);
  });

  // 2) 상세 상단 작성일 처리 (HTML에 <span class="js-date">[##_article_rep_date_##]</span> 넣은 경우)
  $("#detail_page .author .js-date, .js-date").each(function () {
    var dateOnly = toDateOnly($(this).text());
    if (dateOnly) $(this).text(dateOnly);
  });

  // ==============================
  // 댓글 폼 유효성 검사 — 중복 confirm 방지(단일 submit 가드)
  // ==============================
  (function () {
    var $form = $('#detail_page .commentWrite form, #comment-form, .commentWrite form').first();
    if (!$form.length) {
      // 테마에 따라 .commentWrite 밖에서 form이 분리되는 경우 보완
      $form = $('#detail_page .commentWrite, .commentWrite').closest('form').filter(function () {
        return $(this).find('textarea').length;
      }).first();
    }
    if (!$form.length) return;

    // 네임스페이스 중복 제거
    $form.off('.validateComment');
    // 빠른 연속 실행 방지 세마포어
    var isSubmitting = false;
    var skipSubmitHandlerOnce = false;
    var submitResetTimer = null;

    function beginSubmitGuard() {
      isSubmitting = true;
      if (submitResetTimer) {
        clearTimeout(submitResetTimer);
      }
      submitResetTimer = setTimeout(function () {
        submitResetTimer = null;
        isSubmitting = false;
      }, 1500);
    }

    function releaseSubmitGuard() {
      if (submitResetTimer) {
        clearTimeout(submitResetTimer);
        submitResetTimer = null;
      }
      isSubmitting = false;
    }

    function showInvalid(msg, $textarea, e) {
      if (e && e.preventDefault) { e.preventDefault(); }
      alert(msg || '내용을 입력해주세요.');
      var $submit = $form.find('input[type="submit"], button[type="submit"]').first();
      if ($submit.length) {
        $submit.prop('disabled', false).removeAttr('aria-disabled').removeClass('disabled');
      }
      if ($textarea && $textarea.length) {
        $textarea.focus();
      }
      releaseSubmitGuard();
      return false;
    }

    function ensureValid(e) {
      var $textarea = $form.find('textarea');
      if (!$textarea.length || !$textarea.val().trim()) {
        return showInvalid('내용을 입력해주세요.', $textarea, e);
      }
      return true;
    }

    $form.on('submit.validateComment', function (e) {
      if (skipSubmitHandlerOnce) {
        skipSubmitHandlerOnce = false;
        return;
      }
      if (!ensureValid(e)) {
        return false;
      }
      if (isSubmitting) {
        if (e && e.preventDefault) { e.preventDefault(); }
        return false;
      }
      beginSubmitGuard();
    });

    // 티스토리 기본 onclick을 래핑하여 선 검증 수행
    var $submitBtn = $form.find('input[type="submit"], button[type="submit"]').first();
    if ($submitBtn.length) {
      $submitBtn.off('.validateComment');
      var submitEl = $submitBtn.get(0);
      if (submitEl) {
        var originalClick = submitEl.onclick;
        submitEl.onclick = function (event) {
          if (!ensureValid(event)) {
            if (event) {
              if (event.stopImmediatePropagation) event.stopImmediatePropagation();
              if (event.stopPropagation) event.stopPropagation();
            }
            return false;
          }
          if (isSubmitting) {
            if (event && event.preventDefault) { event.preventDefault(); }
            return false;
          }
          skipSubmitHandlerOnce = true;
          beginSubmitGuard();
          var result;
          if (typeof originalClick === 'function') {
            result = originalClick.call(this, event);
          }
          if (result === false) {
            releaseSubmitGuard();
            skipSubmitHandlerOnce = false;
          }
          return result;
        };
      }
    }
  })();

  // ==============================
  // Comment login prompt: de-dupe duplicate confirm
  // ==============================
  (function () {
    function wrapCommentRequireLogin() {
      var current = window.commentRequireLogin;
      if (typeof current !== "function" || current.__lumoraWrapped) {
        return;
      }

      var inFlight = false;
      var unlockTimer = null;

      function scheduleUnlock() {
        if (unlockTimer) return;
        unlockTimer = setTimeout(function () {
          unlockTimer = null;
          inFlight = false;
        }, 0);
      }

      function wrappedCommentRequireLogin() {
        if (inFlight) {
          return false;
        }
        inFlight = true;
        try {
          return current.apply(this, arguments);
        } finally {
          scheduleUnlock();
        }
      }

      wrappedCommentRequireLogin.__lumoraWrapped = true;
      window.commentRequireLogin = wrappedCommentRequireLogin;
    }

    function retryWrap() {
      var attempts = 0;
      function tick() {
        attempts += 1;
        wrapCommentRequireLogin();
        if (attempts < 10 && (!window.commentRequireLogin || !window.commentRequireLogin.__lumoraWrapped)) {
          setTimeout(tick, 300);
        }
      }
      tick();
    }

    retryWrap();
    window.addEventListener("load", retryWrap);
  })();

  // ==============================
  // GIF 이미지 루프 강제 (emoticon 포함)
  // ==============================
  (function () {
    var GIF_IMG_SELECTOR = [
      'figure[data-ke-type="emoticon"] img[src*=".gif"]',
      'img[data-filename$=".gif"]',
      'img[src*=".gif"]'
    ].join(', ');
    var DEFAULT_INTERVAL = 5000;

    function getOriginalSrc(img) {
      if (!img) return null;
      var stored = img.getAttribute('data-lumora-original-src');
      if (stored) return stored;
      var current = img.currentSrc || img.getAttribute('src');
      if (!current) return null;
      var cleaned = current.replace(/([?&])lumoraLoop=\d+/g, '').replace(/([?&])lumoraCache=\d+/g, '');
      img.setAttribute('data-lumora-original-src', cleaned);
      return cleaned;
    }

    function ensureEmoticonFlag(img) {
      if (!img || typeof img.closest !== 'function') return;
      var figure = img.closest('figure[data-ke-type="emoticon"]');
      if (!figure) return;
      if (figure.getAttribute('data-emoticon-isanimation') !== 'true') {
        figure.setAttribute('data-emoticon-isanimation', 'true');
      }
      figure.setAttribute('data-lumora-emoticon', 'looped');
    }

    function toggleGif(img) {
      var base = getOriginalSrc(img);
      if (!base) return;
      var glue = base.indexOf('?') >= 0 ? '&' : '?';
      img.src = base + glue + 'lumoraLoop=' + Date.now();
    }

    function computeInterval(img) {
      var attr = img.getAttribute('data-lumora-loop-ms') || (img.dataset ? img.dataset.lumoraLoopMs : null);
      var ms = attr ? parseInt(attr, 10) : NaN;
      if (!isFinite(ms) || ms < 500) ms = DEFAULT_INTERVAL;
      return ms;
    }

    function detach(img) {
      if (!img) return;
      if (img.__lumoraGifLoopTimer) {
        clearTimeout(img.__lumoraGifLoopTimer);
        img.__lumoraGifLoopTimer = null;
      }
      if (img.__lumoraGifLoopObserver) {
        img.__lumoraGifLoopObserver.disconnect();
        img.__lumoraGifLoopObserver = null;
      }
      img.__lumoraGifLoopAttached = false;
    }

    function attach(img) {
      if (!img || img.__lumoraGifLoopAttached) return;
      ensureEmoticonFlag(img);
      var interval = computeInterval(img);
      var visible = true;

      function schedule() {
        if (!visible) return;
        img.__lumoraGifLoopTimer = window.setTimeout(function () {
          if (!img.isConnected) {
            detach(img);
            return;
          }
          toggleGif(img);
          schedule();
        }, interval);
      }

      img.__lumoraGifLoopAttached = true;
      schedule();

      if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            var nowVisible = entry.isIntersecting && entry.intersectionRatio > 0;
            if (!nowVisible) {
              visible = false;
              if (img.__lumoraGifLoopTimer) {
                clearTimeout(img.__lumoraGifLoopTimer);
                img.__lumoraGifLoopTimer = null;
              }
            } else if (!visible) {
              visible = true;
              schedule();
            }
          });
        }, { threshold: 0.05 });
        observer.observe(img);
        img.__lumoraGifLoopObserver = observer;
      }
    }

    function process(root) {
      var list = (root || document).querySelectorAll(GIF_IMG_SELECTOR);
      list.forEach(function (img) {
        if (!img.getAttribute('src')) return;
        attach(img);
      });
    }

    process(document);

    var target = document.querySelector('#detail_page') || document.querySelector('.article') || document.body;
    if (target && typeof MutationObserver === 'function') {
      var mo = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
          mutation.addedNodes.forEach(function (node) {
            if (node.nodeType !== 1) return;
            if (node.matches && node.matches(GIF_IMG_SELECTOR)) {
              attach(node);
            } else if (node.querySelectorAll) {
              process(node);
            }
          });
          mutation.removedNodes.forEach(function (node) {
            if (node.nodeType !== 1) return;
            if (node.matches && node.matches(GIF_IMG_SELECTOR)) {
              detach(node);
            } else if (node.querySelectorAll) {
              node.querySelectorAll(GIF_IMG_SELECTOR).forEach(detach);
            }
          });
        });
      });
      mo.observe(target, { childList: true, subtree: true });
    }
  })();

  // ==============================
  // GIF 영상 루프 보정
  // ==============================
  (function () {
    var TARGET_SELECTOR = ".article .contents_style video, .contents_style video, #content video";

    function isGifVideo(videoEl) {
      if (!videoEl) return false;

      function hasGifKeyword(value) {
        if (!value) return false;
        return String(value).toLowerCase().indexOf("gif") !== -1;
      }

      function elementHasGifAttr(el, names) {
        if (!el || typeof el.getAttribute !== "function") return false;
        for (var idx = 0; idx < names.length; idx++) {
          if (hasGifKeyword(el.getAttribute(names[idx]))) {
            return true;
          }
        }
        return false;
      }

      if (videoEl.getAttribute('data-force-loop') === 'true') {
        return true;
      }
      if (typeof videoEl.closest === "function") {
        var forceLoopHost = videoEl.closest('[data-force-loop="true"]');
        if (forceLoopHost) {
          return true;
        }
      }

      var candidateAttrNames = [
        "data-original",
        "data-original-src",
        "data-original-format",
        "data-stream-type",
        "data-format",
        "data-file-type",
        "poster",
        "src"
      ];
      if (elementHasGifAttr(videoEl, candidateAttrNames)) {
        return true;
      }

      if (videoEl.dataset) {
        for (var key in videoEl.dataset) {
          if (!Object.prototype.hasOwnProperty.call(videoEl.dataset, key)) continue;
          if (hasGifKeyword(videoEl.dataset[key])) {
            return true;
          }
        }
      }

      if (typeof videoEl.closest === "function") {
        var figureEl = videoEl.closest('figure');
        if (figureEl) {
          var figureAttrNames = [
            "data-original-format",
            "data-origin-format",
            "data-ke-format",
            "data-ke-mime",
            "data-file-type"
          ];
          if (elementHasGifAttr(figureEl, figureAttrNames)) {
            return true;
          }
          if (figureEl.dataset) {
            for (var fKey in figureEl.dataset) {
              if (!Object.prototype.hasOwnProperty.call(figureEl.dataset, fKey)) continue;
              if (hasGifKeyword(figureEl.dataset[fKey])) {
                return true;
              }
            }
          }
        }
      }

      if (typeof videoEl.querySelectorAll === "function") {
        var sources = videoEl.querySelectorAll('source');
        for (var j = 0; j < sources.length; j++) {
          if (elementHasGifAttr(sources[j], ["data-original", "data-original-src", "type", "src"])) {
            return true;
          }
        }
      }

      var noControls = !videoEl.hasAttribute('controls') && !videoEl.controls;
      var muted = videoEl.hasAttribute('muted') || videoEl.muted || videoEl.getAttribute('data-muted') === 'true';
      var autoPlayLike = videoEl.hasAttribute('autoplay') || videoEl.autoplay || videoEl.getAttribute('data-autoplay') === 'true' || videoEl.getAttribute('data-keep-play') === 'true';
      var inlinePlay = videoEl.hasAttribute('playsinline') || videoEl.hasAttribute('webkit-playsinline') || videoEl.getAttribute('data-ke-play-inline') === 'true';
      var className = videoEl.className || '';
      var gifClassHint = typeof className === 'string' && hasGifKeyword(className);

      if (gifClassHint) {
        return true;
      }

      if (noControls && (muted || inlinePlay) && (autoPlayLike || inlinePlay)) {
        return true;
      }

      return false;
    }

    var LOOP_NEAR_END_THRESHOLD = 0.12;

    function isNearEnd(video) {
      if (!video || !video.duration || !isFinite(video.duration)) return false;
      return video.currentTime >= video.duration - LOOP_NEAR_END_THRESHOLD;
    }

    function ensureLoopAttributes(video) {
      if (!video) return;
      if (!video.hasAttribute('loop')) {
        video.setAttribute('loop', 'loop');
      }
      video.loop = true;
      if (!video.hasAttribute('playsinline')) {
        video.setAttribute('playsinline', 'playsinline');
      }
      if (!video.hasAttribute('webkit-playsinline')) {
        video.setAttribute('webkit-playsinline', 'webkit-playsinline');
      }
      if (!video.hasAttribute('preload')) {
        video.setAttribute('preload', 'auto');
      }
    }

    function attachLoopHandlers(video) {
      if (!video) return function () {};
      if (typeof video.__lumoraLoopCleanup === 'function') {
        video.__lumoraLoopCleanup();
      }

      var releaseRestartTimer = null;
      var isRestarting = false;

      function safePlay() {
        var playPromise = video.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(function () {});
        }
      }

      function scheduleRestartUnlock() {
        if (releaseRestartTimer) {
          clearTimeout(releaseRestartTimer);
        }
        releaseRestartTimer = setTimeout(function () {
          isRestarting = false;
          releaseRestartTimer = null;
        }, 120);
      }

      function restartPlayback() {
        if (isRestarting) return;
        isRestarting = true;
        try {
          if (video.ended || video.currentTime > 0.05) {
            try {
              video.currentTime = 0;
            } catch (err) {}
          }
        } finally {
          safePlay();
          scheduleRestartUnlock();
        }
      }

      function onEnded() {
        restartPlayback();
      }

      function onPause() {
        if (video.ended || isNearEnd(video)) {
          restartPlayback();
        }
      }

      function onTimeUpdate() {
        if (isNearEnd(video)) {
          restartPlayback();
        }
      }

      function onStalled() {
        if (video.paused) {
          restartPlayback();
        }
      }

      video.addEventListener('ended', onEnded);
      video.addEventListener('pause', onPause);
      video.addEventListener('webkitendfullscreen', onEnded);
      video.addEventListener('stalled', onStalled);
      video.addEventListener('timeupdate', onTimeUpdate);

      video.__lumoraLoopCleanup = function () {
        video.removeEventListener('ended', onEnded);
        video.removeEventListener('pause', onPause);
        video.removeEventListener('webkitendfullscreen', onEnded);
        video.removeEventListener('stalled', onStalled);
        video.removeEventListener('timeupdate', onTimeUpdate);
        if (releaseRestartTimer) {
          clearTimeout(releaseRestartTimer);
          releaseRestartTimer = null;
        }
        isRestarting = false;
      };

      return restartPlayback;
    }

    function cleanupLoop(video) {
      if (!video) return;
      if (typeof video.__lumoraLoopCleanup === 'function') {
        video.__lumoraLoopCleanup();
        delete video.__lumoraLoopCleanup;
      }
    }

    function applyLoop() {
      $(TARGET_SELECTOR).each(function () {
        var video = this;

        if (!isGifVideo(video)) {
          cleanupLoop(video);
          return;
        }

        ensureLoopAttributes(video);
        video.setAttribute('data-lumora-gif-loop', 'true');

        var restartPlayback = attachLoopHandlers(video);

        if (video.ended || video.paused || isNearEnd(video)) {
          restartPlayback();
        }
      });
    }

    applyLoop();
    var observerTarget =
      document.querySelector("#detail_page") || document.querySelector(".article") || document.body;
    if (!observerTarget || typeof MutationObserver !== "function") {
      return;
    }
    var scheduled = false;
    var observer = new MutationObserver(function () {
      if (scheduled) return;
      scheduled = true;
      setTimeout(function () {
        scheduled = false;
        applyLoop();
      }, 150);
    });
    observer.observe(observerTarget, { childList: true, subtree: true });
  })();

  // ==============================
  // Mobile: move comment toggle button into bottom post button bar
  // ==============================
  (function () {
    if (!document.body || document.body.id !== "tt-body-page") return;
    if (!window.matchMedia || !window.matchMedia("(max-width:1024px)").matches) return;

    var $btn = $(".m-comment-btn").first();
    var $toggle = $("#m-comment-toggle").first();
    if (!$btn.length || !$toggle.length) return;

    var $postbtn = $("#detail_page .container_postbtn .postbtn_like").first();
    if (!$postbtn.length) return;
    if ($btn.closest(".container_postbtn").length) return;

    var $reaction = $postbtn.find('[id^="reaction-"]').first();
    if ($reaction.length) {
      $btn.insertAfter($reaction);
      return;
    }

    var $share = $postbtn.find(".wrap_btn_share").first();
    if ($share.length) {
      $btn.insertBefore($share);
      return;
    }

    $postbtn.prepend($btn);
  })();

  // ==============================
  // Mobile: show subscribe button on top post bar
  // ==============================
  (function () {
    if (!document.body || document.body.id !== "tt-body-page") return;
    if (!window.matchMedia) return;

    var media = window.matchMedia("(max-width:1024px)");
    if (!media.matches) return;

    function normalizeText(text) {
      return String(text || "")
        .replace(/\s+/g, " ")
        .trim();
    }

    function findSubscribeInPostButtons() {
      var selector = [
        "#detail_page .container_postbtn .btn_subscribe",
        '#detail_page .container_postbtn [data-tistory-react-app*="Subscribe"]',
        '#detail_page .container_postbtn [data-tistory-react-app*="subscribe"]',
        '#detail_page .container_postbtn a[href*="subscribe"]',
        '#detail_page .container_postbtn a[href*="follow"]',
        '#detail_page .container_postbtn a[class*="subscribe"]',
        '#detail_page .container_postbtn button[class*="subscribe"]',
        '#detail_page .container_page a[href*="subscribe"]',
        '#detail_page .container_page a[href*="follow"]'
      ].join(", ");

      var $el = $(selector).first();
      if ($el.length) return $el;

      // Fallback: 티스토리 구독 버튼이 .btn_menu_toolbar로 들어오는 경우(클래스에 subscribe가 없음)
      $el = $("#detail_page .container_postbtn .btn_menu_toolbar, #detail_page .container_postbtn a, #detail_page .container_postbtn button")
        .filter(function () {
          var text = normalizeText(this.textContent);
          if (!text) return false;
          if (text.indexOf("구독") !== -1) return true;
          var lower = text.toLowerCase();
          return lower.indexOf("subscribe") !== -1 || lower.indexOf("follow") !== -1;
        })
        .first();

      return $el;
    }

    function resolveClickable($el) {
      if (!$el || !$el.length) return $();
      if ($el.is("a, button")) return $el;
      var $clickable = $el.find("a, button").first();
      return $clickable.length ? $clickable : $el;
    }

    function escapeRegExp(value) {
      return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    function cleanSubscribeLabel($subscribe, $bar) {
      if (!$subscribe || !$subscribe.length) return;
      if (!$bar || !$bar.length) return;

      var blogTitle = normalizeText($bar.find(".m-postbar__title").first().text());
      if (!blogTitle) return;

      var blogTitleLower = blogTitle.toLowerCase();
      var titleRx = new RegExp(escapeRegExp(blogTitle), "ig");

      function cleanupText(raw) {
        var t = normalizeText(String(raw || ""));
        if (!t) return "";
        t = normalizeText(t.replace(titleRx, ""));
        t = t.replace(/^[\s|·•\-]+/g, "").replace(/[\s|·•\-]+$/g, "").trim();
        return t;
      }

      var $state = $subscribe.find(".txt_state").first();
      if ($state.length) {
        var rawState = normalizeText($state.text());
        var cleanedState = cleanupText(rawState);
        if (cleanedState && cleanedState !== rawState) {
          $state.text(cleanedState);
        }
      }

      $subscribe.contents().each(function () {
        if (this.nodeType !== 3) return;
        var t = normalizeText(this.nodeValue);
        if (!t) return;

        var lower = t.toLowerCase();
        if (lower === blogTitleLower) {
          this.nodeValue = "";
          return;
        }

        if (lower.indexOf(blogTitleLower) !== -1) {
          var cleaned = cleanupText(t);
          if (cleaned !== t) this.nodeValue = cleaned;
        }
      });

      $subscribe.find("*").each(function () {
        if (!this || (this.children && this.children.length)) return;
        var t = normalizeText(this.textContent);
        if (!t) return;
        if (t.toLowerCase() === blogTitleLower) {
          this.style.setProperty("display", "none", "important");
        }
      });
    }

    function apply() {
      if (!document.body || document.body.id !== "tt-body-page") return;
      if (!media.matches) return;

      var $bar = $(".m-postbar").first();
      if (!$bar.length) return;

      var $subscribeRaw = findSubscribeInPostButtons();
      if (!$subscribeRaw.length) return;

      var $subscribe = resolveClickable($subscribeRaw);
      if (!$subscribe.length) return;

      if ($subscribe.closest(".m-postbar").length) return;

      $subscribe.addClass("m-postbar__subscribe");
      cleanSubscribeLabel($subscribe, $bar);

      var $search = $bar.find(".m-postbar__icon").first();
      if ($search.length) {
        $subscribe.insertBefore($search);
      } else {
        $bar.append($subscribe);
      }
    }

    var scheduled = false;
    function scheduleApply() {
      if (scheduled) return;
      scheduled = true;
      setTimeout(function () {
        scheduled = false;
        apply();
      }, 120);
    }

    scheduleApply();
    $(window).on("load", scheduleApply);

    var target =
      document.querySelector("#detail_page .container_postbtn") ||
      document.querySelector("#detail_page") ||
      document.body;
    if (!target || typeof MutationObserver !== "function") return;

    var observer = new MutationObserver(function () {
      scheduleApply();
    });
    observer.observe(target, { childList: true, subtree: true });
  })();

  // ==============================
  // Mobile: like (reaction) pop animation
  // ==============================
  (function () {
    if (!document.body || document.body.id !== "tt-body-page") return;
    if (!window.matchMedia || !window.matchMedia("(max-width:1024px)").matches) return;

    var WRAP_SELECTOR = '#detail_page .container_postbtn [id^="reaction-"]';
    var CLICK_SELECTOR =
      WRAP_SELECTOR + " .btn_post, " + WRAP_SELECTOR + " a, " + WRAP_SELECTOR + " button";

    function hasActiveHint($el) {
      if (!$el || !$el.length) return false;
      if ($el.hasClass("on") || $el.hasClass("active")) return true;
      if ($el.hasClass("empathy_up") || $el.hasClass("empathy_up_without_ani")) return true;
      return $el.attr("aria-pressed") === "true";
    }

    function isLikedByDom($wrap) {
      if (!$wrap || !$wrap.length) return false;
      if (hasActiveHint($wrap)) return true;
      return (
        $wrap.find('[aria-pressed="true"], .on, .active, .empathy_up, .empathy_up_without_ani').length > 0
      );
    }

    function getCount($wrap) {
      if (!$wrap || !$wrap.length) return null;

      var $countEl = $wrap.find(".uoc-count, .count").first();
      var $labelEl = $wrap.find(".txt_like").first();

      var raw = "";
      if ($countEl.length) raw = String($countEl.text() || "");
      else if ($labelEl.length) raw = String($labelEl.text() || "");
      else return null;

      var digits = raw.replace(/[^\d]/g, "");
      if (!digits) return 0;
      var n = parseInt(digits, 10);
      if (isNaN(n)) return null;
      return n;
    }

    function animate($wrap) {
      if (!$wrap || !$wrap.length) return;
      var el = $wrap[0];
      $wrap.removeClass("lumora-like-animate");
      void el.offsetWidth;
      $wrap.addClass("lumora-like-animate");

      if (el.__lumoraLikeTimer) {
        clearTimeout(el.__lumoraLikeTimer);
      }
      el.__lumoraLikeTimer = setTimeout(function () {
        $wrap.removeClass("lumora-like-animate");
        el.__lumoraLikeTimer = null;
      }, 700);
    }

    function setLikedClass($wrap, liked) {
      if (!$wrap || !$wrap.length) return;
      $wrap.toggleClass("lumora-liked", !!liked);
    }

    function syncInitial() {
      $(WRAP_SELECTOR).each(function () {
        var $wrap = $(this);
        setLikedClass($wrap, isLikedByDom($wrap));
      });
    }

    syncInitial();
    $(window).on("load", syncInitial);

    (function observeReactionRender() {
      var target =
        document.querySelector("#detail_page .container_postbtn") ||
        document.querySelector("#detail_page") ||
        document.body;
      if (!target || typeof MutationObserver !== "function") return;

      var scheduled = false;
      var observer = new MutationObserver(function () {
        if (scheduled) return;
        scheduled = true;
        setTimeout(function () {
          scheduled = false;
          syncInitial();
        }, 120);
      });
      observer.observe(target, { childList: true, subtree: true });
    })();

    $(document)
      .off("click.lumoraLikeAnim", CLICK_SELECTOR)
      .on("click.lumoraLikeAnim", CLICK_SELECTOR, function () {
        var $clicked = $(this);
        var $wrap = $clicked.closest('[id^="reaction-"]');
        if (!$wrap.length) return;

        var wasLiked = $wrap.hasClass("lumora-liked") || isLikedByDom($wrap);
        var beforeCount = getCount($wrap);

        var el = $wrap[0];
        if (el.__lumoraLikeSyncTimer) {
          clearTimeout(el.__lumoraLikeSyncTimer);
        }

        var attempts = 0;

        function trySync() {
          attempts += 1;

          var afterCount = getCount($wrap);
          var domLiked = isLikedByDom($wrap);

          var nextLiked = null;
          if (domLiked) {
            nextLiked = true;
          } else if (beforeCount != null && afterCount != null) {
            if (afterCount > beforeCount) nextLiked = true;
            if (afterCount < beforeCount) nextLiked = false;
          }

          if (nextLiked === null) {
            if (attempts < 3) {
              el.__lumoraLikeSyncTimer = setTimeout(trySync, 220);
              return;
            }
            el.__lumoraLikeSyncTimer = null;
            setLikedClass($wrap, domLiked);
            if (!wasLiked && domLiked) {
              animate($wrap);
            }
            return;
          }

          el.__lumoraLikeSyncTimer = null;
          setLikedClass($wrap, nextLiked);
          if (!wasLiked && nextLiked) {
            animate($wrap);
          }
        }

        el.__lumoraLikeSyncTimer = setTimeout(trySync, 220);
      });
  })();

  // ==============================
  // Mobile: lock background scroll when comment overlay is open
  // ==============================
  (function () {
    if (!document.body || document.body.id !== "tt-body-page") return;
    if (!window.matchMedia || !window.matchMedia("(max-width:1024px)").matches) return;

    var $toggle = $("#m-comment-toggle").first();
    if (!$toggle.length) return;

    function sync() {
      var isOpen = !!$toggle.prop("checked");
      $("html").toggleClass("m-lock-scroll", isOpen);
      $("body").toggleClass("m-lock-scroll", isOpen);
    }

    $toggle.off(".lockScroll").on("change.lockScroll", sync);
    sync();
  })();

  // ==============================
  // Mobile: comment count badge/header
  // ==============================
  (function () {
    if (!document.body || document.body.id !== "tt-body-page") return;
    if (!$(".m-comment-count--btn, .m-comment-count--header").length) return;

    function getCommentCount() {
      var $list = $("#detail_page .commentlist");
      if (!$list.length) return 0;
      return $list.find('li[id^="comment"]').length;
    }

    function render() {
      var count = getCommentCount();
      var text = count > 0 ? String(count) : "";
      $(".m-comment-count--btn").text(text);
      $(".m-comment-count--header").text(text);
    }

    render();
    $(window).on("load", render);

    var target =
      document.querySelector("#detail_page .commentlist") ||
      document.querySelector("#detail_page") ||
      document.body;
    if (!target || typeof MutationObserver !== "function") return;

    var scheduled = false;
    var observer = new MutationObserver(function () {
      if (scheduled) return;
      scheduled = true;
      setTimeout(function () {
        scheduled = false;
        render();
      }, 100);
    });
    observer.observe(target, { childList: true, subtree: true });
  })();

  // ==============================
  // Mobile: hide comment "more" menu for non-owner
  // - 티스토리 댓글 HTML에는 비로그인(ROLE=guest)이어도 deleteComment 링크가 내려올 수 있어
  //   모바일 UI에서 혼란을 줄이기 위해 (블로그 소유자 계정이 아닐 때) 더보기 버튼을 숨김
  (function () {
    if (!document.body || document.body.id !== "tt-body-page") return;
    if (!window.matchMedia || !window.matchMedia("(max-width:1024px)").matches) return;

    var role = (window.T && window.T.config && window.T.config.ROLE) ? String(window.T.config.ROLE) : "";
    var isOwner = role === "owner" || role === "admin" || role === "manager";
    if (isOwner) return;

    var SELECTOR = [
      "#detail_page .m-comments-overlay .commentlist .control .modify",
      "#detail_page .m-comments-overlay .commentlist .control .address"
    ].join(", ");

    function hide(root) {
      if (!root || !root.querySelectorAll) return;
      var nodes = root.querySelectorAll(SELECTOR);
      for (var i = 0; i < nodes.length; i++) {
        var el = nodes[i];
        if (!el || el.__lumoraHiddenMore) continue;
        el.__lumoraHiddenMore = true;
        el.style.setProperty("display", "none", "important");
      }
    }

    hide(document);
    window.addEventListener("load", function () {
      setTimeout(function () { hide(document); }, 200);
    });

    var target =
      document.querySelector("#detail_page .commentlist") ||
      document.querySelector("#detail_page") ||
      document.body;
    if (!target || typeof MutationObserver !== "function") return;

    var scheduled = false;
    var observer = new MutationObserver(function () {
      if (scheduled) return;
      scheduled = true;
      setTimeout(function () {
        scheduled = false;
        hide(document);
      }, 120);
    });
    observer.observe(target, { childList: true, subtree: true });
  })();

  // Mobile: hide empty ad placeholders
  // - 광고가 로드되지 않아 빈 박스로 남는 영역 제거
  // ==============================
  (function () {
    if (!document.body || document.body.id !== "tt-body-page") return;
    if (!window.matchMedia || !window.matchMedia("(max-width:1024px)").matches) return;

    var AD_SELECTOR = [
      "#detail_page ins.adsbygoogle",
      "#detail_page ins.kakao_ad_area",
      "#detail_page ins[data-ad-client]",
      "#detail_page ins[data-ad-adfit-unit]",
      '#detail_page div[data-tistory-react-app="NaverAd"]'
    ].join(", ");

    function normalizeText(text) {
      return String(text || "")
        .replace(/\s+/g, " ")
        .trim();
    }

    function hasMeaningfulChild(el) {
      if (!el) return false;
      if (el.querySelector && el.querySelector("iframe, img, video")) return true;

      var nodes = el.childNodes || [];
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        if (n.nodeType === 1) {
          var tag = (n.tagName || "").toLowerCase();
          if (tag === "script" || tag === "style" || tag === "noscript") continue;
          if ((n.offsetWidth || 0) > 0 && (n.offsetHeight || 0) > 0) return true;
          if (normalizeText(n.textContent)) return true;
        } else if (n.nodeType === 3) {
          if (normalizeText(n.textContent)) return true;
        }
      }
      return false;
    }

    function shouldHide(el) {
      if (!el) return false;

      var status = el.getAttribute ? el.getAttribute("data-ad-status") : null;
      if (status === "filled") return false;
      if (status === "unfilled") return true;

      if (el.querySelector && el.querySelector("iframe")) return false;
      if (hasMeaningfulChild(el)) return false;

      var rect = el.getBoundingClientRect ? el.getBoundingClientRect() : null;
      var height = rect ? rect.height : el.offsetHeight;
      var width = rect ? rect.width : el.offsetWidth;

      return height >= 40 && width >= 100;
    }

    function hide(el) {
      if (!el || el.__lumoraAdHidden) return;
      el.__lumoraAdHidden = true;
      el.style.setProperty("display", "none", "important");
      el.style.setProperty("margin", "0", "important");
      el.style.setProperty("padding", "0", "important");
      el.style.setProperty("height", "0", "important");
    }

    function scan() {
      var nodes = document.querySelectorAll(AD_SELECTOR);
      for (var i = 0; i < nodes.length; i++) {
        var el = nodes[i];
        if (shouldHide(el)) hide(el);
      }
    }

    scan();
    window.addEventListener("load", function () {
      // give ad scripts a chance to render before deciding it's empty
      setTimeout(scan, 900);
      setTimeout(scan, 2500);
      setTimeout(scan, 5200);
    });

    var target = document.querySelector("#detail_page") || document.body;
    if (!target || typeof MutationObserver !== "function") return;

    var scheduled = false;
    var observer = new MutationObserver(function () {
      if (scheduled) return;
      scheduled = true;
      setTimeout(function () {
        scheduled = false;
        scan();
      }, 250);
    });
    observer.observe(target, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-ad-status", "style", "class"]
    });
  })();

  // ==============================
  // Mobile: related posts summary (fetch og:description)
  // - 티스토리 관련글 치환자에는 summary가 없어 JS로 채움
  // ==============================
  (function () {
    if (!document.body || document.body.id !== "tt-body-page") return;
    if (!window.matchMedia || !window.matchMedia("(max-width:1024px)").matches) return;

    var $links = $('#detail_page .area_related .list_related a.link_related');
    if (!$links.length) return;

    var memoryCache = Object.create(null);
    var MAX_ITEMS = 6;

    function normalizeText(text) {
      return String(text || "")
        .replace(/\s+/g, " ")
        .trim();
    }

    function removeNodes(root, selector) {
      if (!root || !root.querySelectorAll) return;
      var nodes = root.querySelectorAll(selector);
      for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        if (node && node.parentNode) node.parentNode.removeChild(node);
      }
    }

    function looksLikeCode(text) {
      var t = String(text || "");
      if (!t) return false;
      if (t.indexOf("/*") !== -1 || t.indexOf("*/") !== -1) return true;

      var compact = t.replace(/\s+/g, "");
      if (!compact) return false;

      // Lots of typical code tokens (braces/semicolons/etc.)
      var suspicious = (compact.match(/[{};<>]/g) || []).length;
      if (suspicious >= 3 && suspicious / compact.length > 0.06) return true;

      // CSS-ish patterns
      if (/#[-_a-zA-Z0-9]+\s*\{/.test(t)) return true;
      if (/\.[-_a-zA-Z0-9]+\s*\{/.test(t)) return true;
      if (/--[-_a-zA-Z0-9]+\s*:/.test(t)) return true;

      return false;
    }

    function extractDescriptionFromHtml(html) {
      if (!html) return "";
      try {
        var parser = new DOMParser();
        var doc = parser.parseFromString(html, "text/html");

        // NOTE: This blog's meta description is blog-wide (not entry-specific),
        // so we prefer extracting from the actual post content.
        var contentRoot =
          doc.querySelector("#detail_page .article .contents_style") ||
          doc.querySelector(".article .contents_style") ||
          doc.querySelector(".contents_style");

        var desc = "";

        if (contentRoot) {
          // Remove code blocks and non-text embeds so we can mimic Tistory list summaries.
          var root = contentRoot.cloneNode(true);
          removeNodes(root, "pre, code, script, style, iframe, noscript");

          var blocks = root.querySelectorAll("p, li, blockquote, h1, h2, h3, h4");

          function pickFromBlocks(minLen) {
            for (var i = 0; i < blocks.length; i++) {
              var t = normalizeText(blocks[i].textContent);
              if (!t) continue;
              if (t.length < minLen) continue;
              if (looksLikeCode(t)) continue;
              return t;
            }
            return "";
          }

          desc = pickFromBlocks(30) || pickFromBlocks(10);

          if (!desc) {
            desc = normalizeText(root.textContent);
          }

          if (looksLikeCode(desc)) desc = "";
        }

        if (!desc) {
          var meta =
            doc.querySelector('meta[property="og:description"]') ||
            doc.querySelector('meta[name="description"]') ||
            doc.querySelector('meta[property="description"]');
          desc = normalizeText(meta ? meta.getAttribute("content") : "");
        }

        if (desc.length > 140) desc = desc.slice(0, 140) + "...";
        return desc;
      } catch (e) {
        return "";
      }
    }

    function fetchDescription(url, done) {
      if (!url) return done("");
      if (memoryCache[url]) return done(memoryCache[url]);

      function onSuccess(html) {
        var desc = extractDescriptionFromHtml(html);
        if (desc) memoryCache[url] = desc;
        done(desc);
      }

      function onFail() {
        done("");
      }

      if (typeof fetch === "function") {
        fetch(url, { method: "GET", credentials: "omit" })
          .then(function (res) {
            if (!res || !res.ok) throw new Error("fetch failed");
            return res.text();
          })
          .then(onSuccess)
          .catch(onFail);
        return;
      }

      $.get(url).done(onSuccess).fail(onFail);
    }

    $links.each(function (index) {
      if (index >= MAX_ITEMS) return false;

      var $a = $(this);
      var href = $a.attr("href");
      if (!href) return;

      var $desc = $a.find(".desc_related");
      if (!$desc.length) {
        var $title = $a.find(".txt_related");
        $desc = $('<span class="desc_related"></span>');
        if ($title.length) $desc.insertAfter($title);
        else $a.append($desc);
      }

      if (normalizeText($desc.text())) return;

      fetchDescription(href, function (desc) {
        if (!desc) return;
        if (!normalizeText($desc.text())) $desc.text(desc);
      });
    });
  })();
});
