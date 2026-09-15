/* 조수인 포트폴리오 — 공통 스크립트
   JS가 꺼져 있어도 본문·링크는 모두 동작합니다. 여기서는 보조 기능만 다룹니다. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 1) 현재 섹션을 메뉴에 표시 (메인 페이지) */
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav a.link[data-nav]'));
  if (links.length && 'IntersectionObserver' in window) {
    var sections = links.map(function (a) { return document.getElementById(a.getAttribute('data-nav')); }).filter(Boolean);
    var visible = {};
    function setCurrent(id) {
      links.forEach(function (a) {
        if (a.getAttribute('data-nav') === id) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { visible[e.target.id] = e.isIntersecting ? e.intersectionRatio : 0; });
      var best = null, bestRatio = 0;
      sections.forEach(function (s) { if ((visible[s.id] || 0) > bestRatio) { bestRatio = visible[s.id]; best = s.id; } });
      if (best) setCurrent(best);
      else if (window.scrollY < 80) setCurrent(null);
    }, { rootMargin: '-40% 0px -45% 0px', threshold: [0, 0.05, 0.2, 0.5, 1] });
    sections.forEach(function (s) { io.observe(s); });
    links.forEach(function (a) {
      a.addEventListener('click', function () { setCurrent(a.getAttribute('data-nav')); });
    });
  }

  /* 2) 프로젝트 분야 필터 */
  var filters = document.querySelectorAll('.filter');
  var projects = document.querySelectorAll('.project');
  var status = document.getElementById('filter-status');
  filters.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var f = btn.getAttribute('data-filter');
      var count = 0;
      filters.forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
      projects.forEach(function (p) {
        var show = f === 'all' || p.getAttribute('data-field') === f;
        p.classList.toggle('hide', !show);
        if (show) { count++; p.classList.add('in'); }
      });
      if (status) status.textContent = f === 'all' ? '' : btn.textContent.trim() + ' 분야 ' + count + '건';
    });
  });

  /* 3) 등장 모션: 화면 아래에 있는 요소만, 최초 1회 (모션 감소 설정 시 생략) */
  if (!reduce && 'IntersectionObserver' in window) {
    var items = document.querySelectorAll('[data-reveal]');
    var vh = window.innerHeight;
    var pending = [];
    items.forEach(function (el, i) {
      if (el.getBoundingClientRect().top > vh) {
        el.classList.add('reveal');
        pending.push(el);
      }
    });
    if (pending.length) {
      var rio = new IntersectionObserver(function (entries) {
        // 같은 프레임에 들어온 항목은 60ms 간격으로 순차 등장
        var batch = entries.filter(function (e) { return e.isIntersecting; });
        batch.forEach(function (e, i) {
          var el = e.target;
          rio.unobserve(el);
          setTimeout(function () { el.classList.add('in'); }, Math.min(i, 6) * 60);
        });
      }, { rootMargin: '0px 0px -6% 0px' });
      pending.forEach(function (el) { rio.observe(el); });
      // 안전장치: 3초 뒤에도 남아 있으면 모두 표시
      setTimeout(function () { pending.forEach(function (el) { el.classList.add('in'); }); }, 3000);
    }
  }

  /* 4) 이메일 복사 */
  var copyBtn = document.getElementById('copy-email');
  var copyStatus = document.getElementById('copy-status');
  var addr = document.getElementById('email-addr');
  if (copyBtn && addr) {
    copyBtn.addEventListener('click', function () {
      var text = addr.textContent.trim();
      function ok() {
        if (copyStatus) { copyStatus.textContent = '이메일 주소를 복사했습니다: ' + text; copyStatus.className = 'copy-status ok'; }
        copyBtn.textContent = '복사됨';
        setTimeout(function () { copyBtn.textContent = '이메일 복사'; }, 2000);
      }
      function fail() {
        if (copyStatus) { copyStatus.textContent = '자동 복사가 되지 않았습니다. 위 주소를 길게 눌러 직접 복사해 주세요.'; copyStatus.className = 'copy-status err'; }
        try {
          var range = document.createRange(); range.selectNodeContents(addr);
          var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
        } catch (e) { /* 선택 실패는 무시 */ }
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(ok, fail);
      } else { fail(); }
    });
  }

  /* 5) 이미지 로딩 실패 시 대체 텍스트가 보이도록 */
  document.querySelectorAll('.thumb img').forEach(function (img) {
    var fig = img.closest('.thumb');
    function mark() { if (fig) fig.classList.add('has-img'); }
    function broken() { img.classList.add('broken'); if (fig) fig.classList.remove('has-img'); }
    if (img.complete) { if (img.naturalWidth > 0) mark(); else broken(); }
    img.addEventListener('load', mark);
    img.addEventListener('error', broken);
  });
})();
