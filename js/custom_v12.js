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
  // TOC 생성/스크롤 하이라이트 (겹침 방지 클램프 포함)
  // ==============================
  var toc = $("#detail_page .article .tableofcontents");
  var tableOfContent = $(".article .contents_style");
  var content = $("#detail_page .comment");
  var cb = content.offset() ? content.offset().top : 0;
  var tocheight = 100;

  if (tableOfContent.length > 0 && toc.length) {
    tableOfContent.find("h1").addClass("target");
    tableOfContent.find("h2").addClass("target");
    tableOfContent.find("h3").addClass("target");
    tableOfContent.find("h4").addClass("target");

    var target = tableOfContent.find(".target");
    if (target.length > 0) {
      var targetHight = [];
      for (var i = 0; i < target.length; i++) {
        toc.append("<p>" + target.eq(i).text() + "</p>");
        // 각 타겟의 화면 기준 Y축 값을 미리 보관
        targetHight.push(target.eq(i).offset().top);
      }

      var targetp = toc.find("p");
      if (targetp.length) targetp.eq(0).addClass("on");
      tocheight = toc.innerHeight();

      $(targetp).on("click", function () {
        var idx = $(this).index();
        targetp.removeClass("on");
        $(this).addClass("on");
        if (targetHight[idx] != null) {
          $("html, body").animate({ scrollTop: targetHight[idx] }, 500);
        }
      });

      $(window).on("scroll", function () {
        var scroll = $(window).scrollTop();
        var maxTop = cb ? Math.max(0, cb - tocheight) : 0; // 댓글 박스 위까지만

        if (cb) {
          if (scroll < maxTop) {
            toc.css("top", scroll);
          } else {
            toc.css("top", maxTop);
          }
        }

        if (targetHight.length > 0) {
          if (scroll <= targetHight[0] - 50 && scroll >= 0) {
            targetp.removeClass("on");
            targetp.eq(0).addClass("on");
          }
          for (var j = 1; j < targetp.length; j++) {
            if (scroll <= targetHight[j] && scroll >= targetHight[j - 1]) {
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
});

