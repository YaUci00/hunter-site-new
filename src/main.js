import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

/* ---------------- smooth scroll ---------------- */
const lenis = new Lenis({ lerp: 0.1 });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);

/* ---------------- hero title pop-in ----------------
   runs first, before anything heavy: the hero copy is hidden by CSS until
   this reveals it, so there is no flash of static text before the pop */
const heroTitle = document.getElementById('heroTitle');
const chars = [];
for (const node of [...heroTitle.childNodes]) {
  if (node.nodeType === Node.TEXT_NODE) {
    const frag = document.createDocumentFragment();
    for (const ch of node.textContent) {
      const span = document.createElement('span');
      span.className = 'ch';
      span.textContent = ch;
      frag.appendChild(span);
      chars.push(span);
    }
    heroTitle.replaceChild(frag, node);
  }
}
gsap.set('.hero__title, .hero__sub, .hero__eyebrow, .hero__photo', { visibility: 'visible' });
gsap.from(chars, {
  y: 60,
  opacity: 0,
  rotation: () => gsap.utils.random(-14, 14),
  scale: 0.3,
  ease: 'back.out(2)',
  duration: 0.7,
  stagger: 0.035,
  delay: 0.15,
});
gsap.from('.hero__sub, .hero__eyebrow', { opacity: 0, y: 20, duration: 0.6, delay: 0.9 });
gsap.from('.hero__photo', {
  scale: 0,
  rotation: () => gsap.utils.random(-40, 40),
  opacity: 0,
  ease: 'back.out(1.6)',
  duration: 0.8,
  stagger: 0.12,
  delay: 0.6,
});
// gentle scroll parallax on hero photos
gsap.utils.toArray('.hero__photo').forEach((el, i) => {
  gsap.to(el, {
    yPercent: (i % 2 === 0 ? -1 : 1) * 30,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });
});

/* ---------------- three.js background, loaded lazily ----------------
   three is ~85% of the bundle; splitting it out lets the hero pop start
   as soon as the small main chunk arrives */
let sceneApi = null;
let wantNight = false;
import('./scene.js').then((m) => {
  sceneApi = m.initScene({ lenis, gsap });
  if (wantNight) sceneApi.setNight(true, true);
});

/* ---------------- venue data (from hunter-site.com/service_01, service_02) ---------------- */
const IMG = '/hs/wp-content/themes/hunter_tmp/img/service/';

/* downscale huge source photos (some are 8000px+) to display size on a canvas —
   works because /hs proxies hunter-site.com same-origin, so no CORS taint */
function shrink(img, max = 800) {
  if (img.dataset.scaled || !img.naturalWidth || img.naturalWidth <= max) return;
  try {
    const c = document.createElement('canvas');
    c.width = max;
    c.height = Math.round((img.naturalHeight / img.naturalWidth) * max);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    c.toBlob(
      (b) => {
        if (!b) return;
        img.dataset.scaled = '1';
        img.src = URL.createObjectURL(b);
      },
      'image/jpeg',
      0.85
    );
  } catch (_) {
    /* leave original src */
  }
}
function autoShrink(img, max) {
  if (img.complete) shrink(img, max);
  img.addEventListener('load', () => shrink(img, max));
}

const CASINOS = [
  { area: 'AKIHABARA', name: 'アキバギルド', copy: 'メイド一人ひとりがアトラクション', img: 'ag-1635.jpg' },
  { area: 'AKIHABARA', name: 'カジノクエスト', copy: '冒険RPG世界のカジノ', img: 'ag-0644.jpg' },
  { area: 'SHIBUYA', name: 'GoodGame Poker Live SHIBUYA', copy: 'Everybody GoodGame!!', img: 'GGSB.png' },
  { area: 'SHIBUYA', name: 'KKLIVE POKER SHIBUYA', copy: 'ポーカーの白熱は加速する', img: 'KKSB.png' },
  { area: 'SHIBUYA', name: 'SHIBUYA de Poker', copy: 'ワンランク上のポーカーとの出会い', img: 'shibuyadepoker.png' },
  { area: 'SHINJUKU', name: 'GoodGame Poker Live SHINJUKU', copy: 'Everybody GoodGame!!', img: 'GGSJ.png' },
  { area: 'SHINJUKU', name: 'KKLIVE POKER SHINJUKU', copy: '近未来サイバー空間のポーカールーム', img: 'KKSJ.png' },
  { area: 'SHINJUKU', name: 'Casino Live TOKYO', copy: "Let's Enjoy! Let's Drink!", img: 'CLT.png' },
  { area: 'IKEBUKURO', name: 'イケブクロギルド', copy: 'メイド一人ひとりがアトラクション', img: 'IG.png' },
  { area: 'NAGOYA', name: 'GoodGame Poker Live NAGOYA', copy: 'Everybody GoodGame!!', img: 'GGNG.png' },
  { area: 'NAGOYA', name: 'ナゴヤギルド', copy: 'メイド一人ひとりがアトラクション', img: 'NG.png' },
  { area: 'KYOTO', name: 'KYOTO de Poker', copy: 'ワンランク上のポーカーとの出会い', img: 'kyotodepoker.png' },
  { area: 'OSAKA', name: 'GoodGame Poker Live OSAKA', copy: 'Everybody GoodGame!!', img: 'GGOS.png' },
  { area: 'OSAKA', name: 'Re:Poker', copy: 'Nothing but Re-entry.', img: 'repoker-resize.png' },
];

const CAFES = [
  { area: 'AKIHABARA', name: '女神の中庭 〜クイーンズコート〜', copy: '清楚で可愛い王道のメイドカフェ', img: 'QC.png' },
  { area: 'AKIHABARA', name: '魔女の箱庭 〜ウィッチズガーデン〜', copy: '森の中で暮らしている魔女の世界', img: 'WG.png' },
  { area: 'AKIHABARA', name: 'バニーズギルド', copy: '本格的な高級バニーガール', img: 'BG.png' },
  { area: 'AKIHABARA', name: 'サキュバスシーシャ 秋葉原LILITH', copy: '魅惑の娘悪魔×シーシャバー', img: 'sbl.png' },
  { area: 'SHINJUKU', name: 'サキュバスシーシャ 新宿ABYSS', copy: '魅惑の娘悪魔×シーシャバー', img: 'SA.png' },
  { area: 'SHINJUKU', name: '電脳サキュバス サイバーシーシャ 歌舞伎町', copy: '電脳世界の娘悪魔×シーシャバー', img: 'CS.png' },
  { area: 'SHINJUKU', name: '龍幻酒家 ドラゴンシーシャ', copy: '幻想的な世界の美しい龍姫', img: 'RS.png' },
  { area: 'SHINJUKU', name: 'シーシャラウンジ KuruMira', copy: '可憐で美しい女神様', img: 'KM.png' },
  { area: 'SHINJUKU', name: 'EDEN', copy: '新宿の真ん中でBBQを楽しめる', img: 'Eden.jpg' },
  { area: 'AKASAKA', name: 'サキュバスシーシャ 赤坂KISS', copy: '魅惑の娘悪魔×シーシャバー', img: 'SK.png' },
  { area: 'IKEBUKURO', name: 'サキュバスシーシャ 池袋WINGS', copy: '魅惑の娘悪魔×シーシャバー', img: 'SW.png' },
  { area: 'IKEBUKURO', name: '幽幻酒家', copy: 'ネオン煌びやかなキョンシーの世界', img: 'YS.png' },
  { area: 'NAGOYA', name: 'ウィッチズアーク', copy: '幸せを運ぶ海の魔女', img: 'WA.png' },
  { area: 'NAGOYA', name: 'サキュバスシーシャ 名古屋TAILS', copy: '魅惑の娘悪魔×シーシャバー', img: 'ST.png' },
  { area: 'NAGOYA', name: 'アラジンシーシャ 名古屋', copy: '千夜一夜の物語を紡ぐ踊り子たち', img: 'AS.png' },
  { area: 'OSAKA', name: 'サキュバスシーシャ 難波MORRIGAN', copy: '魅惑の娘悪魔×シーシャバー', img: 'SM.png' },
  { area: 'OSAKA', name: 'サキュバスシーシャ VIPER 道頓堀', copy: '魅惑の娘悪魔×シーシャバー', img: 'SV.png' },
  { area: 'OSAKA', name: '電脳サキュバス サイバーシーシャ 心斎橋', copy: '電脳世界の娘悪魔×シーシャバー', img: 'SO.png' },
  { area: 'KYOTO', name: 'サキュバスシーシャ 夜伽 京都木屋町', copy: '魅惑の娘悪魔×シーシャバー', img: 'kyoto.png' },
  { area: 'FUKUOKA', name: 'サキュバスシーシャ 博多 WISP', copy: '魅惑の娘悪魔×シーシャバー', img: 'SWP.png' },
];

function renderVenues(list, mountId) {
  const mount = document.getElementById(mountId);
  for (const v of list) {
    const el = document.createElement('article');
    el.className = 'vcard';
    el.innerHTML = `
      <img class="vcard__img" src="${IMG}${v.img}" alt="${v.name}" loading="lazy" decoding="async" />
      <div class="vcard__body">
        <span class="vcard__area">${v.area}</span>
        <h3 class="vcard__name">${v.name}</h3>
        <p class="vcard__copy">${v.copy}</p>
      </div>`;
    autoShrink(el.querySelector('img'));
    mount.appendChild(el);
  }
}
renderVenues(CASINOS, 'casinoGrid');
renderVenues(CAFES, 'cafeGrid');

/* photo strip: mixed people/store shots, duplicated for seamless loop */
const STRIP = ['QC.png', 'GGSB.png', 'WG.png', 'KKSJ.png', 'BG.png', 'ag-1635.jpg', 'RS.png', 'GGOS.png', 'SA.png', 'kyotodepoker.png'];
const strip = document.getElementById('photostrip');
for (const f of [...STRIP, ...STRIP]) {
  const img = document.createElement('img');
  img.src = IMG + f;
  img.alt = '';
  img.loading = 'lazy';
  img.decoding = 'async';
  autoShrink(img, 600);
  strip.appendChild(img);
}
for (const img of document.querySelectorAll('.hero__photo')) autoShrink(img, 600);

/* venue cards: staggered pop-in via IntersectionObserver (CSS transition) */
const io = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.style.transitionDelay = `${(Number(e.target.dataset.i) % 4) * 70}ms`;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      }
    }
  },
  { rootMargin: '0px 0px -10% 0px' }
);
document.querySelectorAll('.vcard').forEach((el, i) => {
  el.dataset.i = i;
  io.observe(el);
});

/* ---------------- fade-up on scroll ---------------- */
for (const el of document.querySelectorAll('.fade-up')) {
  gsap.to(el, {
    opacity: 1,
    y: 0,
    duration: 0.9,
    ease: 'power3.out',
    scrollTrigger: { trigger: el, start: 'top 82%' },
  });
}

/* ---------------- theme flip (day -> night -> day) ----------------
   fades a fixed composited overlay instead of animating body background,
   so the flip costs one GPU fade rather than full-page repaints */
const overlay = document.getElementById('nightOverlay');

function toNight() {
  document.body.classList.add('is-night');
  gsap.to(overlay, { opacity: 1, duration: 0.8, ease: 'power2.inOut', overwrite: true });
  wantNight = true;
  if (sceneApi) sceneApi.setNight(true);
}
function toDay() {
  document.body.classList.remove('is-night');
  gsap.to(overlay, { opacity: 0, duration: 0.8, ease: 'power2.inOut', overwrite: true });
  wantNight = false;
  if (sceneApi) sceneApi.setNight(false);
}

/* flip while the ink seam band crosses mid-viewport, so the color swap hides behind it */
ScrollTrigger.create({
  trigger: '.marquee--night',
  start: 'top 60%',
  endTrigger: '.marquee--dawn',
  end: 'bottom 40%',
  onEnter: toNight,
  onLeave: toDay,
  onEnterBack: toNight,
  onLeaveBack: toDay,
});

/* ---------------- anchor smooth scroll via Lenis ---------------- */
for (const a of document.querySelectorAll('a[href^="#"]')) {
  a.addEventListener('click', (e) => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const y = target.getBoundingClientRect().top + window.scrollY - 20;
    lenis.scrollTo(y, { duration: 1.4, immediate: document.hidden });
  });
}

/* ---------------- click FX: shooting-game bursts + score ---------------- */
const fxLayer = document.createElement('div');
fxLayer.id = 'fx';
document.body.appendChild(fxLayer);

const hud = document.createElement('div');
hud.id = 'scoreHud';
hud.textContent = 'SCORE 000000';
document.body.appendChild(hud);
let score = 0;
function addScore(n) {
  score += n;
  hud.textContent = 'SCORE ' + String(score).padStart(6, '0');
  hud.classList.add('is-on');
  gsap.fromTo(hud, { scale: 1.18 }, { scale: 1, duration: 0.3, ease: 'back.out(3)' });
}

const FX_CHARS = ['♠', '♥', '♦', '♣', '★', '✦', '●'];
const FX_COLORS = ['#ff4d8d', '#ffc93c', '#4d79ff', '#2edb84', '#1d1a2b'];

function burst(x, y, big) {
  // shockwave ring
  const ring = document.createElement('div');
  ring.className = 'fx-ring';
  ring.style.left = `${x - 7}px`;
  ring.style.top = `${y - 7}px`;
  if (big) ring.style.borderColor = '#ffc93c';
  fxLayer.appendChild(ring);
  gsap.to(ring, { scale: big ? 9 : 5, opacity: 0, duration: 0.55, ease: 'power2.out', onComplete: () => ring.remove() });

  // suit/star particles
  const n = big ? 16 : 10;
  for (let i = 0; i < n; i++) {
    const p = document.createElement('span');
    p.className = 'fx-p';
    p.textContent = FX_CHARS[Math.floor(Math.random() * FX_CHARS.length)];
    p.style.color = FX_COLORS[Math.floor(Math.random() * FX_COLORS.length)];
    p.style.fontSize = `${14 + Math.random() * (big ? 20 : 12)}px`;
    p.style.left = `${x}px`;
    p.style.top = `${y}px`;
    fxLayer.appendChild(p);
    const ang = Math.random() * Math.PI * 2;
    const dist = (big ? 90 : 50) + Math.random() * (big ? 160 : 100);
    gsap.to(p, {
      x: Math.cos(ang) * dist,
      y: Math.sin(ang) * dist + 60, // slight gravity
      rotation: gsap.utils.random(-260, 260),
      scale: 0.2,
      opacity: 0,
      duration: 0.7 + Math.random() * 0.4,
      ease: 'power2.out',
      onComplete: () => p.remove(),
    });
  }

  // floating score
  const s = document.createElement('span');
  s.className = 'fx-score';
  s.textContent = big ? '+100' : '+10';
  s.style.left = `${x + 14}px`;
  s.style.top = `${y - 24}px`;
  if (big) s.style.fontSize = '1.6rem';
  fxLayer.appendChild(s);
  gsap.to(s, { y: -70, opacity: 0, duration: 0.9, ease: 'power1.out', onComplete: () => s.remove() });
}

window.addEventListener('pointerdown', (e) => {
  if (e.target.closest('a, button, .nav')) return;
  const hit = sceneApi ? sceneApi.shootFloater(e.clientX, e.clientY) : false;
  burst(e.clientX, e.clientY, hit);
  addScore(hit ? 100 : 10);
});
