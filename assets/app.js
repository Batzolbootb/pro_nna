/* nna.mn — front-end behaviour (demo data, no backend) */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  var $ = function (s, r) { return (r || doc).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); };
  var store = {
    get: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
  };
  var fmt = function (n) { return n.toLocaleString('en-US') + '₮'; };
  var CK = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';

  function toast(msg) {
    var t = $('.toast');
    if (!t) { t = doc.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.setAttribute('aria-live', 'polite'); }
    var host = $('dialog[open]') || doc.body; // a modal dialog sits in the top layer, so the toast has to live inside it
    if (t.parentNode !== host) host.appendChild(t);
    t.textContent = msg; t.classList.add('show');
    clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove('show'); }, 2400);
  }
  function share(data, done) {
    if (navigator.share) { navigator.share(data).catch(function () {}); return; }
    var txt = (data.text ? data.text + ' ' : '') + (data.url || '');
    if (navigator.clipboard) navigator.clipboard.writeText(txt).then(function () { toast(done || 'Холбоос хуулагдлаа'); }, function () { toast(txt); });
    else toast(txt);
  }
  // iOS Safari only applies :active styles once a touch listener exists
  doc.addEventListener('touchstart', function () {}, { passive: true });

  /* theme */
  function syncThemeBtns() {
    var t = root.getAttribute('data-theme');
    $$('.theme-btn').forEach(function (b) {
      b.setAttribute('aria-pressed', t === 'dark' ? 'true' : 'false');
      if (b.classList.contains('mtheme')) $('.t', b).textContent = t === 'dark' ? 'Гэгээлэг горим' : 'Харанхуй горим';
      else b.setAttribute('aria-label', t === 'dark' ? 'Гэгээлэг горим руу шилжих' : 'Харанхуй горим руу шилжих');
    });
  }
  // a manual choice must also recolour the phone's status bar, which reads <meta name="theme-color">
  function syncThemeColor() {
    var manual = null; try { manual = localStorage.getItem('nna-theme'); } catch (e) {}
    if (!manual) return;
    var c = root.getAttribute('data-theme') === 'dark' ? '#0B0E13' : '#FFFFFF';
    $$('meta[name="theme-color"]').forEach(function (m) { m.setAttribute('content', c); });
  }
  function setTheme(t) {
    root.setAttribute('data-theme', t);
    try { localStorage.setItem('nna-theme', t); } catch (e) {}
    syncThemeBtns(); syncThemeColor();
  }
  syncThemeBtns(); syncThemeColor();
  $$('.theme-btn').forEach(function (b) { b.addEventListener('click', function () { setTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'); }); });
  try {
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
      if (!localStorage.getItem('nna-theme')) { root.setAttribute('data-theme', e.matches ? 'dark' : 'light'); syncThemeBtns(); }
    });
  } catch (e) {}

  /* mobile menu */
  var hdr = $('.hdr'), menu = $('.menu');
  if (hdr && menu) {
    var closeMenu = function () { hdr.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-label', 'Цэс нээх'); };
    menu.setAttribute('aria-expanded', 'false');
    menu.addEventListener('click', function () {
      var open = hdr.classList.toggle('open');
      menu.setAttribute('aria-expanded', open ? 'true' : 'false');
      menu.setAttribute('aria-label', open ? 'Цэс хаах' : 'Цэс нээх');
    });
    $$('.nav a', hdr).forEach(function (a) { a.addEventListener('click', closeMenu); });
    doc.addEventListener('click', function (e) { if (hdr.classList.contains('open') && !hdr.contains(e.target)) closeMenu(); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && hdr.classList.contains('open')) { closeMenu(); menu.focus(); } });
  }

  /* home: category chips + search over every poster card */
  var cards = $$('#events [data-cat]');
  if (cards.length) {
    var cat = 'Бүгд', q = '';
    var grps = $$('#events .evgrp');
    var empty = doc.createElement('p'); empty.className = 'empty'; empty.textContent = 'Тохирох эвэнт олдсонгүй.';
    grps[grps.length - 1].after(empty);
    var apply = function () {
      var shown = 0;
      cards.forEach(function (c) {
        // title + category + place, so "марафон" also finds "UB Night Marathon"
        var hay = (c.getAttribute('data-cat') + ' ' + $('h3', c).textContent + ' ' + $('.cat', c).textContent).toLowerCase();
        var ok = (cat === 'Бүгд' || c.getAttribute('data-cat') === cat) && (!q || hay.indexOf(q) !== -1);
        c.hidden = !ok; if (ok) shown++;
      });
      grps.forEach(function (g) { g.hidden = !$$('[data-cat]', g).some(function (c) { return !c.hidden; }); });
      empty.classList.toggle('show', !shown);
    };
    $$('#events .chips .chip').forEach(function (ch) {
      ch.addEventListener('click', function () {
        $$('#events .chips .chip').forEach(function (o) { o.setAttribute('aria-pressed', 'false'); });
        ch.setAttribute('aria-pressed', 'true');
        cat = ch.firstChild.textContent.trim(); apply();
      });
    });
    var evq = $('#ev-q');
    if (evq) {
      evq.addEventListener('input', function () { q = evq.value.trim().toLowerCase(); apply(); });
      evq.addEventListener('keydown', function (e) { if (e.key === 'Enter') { evq.blur(); $('#events').scrollIntoView({ behavior: 'smooth' }); } });
    }
  }
  $$('[data-more]').forEach(function (b) { b.addEventListener('click', function () { toast('Жишээ хувилбарт 8 эвэнт харагдана'); }); });

  /* upcoming event: ask for a phone number in a bottom sheet */
  var sheet = $('#notify');
  $$('[data-notify]').forEach(function (b) {
    b.addEventListener('click', function () {
      if (!sheet || !sheet.showModal) { toast('Зураг ормогц танд мэдэгдэнэ'); return; }
      sheet._btn = b; sheet.returnValue = '';
      $('[data-b="nt-ev"]', sheet).textContent = b.getAttribute('data-notify');
      sheet.showModal();
    });
  });
  if (sheet) {
    sheet.addEventListener('click', function (e) { if (e.target === sheet) sheet.close(); });
    sheet.addEventListener('close', function () {
      var b = sheet._btn; if (sheet.returnValue !== 'ok' || !b) return;
      b.disabled = true; b.lastChild.textContent = 'Мэдэгдэл идэвхтэй';
      toast('Зураг ормогц SMS илгээнэ');
    });
  }

  /* small actions */
  var code = $('#code');
  $$('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var c = code ? code.textContent : '';
      if (navigator.clipboard) navigator.clipboard.writeText(c).catch(function () {});
      toast('Код хуулагдлаа: ' + c);
    });
  });
  $$('[data-email]').forEach(function (b) { b.addEventListener('click', function () { toast('Кодыг имэйлээр илгээлээ (жишээ)'); }); });
  $$('[data-share]').forEach(function (b) { b.addEventListener('click', function () { share({ title: doc.title, url: location.href }); }); });
  $$('[data-share-code]').forEach(function (b) {
    b.addEventListener('click', function () {
      var base = /^https?:/.test(location.protocol) ? location.origin : 'https://nna.mn';
      share({ title: 'nna.mn — миний зургууд', text: 'Миний nna.mn нэвтрэх код: ' + (code ? code.textContent : ''), url: base + '/library' }, 'Код болон холбоос хуулагдлаа');
    });
  });
  var codeIn = $('#code-in');
  if (codeIn) {
    var openCode = function () {
      var v = codeIn.value.trim();
      if (!/^NNA-[A-Z0-9]{4}-[A-Z0-9]{2}$/.test(v)) { toast('Код NNA-XXXX-XX хэлбэртэй байна'); codeIn.focus(); return; }
      toast('Код шалгаж байна… (жишээ)');
    };
    codeIn.addEventListener('input', function () { var p = codeIn.selectionStart; codeIn.value = codeIn.value.toUpperCase(); codeIn.setSelectionRange(p, p); });
    codeIn.addEventListener('keydown', function (e) { if (e.key === 'Enter') openCode(); });
    $$('[data-open-code]').forEach(function (b) { b.addEventListener('click', openCode); });
  }
  $$('a[href="#"]').forEach(function (a) {
    if (a.classList.contains('bank')) return;
    if (/татах/i.test(a.textContent)) a.addEventListener('click', function (e) { e.preventDefault(); toast('Татаж эхэллээ (жишээ)'); });
    else a.addEventListener('click', function (e) { e.preventDefault(); toast('Энэ хуудас удахгүй нэмэгдэнэ'); });
  });

  /* event page: sticky bar only after the selfie card scrolls out of view */
  var mbw = $('.mbar[data-watch]'), watched = mbw && $(mbw.getAttribute('data-watch'));
  if (watched && 'IntersectionObserver' in window) {
    mbw.classList.add('auto');
    new IntersectionObserver(function (es) { mbw.classList.toggle('show', !es[0].isIntersecting); }).observe(watched);
  }

  /* selfie preview helper */
  var selfie = store.get('nna-selfie');
  function showSelfie(el) {
    if (!selfie || !el) return;
    var img = doc.createElement('img'); img.className = 'shot-img'; img.alt = ''; img.src = selfie; el.appendChild(img);
  }

  /* upload: real file / camera picker, gated by consent */
  var cam = $('.cam-actions');
  if (cam) {
    var consent = $('#consent');
    var links = $$('a', cam);
    var gate = function () { links.forEach(function (a) { a.setAttribute('aria-disabled', consent.checked ? 'false' : 'true'); }); };
    consent.addEventListener('change', gate); window.addEventListener('pageshow', gate); gate();
    var input = doc.createElement('input'); input.type = 'file'; input.accept = 'image/*'; input.hidden = true; doc.body.appendChild(input);
    var pick = function (useCam) {
      if (!consent.checked) { toast('Эхлээд зөвшөөрлөө тэмдэглэнэ үү'); consent.focus(); return; }
      if (useCam) input.setAttribute('capture', 'user'); else input.removeAttribute('capture');
      input.click();
    };
    links.forEach(function (a, i) { a.addEventListener('click', function (e) { e.preventDefault(); pick(i === 0); }); });
    var vp = $('[data-cam]'); if (vp) vp.addEventListener('click', function () { pick(true); });
    input.addEventListener('change', function () {
      var f = input.files && input.files[0]; if (!f) return;
      // object URL instead of a data URL: a 12MP phone photo as base64 is ~16MB of string on a low-end phone
      var url = URL.createObjectURL(f), im = new Image();
      im.onload = function () {
        var s = Math.min(1, 480 / Math.max(im.width, im.height)), c = doc.createElement('canvas');
        c.width = Math.round(im.width * s); c.height = Math.round(im.height * s);
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        store.set('nna-selfie', c.toDataURL('image/jpeg', .82));
        location.href = 'matching.html';
      };
      im.onerror = function () { URL.revokeObjectURL(url); toast('Зургийг уншиж чадсангүй. JPG эсвэл PNG сонгоно уу'); };
      im.src = url;
    });
  }

  /* matching: progress then results */
  var bar = $('.bar[role="progressbar"]');
  if (bar) {
    showSelfie($('.match .viewport'));
    var fill = $('i', bar), cnt = $('.pc'), total = 9244, p = 34;
    var tm = setInterval(function () {
      p = Math.min(100, p + 4 + Math.random() * 6);
      fill.style.width = p + '%'; bar.setAttribute('aria-valuenow', String(Math.round(p)));
      if (cnt) cnt.textContent = Math.round(total * p / 100).toLocaleString('en-US');
      if (p >= 100) { clearInterval(tm); setTimeout(function () { location.href = 'results.html'; }, 400); }
    }, 220);
  }

  /* full-screen viewer: swipe between photos, tap to zoom where you tapped */
  var V = null;
  function openViewer(o, i) {
    if (!V) {
      var d = doc.createElement('dialog'); d.className = 'viewer'; d.setAttribute('aria-label', 'Зураг харах');
      d.innerHTML = '<div class="vbar"><span class="vc"></span><span class="badge b-glass vb"></span><button class="icon-btn vx" type="button" aria-label="Хаах"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>' +
        '<div class="vstage"><div class="vimg ph"></div>' +
        '<button class="vnav p" type="button" aria-label="Өмнөх зураг"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>' +
        '<button class="vnav n" type="button" aria-label="Дараагийн зураг"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button></div>' +
        '<div class="vfoot"></div>';
      doc.body.appendChild(d);
      V = { d: d, img: $('.vimg', d), cnt: $('.vc', d), badge: $('.vb', d), foot: $('.vfoot', d), prev: $('.vnav.p', d), next: $('.vnav.n', d) };
      var go = function (step) { var j = V.i + step; if (j >= 0 && j < V.o.items.length) V.show(j); };
      V.show = function (j) {
        var it = V.o.items[j]; V.i = j;
        V.img.className = 'vimg ph ' + it.cls; V.img.innerHTML = it.html || '';
        V.cnt.textContent = (j + 1) + ' / ' + V.o.items.length;
        V.badge.textContent = it.label || ''; V.badge.hidden = !it.label;
        V.prev.disabled = j === 0; V.next.disabled = j === V.o.items.length - 1;
        V.o.foot(j, V.foot);
      };
      $('.vx', d).addEventListener('click', function () { d.close(); });
      V.prev.addEventListener('click', function () { go(-1); });
      V.next.addEventListener('click', function () { go(1); });
      d.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft') go(-1); if (e.key === 'ArrowRight') go(1); });
      d.addEventListener('close', function () { if (V.o.onClose) V.o.onClose(V.i); });
      var stage = $('.vstage', d), sx = null, sy = 0, dx = 0;
      stage.addEventListener('pointerdown', function (e) { dx = 0; if (e.pointerType === 'mouse' || V.img.classList.contains('zoom')) return; sx = e.clientX; sy = e.clientY; });
      stage.addEventListener('pointermove', function (e) {
        if (sx === null) return; dx = e.clientX - sx;
        if (Math.abs(dx) > Math.abs(e.clientY - sy)) { V.img.style.transition = 'none'; V.img.style.transform = 'translateX(' + dx + 'px)'; }
      });
      var end = function () {
        if (sx === null) return; sx = null; V.img.style.transition = ''; V.img.style.transform = '';
        if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1);
      };
      stage.addEventListener('pointerup', end); stage.addEventListener('pointercancel', end);
      V.img.addEventListener('click', function (e) {
        if (Math.abs(dx) > 8) return;
        var r = V.img.getBoundingClientRect();
        if (!V.img.classList.contains('zoom')) V.img.style.transformOrigin = ((e.clientX - r.left) / r.width * 100) + '% ' + ((e.clientY - r.top) / r.height * 100) + '%';
        V.img.classList.toggle('zoom');
      });
    }
    V.o = o; V.show(i);
    if (V.d.showModal) V.d.showModal();
  }

  /* results: selection + live price */
  var grid = $('#grid');
  if (grid) {
    showSelfie($('.who .avatar'));
    var data = [
      ['m-dawn', 'x34', '99% тохирол'], ['m-day', 'x22', '98% тохирол'], ['m-trail', 'x40', '97% тохирол'],
      ['m-day', 'x46', '96% тохирол'], ['m-dawn', 'x26', '94% тохирол'], ['m-trail', 'x52', '81% тохирол'], ['m-day', 'x30', '93% тохирол']
    ];
    var off = { 5: true }, tiles = [];
    var bind = function (k, v) { $$('[data-b="' + k + '"]').forEach(function (el) { el.textContent = v; }); };
    data.forEach(function (d, i) {
      var el = doc.createElement('div'); el.className = 'tile ph ' + d[0] + ' ' + d[1]; el.setAttribute('data-i', i);
      el.innerHTML = '<button type="button" class="t-open" aria-label="Зураг ' + (i + 1) + ', ' + d[2] + ', томруулж харах"></button>' +
        '<span class="fd corners"></span><span class="wm" aria-hidden="true">NNA.MN</span>' +
        '<button type="button" class="sel" aria-label="Зураг ' + (i + 1) + '-г сонгох"></button><span class="lb badge b-glass"></span>';
      grid.appendChild(el); tiles.push(el);
    });
    // update tiles in place: re-rendering the grid replayed the pop animation on every selected photo
    var paint = function (i) {
      var on = !off[i], el = tiles[i], s = $('.sel', el);
      el.classList.toggle('on', on); el.classList.toggle('off', !on);
      s.setAttribute('aria-pressed', on ? 'true' : 'false'); s.innerHTML = on ? CK : '';
      $('.lb', el).textContent = on ? data[i][2] : 'Хасагдсан';
    };
    var totals = function () {
      var count = 0; data.forEach(function (_, i) { if (!off[i]) count++; });
      var bundle = count >= 4, price = bundle ? 10000 : count * 3000;
      bind('count', count + ' / ' + data.length + ' зураг');
      bind('price', fmt(price));
      bind('rule', bundle ? 'Багц үнэ: 4 ба түүнээс олон зураг' : (count ? 'Зураг тус бүр 3,000₮' : 'Татах зургаа сонгоно уу'));
      bind('savings', 'Тус бүрээр авбал ' + fmt(count * 3000) + ' болох байсан. Та ' + fmt(count * 3000 - 10000) + ' хэмнэлээ.');
      bind('upsell', 'Дахиад ' + (4 - count) + ' зураг нэмбэл бүгд 10,000₮ (+' + fmt(10000 - count * 3000) + ')');
      bind('hint', !count ? 'Зургаа сонгоно уу' : bundle ? count + ' зураг · багц үнэ' : '+' + (4 - count) + ' зураг нэмбэл бүгд 10,000₮');
      $$('[data-b="savings"]').forEach(function (el) { el.hidden = !bundle; });
      $$('[data-b="upsell"]').forEach(function (el) { el.hidden = !(count > 0 && count < 4); });
      $$('a[href="checkout.html"]').forEach(function (a) { a.setAttribute('aria-disabled', count ? 'false' : 'true'); });
      store.set('nna-count', String(count));
      return { count: count, price: price };
    };
    var toggle = function (i) {
      if (off[i]) delete off[i]; else off[i] = true;
      paint(i); totals();
      var el = tiles[i]; el.classList.remove('pop');
      if (!off[i]) { void el.offsetWidth; el.classList.add('pop'); }
      if (navigator.vibrate) navigator.vibrate(8);
    };
    var vopts = {
      items: data.map(function (d) { return { cls: d[0] + ' ' + d[1], label: d[2], html: '<span class="fd corners"></span><span class="wm" aria-hidden="true">NNA.MN</span>' }; }),
      foot: function (i, f) {
        var on = !off[i], t = totals();
        f.innerHTML = '<span class="tx"><b class="tnum">' + fmt(t.price) + ' · ' + t.count + ' зураг</b>' + (on ? 'Таных биш бол хасна уу' : 'Хасагдсан — дахин сонгож болно') + '</span>' +
          '<button type="button" class="btn vtog" aria-pressed="' + on + '">' + (on ? CK + 'Сонгосон' : 'Сонгох') + '</button>';
        $('.vtog', f).addEventListener('click', function () { toggle(i); vopts.foot(i, f); $('.vtog', f).focus(); });
      },
      onClose: function (i) { $('.t-open', tiles[i]).focus(); }
    };
    grid.addEventListener('click', function (e) {
      var el = e.target.closest('.tile'); if (!el) return;
      var i = +el.getAttribute('data-i');
      if (e.target.closest('.sel')) toggle(i);
      else if (e.target.closest('.t-open')) openViewer(vopts, i);
    });
    $$('[data-act]').forEach(function (b) {
      b.addEventListener('click', function () {
        off = {}; if (b.getAttribute('data-act') === 'none') data.forEach(function (_, i) { off[i] = true; });
        data.forEach(function (_, i) { paint(i); }); totals();
      });
    });
    data.forEach(function (_, i) { paint(i); }); totals();
  }

  /* checkout: reflect selection, countdown, bank apps, auto payment check */
  var ol = $('.ol');
  if (ol) {
    var n = parseInt(store.get('nna-count') || '6', 10) || 6;
    var lis = $$('.li', ol), bundleOk = n >= 4, tot = bundleOk ? 10000 : n * 3000;
    $('span:last-child', lis[0]).textContent = n;
    var each = $('span:last-child', lis[1]); each.textContent = fmt(n * 3000);
    if (!bundleOk) { each.style.textDecoration = 'none'; each.style.color = 'var(--ink)'; lis[2].hidden = true; }
    else $('span:last-child', lis[2]).textContent = '−' + fmt(n * 3000 - 10000);
    $('span:last-child', lis[3]).textContent = fmt(tot);
    var mb = $('.mbar .tx'); if (mb) mb.innerHTML = '<b class="tnum">' + fmt(tot) + '</b>' + n + ' зураг · QPay';
    $$('.thumbs .ph').forEach(function (t, i) { t.hidden = i >= n; });
    var timer = $('.timer'), left = 14 * 60 + 52;
    if (timer) setInterval(function () { left = Math.max(0, left - 1); timer.textContent = String(Math.floor(left / 60)).padStart(2, '0') + ':' + String(left % 60).padStart(2, '0'); }, 1000);
    var qrbox = $('.qrbox'), wait = $('[data-paywait]'), pending = false;
    var setWait = function (t, s) { wait.hidden = false; $('[data-b="pw-t"]', wait).textContent = t; $('[data-b="pw-s"]', wait).textContent = s; };
    var check = function () { setWait('Төлбөр шалгаж байна…', 'Түр хүлээнэ үү.'); setTimeout(function () { location.href = 'library.html'; }, 1200); };
    $$('.rc input').forEach(function (r, i) {
      r.addEventListener('change', function () {
        if (qrbox) qrbox.hidden = i !== 0;
        if (wait) wait.hidden = true;
        if (i === 1) toast('Картын төлбөр удахгүй нэмэгдэнэ (жишээ)');
      });
    });
    $$('.bank').forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.preventDefault();
        // live: location.href = the bank's deeplink from the QPay invoice (urls[].link)
        pending = true;
        toast('«' + b.getAttribute('data-bank') + '» апп нээгдэнэ (жишээ)');
        setWait('Төлбөр хүлээж байна…', 'Төлөөд энд буцаж ирэхэд автоматаар шалгана.');
        wait.scrollIntoView({ block: 'center', behavior: 'smooth' });
      });
    });
    // coming back from the bank app is the cue to check — no "check payment" tap needed
    doc.addEventListener('visibilitychange', function () { if (pending && doc.visibilityState === 'visible') { pending = false; check(); } });
    var sq = $('[data-showqr]');
    if (sq) sq.addEventListener('click', function () { var on = qrbox.classList.toggle('qr-on'); sq.textContent = on ? 'QR нуух' : 'Өөр утаснаас төлөх бол QR харуулах'; });
    $$('[data-check], .side a[href="library.html"]').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); check(); }); });
  }

  /* library: save to the phone's photo roll via the share sheet, viewer per event */
  var lgrids = $$('.lgrid');
  if (lgrids.length) {
    var canShareFiles = (function () { try { return !!(navigator.canShare && navigator.canShare({ files: [new File([''], 'a.jpg', { type: 'image/jpeg' })] })); } catch (e) { return false; } })();
    var MOOD = { 'm-dawn': ['#F6D2B4', '#66788C'], 'm-day': ['#9EC0E6', '#6E8763'], 'm-trail': ['#E6DCCB', '#56634C'], 'm-night': ['#1B2550', '#0E1530'] };
    var files = new Map();
    // share() has to run inside the tap, so the files are prepared up front (live: fetch the originals as blobs here)
    if (canShareFiles) $$('.lt').forEach(function (t, k) {
      var m = (t.className.match(/m-\w+/) || ['m-day'])[0], g = MOOD[m] || MOOD['m-day'];
      var c = doc.createElement('canvas'); c.width = 600; c.height = 750;
      var x = c.getContext('2d'), gr = x.createLinearGradient(0, 0, 0, 750);
      gr.addColorStop(0, g[0]); gr.addColorStop(1, g[1]); x.fillStyle = gr; x.fillRect(0, 0, 600, 750);
      x.fillStyle = 'rgba(255,255,255,.85)'; x.font = '600 28px sans-serif'; x.fillText('nna.mn · жишээ зураг ' + (k + 1), 32, 700);
      c.toBlob(function (b) { files.set(t, new File([b], 'nna-' + (k + 1) + '.jpg', { type: 'image/jpeg' })); }, 'image/jpeg', .85);
    });
    var save = function (ts) {
      var fs = ts.map(function (t) { return files.get(t); }).filter(Boolean);
      if (!canShareFiles || !fs.length) { toast('Татаж эхэллээ (жишээ)'); return; }
      navigator.share({ files: fs, title: 'nna.mn зургууд' }).catch(function (e) { if (e && e.name !== 'AbortError') toast('Хадгалж чадсангүй — ZIP-ээр татна уу'); });
    };
    $$('[data-save]').forEach(function (b) {
      b.addEventListener('click', function () { var g = b.closest('.grp'); save($$('.lt', g || doc)); });
    });
    $$('.grp').forEach(function (g) {
      var ts = $$('.lt', g), title = $('h1, h2', g).textContent;
      var opts = {
        items: ts.map(function (t) { return { cls: t.className.replace(/\b(lt|ph)\b/g, '').trim() }; }),
        foot: function (i, f) {
          f.innerHTML = '<span class="tx"><b>' + title + '</b>Эх хэмжээ · усан тэмдэггүй</span><button type="button" class="btn btn-pri">' + (canShareFiles ? 'Утсандаа хадгалах' : 'Татах') + '</button>';
          $('.btn', f).addEventListener('click', function () { save([ts[i]]); });
        },
        onClose: function (i) { $('.lt-open', ts[i]).focus(); }
      };
      ts.forEach(function (t, i) {
        $('.lt-open', t).addEventListener('click', function () { openViewer(opts, i); });
        $('.dl', t).addEventListener('click', function () { save([t]); });
      });
    });
  }
})();
