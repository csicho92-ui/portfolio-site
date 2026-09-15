#!/usr/bin/env node
// 사용법: node tools/build.js  → index.html, projects/<slug>/index.html 생성
const fs = require('fs');
const path = require('path');
const C = require('./content.js');

const ROOT = path.join(__dirname, '..');
const esc = (s) => String(s).replace(/&(?![a-z#0-9]+;)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const strip = (s) => String(s).replace(/<[^>]+>/g, '');
const kindClass = { work: '', personal: 'personal', contest: 'contest', study: 'study' };

const ICON = {
  arrowDown: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14M5 12l7 7 7-7"/></svg>',
  arrowRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
  blog: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h11a3 3 0 0 1 3 3v11H7a3 3 0 0 1-3-3V5Z"/><path d="M8 9h7M8 13h7M8 17h4"/></svg>',
  notion: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4h16v16H4z"/><path d="M8 8v8M8 8l8 8V8"/></svg>',
  pdf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12m0 0-4-4m4 4 4-4"/><path d="M5 17v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2"/></svg>',
};

function head({ title, desc, url, rel, ogImage }) {
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
${url ? `<meta property="og:url" content="${esc(url)}">\n<link rel="canonical" href="${esc(url)}">` : ''}
<meta property="og:image" content="${esc(ogImage)}">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
<link rel="stylesheet" href="${rel}assets/style.css">
</head>
<body>
<a class="skip" href="#main">본문으로 건너뛰기</a>
`;
}

function thumb(p, rel, big) {
  // 이미지 파일: images/<slug>.jpg (없으면 텍스트 대체 표시). 교체 방법은 README 참고.
  return `<figure class="thumb${big ? '' : ''}">
  <img src="${rel}images/${p.slug}.jpg" alt="${esc(strip(p.short))} 결과물 이미지" loading="${big ? 'eager' : 'lazy'}" width="1600" height="${big ? 900 : 1000}">
  <figcaption><b>${esc(p.thumbTitle)}</b>${esc(p.thumbSub)}</figcaption>
</figure>`;
}

/* ---------------- 메인 페이지 (다크 · 영상 카드 템플릿) ---------------- */
const HOME_CSS = `
:root{--bg:#0b0d14;--fg:#eef1f8;--muted:#9aa3b8;--line:rgba(255,255,255,.1);--card:rgba(255,255,255,.04);--accent:#7c9cff;--accent2:#c98fff;--nav:64px}
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth;scroll-padding-top:var(--nav)}
body{font-family:'Pretendard Variable','Pretendard','Segoe UI',system-ui,-apple-system,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;background:var(--bg);color:var(--fg);line-height:1.6;overflow-x:hidden;-webkit-font-smoothing:antialiased;word-break:keep-all}
img,video{display:block;max-width:100%}
a{color:inherit}
ul{list-style:none}
:focus-visible{outline:2px solid var(--accent);outline-offset:3px;border-radius:4px}
.skip{position:absolute;left:-999px;top:8px;z-index:40;padding:8px 14px;background:var(--accent);color:#000;border-radius:8px}
.skip:focus{left:8px}
#fx{position:fixed;inset:0;z-index:30;pointer-events:none}
[hidden]{display:none!important}
.todo{background:rgba(255,214,102,.18);color:#ffd666;padding:0 6px;border-radius:4px;font-weight:600;font-size:.92em}

/* 상단 고정 내비게이션 */
header{position:fixed;top:0;left:0;right:0;z-index:20;height:var(--nav);display:flex;align-items:center;padding:0 clamp(16px,5vw,64px);background:rgba(11,13,20,.7);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-bottom:1px solid var(--line)}
nav{display:flex;justify-content:space-between;align-items:center;width:100%;max-width:1200px;margin:0 auto;gap:16px}
.logo{font-weight:800;letter-spacing:.1em;text-decoration:none;white-space:nowrap}
nav ul{display:flex;gap:clamp(12px,3vw,32px)}
nav li a{position:relative;text-decoration:none;font-size:14px;color:var(--muted);padding:6px 0;transition:color .2s;white-space:nowrap}
nav li a::after{content:"";position:absolute;left:0;right:0;bottom:0;height:2px;background:linear-gradient(90deg,var(--accent),var(--accent2));transform:scaleX(0);transform-origin:left;transition:transform .3s}
nav li a:hover,nav li a[aria-current]{color:var(--fg)}
nav li a[aria-current]::after{transform:scaleX(1)}

/* 공통 레이아웃 */
section{position:relative;padding:clamp(80px,14vh,140px) clamp(16px,5vw,64px);overflow:hidden}
.wrap{position:relative;z-index:1;max-width:1200px;margin:0 auto}
h2{font-size:clamp(28px,4vw,48px);letter-spacing:-.02em;margin-bottom:12px}
.sub{color:var(--muted);margin-bottom:48px;max-width:600px}
.wm{position:absolute;right:-2vw;top:8%;font-size:clamp(100px,22vw,320px);font-weight:900;line-height:1;color:transparent;-webkit-text-stroke:1px rgba(255,255,255,.07);user-select:none;pointer-events:none}
[data-speed]{will-change:transform}
.tags{display:flex;flex-wrap:wrap;gap:8px}
.tags li{font-size:12px;padding:4px 10px;border:1px solid var(--line);border-radius:999px;color:var(--muted)}
.btn{display:inline-flex;align-items:center;gap:8px;padding:14px 28px;border-radius:999px;text-decoration:none;font-weight:600;font-size:15px;border:0;cursor:pointer;font-family:inherit;transition:transform .2s,box-shadow .2s}
.btn.primary{background:linear-gradient(90deg,var(--accent),var(--accent2));color:#0b0d14}
.btn.ghost{border:1px solid var(--line);background:var(--card);color:var(--fg)}
.btn:hover{transform:translateY(-2px);box-shadow:0 10px 30px rgba(124,156,255,.25)}

/* 스크롤 등장 */
.reveal{opacity:0;transform:translateY(24px);transition:opacity .7s ease,transform .7s ease}
.reveal.in{opacity:1;transform:none}
.stagger>:nth-child(2){transition-delay:.1s}.stagger>:nth-child(3){transition-delay:.2s}.stagger>:nth-child(4){transition-delay:.3s}
.no-js .reveal{opacity:1;transform:none}

/* 홈 */
.hero{min-height:100svh;display:flex;align-items:center;padding-top:calc(var(--nav) + 40px)}
.blob{position:absolute;border-radius:50%;filter:blur(80px);opacity:.45;pointer-events:none}
.b1{width:50vw;height:50vw;max-width:600px;max-height:600px;background:var(--accent);top:-10%;right:-10%}
.b2{width:40vw;height:40vw;max-width:480px;max-height:480px;background:var(--accent2);bottom:-10%;left:-10%}
.eyebrow{color:var(--accent);font-weight:600;letter-spacing:.2em;font-size:13px;text-transform:uppercase;margin-bottom:16px}
h1{font-size:clamp(38px,7vw,88px);line-height:1.12;letter-spacing:-.03em;font-weight:800;word-break:keep-all;text-wrap:balance}
h1 span{background:linear-gradient(90deg,var(--accent),var(--accent2));-webkit-background-clip:text;background-clip:text;color:transparent}
.lead{margin:24px 0;font-size:clamp(16px,2vw,20px);color:var(--muted);max-width:640px;word-break:keep-all}
.lead strong{color:var(--fg);font-weight:600}
.hero .tags{margin-bottom:40px}
.cta{display:flex;flex-wrap:wrap;gap:12px}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,200px),1fr));gap:12px;margin-top:56px;max-width:900px}
.stats a{display:block;padding:18px 20px;border:1px solid var(--line);border-radius:16px;background:var(--card);text-decoration:none;transition:transform .3s,border-color .3s}
.stats a:hover{transform:translateY(-4px);border-color:rgba(124,156,255,.5)}
.stats b{display:block;font-size:clamp(22px,2.4vw,30px);letter-spacing:-.02em;font-variant-numeric:tabular-nums;background:linear-gradient(90deg,var(--accent),var(--accent2));-webkit-background-clip:text;background-clip:text;color:transparent}
.stats small{display:block;color:var(--muted);font-size:13px;margin-top:4px}

/* 포트폴리오: 카드 */
.filters{display:flex;flex-wrap:wrap;gap:8px;margin:-24px 0 32px}
.filter{font:inherit;font-size:13px;padding:8px 14px;border-radius:999px;border:1px solid var(--line);background:transparent;color:var(--muted);cursor:pointer;transition:all .2s}
.filter:hover{color:var(--fg);border-color:rgba(255,255,255,.3)}
.filter[aria-pressed="true"]{background:var(--fg);color:var(--bg);border-color:var(--fg)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr));gap:24px}
.card{display:flex;flex-direction:column;border:1px solid var(--line);border-radius:20px;background:var(--card);overflow:hidden;transition:transform .3s,border-color .3s,opacity .7s}
.card:hover{transform:translateY(-6px);border-color:rgba(124,156,255,.5)}
.card.hide{display:none}
@media(min-width:900px){.card.featured{grid-column:span 2}}
.thumb{position:relative;display:block;width:100%;aspect-ratio:16/9;border:0;padding:0;background:radial-gradient(120% 120% at 100% 0%,rgba(124,156,255,.28),transparent 55%),radial-gradient(100% 100% at 0% 100%,rgba(201,143,255,.22),transparent 55%),#0f1220;cursor:pointer;overflow:hidden;font:inherit;color:inherit;text-align:left}
.thumb img{width:100%;height:100%;object-fit:cover;transition:transform .5s}
.card:hover .thumb img{transform:scale(1.04)}
.play{position:absolute;inset:0;display:grid;place-items:center;background:linear-gradient(transparent 55%,rgba(0,0,0,.65))}
.play b{width:56px;height:56px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.92);color:#000;font-size:18px;padding-left:4px;box-shadow:0 8px 24px rgba(0,0,0,.4);transition:transform .3s}
.thumb:hover .play b,.thumb:focus-visible .play b{transform:scale(1.1)}
.play small{position:absolute;left:16px;bottom:14px;font-size:12px;color:#fff;opacity:.85}
.tile{position:relative;display:block;aspect-ratio:16/9;overflow:hidden;text-decoration:none;background:radial-gradient(120% 120% at 100% 0%,rgba(124,156,255,.28),transparent 55%),radial-gradient(100% 100% at 0% 100%,rgba(201,143,255,.22),transparent 55%),#0f1220}
.tile img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.tile img.broken,.thumb img.broken{display:none}
.tile .num{position:absolute;left:24px;bottom:22px;right:24px}
.tile .num b{display:block;font-size:clamp(26px,3vw,40px);letter-spacing:-.03em;line-height:1.05;font-variant-numeric:tabular-nums}
.tile .num small{display:block;color:var(--muted);font-size:13px;margin-top:6px}
.tile .k{position:absolute;left:20px;top:18px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--accent);font-weight:700}
.tile.has-img .num,.tile.has-img .k{text-shadow:0 2px 12px rgba(0,0,0,.7)}
.tile.has-img::after{content:"";position:absolute;inset:0;background:linear-gradient(transparent 40%,rgba(0,0,0,.7))}
.tile.has-img .num{z-index:1}
.body{padding:20px 24px 24px;display:flex;flex-direction:column;gap:12px;flex:1}
.kind{display:inline-flex;align-items:center;gap:8px;font-size:12px;color:var(--muted)}
.kind i{font-style:normal;padding:2px 8px;border-radius:999px;border:1px solid rgba(124,156,255,.35);background:rgba(124,156,255,.1);color:var(--accent);font-weight:600}
.kind i.personal{border-color:rgba(255,196,102,.35);background:rgba(255,196,102,.1);color:#ffc466}
.kind i.contest{border-color:rgba(255,128,171,.35);background:rgba(255,128,171,.1);color:#ff80ab}
.kind i.study{border-color:rgba(201,143,255,.35);background:rgba(201,143,255,.1);color:var(--accent2)}
.card h3{font-size:20px;line-height:1.3}
.card h3 a{text-decoration:none}
.card h3 a:hover{color:var(--accent)}
.desc{color:var(--muted);font-size:15px}
.role{font-size:13px;color:var(--accent)}
.result{font-size:14px;font-weight:600;color:var(--fg);padding-left:12px;border-left:2px solid var(--accent)}
.result small{display:block;color:var(--muted);font-size:12px;margin-top:2px}
.links{display:flex;flex-wrap:wrap;gap:6px 16px;margin-top:auto;padding-top:8px;font-size:14px}
.links a{color:var(--muted);text-decoration:none;border-bottom:1px solid transparent;transition:color .2s,border-color .2s}
.links a:hover{color:var(--fg);border-color:var(--accent)}
.links a.more{color:var(--fg);font-weight:600}

/* 자기소개 */
.cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));gap:24px}
@media(min-width:900px){.cols{grid-template-columns:1fr 1fr}}
.panel{padding:28px;border:1px solid var(--line);border-radius:20px;background:var(--card)}
.panel h3{font-size:13px;letter-spacing:.15em;color:var(--accent);text-transform:uppercase;margin-bottom:20px}
.tl li{position:relative;padding-left:20px;margin-bottom:20px;border-left:1px solid var(--line)}
.tl li::before{content:"";position:absolute;left:-5px;top:9px;width:9px;height:9px;border-radius:50%;background:var(--accent)}
.tl time{display:block;font-size:12px;color:var(--muted)}
.tl strong{display:block;font-size:16px}
.tl p{color:var(--muted);font-size:14px}
.tl .award{display:inline-block;margin-left:6px;font-size:11px;padding:1px 8px;border-radius:999px;background:rgba(255,128,171,.12);color:#ff80ab;border:1px solid rgba(255,128,171,.35);vertical-align:2px}
.stack{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px}
.stack li{font-size:13px;padding:6px 12px;border-radius:8px;background:rgba(124,156,255,.1);border:1px solid rgba(124,156,255,.25)}
.stack-label{font-size:12px;color:var(--muted);margin-bottom:8px}
.values li{margin-bottom:14px}
.values strong{display:block;margin-bottom:2px;font-weight:600;font-size:15px}
.values p{color:var(--muted);font-size:14px}
.values a{color:var(--accent);text-decoration:none;font-size:13px}
.values a:hover{text-decoration:underline}

/* 연락처 */
.contact .wrap{text-align:center}
.contact .sub{margin:0 auto 40px}
.clist{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));gap:16px;max-width:960px;margin:0 auto}
.clist a,.clist button{display:flex;flex-direction:column;align-items:center;gap:6px;padding:28px 20px;border:1px solid var(--line);border-radius:20px;background:var(--card);text-decoration:none;color:inherit;font:inherit;cursor:pointer;transition:transform .3s,border-color .3s,opacity .7s}
.clist a:hover,.clist button:hover{transform:translateY(-4px);border-color:rgba(124,156,255,.5)}
.clist span{font-size:26px}
.clist strong{font-size:16px}
.clist small{color:var(--muted);font-size:13px;word-break:break-all}
.copy-status{min-height:1.5em;margin-top:18px;font-size:14px;color:var(--muted)}
.copy-status.ok{color:var(--accent)}
footer{padding:32px;text-align:center;color:var(--muted);font-size:13px;border-top:1px solid var(--line)}

/* 영상 크게 보기 */
dialog{border:0;padding:0;background:#000;border-radius:16px;width:min(96vw,1100px);max-width:none;overflow:hidden;color:var(--fg)}
dialog::backdrop{background:rgba(0,0,0,.85);backdrop-filter:blur(6px)}
dialog .frame{position:relative;width:100%;aspect-ratio:16/9;background:#000}
dialog .frame.vertical{aspect-ratio:16/9}
dialog iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
dialog .close{position:absolute;top:10px;right:10px;z-index:1;width:40px;height:40px;border:0;border-radius:50%;background:rgba(0,0,0,.5);color:#fff;font-size:22px;line-height:1;cursor:pointer}
dialog .cap{padding:14px 18px;font-size:14px;color:var(--muted);display:flex;flex-wrap:wrap;gap:8px 16px;align-items:center}
dialog .cap a{color:var(--accent);text-decoration:none}

@media(prefers-reduced-motion:reduce){
  html{scroll-behavior:auto}
  *,*::before,*::after{transition:none!important;animation:none!important}
  .reveal{opacity:1;transform:none}
  [data-speed]{transform:none!important}
  #fx{display:none}
}
`;

const HOME_JS = `
document.documentElement.classList.remove('no-js');
const rm = matchMedia('(prefers-reduced-motion: reduce)').matches;
const hover = matchMedia('(hover: hover)').matches;
const $ = (s, r = document) => r.querySelectorAll(s);

/* 1. 현재 섹션 메뉴 하이라이트 */
const links = [...$('nav li a')];
const navIO = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  links.forEach(a => a.hash === '#' + e.target.id ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current'));
}), { rootMargin: '-40% 0px -55% 0px' });
$('section').forEach(s => navIO.observe(s));

/* 2. 스크롤 등장 (첫 화면에 이미 보이는 요소는 즉시 표시) */
const revealIO = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); revealIO.unobserve(e.target); }
}), { threshold: .12 });
$('.reveal').forEach(el => { if (el.getBoundingClientRect().top < innerHeight) el.classList.add('in'); else revealIO.observe(el); });

/* 3. 패럴랙스: 화면에 보이는 섹션의 [data-speed] 요소만 이동 */
if (!rm) {
  const seen = new Set();
  const secIO = new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? seen.add(e.target) : seen.delete(e.target)));
  $('section').forEach(s => secIO.observe(s));
  let tick = false;
  const parallax = () => {
    tick = false;
    seen.forEach(s => {
      const r = s.getBoundingClientRect();
      const d = r.top + r.height / 2 - innerHeight / 2;
      $('[data-speed]', s).forEach(el => el.style.transform = 'translate3d(0,' + (d * el.dataset.speed) + 'px,0)');
    });
  };
  addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(parallax); } }, { passive: true });
  parallax();
}

/* 4. 마우스 파티클 잔상 (canvas + rAF, 파티클 없으면 루프 정지) */
if (!rm && hover) {
  const cv = document.getElementById('fx'), ctx = cv.getContext('2d');
  let ps = [], raf = 0;
  const size = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  size(); addEventListener('resize', size);
  const loop = () => {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    ps = ps.filter(p => (p.life -= .025) > 0);
    for (const p of ps) {
      p.x += p.vx; p.y += p.vy; p.vy += .03;
      ctx.globalAlpha = p.life; ctx.fillStyle = p.c;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    raf = ps.length ? requestAnimationFrame(loop) : 0;
  };
  addEventListener('pointermove', e => {
    for (let i = 0; i < 3; i++) ps.push({ x: e.clientX, y: e.clientY, vx: (Math.random() - .5) * 2, vy: (Math.random() - .5) * 2, r: 2 + Math.random() * 3, life: 1, c: Math.random() < .5 ? '#7c9cff' : '#c98fff' });
    if (ps.length > 240) ps.splice(0, ps.length - 240);
    if (!raf) raf = requestAnimationFrame(loop);
  }, { passive: true });
}

/* 5. 분야 필터 */
$('.filter').forEach(btn => btn.addEventListener('click', () => {
  const f = btn.dataset.filter;
  $('.filter').forEach(b => b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'));
  $('.card').forEach(c => { const show = f === 'all' || c.dataset.field === f; c.classList.toggle('hide', !show); if (show) c.classList.add('in'); });
}));

/* 6. 영상 크게 보기 (<dialog> + YouTube) */
const dlg = document.getElementById('player'), frame = dlg.querySelector('.frame'), cap = dlg.querySelector('.cap');
const open = (id, title, url) => {
  frame.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0" title="' + title.replace(/"/g, '&quot;') + '" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>';
  cap.innerHTML = '<span>' + title + '</span>' + (url ? '<a href="' + url + '" target="_blank" rel="noopener">YouTube에서 열기 ↗</a>' : '');
  dlg.showModal();
};
$('.thumb[data-yt]').forEach(b => b.addEventListener('click', () => open(b.dataset.yt, b.dataset.title, b.dataset.url)));
dlg.addEventListener('close', () => { frame.innerHTML = ''; });
dlg.addEventListener('click', e => e.target === dlg && dlg.close());
dlg.querySelector('.close').addEventListener('click', () => dlg.close());

/* 7. 이메일 복사 */
const copyBtn = document.getElementById('copy-email'), status = document.getElementById('copy-status');
if (copyBtn) copyBtn.addEventListener('click', () => {
  const t = copyBtn.dataset.email;
  const ok = () => { status.textContent = '이메일 주소를 복사했습니다: ' + t; status.className = 'copy-status ok'; };
  const fail = () => { status.textContent = '자동 복사가 되지 않았습니다. 주소를 직접 선택해 복사해 주세요: ' + t; status.className = 'copy-status'; };
  (navigator.clipboard && navigator.clipboard.writeText) ? navigator.clipboard.writeText(t).then(ok, fail) : fail();
});

/* 8. 이미지 없으면 숫자 타일만 보이도록 */
$('.tile img, .thumb img').forEach(img => {
  const t = img.closest('.tile, .thumb');
  const mark = () => t.classList.add('has-img'), broken = () => { img.classList.add('broken'); t.classList.remove('has-img'); };
  if (img.complete) { img.naturalWidth > 0 ? mark() : broken(); }
  img.addEventListener('load', mark); img.addEventListener('error', broken);
});
`;

function buildIndex() {
  const S = C.site, I = C.intro;
  const url = S.baseUrl ? S.baseUrl.replace(/\/$/, '') + '/' : '';
  const title = `${S.name} | ${S.role}`;
  const desc = strip(I.headline) + ' ' + strip(I.sub[0]);
  const yt = (id) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  const ytUrl = (id) => `https://www.youtube.com/watch?v=${id}`;

  const cards = C.projects.map((p) => {
    const media = p.videos && p.videos.length
      ? `<button class="thumb" data-yt="${p.videos[0].id}" data-title="${esc(strip(p.short))} — ${esc(p.videos[0].label)}" data-url="${ytUrl(p.videos[0].id)}" aria-label="${esc(strip(p.short))} 영상 크게 보기">
            <img src="${yt(p.videos[0].id)}" alt="" loading="lazy" width="480" height="360">
            <span class="play"><b>▶</b><small>${esc(p.videos[0].label)}</small></span>
          </button>`
      : `<a class="tile" href="projects/${p.slug}/" aria-label="${esc(strip(p.short))} 자세히 보기">
            <img src="images/${p.slug}.jpg" alt="" loading="lazy" width="1600" height="900">
            <span class="k">${esc(p.fieldLabel)}</span>
            <span class="num"><b>${esc(p.thumbTitle)}</b><small>${esc(p.thumbSub)}</small></span>
          </a>`;
    const extra = (p.videos || []).slice(1).map((v) => `<a href="#" data-yt="${v.id}" data-title="${esc(strip(p.short))} — ${esc(v.label)}" data-url="${ytUrl(v.id)}" class="thumb-link">${esc(v.label)} ▶</a>`).join('');
    const ext = (p.links || []).filter((l) => !/노션 원본|숏폼 예시|수상작 영상|숏폼 ·/.test(l.label)).map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener" title="새 창에서 열림">${esc(l.label)} ↗</a>`).join('');
    return `
        <article class="card reveal${p.featured ? ' featured' : ''}" data-field="${p.field}">
          ${media}
          <div class="body">
            <p class="kind"><i class="${kindClass[p.kind]}">${esc(p.kindLabel)}</i><span>${esc(p.period)}</span></p>
            <h3><a href="projects/${p.slug}/">${esc(p.short)}</a></h3>
            <p class="desc">${esc(p.hook)}</p>
            <p class="result">${esc(p.resultShort)}</p>
            <p class="links"><a class="more" href="projects/${p.slug}/">자세히 보기 →</a>${extra}${ext}</p>
          </div>
        </article>`;
  }).join('\n');

  const stack = `<ul class="stack">${['Photoshop','Illustrator','CapCut','Gemini · ChatGPT · Claude','인스타그램','네이버 블로그','Meta Ads','네이버 검색광고','Excel','Notion','HTML / CSS / JS','React · Next.js','Expo','Claude Code'].map((x) => `<li>${x}</li>`).join('')}</ul>`;
  const career = C.about.history.filter((h) => /필국제무역|행정조교/.test(h.title));
  const edu = C.about.history.filter((h) => !/필국제무역|행정조교/.test(h.title));
  const tl = (arr) => arr.map((h) => `<li><time>${esc(h.time)}</time><strong>${esc(h.title)}${h.award ? `<span class="award">${esc(h.award)}</span>` : ''}</strong>${h.org ? `<p>${esc(h.org.split(' · ')[0])}</p>` : ''}</li>`).join('');

  let h = `<!DOCTYPE html>
<html lang="ko" class="no-js">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
${url ? `<meta property="og:url" content="${esc(url)}">\n<link rel="canonical" href="${esc(url)}">` : ''}
<meta property="og:image" content="${esc(url)}images/og.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
<style>${HOME_CSS}</style>
</head>
<body>
<a class="skip" href="#home">본문으로 건너뛰기</a>
<canvas id="fx" aria-hidden="true"></canvas>

<header>
  <nav aria-label="주 메뉴">
    <a class="logo" href="#home">SOOIN.</a>
    <ul>
      <li><a href="#home">홈</a></li>
      <li><a href="#portfolio">포트폴리오</a></li>
      <li><a href="#about">자기소개</a></li>
      <li><a href="#contact">연락처</a></li>
    </ul>
  </nav>
</header>

<main>
  <!-- 홈 -->
  <section id="home" class="hero">
    <div class="blob b1" data-speed="0.35"></div>
    <div class="blob b2" data-speed="-0.2"></div>
    <div class="wrap">
      <p class="eyebrow reveal">Content Marketer · ${esc(S.name)}</p>
      <h1 class="reveal">고객의 말을<br><span>콘텐츠로 번역</span>하는<br>마케터입니다.</h1>
      <p class="lead reveal">7년간 하루 50건의 고객 문의를 들었고, 그 데이터로 SNS 팔로워를 10개월 만에 10배로 키웠습니다.</p>
      <ul class="tags reveal">${I.keywords.map((k) => `<li>${esc(k)}</li>`).join('')}</ul>
      <div class="cta reveal">
        <a class="btn primary" href="#portfolio">포트폴리오 보기 →</a>
        <a class="btn ghost" href="mailto:${esc(S.email)}">이메일 보내기</a>
        <a class="btn ghost" href="${esc(S.resume.file)}" download${S.resume.ready ? '' : ' hidden'}>이력서 다운로드</a>
      </div>
      <div class="stats reveal">
        ${I.metrics.map((m) => `<a href="projects/${m.slug}/"><b>${esc(m.num)}</b><small>${esc(m.desc)}</small></a>`).join('\n        ')}
      </div>
    </div>
  </section>

  <!-- 포트폴리오 -->
  <section id="portfolio">
    <div class="wm" data-speed="-0.15" aria-hidden="true">WORK</div>
    <div class="wrap">
      <h2 class="reveal">Portfolio</h2>
      <p class="sub reveal">과정과 측정 기준은 각 카드의 상세 페이지에 있습니다.</p>
      <div class="filters reveal" role="group" aria-label="분야별 필터">
        <button class="filter" type="button" data-filter="all" aria-pressed="true">전체</button>
        ${C.fields.map((f) => `<button class="filter" type="button" data-filter="${f.key}" aria-pressed="false">${esc(f.label)}</button>`).join('')}
      </div>
      <div class="grid stagger">
${cards}
      </div>
    </div>
  </section>

  <!-- 자기소개 -->
  <section id="about">
    <div class="wm" data-speed="0.15" aria-hidden="true">ABOUT</div>
    <div class="wrap">
      <h2 class="reveal">About</h2>
      <p class="sub reveal">운영 → CS → 영업지원 → SNS · 광고까지, 고객 접점에서 얻은 데이터로 콘텐츠를 만듭니다.</p>
      <div class="cols stagger">
        <div class="panel reveal">
          <h3>경력</h3>
          <ul class="tl">${tl(career)}</ul>
        </div>
        <div class="panel reveal">
          <h3>스킬</h3>
          ${stack}
        </div>
        <div class="panel reveal">
          <h3>수상 · 교육 · 학력</h3>
          <ul class="tl">${tl(edu)}</ul>
        </div>
        <div class="panel reveal">
          <h3>일하는 방식</h3>
          <ul class="values">
            ${C.approach.map((a) => `<li><strong>${esc(a.title)}</strong><a href="projects/${a.cases[0].slug}/">${esc(a.cases[0].label)} →</a></li>`).join('')}
          </ul>
        </div>
      </div>
    </div>
  </section>

  <!-- 연락처 -->
  <section id="contact" class="contact">
    <div class="wm" data-speed="-0.15" aria-hidden="true">HELLO</div>
    <div class="wrap">
      <h2 class="reveal">Contact</h2>
      <p class="sub reveal">포지션 이야기, 자료 요청, 커피챗 모두 환영합니다. 보통 당일 안에 답장합니다.</p>
      <div class="clist stagger">
        <a class="reveal" href="mailto:${esc(S.email)}?subject=${encodeURIComponent('[채용] 조수인 콘텐츠 마케터 포지션 관련')}"><span>✉️</span><strong>이메일 보내기</strong><small>${esc(S.email)}</small></a>
        <button class="reveal" type="button" id="copy-email" data-email="${esc(S.email)}"><span>📋</span><strong>이메일 복사</strong><small>클립보드에 주소 복사</small></button>
        ${S.channels.map((c) => `<a class="reveal" href="${esc(c.url)}" target="_blank" rel="noopener" title="새 창에서 열림"><span>${c.icon === 'blog' ? '✍️' : '🗂️'}</span><strong>${esc(c.label)}</strong><small>${esc(c.sub)}</small></a>`).join('\n        ')}
        <a class="reveal" href="${esc(S.resume.file)}" download${S.resume.ready ? '' : ' hidden'}><span>📄</span><strong>이력서</strong><small>PDF 다운로드</small></a>
      </div>
      <p class="copy-status" id="copy-status" role="status" aria-live="polite"></p>
    </div>
  </section>
</main>

<footer>© 2026 ${esc(S.name)} · Built with vanilla HTML / CSS / JS</footer>

<dialog id="player">
  <button class="close" aria-label="닫기">×</button>
  <div class="frame"></div>
  <p class="cap"></p>
</dialog>

<script>${HOME_JS}
/* 카드 하단의 추가 영상 링크 */
$('.thumb-link').forEach(a => a.addEventListener('click', e => { e.preventDefault(); open(a.dataset.yt, a.dataset.title, a.dataset.url); }));
</script>
</body>
</html>
`;
  fs.writeFileSync(path.join(ROOT, 'index.html'), h);
}

/* ---------------- 상세 페이지 ---------------- */
function section(id, title, items, kind, slug) {
  if (!items || !items.length) return '';
  let body;
  if (kind === 'results') {
    body = `<ul class="result-list">${items.map((r) => `<li><b>${r.b}</b><span class="basis">${r.basis}</span></li>`).join('')}</ul>`;
  } else if (kind === 'gallery') {
    body = `<div class="gallery">${items.map((g, i) => `<figure class="thumb"><img src="../../images/${slug}-${i + 1}.jpg" alt="${esc(g)}" loading="lazy" width="1200" height="900"><figcaption><b>${esc(g)}</b>이미지 준비 중</figcaption></figure>`).join('')}</div>`;
  } else if (kind === 'p') {
    body = items.map((t) => `<p>${t}</p>`).join('');
  } else {
    body = `<ul>${items.map((t) => `<li>${t}</li>`).join('')}</ul>`;
  }
  return `<section aria-labelledby="${id}-h"><h2 id="${id}-h">${esc(title)}</h2>${body}</section>`;
}

function buildProject(p, idx) {
  const S = C.site, D = p.detail;
  const rel = '../../';
  const base = S.baseUrl ? S.baseUrl.replace(/\/$/, '') : '';
  const url = base ? `${base}/projects/${p.slug}/` : '';
  const title = `${strip(p.short)} — ${S.name} 포트폴리오`;
  const desc = `${strip(p.problem)} · 성과: ${strip(p.result)}`;
  const prev = C.projects[idx - 1], next = C.projects[idx + 1];
  let h = head({ title, desc, url, rel, ogImage: (base ? base + '/' : '../../') + `images/${p.slug}.jpg` });

  h += `
<header class="nav">
  <div class="wrap">
    <a class="brand" href="${rel}index.html">${esc(S.name)} <span>· ${esc(S.role)}</span></a>
    <nav aria-label="페이지 이동"><a class="back" href="${rel}index.html#projects">← 프로젝트 목록으로</a></nav>
  </div>
</header>

<main id="main">
  <div class="wrap">
    <header class="detail-head">
      <p class="kicker"><span class="kind ${kindClass[p.kind]} tag">${esc(p.kindLabel)}</span><span>${esc(p.fieldLabel)}</span><span aria-hidden="true">·</span><time>${esc(p.period)}</time></p>
      <h1>${esc(p.title)}</h1>
      <dl class="summary">
        <div><dt>기간</dt><dd>${esc(p.period)}</dd></div>
        <div><dt>분야</dt><dd>${esc(p.fieldLabel)}</dd></div>
        <div><dt>역할</dt><dd>${esc(p.role)}</dd></div>
        <div><dt>핵심 결과</dt><dd class="big">${D.summaryResult}</dd></div>
      </dl>
      <div class="hero-figure">${thumb(p, rel, true)}</div>
    </header>

    <article class="article">
      ${section('scope', '참여 범위', D.scope)}
      ${section('background', '배경과 문제', D.background, 'p')}
      ${section('goal', '목표', D.goal)}
      ${section('insight', '타깃과 인사이트', D.insight, 'p')}
      ${section('strategy', '전략', D.strategy)}
      ${section('execution', '실행', D.execution)}
      ${section('results', '성과', D.results, 'results')}
      ${D.limits ? `<p class="callout"><strong>측정 기준과 한계.</strong> ${D.limits}</p>` : ''}
      ${section('retro', '회고', D.retro)}
      ${section('gallery', '결과물', D.gallery, 'gallery', p.slug)}
      ${p.links && p.links.length ? `<section aria-labelledby="links-h"><h2 id="links-h">관련 링크</h2><p class="links-list">${p.links.map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener" title="새 창에서 열림">${esc(l.label)}</a>`).join('')}</p><p class="note">외부 링크는 새 창에서 열립니다.</p></section>` : ''}
    </article>

    <footer class="detail-foot">
      <div class="row">
        <a class="btn btn-secondary" href="${rel}index.html#projects">← 프로젝트 목록으로</a>
        <a class="btn btn-primary" href="mailto:${esc(S.email)}?subject=${encodeURIComponent('[채용] ' + strip(p.short) + ' 프로젝트 관련')}">${ICON.mail} 이메일로 연락하기</a>
      </div>
      <nav class="pager" aria-label="다른 프로젝트">
        ${prev ? `<a href="../${prev.slug}/">← ${esc(prev.short)}</a>` : ''}
        ${next ? `<a href="../${next.slug}/">${esc(next.short)} →</a>` : ''}
      </nav>
    </footer>
  </div>
</main>
<script src="${rel}assets/main.js" defer></script>
</body>
</html>
`;
  const dir = path.join(ROOT, 'projects', p.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), h);
}

buildIndex();
C.projects.forEach(buildProject);
fs.mkdirSync(path.join(ROOT, 'images'), { recursive: true });
console.log('built: index.html + ' + C.projects.length + ' project pages');
