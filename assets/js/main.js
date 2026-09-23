/* =========================================================
   tripman corporate site — main.js
   - mobile nav
   - header shrink on scroll
   - hero date-change-line animation (+ skip / reduced-motion)
   - reveal on scroll
   - JP / EN i18n (JSON dictionaries, JA fallback, prep banner)
   ========================================================= */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- mobile nav ---------- */
  var body = document.body;
  var hamburger = document.getElementById('hamburger');
  var scrim = document.getElementById('navScrim');
  var primaryNav = document.getElementById('primaryNav');

  function closeMenu() {
    body.classList.remove('is-menu-open');
    if (primaryNav) primaryNav.classList.remove('is-open');
    if (hamburger) hamburger.setAttribute('aria-expanded', 'false');
    if (scrim) scrim.hidden = true;
  }
  function toggleMenu() {
    var open = body.classList.toggle('is-menu-open');
    // the open/closed transform is driven directly off the nav element's own
    // class (not a body-descendant selector), so there's no ambiguity about
    // which rule wins
    if (primaryNav) primaryNav.classList.toggle('is-open', open);
    if (hamburger) hamburger.setAttribute('aria-expanded', String(open));
    if (scrim) scrim.hidden = !open;
  }
  if (hamburger) hamburger.addEventListener('click', toggleMenu);
  if (scrim) scrim.addEventListener('click', closeMenu);
  document.querySelectorAll('.nav__links a').forEach(function (a) {
    a.addEventListener('click', closeMenu);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenu();
  });

  /* ---------- header shrink ---------- */
  var header = document.getElementById('siteHeader');
  function onScroll() {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 24);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- hero intro animation ----------
     The hero is fully readable at rest (CSS resting state). Adding
     `.anim-ready` plays the one-shot CSS intro; `.is-revealed` cancels
     it and locks the finished state (no visible skip button per v1.1 —
     scrolling away or pressing Escape still finishes it instantly). */
  var hero = document.getElementById('hero');

  function finishHero() {
    if (hero) hero.classList.add('is-revealed');
  }

  if (hero) {
    if (reduceMotion) {
      finishHero();
    } else {
      hero.classList.add('anim-ready');
      // failsafe: guarantee the finished state even if something stalls
      var failsafe = setTimeout(finishHero, 4000);

      var skip = function () {
        clearTimeout(failsafe);
        finishHero();
      };
      window.addEventListener('scroll', function once() {
        skip();
        window.removeEventListener('scroll', once);
      }, { passive: true });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') skip();
      });
    }
  }

  /* ---------- reveal on scroll ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('is-in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.16 });
    revealEls.forEach(function (el) { io.observe(el); });
    // failsafe: never leave content hidden (observer misfire / already in view / slow)
    setTimeout(function () {
      revealEls.forEach(function (el) { el.classList.add('is-in'); });
    }, 1600);
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- i18n ---------- */
  var LANG_KEY = 'tripman.lang';
  var dicts = {};
  var current = 'ja';
  var langButtons = document.querySelectorAll('.lang button[data-lang]');
  var banner = document.getElementById('i18nBanner');
  var bannerText = document.getElementById('i18nBannerText');
  var bannerClose = document.getElementById('i18nBannerClose');

  // capture original (JA) text as authored in the HTML
  var i18nEls = document.querySelectorAll('[data-i18n]');
  i18nEls.forEach(function (el) { el.setAttribute('data-i18n-ja', el.innerHTML.trim()); });

  function loadDict(lang) {
    if (dicts[lang]) return Promise.resolve(dicts[lang]);
    return fetch('i18n/' + lang + '.json', { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : {}; })
      .then(function (json) { dicts[lang] = json || {}; return dicts[lang]; })
      .catch(function () { dicts[lang] = {}; return dicts[lang]; });
  }

  function applyLang(lang) {
    current = lang;
    document.documentElement.setAttribute('lang', lang);
    langButtons.forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === lang));
    });
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}

    if (lang === 'ja') {
      i18nEls.forEach(function (el) { el.innerHTML = el.getAttribute('data-i18n-ja'); });
      hideBanner();
      return;
    }

    loadDict(lang).then(function (dict) {
      var missing = 0;
      i18nEls.forEach(function (el) {
        var key = el.getAttribute('data-i18n');
        if (dict && Object.prototype.hasOwnProperty.call(dict, key) && dict[key]) {
          el.innerHTML = dict[key];
        } else {
          el.innerHTML = el.getAttribute('data-i18n-ja'); // fallback to Japanese
          missing++;
        }
      });
      if (missing > 0) showBanner(missing);
      else hideBanner();
    });
  }

  function showBanner() {
    if (!banner) return;
    banner.hidden = false;
    if (bannerText) {
      bannerText.textContent = 'English pages are being prepared. Untranslated parts are shown in Japanese — your browser translation can also help.';
    }
    requestAnimationFrame(function () { banner.classList.add('is-shown'); });
  }
  function hideBanner() {
    if (!banner) return;
    banner.classList.remove('is-shown');
    setTimeout(function () { banner.hidden = true; }, 400);
  }
  if (bannerClose) bannerClose.addEventListener('click', hideBanner);

  langButtons.forEach(function (b) {
    b.addEventListener('click', function () { applyLang(b.getAttribute('data-lang')); });
  });

  // initial language
  var stored = null;
  try { stored = localStorage.getItem(LANG_KEY); } catch (e) {}
  var initial = stored || (navigator.language && navigator.language.toLowerCase().indexOf('ja') === 0 ? 'ja' : 'ja');
  if (initial !== 'ja') applyLang(initial);
  else applyLang('ja');

  /* ---------- contact form ---------- */
  var form = document.getElementById('contactForm');
  if (form) {
    var tsField = document.getElementById('ts');
    if (tsField) tsField.value = String(Date.now());

    // preselect お問い合わせ種別 from ?type=
    var qs = new URLSearchParams(location.search);
    var typeMap = {
      partner: 'プロジェクトマネジメント・業務変革コンサルティングのご相談',
      pm: 'プロジェクトマネジメント・業務変革コンサルティングのご相談',
      consulting: 'プロジェクトマネジメント・業務変革コンサルティングのご相談',
      case: '案件紹介',
      recruit: '採用'
    };
    var want = typeMap[(qs.get('type') || '').toLowerCase()];
    var typeSel = document.getElementById('type');
    if (want && typeSel) {
      for (var i = 0; i < typeSel.options.length; i++) {
        if (typeSel.options[i].value === want) { typeSel.selectedIndex = i; break; }
      }
    }

    var errBox = document.getElementById('formError');
    var okBox = document.getElementById('formOk');
    var submitBtn = document.getElementById('submitBtn');

    var showErr = function (msg) {
      if (!errBox) return;
      errBox.textContent = msg;
      errBox.hidden = false;
      errBox.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    };
    var clearInvalid = function () {
      form.querySelectorAll('.field-invalid').forEach(function (el) { el.classList.remove('field-invalid'); });
    };

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      clearInvalid();
      if (errBox) errBox.hidden = true;

      var name = form.name ? form.elements['name'] : null;
      var fields = {
        name: form.elements['name'],
        email: form.elements['email'],
        type: form.elements['type'],
        message: form.elements['message'],
        consent: form.elements['consent']
      };
      var firstBad = null;
      var bad = function (el) { if (el) { el.classList.add('field-invalid'); if (!firstBad) firstBad = el; } };

      if (!fields.name.value.trim()) bad(fields.name);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.value.trim())) bad(fields.email);
      if (!fields.type.value) bad(fields.type);
      if (!fields.message.value.trim()) bad(fields.message);
      if (!fields.consent.checked) bad(fields.consent);

      // 機械的な入力・ソースコード風の入力の抑止（サーバー側でも同じ判定を行う）
      var looksLikeMarkup = /<\s*(script|iframe|style|object|embed|svg|img|a)\b|<\/?[a-z][\s\S]*>/i;
      var companyEl = form.elements['company'];
      [fields.name, companyEl, fields.message].forEach(function (el) {
        if (el && el.value && looksLikeMarkup.test(el.value)) bad(el);
      });

      if (firstBad) {
        showErr('未入力の項目があるか、HTMLタグ・スクリプトのような入力が含まれています。赤枠の項目をご確認ください。');
        firstBad.focus();
        return;
      }

      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '送信中…'; }

      fetch(form.action, { method: 'POST', body: new FormData(form), headers: { 'X-Requested-With': 'fetch' } })
        .then(function (r) { return r.json().catch(function () { return { ok: r.ok }; }); })
        .then(function (data) {
          if (data && data.ok) {
            form.hidden = true;
            if (okBox) { okBox.hidden = false; okBox.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' }); }
          } else {
            showErr((data && data.message) || '送信に失敗しました。時間をおいて再度お試しいただくか、info@tripman.co.jp までご連絡ください。');
            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '送信する'; }
          }
        })
        .catch(function () {
          showErr('通信エラーが発生しました。時間をおいて再度お試しいただくか、info@tripman.co.jp までご連絡ください。');
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '送信する'; }
        });
    });
  }
})();
