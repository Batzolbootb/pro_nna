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
    if (!t) { t = doc.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.setAttribute('aria-live', 'polite'); doc.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show');
    clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove('show'); }, 2400);
  }

  /* theme */
  function syncThemeBtns() {
    var t = root.getAttribute('data-theme');
    $$('.theme-btn').forEach(function (b) { b.setAttribute('aria-pressed', t === 'dark' ? 'true' : 'false'); b.setAttribute('aria-label', t === 'dark' ? 'Гэгээлэг горим руу шилжих' : 'Харанхуй горим руу шилжих'); });
  }
  function setTheme(t) {
    root.setAttribute('data-theme', t);
    try { localStorage.setItem('nna-theme', t); } catch (e) {}
    syncThemeBtns();
  }
  syncThemeBtns();
  $$('.theme-btn').forEach(function (b) { b.addEventListener('click', function () { setTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'); }); });
  try {
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
      if (!localStorage.getItem('nna-theme')) { root.setAttribute('data-theme', e.matches ? 'dark' : 'light'); syncThemeBtns(); }
    });
  } catch (e) {}

  /* mobile menu */
  var hdr = $('.hdr'), menu = $('.menu');
  if (hdr && menu) {
    menu.setAttribute('aria-expanded', 'false');
    menu.addEventListener('click', function () {
      var open = hdr.classList.toggle('open');
      menu.setAttribute('aria-expanded', open ? 'true' : 'false');
      menu.setAttribute('aria-label', open ? 'Цэс хаах' : 'Цэс нээх');
    });
    $$('.nav a', hdr).forEach(function (a) { a.addEventListener('click', function () { hdr.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); }); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && hdr.classList.contains('open')) { hdr.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); menu.focus(); } });
  }

  /* home: category chips + search */
  var cards = $$('#events .grid-ev .ev');
  if (cards.length) {
    var cat = 'Бүгд', q = '';
    var empty = doc.createElement('p'); empty.className = 'empty'; empty.textContent = 'Тохирох эвэнт олдсонгүй.';
    $('#events .grid-ev').after(empty);
    var apply = function () {
      var shown = 0;
      cards.forEach(function (c) {
        var cc = ($('.cat', c).textContent.split('·')[0] || '').trim();
        var title = $('h3', c).textContent.toLowerCase();
        var ok = (cat === 'Бүгд' || cc === cat) && (!q || title.indexOf(q) !== -1);
        c.hidden = !ok; if (ok) shown++;
      });
      empty.classList.toggle('show', !shown);
    };
    $$('#events .chip').forEach(function (ch) {
      ch.addEventListener('click', function () {
        $$('#events .chip').forEach(function (o) { o.setAttribute('aria-pressed', 'false'); });
        ch.setAttribute('aria-pressed', 'true');
        cat = ch.firstChild.textContent.trim(); apply();
      });
    });
    var evq = $('#ev-q'); if (evq) evq.addEventListener('input', function () { q = evq.value.trim().toLowerCase(); apply(); });
    var hq = $('#hero-q');
    if (hq) {
      var go = function () { if (evq) { evq.value = hq.value; q = hq.value.trim().toLowerCase(); apply(); } };
      hq.addEventListener('keydown', function (e) { if (e.key === 'Enter') { go(); location.hash = 'events'; } });
      var hb = $('.searchbar .btn'); if (hb) hb.addEventListener('click', go);
    }
  }

  /* small actions */
  $$('button').forEach(function (b) {
    var t = b.textContent.trim();
    if (t === 'Мэдэгдэл авах') b.addEventListener('click', function () { b.textContent = 'Мэдэгдэл идэвхтэй'; b.disabled = true; toast('Зураг ормогц танд мэдэгдэнэ'); });
    if (t === 'Бүх эвэнтийг үзэх') b.addEventListener('click', function () { toast('Жишээ хувилбарт 8 эвэнт харагдана'); });
    if (t === 'Хуулах') b.addEventListener('click', function () {
      var code = ($('.code') || {}).textContent || '';
      if (navigator.clipboard) navigator.clipboard.writeText(code).catch(function () {});
      toast('Код хуулагдлаа: ' + code);
    });
    if (t === 'Имэйлээр илгээх') b.addEventListener('click', function () { toast('Кодыг имэйлээр илгээлээ (жишээ)'); });
    if (t === 'Нээх') b.addEventListener('click', function () { toast('Код шалгаж байна… (жишээ)'); });
  });
  $$('.dl, a[href="#"]').forEach(function (a) {
    if (/татах/i.test(a.textContent) || a.classList.contains('dl')) a.addEventListener('click', function (e) { e.preventDefault(); toast('Татаж эхэллээ (жишээ)'); });
    else if (/апп нээх/.test(a.textContent)) a.addEventListener('click', function (e) { e.preventDefault(); toast('Банкны апп нээгдэнэ (жишээ)'); });
    else if (a.getAttribute('href') === '#') a.addEventListener('click', function (e) { e.preventDefault(); toast('Энэ хуудас удахгүй нэмэгдэнэ'); });
  });

  /* selfie preview helper */
  var selfie = store.get('nna-selfie');
  function showSelfie(el) {
    if (!selfie || !el) return;
    var img = doc.createElement('img'); img.className = 'shot-img'; img.alt = ''; img.src = selfie; el.appendChild(img);
  }

  /* upload: real file / camera picker */
  var cam = $('.cam-actions');
  if (cam) {
    var consent = $('.check input');
    var input = doc.createElement('input'); input.type = 'file'; input.accept = 'image/*'; input.hidden = true; doc.body.appendChild(input);
    var links = $$('a', cam);
    links.forEach(function (a, i) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        if (consent && !consent.checked) { toast('Эхлээд зөвшөөрлөө тэмдэглэнэ үү'); consent.focus(); return; }
        if (i === 0) input.setAttribute('capture', 'user'); else input.removeAttribute('capture');
        input.click();
      });
    });
    input.addEventListener('change', function () {
      var f = input.files && input.files[0]; if (!f) return;
      var r = new FileReader();
      r.onload = function () {
        var im = new Image();
        im.onload = function () {
          var s = 480 / Math.max(im.width, im.height), c = doc.createElement('canvas');
          c.width = Math.round(im.width * Math.min(1, s)); c.height = Math.round(im.height * Math.min(1, s));
          c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
          store.set('nna-selfie', c.toDataURL('image/jpeg', .82));
          location.href = 'matching.html';
        };
        im.src = r.result;
      };
      r.readAsDataURL(f);
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

  /* results: selection + live price */
  var grid = $('#grid');
  if (grid) {
    showSelfie($('.who .avatar'));
    var data = [
      ['m-dawn', 'x34', '99% тохирол'], ['m-day', 'x22', '98% тохирол'], ['m-trail', 'x40', '97% тохирол'],
      ['m-day', 'x46', '96% тохирол'], ['m-dawn', 'x26', '94% тохирол'], ['m-trail', 'x52', '81% тохирол'], ['m-day', 'x30', '93% тохирол']
    ];
    var off = { 5: true };
    var bind = function (k, v) { $$('[data-b="' + k + '"]').forEach(function (el) { el.textContent = v; }); };
    var render = function () {
      var count = 0, html = '';
      data.forEach(function (d, i) {
        var on = !off[i]; if (on) count++;
        html += '<button type="button" data-i="' + i + '" class="tile ' + (on ? 'on' : 'off') + ' ph ' + d[0] + ' ' + d[1] + '" aria-pressed="' + on + '" aria-label="Зураг ' + (i + 1) + ', ' + d[2] + (on ? ', сонгосон' : ', хасагдсан') + '">' +
          (on ? '<span class="fd corners"></span><span class="wm" aria-hidden="true">NNA.MN</span><span class="sel">' + CK + '</span><span class="lb badge b-glass">' + d[2] + '</span>'
              : '<span class="sel"></span><span class="lb badge b-glass">Хасагдсан</span>') + '</button>';
      });
      grid.innerHTML = html;
      var bundle = count >= 4, price = bundle ? 10000 : count * 3000;
      bind('count', count + ' / ' + data.length + ' зураг');
      bind('price', fmt(price));
      bind('rule', bundle ? 'Багц үнэ: 4 ба түүнээс олон зураг' : (count ? 'Зураг тус бүр 3,000₮' : 'Татах зургаа сонгоно уу'));
      bind('savings', 'Тус бүрээр авбал ' + fmt(count * 3000) + ' болох байсан. Та ' + fmt(count * 3000 - 10000) + ' хэмнэлээ.');
      bind('upsell', 'Дахиад ' + (4 - count) + ' зураг нэмбэл бүгд 10,000₮ (+' + fmt(10000 - count * 3000) + ')');
      $$('[data-b="savings"]').forEach(function (el) { el.hidden = !bundle; });
      $$('[data-b="upsell"]').forEach(function (el) { el.hidden = !(count > 0 && count < 4); });
      $$('a[href="checkout.html"]').forEach(function (a) { a.setAttribute('aria-disabled', count ? 'false' : 'true'); });
      store.set('nna-count', String(count));
    };
    grid.addEventListener('click', function (e) {
      var b = e.target.closest('.tile'); if (!b) return;
      var i = +b.getAttribute('data-i'); if (off[i]) delete off[i]; else off[i] = true;
      render(); var nb = grid.querySelector('[data-i="' + i + '"]'); if (nb) nb.focus();
    });
    $$('[data-act]').forEach(function (b) {
      b.addEventListener('click', function () { off = {}; if (b.getAttribute('data-act') === 'none') data.forEach(function (_, i) { off[i] = true; }); render(); });
    });
    render();
  }

  /* checkout: reflect selection, countdown, method switch */
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
    var qrbox = $('.qrbox');
    $$('.rc input').forEach(function (r, i) { r.addEventListener('change', function () { if (qrbox) qrbox.hidden = i !== 0; if (i === 1) toast('Картын төлбөр удахгүй нэмэгдэнэ (жишээ)'); }); });
  }
})();
