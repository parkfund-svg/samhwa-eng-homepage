/* 상담신청 폼 전송 설정
   1) Google Apps Script를 배포한 뒤 그 웹앱 URL을 아래 WEBHOOK_URL에 붙여넣으세요.
   2) 설정 방법은 gas/상담신청_설정가이드.md 파일을 참고하세요.
   3) URL을 설정하지 않으면 브라우저 저장(localStorage)에만 남고 이메일 알림/시트 저장은 되지 않습니다. */
var CONSULT_WEBHOOK_URL = '';

/* 카카오톡 채널 상담 버튼 설정
   1) business.kakao.com 에서 카카오톡 채널을 만드세요 (무료, 서버/백엔드 불필요).
   2) 채널 관리자센터 > 채널 정보 > 채널 URL(https://pf.kakao.com/_xxxxx/chat 형태)을 복사해
      아래 KAKAO_CHANNEL_CHAT_URL에 붙여넣으면 우측 하단에 상담 버튼이 자동으로 나타납니다.
   3) 자세한 절차는 gas/카카오톡채널_설정가이드.md 참고. */
var KAKAO_CHANNEL_CHAT_URL = '';

document.addEventListener('DOMContentLoaded', function () {
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

      // 로컬 백업 (구글시트 연동 여부와 무관하게 항상 저장)
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
        .catch(function (err) {
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

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  initLineDraw();
  initCountUp();
  initMagneticButtons(reduceMotion);
  initAmbientCanvas(reduceMotion);
  initBlobParallax(reduceMotion);
});

/* 히어로 회로선 드로잉 리빌 */
function initLineDraw() {
  var lines = document.querySelectorAll('[data-draw]');
  if (!lines.length) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add('drawn');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.3 });
  lines.forEach(function (el) { io.observe(el); });
}

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

/* 매그네틱 CTA 버튼 — 마우스를 따라 살짝 끌리는 효과 */
function initMagneticButtons(reduceMotion) {
  if (reduceMotion) return;
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  var btns = document.querySelectorAll('.btn-magnetic');
  btns.forEach(function (btn) {
    btn.addEventListener('mousemove', function (e) {
      var r = btn.getBoundingClientRect();
      var x = e.clientX - r.left - r.width / 2;
      var y = e.clientY - r.top - r.height / 2;
      btn.style.transform = 'translate(' + (x * 0.28) + 'px,' + (y * 0.32) + 'px)';
    });
    btn.addEventListener('mouseleave', function () {
      btn.style.transform = 'translate(0,0)';
    });
  });
}

/* 앰비언트 캔버스 배경 — 실제 회로기판(PCB) 배선처럼 그리드에 맞춘 트레이스 + 비아 패드 (전기공사 아이덴티티) */
function initAmbientCanvas(reduceMotion) {
  var canvas = document.getElementById('bgCanvas');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var W, H, dpr;
  var GRID = 26;
  var traces = [];
  var vias = []; // [x, y, isPad]

  function buildTraces() {
    traces = [];
    vias = [];
    var cols = Math.ceil(W / GRID);
    var rows = Math.ceil(H / GRID);
    var count = Math.min(70, Math.max(26, Math.round((cols * rows) / 26)));
    var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];

    for (var i = 0; i < count; i++) {
      var gx = Math.floor(Math.random() * cols) * GRID;
      var gy = Math.floor(Math.random() * rows) * GRID;
      var x = gx, y = gy;
      var pts = [[x, y]];
      var lastDir = dirs[Math.floor(Math.random() * 4)];
      var segs = 3 + Math.floor(Math.random() * 4);

      for (var s = 0; s < segs; s++) {
        var dir = Math.random() < 0.4 ? lastDir : dirs[Math.floor(Math.random() * 4)];
        var steps = 1 + Math.floor(Math.random() * 5);
        var nx = Math.max(0, Math.min(W, x + dir[0] * GRID * steps));
        var ny = Math.max(0, Math.min(H, y + dir[1] * GRID * steps));
        if (nx === x && ny === y) continue;

        // 45도 모따기 코너 (실제 PCB 배선처럼)
        if ((dir[0] !== lastDir[0] || dir[1] !== lastDir[1]) && pts.length) {
          var chamfer = Math.min(GRID * 0.7, 14);
          pts.push([x + lastDir[0] * chamfer, y + lastDir[1] * chamfer]);
          pts.push([nx - dir[0] * chamfer, ny - dir[1] * chamfer]);
        }
        pts.push([nx, ny]);
        vias.push([nx, ny, Math.random() < 0.35]);
        x = nx; y = ny; lastDir = dir;
      }
      if (pts.length > 1) {
        traces.push({ pts: pts, phase: Math.random() * Math.PI * 2, speed: 0.3 + Math.random() * 0.4 });
      }
    }
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildTraces();
  }

  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(47,111,216,.20)';
    ctx.lineWidth = 1.1;
    traces.forEach(function (tr) {
      ctx.beginPath();
      tr.pts.forEach(function (p, idx) {
        if (idx === 0) ctx.moveTo(p[0], p[1]);
        else ctx.lineTo(p[0], p[1]);
      });
      ctx.stroke();
    });

    vias.forEach(function (v, i) {
      var glow = 0.35 + 0.3 * Math.sin(t * 0.0005 + i);
      if (v[2]) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(28,79,166,' + (glow * 0.7).toFixed(3) + ')';
        ctx.lineWidth = 1;
        ctx.arc(v[0], v[1], 3.4, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.fillStyle = 'rgba(28,79,166,' + (glow * 0.6).toFixed(3) + ')';
      ctx.arc(v[0], v[1], 1.3, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  resize();
  window.addEventListener('resize', resize);

  if (reduceMotion) { draw(0); return; }

  var running = true;
  document.addEventListener('visibilitychange', function () {
    running = !document.hidden;
    if (running) requestAnimationFrame(loop);
  });

  function loop(t) {
    if (!running) return;
    draw(t);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

/* 블러 그라디언트 블롭 — 스크롤 패럴랙스 */
function initBlobParallax(reduceMotion) {
  var hero = document.querySelector('.hero');
  if (!hero) return;
  var b1 = document.createElement('div');
  b1.className = 'blob blob-blue';
  b1.style.cssText = 'width:420px;height:420px;top:-120px;right:-100px';
  var b2 = document.createElement('div');
  b2.className = 'blob blob-indigo';
  b2.style.cssText = 'width:360px;height:360px;bottom:-140px;left:-80px';
  hero.appendChild(b1);
  hero.appendChild(b2);

  if (reduceMotion) return;

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var y = window.scrollY;
      b1.style.transform = 'translateY(' + (y * 0.12) + 'px)';
      b2.style.transform = 'translateY(' + (y * -0.08) + 'px)';
      ticking = false;
    });
  });
}
