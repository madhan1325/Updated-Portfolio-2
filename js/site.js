/* Madhan Kumar — portfolio script. No framework, no animation library. */
(function(){
'use strict';
var $ = function(s, r){ return (r || document).querySelector(s); }, $$ = function(s, r){ return [].slice.call((r || document).querySelectorAll(s)); };
var mqReduce = matchMedia('(prefers-reduced-motion: reduce)'), reduce = mqReduce.matches;
mqReduce.addEventListener && mqReduce.addEventListener('change', function(e){ reduce = e.matches; });
var OUT = 'cubic-bezier(.23,1,.32,1)', IO = 'cubic-bezier(.77,0,.175,1)';
function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
var ARW = '<span class="ar" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 17L17 7M8 7h9v9"/></svg><svg viewBox="0 0 24 24"><path d="M7 17L17 7M8 7h9v9"/></svg></span>';
var TRI = '<svg viewBox="0 0 10 12" aria-hidden="true"><path d="M0 0l10 6-10 6z"/></svg>';

/* =====================================================================
   VIDEO DIALOG: showreel (local MP4) and YouTube, both created on demand
   ===================================================================== */
var lb = $('#lb'), lbBox = $('#lbBox');
function openDialog(html){
  lbBox.innerHTML = html; lb.showModal(); cuMove(lb); lb.focus({ preventScroll: true });
  var v = $('video', lbBox); if (v) { var p = v.play(); if (p && p.catch) p.catch(function(){}); }
}
function playReel(){
  openDialog('<video controls playsinline preload="auto" poster="assets/img/showreel-poster-960.webp" src="assets/video/showreel.mp4" aria-label="Showreel"></video>');
}
var ytId = function(u){ var m = String(u).match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/); return m ? m[1] : ''; };
var ytList = function(u){ var m = String(u).match(/[?&]list=([\w-]+)/); return m ? m[1] : ''; };
function playYT(id, list, title){
  openDialog('<iframe src="https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&playsinline=1' + (list ? '&list=' + list : '') + '" title="' + esc(title || 'Video player') + '" referrerpolicy="strict-origin-when-cross-origin" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>');
}
$('#lbX').addEventListener('click', function(){ lb.close(); });
lb.addEventListener('click', function(e){ if (e.target === lb) lb.close(); });
lb.addEventListener('close', function(){ lbBox.innerHTML = ''; cuMove(); });
$('#reelBtn').addEventListener('click', playReel);

/* =====================================================================
   FILMS AND VIDEOS: lightweight posters; the player is built on click
   ===================================================================== */
(function(){
  var rail = $('#rail'); if (!rail || !window.FILMS) return;
  rail.innerHTML = FILMS.map(function(f){
    var id = ytId(f.url), list = ytList(f.url), base = 'https://i.ytimg.com/vi/' + id + '/';
    return '<figure class="vc"><button type="button" class="vf" data-id="' + id + '" data-list="' + list + '" data-t="' + esc(f.title) + '" data-cursor="Play" aria-label="Play ' + esc(f.title) + (list ? ' playlist' : '') + '">' +
      '<img alt="" loading="lazy" decoding="async" width="1280" height="720" src="' + base + 'mqdefault.jpg" srcset="' + base + 'mqdefault.jpg 320w, ' + base + 'maxresdefault.jpg 1280w" sizes="(max-width: 760px) 80vw, 30vw">' +
      '<span class="pc">' + TRI + '</span></button><figcaption class="vm"><span class="tg">' + (list ? 'Playlist' : 'Video') + '</span>' + esc(f.title) + '</figcaption></figure>';
  }).join('');
  /* maxresdefault is missing for some uploads; fall back to the 320px still */
  $$('img', rail).forEach(function(im){ im.addEventListener('error', function(){ if (im.srcset) { im.removeAttribute('srcset'); im.src = im.src.replace(/[^/]+\.jpg$/, 'mqdefault.jpg'); } else im.style.visibility = 'hidden'; }); im.addEventListener('load', function(){ if (im.naturalWidth === 120) { im.removeAttribute('srcset'); } }); });
  rail.addEventListener('click', function(e){ var b = e.target.closest('.vf'); if (b) playYT(b.dataset.id, b.dataset.list, b.dataset.t); });
})();

/* =====================================================================
   SELECTED WORK: the art-directed gallery
   One coordinated move per change: the chosen thumbnail lifts, travels
   and grows into the featured slot (FLIP on transform), the other cards
   shift one slot, and the new title rises in.
   ===================================================================== */
var G = (function(){
  var DATA = window.PROJECTS || [];
  var stage = $('#stage'), feat = $('#feat'), strip = $('#strip'), bdi = $('#bdi');
  var eyeT = $('#eyeT'), mlogo = $('#mlogo'), eye = $('#eye'), ttl = $('#ttl'), cr = $('#cr'), tmp = $('#tmp'), open = $('#open'), openT = $('#openT');
  var num = $('#num'), prog = $('#prog'), live = $('#live'), gal = $('#gal'), note = $('#colNote');
  var colTabs = $$('#cols [role=tab]'), fmtWrap = $('#fmts'), fmtTabs = $$('#fmts [role=tab]');
  var LABEL = { poster: 'Poster', reel: 'Reel', carousel: 'Carousel' };
  var ACTION = { poster: 'View poster', reel: 'Watch reel', carousel: 'View carousel' };
  var NOTE = { tevatel: 'Current client', brands: 'Reels for brands', influencers: 'Reels for creators', models: 'Reels for photographers' };
  /* timing, tuned against the reference clip (60 fps, frame by frame):
     ~250 ms hold, card lifts, ~650 ms travel-and-grow on an ease-in-out,
     old title out early, new title resolves over the last ~300 ms. */
  var T = { move: 760, lift: .16, title: 320, titleAt: 500, shift: 620, shiftAt: 90, bg: 640 };
  var EASE_MOVE = 'cubic-bezier(.65,.02,.22,1)';
  var col = null, items = [], idx = 0, fmt = null, pending = null;

  function srcset(it, ext){ return it.cover + '-360.' + ext + ' 360w, ' + it.cover + '-720.' + ext + ' 720w, ' + it.cover + '-1080.' + ext + ' 1080w'; }
  var FSIZES = '(max-width: 760px) 88vw, (max-width: 1100px) 62vw, 40vw', TSIZES = '(max-width: 760px) 100px, 160px';
  function pic(it, cls, sizes, extra){
    return '<picture><source type="image/avif" srcset="' + srcset(it, 'avif') + '" sizes="' + sizes + '"><img class="' + cls + '"' + (cls ? ' style="--ar:' + it.w + '/' + it.h + '"' : '') + ' src="' + it.cover + '-720.webp" srcset="' + srcset(it, 'webp') + '" sizes="' + sizes + '" width="' + it.w + '" height="' + it.h + '" alt="' + esc(it.alt) + '" decoding="async"' + (extra || '') + '></picture>';
  }
  function pad(n){ return (n < 10 ? '0' : '') + n; }
  function titleOf(it){ return it.title; }

  /* ---- static state writers ---- */
  function setMeta(it){
    eyeT.textContent = col.title + ' · ' + LABEL[it.format];
    if (col.logo) { mlogo.src = col.logo; mlogo.hidden = false; mlogo.className = 'mlogo' + (col.id === 'tevatel' ? ' sq' : ''); } else mlogo.hidden = true;
    ttl.textContent = titleOf(it);
    cr.textContent = it.credit ? 'For ' + it.credit : '';
    tmp.hidden = !it.temp;
    open.href = it.url; openT.textContent = it.exact === false ? 'See ' + col.title + ' on Instagram' : ACTION[it.format];
  }
  function setCount(){
    num.textContent = pad(idx + 1);
    prog.style.setProperty('--p', ((idx + 1) / items.length).toFixed(3));
    live.textContent = col.title + ', ' + LABEL[items[idx].format] + ' ' + (idx + 1) + ' of ' + items.length + ': ' + titleOf(items[idx]) + (items[idx].temp ? ' (temporary cover)' : '');
  }
  function setTone(it){
    stage.style.setProperty('--tone', it.tone);
    bdi.style.backgroundImage = 'url("' + it.lqip + '")';
  }
  function setFeature(it){
    feat.innerHTML = pic(it, 'fi', FSIZES);
  }
  /* strip: every item but the active one, in queue order after it */
  function buildStrip(){
    strip.innerHTML = items.map(function(it, i){
      return '<button type="button" class="th" data-i="' + i + '" style="--ar:' + it.w + '/' + it.h + ';--tone:' + it.tone + '" aria-label="Show ' + esc(LABEL[it.format] + ': ' + titleOf(it)) + (it.credit ? ' for ' + esc(it.credit) : '') + '">' +
        pic(it, '', TSIZES, ' loading="lazy"').replace(' alt="' + esc(it.alt) + '"', ' alt=""') + '</button>';
    }).join('');
    order();
  }
  function order(){
    var btn = $$('.th', strip);
    btn.forEach(function(b){ var i = +b.dataset.i; b.classList.toggle('act', i === idx); });
    for (var k = 1; k < items.length; k++) strip.appendChild(btn[(idx + k) % items.length]);
    strip.appendChild(btn[idx]);
    strip.scrollLeft = 0;
  }
  function thumb(i){ return $('.th[data-i="' + i + '"]', strip); }

  /* ---- collections and formats ---- */
  function choose(colId, fmtId, animate){
    finish();
    col = DATA.filter(function(c){ return c.id === colId; })[0] || DATA[0];
    fmt = fmtId && col.formats.indexOf(fmtId) > -1 ? fmtId : col.formats[0];
    items = col.items.filter(function(it){ return it.format === fmt; }); idx = 0;
    colTabs.forEach(function(t){ var on = t.dataset.col === col.id; t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; });
    fmtWrap.hidden = col.formats.length < 2;
    fmtTabs.forEach(function(t){ var on = t.dataset.fmt === fmt; t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; });
    gal.setAttribute('aria-label', col.title + ' artwork'); note.textContent = NOTE[col.id] || '';
    var it = items[0];
    setTone(it); setMeta(it); setCount(); buildStrip();
    var same = $('.fi', feat) && $('.fi', feat).getAttribute('src') === it.cover + '-720.webp';
    if (!same) setFeature(it);
    if (animate && !reduce) {
      /* a set change is a cut, not a travel: quick dissolve + rise */
      var f = $('.fi', feat);
      f && f.animate([{ opacity: 0, transform: 'scale(.97)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: OUT });
      ttl.animate([{ opacity: 0, transform: 'translateY(40%)' }, { opacity: 1, transform: 'none' }], { duration: T.title, easing: OUT });
      $$('.th:not(.act)', strip).forEach(function(b, k){ b.animate([{ opacity: 0, transform: 'translateX(24px)' }, { opacity: 1, transform: 'none' }], { duration: 480, delay: 60 + k * 50, easing: OUT, fill: 'backwards' }); });
    }
  }

  /* ---- the shared-element move ---- */
  function contentBox(el){
    var r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    var pl = parseFloat(cs.paddingLeft), pr = parseFloat(cs.paddingRight), pt = parseFloat(cs.paddingTop), pb = parseFloat(cs.paddingBottom);
    return { left: r.left + pl, top: r.top + pt, width: r.width - pl - pr, height: r.height - pt - pb };
  }
  function fitRect(box, w, h){
    var s = Math.min(box.width / w, box.height / h), fw = w * s, fh = h * s;
    return { left: box.left + (box.width - fw) / 2, top: box.top + (box.height - fh) / 2, width: fw, height: fh };
  }
  function visibleIn(r, host){ var h = host.getBoundingClientRect(); return r.right > h.left + 8 && r.left < h.right - 8 && r.width > 0; }

  function go(to){
    if (!items.length || items.length < 2) return;
    to = (to + items.length) % items.length;
    if (to === idx && !pending) return;
    finish();
    if (to === idx) return;
    var it = items[to], from = idx, tb = thumb(to), timg = tb && $('img', tb);
    var tr = timg && timg.getBoundingClientRect();
    var canFly = !reduce && tr && visibleIn(tr, strip) && timg.complete && timg.naturalWidth;

    if (!canFly) {
      idx = to; setTone(it); setFeature(it); setMeta(it); setCount(); order();
      if (!reduce) {
        var f = $('.fi', feat); f.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: OUT });
        ttl.animate([{ opacity: 0, transform: 'translateY(40%)' }, { opacity: 1, transform: 'none' }], { duration: T.title, easing: OUT });
      }
      return;
    }

    var anims = [], timers = [];
    var sr = stage.getBoundingClientRect();
    var to_ = fitRect(contentBox(feat), it.w, it.h);
    /* FIRST: where every visible card is now */
    var firsts = {};
    $$('.th:not(.act)', strip).forEach(function(b){ firsts[b.dataset.i] = b.getBoundingClientRect(); });

    /* the flying copy starts life at the final size and position, and is
       transformed back onto the thumbnail; animating to identity is cheap */
    var fly = document.createElement('div'); fly.className = 'fly';
    fly.style.cssText = 'width:' + to_.width + 'px;height:' + to_.height + 'px;transform:translate(' + (to_.left - sr.left) + 'px,' + (to_.top - sr.top) + 'px)';
    var fimg = new Image(); fimg.alt = ''; fimg.decoding = 'sync'; fimg.src = timg.currentSrc || timg.src; fly.appendChild(fimg);
    stage.appendChild(fly);
    /* start loading the sharp feature image straight away */
    var pre = document.createElement('div'); pre.innerHTML = pic(it, 'fi', FSIZES); var next = $('picture', pre);
    var nimg = $('img', next);

    var bx = to_.left - sr.left, by = to_.top - sr.top, s = tr.width / to_.width;
    var tx = tr.left - sr.left, ty = tr.top - sr.top;
    function T3(x, y, k){ return 'translate(' + x + 'px,' + y + 'px) scale(' + k + ')'; }
    anims.push(fly.animate([
      { transform: T3(tx, ty, s), boxShadow: '0 10px 24px -12px rgba(0,0,0,.6)', offset: 0 },
      { transform: T3(tx - tr.width * .02, ty - 10, s * 1.04), offset: T.lift },
      { transform: T3(bx, by, 1), boxShadow: '0 30px 70px -24px rgba(0,0,0,.65)', offset: 1 }
    ], { duration: T.move, easing: EASE_MOVE, fill: 'both' }));

    /* the old feature recedes beneath it */
    var old = $('.fi', feat);
    if (old) anims.push(old.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(.965)' }], { duration: 380, delay: 220, easing: 'ease-in', fill: 'forwards' }));
    /* old title leaves early, upward */
    anims.push(ttl.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-30%)' }], { duration: 200, delay: 120, easing: 'ease-in', fill: 'forwards' }));
    anims.push(eye.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, delay: 120, fill: 'forwards' }));

    /* state now; visuals catch up */
    idx = to; order(); setCount();
    stage.style.setProperty('--tone', it.tone);
    /* backdrop: cross-fade to the new artwork's colours */
    var bd2 = document.createElement('i'); bd2.style.backgroundImage = 'url("' + it.lqip + '")'; bd2.style.opacity = 0;
    bdi.parentNode.appendChild(bd2);
    anims.push(bd2.animate([{ opacity: 0 }, { opacity: 1 }], { duration: T.bg, delay: 180, easing: OUT, fill: 'forwards' }));

    /* LAST + INVERT + PLAY for the strip: each card shifts one slot */
    $$('.th:not(.act)', strip).forEach(function(b){
      var f = firsts[b.dataset.i], l = b.getBoundingClientRect();
      if (f) { var dx = f.left - l.left, dy = f.bottom - l.bottom; if (dx || dy) anims.push(b.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px)' }, { transform: 'none' }], { duration: T.shift, delay: T.shiftAt, easing: EASE_MOVE, fill: 'backwards' })); }
      else anims.push(b.animate([{ opacity: 0, transform: 'translateX(28px) scale(.92)' }, { opacity: 1, transform: 'none' }], { duration: 520, delay: 360, easing: OUT, fill: 'backwards' }));
    });

    /* the new title resolves as the image settles */
    timers.push(setTimeout(function(){
      setMeta(it);
      anims.push(ttl.animate([{ opacity: 0, transform: 'translateY(55%)' }, { opacity: 1, transform: 'none' }], { duration: T.title, easing: OUT, fill: 'backwards' }));
      anims.push(eye.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: T.title, easing: OUT }));
    }, T.titleAt));

    var done = false;
    function settle(){
      if (done) return; done = true;
      timers.forEach(clearTimeout);
      anims.forEach(function(a){ try { a.cancel(); } catch (e) {} });
      setMeta(it);
      bdi.style.backgroundImage = 'url("' + it.lqip + '")'; if (bd2.parentNode) bd2.remove();
      feat.innerHTML = ''; feat.appendChild(next);
      /* keep the flying copy until the sharp image is ready, then lift it off */
      var rm = function(){ if (fly.parentNode) fly.remove(); };
      if (nimg.complete && nimg.naturalWidth) rm(); else if (nimg.decode) nimg.decode().then(rm, rm); else nimg.onload = rm;
      setTimeout(rm, 1200);
      pending = null;
    }
    anims[0].onfinish = settle;
    pending = { settle: settle, fly: fly };
  }
  /* rapid input: jump the running move to its end state, then start the next */
  function finish(){ if (pending) { var p = pending; p.settle(); if (p.fly.parentNode) p.fly.remove(); } }

  /* ---- wiring ---- */
  function tabs(list, onPick){
    list.forEach(function(t, i){
      t.addEventListener('click', function(){ onPick(t); });
      t.addEventListener('keydown', function(e){
        var k = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : e.key === 'Home' ? -i : e.key === 'End' ? list.length - 1 - i : 0;
        if (!k) return; e.preventDefault(); e.stopPropagation();
        var n = list[(i + k + list.length) % list.length]; n.focus(); onPick(n);
      });
    });
  }
  tabs(colTabs, function(t){ if (t.dataset.col !== (col && col.id)) choose(t.dataset.col, null, true); });
  tabs(fmtTabs, function(t){ if (t.dataset.fmt !== fmt) choose(col.id, t.dataset.fmt, true); });
  strip.addEventListener('click', function(e){
    var b = e.target.closest('.th'); if (!b) return;
    var had = document.activeElement === b; go(+b.dataset.i);
    /* the chosen card leaves the strip; keep keyboard focus in the strip */
    if (had) { var f = $('.th:not(.act)', strip); if (f) f.focus({ preventScroll: true }); }
  });
  $('#prev').addEventListener('click', function(){ go(idx - 1); });
  $('#next').addEventListener('click', function(){ go(idx + 1); });
  gal.addEventListener('keydown', function(e){
    if (e.target.closest('[role=tablist]') || e.altKey || e.metaKey || e.ctrlKey) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); go(idx + 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); go(idx - 1); }
  });
  /* swipe on the featured artwork */
  (function(){
    var x0 = null, y0 = 0, t0 = 0;
    feat.addEventListener('pointerdown', function(e){ if (e.pointerType === 'mouse') return; x0 = e.clientX; y0 = e.clientY; t0 = Date.now(); }, { passive: true });
    feat.addEventListener('pointerup', function(e){
      if (x0 === null) return; var dx = e.clientX - x0, dy = e.clientY - y0; x0 = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.3 && Date.now() - t0 < 700) go(idx + (dx < 0 ? 1 : -1));
    }, { passive: true });
    feat.addEventListener('pointercancel', function(){ x0 = null; }, { passive: true });
  })();

  if (DATA.length) choose('tevatel', 'poster', false);
  return { go: go };
})();

/* =====================================================================
   PAGE CHROME: timecode, nav theme, reveals, hero, intro, marquees,
   cursor, contact, questionnaire (carried over from the original site)
   ===================================================================== */
var tc = $('#tc'), bar = $('#bar'), st = $('#st'), mw = $('#mw'), nm = $('#nm'), nv = $('#nv'), wk = $('#work');
var ab = $('#about'), mqe = $('.mq'), ctn = $('#contact'), hero = $('.hero'), ND = $$('#nv>div a'), fl = $('#films');
function words(el){ el.innerHTML = el.textContent.trim().split(/\s+/).map(function(w){ return '<span class="w">' + w + '</span>'; }).join(' '); return el.querySelectorAll('.w'); }
var stw = words(st), sm = $('#sm'), smw = words(sm);
var TT = { m: 1e9, a: 1e9, w: 1e9, c: 1e9 }, pA = 0, lp = -1, nvk = '', lac = null;
var K = { ink: [29,29,31], dk: [14,14,15], wh: [255,255,255], mu: [110,110,115], mud: [163,163,163], b2: [245,245,247], b2d: [44,44,46], cr: [242,242,242], bg: [11,11,11], gd: [212,175,55] };
function mx3(a, b, p){ return [Math.round(a[0] + (b[0] - a[0]) * p), Math.round(a[1] + (b[1] - a[1]) * p), Math.round(a[2] + (b[2] - a[2]) * p)]; }
function rgb(a, al){ return al == null ? 'rgb(' + a.join(',') + ')' : 'rgba(' + a.join(',') + ',' + al + ')'; }
function ease(x){ x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); }
function reveal(el, ws){ var vh = innerHeight, r = el.getBoundingClientRect(), q = Math.min(1, Math.max(0, (vh * .85 - r.top) / (r.height + vh * .3))), k = Math.round(q * ws.length); for (var i = 0; i < ws.length; i++) ws[i].classList.toggle('on', i < k); }
function themeAt(y){
  if (y < TT.m) return { f: K.ink, b: K.gd, n: 0, bar: K.ink };
  if (y < TT.w) return { f: mx3(K.ink, K.wh, pA), b: mx3(K.wh, K.dk, pA), n: 1, bar: K.gd };
  if (y < TT.c) return { f: K.wh, b: K.dk, n: 1, bar: K.gd };
  return { f: K.cr, b: K.bg, n: 1, bar: K.cr };
}
function theme(y, vh){
  var ra = ab.getBoundingClientRect();
  TT.m = mqe.getBoundingClientRect().top; TT.a = ra.top; TT.w = wk.getBoundingClientRect().top; TT.c = ctn.getBoundingClientRect().top;
  pA = Math.round(ease((vh * .95 - ra.bottom) / (vh * .6)) * 1000) / 1000;
  if (pA !== lp) { lp = pA; var s = ab.style;
    s.setProperty('--bg', rgb(mx3(K.wh, K.dk, pA))); s.setProperty('--ink', rgb(mx3(K.ink, K.wh, pA)));
    s.setProperty('--mut', rgb(mx3(K.mu, K.mud, pA))); s.setProperty('--bg2', rgb(mx3(K.b2, K.b2d, pA))); }
  if (y < vh * 1.2) hero.style.setProperty('--hp', (Math.min(1, y / vh) * .5).toFixed(3));
  var t = themeAt(26), k = [t.f, t.b, t.n, t.bar].join('|');
  if (k !== nvk) { nvk = k; var n = nv.style; n.setProperty('--nf', rgb(t.f)); n.setProperty('--nb', rgb(t.b, .74)); n.setProperty('--na', t.n); n.setProperty('--nbar', rgb(t.bar)); }
  var fT = fl.getBoundingClientRect().top;
  var ac = TT.c <= 60 ? '#contact' : fT <= 60 ? '#films' : TT.w <= 60 ? '#work' : TT.a <= 60 ? '#about' : '';
  if (ac !== lac) { lac = ac; ND.forEach(function(a){ if (a.getAttribute('href') === ac) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); }); }
}
function tcFmt(f){ var p = function(n){ return (n < 10 ? '0' : '') + n; }; return '00:' + p(Math.floor(f / 1440)) + ':' + p(Math.floor(f / 24) % 60) + ':' + p(f % 24); }
function tick(){
  var y = scrollY, vh = innerHeight, p = Math.min(1, Math.max(0, y / Math.max(1, document.documentElement.scrollHeight - vh)));
  tc.textContent = tcFmt(Math.floor(p * 96 * 24)); bar.style.transform = 'scaleX(' + p + ')';
  reveal(st, stw); reveal(sm, smw); theme(y, vh);
  if (!reduce && y < vh * 1.2) nm.style.transform = 'translate3d(0,' + (y * .12) + 'px,0)';
}
var tq = false;
addEventListener('scroll', function(){ if (!tq) { tq = true; requestAnimationFrame(function(){ tq = false; tick(); }); } }, { passive: true });
addEventListener('resize', tick); tick();
/* one shared frame loop for the small continuous effects */
var tasks = [];
requestAnimationFrame(function frame(t){ for (var i = 0; i < tasks.length; i++) tasks[i](t); requestAnimationFrame(frame); });

var fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
if (!reduce && fine) {
  var px = 0, py = 0, cx = 0, cy = 0;
  hero.addEventListener('pointermove', function(e){ px = e.clientX / innerWidth - .5; py = e.clientY / innerHeight - .5; }, { passive: true });
  tasks.push(function(){ if (scrollY > innerHeight) return; cx += (px - cx) * .06; cy += (py - cy) * .06; mw.style.transform = 'translate3d(' + (cx * 18) + 'px,' + (cy * 10) + 'px,0)'; });
}

/* entrances */
var rv = 'IntersectionObserver' in window ? new IntersectionObserver(function(en){
  var k = 0; en.forEach(function(e){ if (!e.isIntersecting) return; e.target.style.transitionDelay = (k++ * 70) + 'ms'; e.target.classList.add('in'); rv.unobserve(e.target); });
}, { threshold: .15, rootMargin: '0px 0px -5% 0px' }) : null;
$$('.x,[data-io]').forEach(function(el){ if (rv) rv.observe(el); else el.classList.add('in'); });

/* hero shader: liquid gold with grain, drawn only while the hero is on screen */
(function(){
  var cv = $('#gl'), g = cv.getContext('webgl', { antialias: false, alpha: false }); if (!g) return;
  var vs = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  var fs = 'precision mediump float;uniform vec2 r,m;uniform float t;' +
    'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}' +
    'float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);}' +
    'float fb(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p=p*2.02+7.;a*=.5;}return v;}' +
    'void main(){vec2 u=gl_FragCoord.xy/r;vec2 q=u*vec2(r.x/r.y,1.)*1.8;float s=t*.05;' +
    'vec2 w=vec2(fb(q+s),fb(q+vec2(5.2,1.3)-s));float f=fb(q+2.4*w+(m-.5)*.9);' +
    'vec3 gd=vec3(.83,.686,.216),dk=vec3(.6,.46,.1),hi=vec3(.98,.89,.55);' +
    'vec3 c=mix(gd,dk,smoothstep(.32,.78,f));c=mix(c,hi,.45*smoothstep(.62,.92,w.y)*(1.-smoothstep(.3,.7,f)));' +
    'c+=(h(gl_FragCoord.xy+fract(t))-.5)*.05;gl_FragColor=vec4(c,1.);}';
  function sh(t, s){ var o = g.createShader(t); g.shaderSource(o, s); g.compileShader(o); return o; }
  var pr = g.createProgram(); g.attachShader(pr, sh(g.VERTEX_SHADER, vs)); g.attachShader(pr, sh(g.FRAGMENT_SHADER, fs)); g.linkProgram(pr);
  if (!g.getProgramParameter(pr, g.LINK_STATUS)) return;
  g.useProgram(pr); g.bindBuffer(g.ARRAY_BUFFER, g.createBuffer()); g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), g.STATIC_DRAW);
  var loc = g.getAttribLocation(pr, 'p'); g.enableVertexAttribArray(loc); g.vertexAttribPointer(loc, 2, g.FLOAT, false, 0, 0);
  var U = { r: g.getUniformLocation(pr, 'r'), m: g.getUniformLocation(pr, 'm'), t: g.getUniformLocation(pr, 't') };
  var tx = .5, ty = .5, mx = .5, my = .5, coarse = matchMedia('(pointer: coarse)').matches, fc = 0;
  function size(){ var s = coarse ? .4 : .6; cv.width = Math.max(2, cv.clientWidth * s | 0); cv.height = Math.max(2, cv.clientHeight * s | 0); g.viewport(0, 0, cv.width, cv.height); }
  function draw(ms){ mx += (tx - mx) * .04; my += (ty - my) * .04; g.uniform2f(U.r, cv.width, cv.height); g.uniform2f(U.m, mx, my); g.uniform1f(U.t, ms / 1000); g.drawArrays(g.TRIANGLE_STRIP, 0, 4); }
  size(); addEventListener('resize', size); draw(0);
  if (reduce) return;
  hero.addEventListener('pointermove', function(e){ tx = e.clientX / innerWidth; ty = 1 - e.clientY / innerHeight; }, { passive: true });
  tasks.push(function(ms){ if (scrollY < innerHeight * 1.05 && !document.hidden && (!coarse || (fc++ & 1))) draw(ms); });
})();

/* opening: a timeline assembles, then the screen cuts open (once per visit) */
(function(){
  var H = document.documentElement, I = $('#intro');
  function go(){ H.classList.add('go'); }
  if (!H.classList.contains('intro')) { if (I) I.remove(); requestAnimationFrame(go); return; }
  var tl = $('#tl'), pl = $('#pl'), itc = $('#itc'), done = false, T = 1800;
  var clips = [[0,34,0,'#d4af37'],[36,26,0,'#c7c7cc'],[10,40,1,'#f5f5f7'],[52,30,1,'#8f7424'],[64,36,0,'#2c2c2e'],[0,9,1,'#2c2c2e']];
  clips.forEach(function(c){
    var d = document.createElement('div'); d.className = 'cp'; d.style.cssText = 'left:' + c[0] + '%;width:' + c[1] + '%;top:' + (8 + c[2] * 60) + 'px;background:' + c[3];
    tl.insertBefore(d, pl);
    d.animate([{ opacity: 0, transform: 'translateY(12px) scale(.96)' }, { opacity: 1, transform: 'none' }], { duration: 380, delay: c[0] / 100 * T, easing: OUT, fill: 'both' });
  });
  pl.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(' + tl.clientWidth + 'px)' }], { duration: T, easing: 'linear', fill: 'forwards' });
  var t0 = performance.now();
  (function step(now){ var p = Math.min(1, (now - t0) / T); itc.textContent = tcFmt(Math.floor(p * 106)); if (p < 1 && !done) requestAnimationFrame(step); else exit(); })(t0);
  function exit(){
    if (done) return; done = true; itc.textContent = tcFmt(106);
    $('.ic').animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, easing: OUT, fill: 'forwards' }).finished.then(function(){
      var o = { duration: 850, easing: IO, fill: 'forwards' };
      $('.ip.a').animate([{ transform: 'none' }, { transform: 'translateY(-101%)' }], o);
      $('.ip.b').animate([{ transform: 'none' }, { transform: 'translateY(101%)' }], o);
      $('.sk').remove(); setTimeout(go, 300);
      setTimeout(function(){ I.remove(); H.classList.remove('lock', 'intro'); }, 880);
    });
  }
  I.addEventListener('click', exit); addEventListener('keydown', function k(){ removeEventListener('keydown', k); exit(); }); setTimeout(exit, 5000);
})();

/* copy email */
$$('[data-copy]').forEach(function(b){
  var t = b.textContent;
  b.addEventListener('click', function(){
    var done = function(){ b.textContent = 'Copied'; setTimeout(function(){ b.textContent = t; }, 1600); };
    if (navigator.clipboard) navigator.clipboard.writeText(b.dataset.copy).then(done, function(){ location.href = 'mailto:' + b.dataset.copy; }); else location.href = 'mailto:' + b.dataset.copy;
  });
});

/* rolling text and arrows */
function roll(el){
  var n = [].filter.call(el.childNodes, function(c){ return c.nodeType === 3 && c.textContent.trim(); })[0]; if (!n || $('.rl', el)) return;
  var t = n.textContent.trim(), s = document.createElement('span'); s.className = 'rl'; s.innerHTML = '<i>' + esc(t) + '</i><i aria-hidden="true">' + esc(t) + '</i>'; el.replaceChild(s, n);
}
$$('#nv>div a,.btn,.pill,.fb a').forEach(roll);
$$('.btn,.pill').forEach(function(b){ b.insertAdjacentHTML('beforeend', ARW); });
$$('[data-ar]').forEach(function(s){ s.innerHTML = ARW.replace(/^<span[^>]*>|<\/span>$/g, ''); });

/* marquees: speed and direction follow scroll */
var mqs = [], vel = 0, dirS = 1, lastY = scrollY, lt = 0;
function marq(el, sp, dir, host){
  var o = { el: el, sp: sp, dir: dir, x: 0, w: 0, vis: true, hov: false }; mqs.push(o);
  o.m = function(){ o.w = el.scrollWidth / 2; }; o.m();
  new IntersectionObserver(function(e){ o.vis = e[0].isIntersecting; }).observe(host);
  if (host.classList.contains('mq')) { host.addEventListener('mouseenter', function(){ o.hov = true; }); host.addEventListener('mouseleave', function(){ o.hov = false; }); }
}
var mt = $('#mt'); mt.innerHTML = mt.innerHTML + mt.innerHTML + mt.innerHTML + mt.innerHTML;
$$('img', mt).slice(4).forEach(function(i){ i.parentNode.setAttribute('aria-hidden', 'true'); });
var TKW = ['Reels', 'Posters', 'Carousels', 'Short films', 'Vlogs', 'Mashups'], tkh = TKW.map(function(w){ return '<span>' + w + '</span>'; }).join('');
$('#tk').innerHTML = tkh + tkh + tkh + tkh;
marq(mt, .55, false, mqe); marq($('#tk'), 1.1, true, $('.tk'));
addEventListener('resize', function(){ mqs.forEach(function(o){ o.m(); }); }); addEventListener('load', function(){ mqs.forEach(function(o){ o.m(); }); });
if (!reduce) tasks.push(function(t){
  var dt = Math.min(50, t - lt) / 16.67; lt = t; var y = scrollY, dy = y - lastY; lastY = y;
  vel += (dy - vel) * .1; if (Math.abs(dy) > .5) dirS += ((dy > 0 ? 1 : -1) - dirS) * .08;
  mqs.forEach(function(o){
    if (!o.vis || !o.w) return;
    o.x -= (o.sp * (o.dir ? dirS : 1) * (o.hov ? .15 : 1) + (o.dir ? vel * .3 : 0)) * dt;
    if (o.x <= -o.w) o.x += o.w; if (o.x > 0) o.x -= o.w;
    o.el.style.transform = 'translate3d(' + o.x + 'px,0,0)';
  });
});

/* magnetic buttons */
if (fine && !reduce) {
  var mg = [], mdirty = true;
  $$('.btn,#reelBtn,.pill,.badge').forEach(function(el){ el.setAttribute('data-mag', ''); mg.push({ el: el, x: 0, y: 0, tx: 0, ty: 0, c: null }); });
  addEventListener('scroll', function(){ mdirty = true; }, { passive: true }); addEventListener('resize', function(){ mdirty = true; });
  document.addEventListener('pointermove', function(e){
    if (mdirty) { mg.forEach(function(o){ var r = o.el.getBoundingClientRect(); o.c = { x: r.left + r.width / 2 - o.x, y: r.top + r.height / 2 - o.y, w: r.width / 2 + 36, h: r.height / 2 + 36 }; }); mdirty = false; }
    mg.forEach(function(o){ var dx = e.clientX - o.c.x, dy = e.clientY - o.c.y; if (Math.abs(dx) < o.c.w && Math.abs(dy) < o.c.h) { o.tx = dx * .3; o.ty = dy * .3; } else { o.tx = 0; o.ty = 0; } });
  }, { passive: true });
  tasks.push(function(){ mg.forEach(function(o){
    if (o.x === o.tx && o.y === o.ty) return;
    o.x += (o.tx - o.x) * .16; o.y += (o.ty - o.y) * .16;
    if (Math.abs(o.tx - o.x) < .05 && Math.abs(o.ty - o.y) < .05) { o.x = o.tx; o.y = o.ty; }
    o.el.style.transform = o.x || o.y ? 'translate3d(' + o.x + 'px,' + o.y + 'px,0)' : '';
  }); });
}

/* custom cursor */
var cuMove = function(){};
if (fine) {
  var cu = $('#cu'), cdot = $('#cu b'), cring = $('#cu u'), clab = $('#cu i'), rx = 0, ry = 0, mpx = -1e3, mpy = -1e3, seen = false, ck_ = '', cl_ = '', dlgOpen = false;
  document.documentElement.classList.add('cx');
  cuMove = function(host){ dlgOpen = !!host; (host || document.body).appendChild(cu); };
  document.addEventListener('pointermove', function(e){ mpx = e.clientX; mpy = e.clientY; if (!seen) { seen = true; rx = mpx; ry = mpy; } cu.classList.add('on'); }, { passive: true });
  document.documentElement.addEventListener('mouseleave', function(){ cu.classList.remove('on'); });
  document.addEventListener('pointerover', function(e){
    var t = e.target; if (t.tagName === 'IFRAME') { cu.classList.remove('on'); return; }
    var h = t.closest && t.closest('[data-cursor],a,button,[role=button],input,select,textarea,label'), d = h && h.getAttribute('data-cursor');
    cu.classList.toggle('v', !!d); cu.classList.toggle('l', !!h && !d);
    if (d && d !== cl_) { cl_ = d; clab.textContent = d; }
  });
  tasks.push(function(){
    rx += (mpx - rx) * (reduce ? 1 : .2); ry += (mpy - ry) * (reduce ? 1 : .2);
    cdot.style.transform = 'translate3d(' + mpx + 'px,' + mpy + 'px,0)';
    cring.style.transform = clab.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0)';
    var t = dlgOpen ? { f: K.cr, b: K.bg } : themeAt(mpy), k = t.f + '|' + t.b;
    if (k !== ck_) { ck_ = k; cu.style.setProperty('--cc', rgb(t.f)); cu.style.setProperty('--cb', rgb(t.b)); }
  });
}

/* contact: rotating lines, wordmark fit, blob pause, form */
(function(){
  var L = $$('.rot span');
  if (!reduce) { var i = 0; setInterval(function(){ var o = L[i]; i = (i + 1) % L.length; o.className = 'out'; L[i].className = 'on'; setTimeout(function(){ o.className = ''; }, 900); }, 2800); }
  var fw = $('#fw'); function fit(){ fw.style.fontSize = '100px'; fw.style.fontSize = (100 * fw.parentNode.clientWidth / fw.getBoundingClientRect().width) + 'px'; }
  fit(); addEventListener('resize', fit); if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  new IntersectionObserver(function(e){ ctn.classList.toggle('off', !e[0].isIntersecting); }).observe(ctn);
  var cf = $('#cf'), fs = $('#fs'), MAIL = 'madhankumar1080@gmail.com';
  cf.addEventListener('submit', function(e){
    e.preventDefault(); if (!cf.checkValidity()) { cf.reportValidity(); return; }
    var d = new FormData(cf);
    fs.textContent = 'Opening your email app. If nothing opens, write to ' + MAIL + '.';
    location.href = 'mailto:' + MAIL + '?subject=' + encodeURIComponent('Portfolio enquiry: ' + d.get('subject')) + '&body=' + encodeURIComponent('Name: ' + d.get('name') + '\nEmail: ' + d.get('email') + '\n\n' + d.get('message'));
  });
})();

/* project questionnaire */
(function(){
  var QZ = [
    { q: 'What’s your name?', k: 'Name', t: 'text', ph: 'Your name' },
    { q: 'What do you need made?', k: 'Need', t: 'multi', o: ['Reels and short-form edits', 'Long-form video', 'Posters', 'Carousels', 'Brand content package', 'Something else'] },
    { q: 'How much work is it?', k: 'Volume', t: 'one', o: ['A single piece', 'A small batch (2 to 10)', 'Ongoing monthly work'] },
    { q: 'When do you need it?', k: 'Timeline', t: 'one', o: ['This week', 'In 2 to 4 weeks', 'No fixed date'] },
    { q: 'Roughly what’s your budget?', k: 'Budget', t: 'one', o: ['Under ₹10,000', '₹10,000 to ₹30,000', '₹30,000+', 'Not sure yet'] },
    { q: 'How can I reach you?', k: 'Contact', t: 'text', ph: 'Email or WhatsApp number' }
  ];
  var qz = $('#qz'), qa = $('#qa'), qq = $('#qq'), qn = $('#qn'), nx = $('#qnx'), bk = $('#qbk'), fin = $('#qfin'), qi = 0, ans = {};
  function has(v){ return v && v.length; }
  function draw(){
    var s = QZ[qi], end = qi === QZ.length, h = '';
    qn.textContent = end ? 'All set' : 'Question ' + (qi + 1) + ' of ' + QZ.length; $('#qpi').style.transform = 'scaleX(' + (qi / QZ.length) + ')';
    bk.hidden = !qi; nx.hidden = end; fin.hidden = !end;
    if (end) {
      qq.textContent = 'Thanks, ' + (ans.Name || 'there') + '.';
      h = '<dl>' + QZ.map(function(z){ return '<div><dt>' + z.k + '</dt><dd>' + esc([].concat(ans[z.k] || '-').join(', ')) + '</dd></div>'; }).join('') + '</dl>';
      var msg = 'Hi Madhan, I filled in your project questionnaire.\n\n' + QZ.map(function(z){ return z.k + ': ' + [].concat(ans[z.k] || '-').join(', '); }).join('\n');
      $('#qwa').href = 'https://wa.me/919789858037?text=' + encodeURIComponent(msg);
      $('#qem').href = 'mailto:madhankumar1080@gmail.com?subject=' + encodeURIComponent('Project enquiry from ' + (ans.Name || 'your site')) + '&body=' + encodeURIComponent(msg);
    } else {
      qq.textContent = s.q;
      h = s.t === 'text' ? '<input id="qin" class="qt" value="' + esc(ans[s.k] || '') + '" placeholder="' + s.ph + '" autocomplete="off" aria-label="' + esc(s.q) + '">' :
        s.o.map(function(o){ var on = [].concat(ans[s.k] || []).indexOf(o) > -1; return '<button type="button" class="qo' + (on ? ' on' : '') + '" aria-pressed="' + on + '">' + esc(o) + '</button>'; }).join('');
    }
    qa.innerHTML = h; qa.classList.remove('sw'); void qa.offsetWidth; qa.classList.add('sw');
    nx.disabled = !end && !has(ans[s.k]); var f = $('#qin'); if (f) f.focus();
  }
  function next(){ if (qi < QZ.length && !nx.disabled) { qi++; draw(); } }
  nx.addEventListener('click', next); bk.addEventListener('click', function(){ if (qi) { qi--; draw(); } });
  qa.addEventListener('input', function(e){ ans[QZ[qi].k] = e.target.value.trim(); nx.disabled = !has(ans[QZ[qi].k]); });
  qa.addEventListener('keydown', function(e){ if (e.key === 'Enter') { e.preventDefault(); next(); } });
  qa.addEventListener('click', function(e){
    var b = e.target.closest('.qo'); if (!b) return; var s = QZ[qi], v = b.textContent;
    if (s.t === 'multi') { var a = [].concat(ans[s.k] || []), j = a.indexOf(v); if (j > -1) a.splice(j, 1); else a.push(v); ans[s.k] = a; b.classList.toggle('on'); b.setAttribute('aria-pressed', j < 0); nx.disabled = !a.length; }
    else { ans[s.k] = v; $$('.qo', qa).forEach(function(o){ o.classList.toggle('on', o === b); o.setAttribute('aria-pressed', o === b); }); nx.disabled = false; setTimeout(next, 320); }
  });
  $('#qgo').addEventListener('click', function(e){
    var r = e.currentTarget.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2; qi = 0; ans = {}; draw(); qz.showModal(); cuMove(qz);
    if (!reduce) qz.animate([{ clipPath: 'circle(0px at ' + x + 'px ' + y + 'px)' }, { clipPath: 'circle(150vmax at ' + x + 'px ' + y + 'px)' }], { duration: 900, easing: IO });
  });
  $('#qx').addEventListener('click', function(){ if (reduce) qz.close(); else qz.animate([{ clipPath: 'circle(150vmax at 50% 50%)' }, { clipPath: 'circle(0px at 50% 100%)' }], { duration: 600, easing: IO, fill: 'forwards' }).onfinish = function(){ qz.close(); }; });
  qz.addEventListener('close', function(){ cuMove(); });
})();
})();
