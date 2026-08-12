/* 상담신청 폼 전송 설정
   1) Google Apps Script를 배포한 뒤 그 웹앱 URL을 아래 WEBHOOK_URL에 붙여넣으세요.
   2) 설정 방법은 gas/상담신청_설정가이드.md 파일을 참고하세요.
   3) URL을 설정하지 않으면 브라우저 저장(localStorage)에만 남고 이메일 알림/시트 저장은 되지 않습니다. */
var CONSULT_WEBHOOK_URL = '';

/* 카카오톡 채널 상담 버튼 설정 — 자세한 절차는 gas/카카오톡채널_설정가이드.md 참고. */
var KAKAO_CHANNEL_CHAT_URL = '';

document.addEventListener('DOMContentLoaded', function () {
  var reduceMotionPref = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 움직임 최소화 설정 사용자는 배경 영상을 재생하지 않고 포스터 정지 이미지만 표시
  var autoplayVideos = document.querySelectorAll('.hero-bg, .page-header-video');
  if (reduceMotionPref) {
    autoplayVideos.forEach(function (v) {
      v.pause();
      v.removeAttribute('autoplay');
    });
  }

  // 히어로 배경 영상 2종(주간/노을) 크로스페이드 전환
  var heroVideoA = document.getElementById('heroVideoA');
  var heroVideoB = document.getElementById('heroVideoB');
  if (heroVideoA && heroVideoB && !reduceMotionPref) {
    var current = heroVideoA;
    var next = heroVideoB;
    function swapHeroVideo() {
      next.currentTime = 0;
      next.play();
      next.classList.add('is-active');
      current.classList.remove('is-active');
      var prevCurrent = current;
      current = next;
      next = prevCurrent;
      current.removeEventListener('ended', swapHeroVideo);
      current.addEventListener('ended', swapHeroVideo);
    }
    heroVideoA.addEventListener('ended', swapHeroVideo);
  }

  var kakaoBtn = document.getElementById('kakaoFloat');
  if (kakaoBtn && KAKAO_CHANNEL_CHAT_URL) {
    kakaoBtn.href = KAKAO_CHANNEL_CHAT_URL;
    kakaoBtn.style.display = 'flex';
  }

  var header = document.querySelector('.site-header');
  var toggle = document.querySelector('.mobile-toggle');
  var menu = document.querySelector('.menu');

  window.addEventListener('scroll', function () {
    if (window.scrollY > 8) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  });

  toggle.addEventListener('click', function () {
    menu.classList.toggle('open');
  });

  menu.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () {
      menu.classList.remove('open');
    });
  });

  // 실적현황 탭
  var tabBtns = document.querySelectorAll('.tab-btn');
  var panels = document.querySelectorAll('.tab-panel');
  tabBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      tabBtns.forEach(function (b) { b.classList.remove('active'); });
      panels.forEach(function (p) { p.classList.remove('active'); });
      btn.classList.add('active');
      document.getElementById(btn.dataset.target).classList.add('active');
    });
  });

  // 상담신청 폼
  var consultForm = document.getElementById('consultForm');
  if (consultForm) {
    consultForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var status = document.getElementById('consult-status');
      var submitBtn = consultForm.querySelector('button[type="submit"]');
      var payload = {
        ts: new Date().toISOString(),
        name: consultForm.name.value.trim(),
        phone: consultForm.phone.value.trim(),
        email: consultForm.email.value.trim(),
        field: consultForm.field.value,
        message: consultForm.message.value.trim()
      };

      var existing = JSON.parse(localStorage.getItem('samhwaConsultSubmissions') || '[]');
      existing.push(payload);
      localStorage.setItem('samhwaConsultSubmissions', JSON.stringify(existing));

      if (!CONSULT_WEBHOOK_URL) {
        status.className = 'consult-status';
        status.textContent = '상담 신청이 접수되었습니다. (담당자에게 직접 전달하시려면 041-331-3778로 연락 부탁드립니다)';
        consultForm.reset();
        return;
      }

      submitBtn.disabled = true;
      status.className = 'consult-status';
      status.textContent = '전송 중...';

      fetch(CONSULT_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      })
        .then(function (res) {
          if (!res.ok) throw new Error('전송 실패');
          status.className = 'consult-status success';
          status.textContent = '상담 신청이 정상적으로 접수되었습니다. 빠르게 연락드리겠습니다.';
          consultForm.reset();
        })
        .catch(function () {
          status.className = 'consult-status error';
          status.textContent = '전송 중 문제가 발생했습니다. 전화(041-331-3778) 또는 이메일로 문의해 주세요.';
        })
        .finally(function () {
          submitBtn.disabled = false;
        });
    });
  }

  // 스크롤 등장 효과
  var reveals = document.querySelectorAll('[data-reveal]');
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.style.opacity = 1;
        e.target.style.transform = 'none';
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  reveals.forEach(function (el) {
    el.style.opacity = 0;
    el.style.transform = 'translateY(24px)';
    el.style.transition = 'opacity .6s ease, transform .6s ease';
    io.observe(el);
  });

  // 카드 그리드 순차(스태거) 등장 효과
  var staggerGroups = document.querySelectorAll('[data-reveal-stagger]');
  var stIo = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      Array.prototype.forEach.call(e.target.children, function (child, i) {
        child.style.transitionDelay = Math.min(i * 60, 480) + 'ms';
        child.style.opacity = 1;
        child.style.transform = 'none';
      });
      stIo.unobserve(e.target);
    });
  }, { threshold: 0.1 });
  staggerGroups.forEach(function (group) {
    Array.prototype.forEach.call(group.children, function (child) {
      child.style.opacity = 0;
      child.style.transform = 'translateY(28px)';
      child.style.transition = 'opacity .55s ease, transform .55s ease';
    });
    stIo.observe(group);
  });

  // 증명서 라이트박스
  var lightbox = document.getElementById('certLightbox');
  if (lightbox) {
    var lbImg = document.getElementById('lightboxImg');
    var lbCaption = document.getElementById('lightboxCaption');
    var lbClose = document.getElementById('lightboxClose');
    document.querySelectorAll('[data-lightbox]').forEach(function (el) {
      el.addEventListener('click', function () {
        lbImg.src = el.getAttribute('data-lightbox');
        lbImg.alt = el.getAttribute('data-lightbox-title') || '';
        lbCaption.textContent = el.getAttribute('data-lightbox-title') || '';
        lightbox.classList.add('open');
      });
    });
    function closeLightbox() {
      lightbox.classList.remove('open');
    }
    lbClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeLightbox();
    });
  }

  initCountUp();
});

/* 통계 카운트업 + BB0류 디코드 리빌 */
function initCountUp() {
  var nums = document.querySelectorAll('[data-count], [data-decode]');
  if (!nums.length) return;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var scrambleChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  function animateCount(el) {
    var target = parseFloat(el.textContent.replace(/,/g, ''));
    if (isNaN(target)) return;
    var decimals = (el.textContent.split('.')[1] || '').length;
    if (reduceMotion) { el.textContent = target.toFixed(decimals); return; }
    var start = 0;
    var duration = 1200;
    var t0 = null;
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = start + (target - start) * eased;
      el.textContent = val.toFixed(decimals);
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target.toFixed(decimals);
    }
    requestAnimationFrame(step);
  }

  function animateDecode(el) {
    var final = el.textContent;
    if (reduceMotion) { el.textContent = final; return; }
    var frame = 0;
    var totalFrames = 16;
    var timer = setInterval(function () {
      frame++;
      var out = '';
      for (var i = 0; i < final.length; i++) {
        if (frame > totalFrames * (i + 1) / final.length) out += final[i];
        else out += scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
      }
      el.textContent = out;
      if (frame >= totalFrames) { el.textContent = final; clearInterval(timer); }
    }, 45);
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      if (e.target.hasAttribute('data-count')) animateCount(e.target);
      else animateDecode(e.target);
      io.unobserve(e.target);
    });
  }, { threshold: 0.6 });
  nums.forEach(function (el) { io.observe(el); });
}
