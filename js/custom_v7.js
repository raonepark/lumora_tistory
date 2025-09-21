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
});


