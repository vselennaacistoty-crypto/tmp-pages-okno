/* Окно-ДНР — рабочая логика поверх макета дизайнера (12.10.2026).
   1) Форма #lead-form отправляется на /send.php (как на прежнем сайте). Демонстрационный
      обработчик дизайнера в app.js / pages.js не трогаем: перехватываем submit раньше него
      (фаза захвата на document) и даём форме уйти на сервер штатно.
   2) Cookie-согласие и Яндекс.Метрика 113044063 (счётчик окно-днр.рф; 111054411 — счётчик
      единого-контура, с 12.10 по 23.10.2026 стоял здесь по ошибке): счётчик загружается только
      после разрешения аналитики. Ключ и формат записи — те же, что на прежнем сайте
      (oknodnr.cookie.consent.v1), поэтому уже данное посетителями согласие сохраняется.
      Цели счётчика (их ждёт Директ 714842333): PHONE_CLICK 664235932, FORM_SUBMIT 664236124 —
      FORM_SUBMIT с 26.10.2026 засчитывается на /spasibo/?ok=1, а не в момент нажатия кнопки. */
(function () {
  'use strict';
  var d = document, M = 113044063, opened = Date.now();

  function goal(id) { try { if (typeof window.ym === 'function') { window.ym(M, 'reachGoal', id); } } catch (e) {} }

  d.addEventListener('click', function (ev) {
    if (ev.target && ev.target.closest && ev.target.closest('a[href^="tel:"]')) { goal('PHONE_CLICK'); }
  }, true);

  /* 1. Форма */
  function prepForm(f) {
    var t = f.querySelector('input[name="t"]'), el = f.querySelector('input[name="el"]'), nx = f.querySelector('input[name="next"]');
    if (t) { t.value = String(Math.floor(opened / 1000)); }
    if (nx) { nx.value = location.pathname; }
    if (el) { el.value = '0'; }
  }
  function onReady() {
    var forms = d.querySelectorAll('form.ours-lead');
    for (var i = 0; i < forms.length; i++) { prepForm(forms[i]); }
  }
  d.addEventListener('submit', function (ev) {
    var f = ev.target;
    if (!f || !f.classList || !f.classList.contains('ours-lead')) { return; }
    // обработчик дизайнера (демо) не должен сработать — форма уходит на сервер
    ev.stopImmediatePropagation();
    var ph = f.querySelector('input[name="phone"]');
    var digits = ph ? ph.value.replace(/\D/g, '') : '';
    if (digits.length < 10 || digits.length > 15) {
      ev.preventDefault();
      if (ph) { ph.setCustomValidity('Введите номер телефона: от 10 до 15 цифр.'); ph.reportValidity(); }
      return;
    }
    if (ph) { ph.setCustomValidity(''); }
    var el = f.querySelector('input[name="el"]');
    if (el) { el.value = String(Math.round((Date.now() - opened) / 1000)); }
    var btn = f.querySelector('button[type="submit"]');
    if (btn) { btn.setAttribute('aria-busy', 'true'); }
    // FORM_SUBMIT засчитывается на /spasibo/?ok=1 (см. leadDone): отсюда до ухода на send.php цель не успевала уйти
    if (f.querySelector('#wish') && /^Балкон \d/.test(f.querySelector('#wish').value)) { goal('calc_lead'); }
  }, true);
  d.addEventListener('input', function (ev) {
    if (ev.target && ev.target.name === 'phone' && ev.target.setCustomValidity) { ev.target.setCustomValidity(''); }
  }, true);

  /* 1б. Предварительная сумма в конфигураторе дизайнера. Ставки = lib/pricing.js прода
     (подтверждены владельцем 27.09.2026), те же в tools/build.py. Материалы по умолчанию:
     ПВХ-панели и линолеум — выбора материалов в макете нет. */
  var RATE = { glass: 1970, roof: 980, parapet: 440, warm: 410, finish: 790, floor: 510 };
  var GK = { cold: [1, 'холодное (алюминий)'], warm: [1.6, 'тёплое (ПВХ)'], panorama: [2.1, 'панорамное'] };
  function money(n) { return new Intl.NumberFormat('ru-RU').format(Math.round(n)) + '\u00a0₽'; }
  function estimate() {
    var box = d.querySelector('.ours-estimate'), L = d.getElementById('length'), D = d.getElementById('depth');
    if (!box || !L || !D) { return null; }
    var w = Number(L.value), dp = Number(D.value), per = w + 2 * dp;
    var gb = d.querySelector('.glass-choices [aria-pressed="true"]') || d.querySelector('.glass-choices .active');
    var g = GK[gb ? gb.getAttribute('data-glazing') : 'warm'] || GK.warm;
    var on = {}; var ws = d.querySelectorAll('[name="work"]:checked');
    for (var i = 0; i < ws.length; i++) { on[ws[i].value] = true; }
    var rows = [['Остекление — ' + g[1], per * 1.5 * RATE.glass * g[0]]];
    if (on['Крыша']) { rows.push(['Крыша', w * RATE.roof]); }
    if (on['Ремонт парапета']) { rows.push(['Парапет', per * RATE.parapet]); }
    if (on['Утепление']) { rows.push(['Утепление стен', per * 1.4 * RATE.warm]); }
    if (on['Отделка стен и потолка']) { rows.push(['Отделка стен и потолка — ПВХ-панели', per * 1.4 * RATE.finish]); }
    if (on['Укладка пола']) { rows.push(['Укладка пола — линолеум', w * dp * RATE.floor]); }
    var total = 0, html = '';
    for (var k = 0; k < rows.length; k++) { rows[k][1] = Math.round(rows[k][1]); total += rows[k][1]; html += '<li><span>' + rows[k][0] + '</span><span>' + money(rows[k][1]) + '</span></li>'; }
    box.querySelector('.ours-estimate__sum b').textContent = money(total);
    box.querySelector('.ours-estimate__rows').innerHTML = html;
    return total;
  }
  function estLater() { setTimeout(estimate, 0); }
  d.addEventListener('input', function (ev) { if (ev.target.closest && ev.target.closest('#configurator')) { estLater(); } });
  d.addEventListener('change', function (ev) { if (ev.target.closest && ev.target.closest('#configurator')) { estLater(); } });
  d.addEventListener('click', function (ev) {
    if (!ev.target.closest) { return; }
    if (ev.target.closest('#configurator button')) { estLater(); }
    // «Получить точный расчёт»: дизайнер пишет комплектацию в #wish, мы дописываем предварительную сумму
    if (ev.target.closest('#transfer-config')) {
      setTimeout(function () {
        var t = estimate(), wish = d.getElementById('wish');
        if (t && wish && wish.value.indexOf('Предварительно') < 0) { wish.value += ' Предварительно ≈ ' + money(t).replace('\u00a0', ' ') + '.'; }
      }, 0);
    }
  });

  /* 1в. Выпадающее меню «Все услуги»: на компьютере — по наведению (CSS) и по кнопке, на телефоне — аккордеон */
  d.addEventListener('click', function (ev) {
    if (!ev.target.closest) { return; }
    var btn = ev.target.closest('.nav-drop__btn');
    if (btn) {
      var dr = btn.closest('.nav-drop'), op = !dr.classList.contains('open');
      dr.classList.toggle('open', op); btn.setAttribute('aria-expanded', op ? 'true' : 'false');
      return;
    }
    var h = ev.target.closest('.nav-drop__h');
    if (h && window.matchMedia('(max-width: 700px)').matches) {
      var col = h.closest('.nav-drop__col'), o2 = !col.classList.contains('open');
      col.classList.toggle('open', o2); h.setAttribute('aria-expanded', o2 ? 'true' : 'false');
      return;
    }
    var open = d.querySelector('.nav-drop.open');
    if (open && !ev.target.closest('.nav-drop')) { open.classList.remove('open'); open.querySelector('.nav-drop__btn').setAttribute('aria-expanded', 'false'); }
  });
  d.addEventListener('keydown', function (ev) {
    if (ev.key !== 'Escape') { return; }
    var open = d.querySelector('.nav-drop.open');
    if (open) { open.classList.remove('open'); open.querySelector('.nav-drop__btn').setAttribute('aria-expanded', 'false'); }
    if (d.activeElement && d.activeElement.closest && d.activeElement.closest('.nav-drop__panel')) { d.activeElement.blur(); }
  });

  /* 2. Cookie-согласие и Метрика */
  var CK_KEY = 'oknodnr.cookie.consent.v1';
  var CK_TEXT = 'Мы используем файлы cookie, чтобы сайт работал и становился удобнее. Нажимая «Хорошо», вы соглашаетесь с обработкой данных согласно Политике обработки персональных данных и Уведомлению об использовании cookie.';
  function ckRead() { try { var r = localStorage.getItem(CK_KEY); if (!r) { return null; } var p = JSON.parse(r); return p && typeof p === 'object' ? p : null; } catch (e) { return null; } }
  function ckWrite(a) { try { localStorage.setItem(CK_KEY, JSON.stringify({ v: 1, analytics: !!a, at: new Date().toISOString(), text: CK_TEXT })); } catch (e) {} }
  function startMetrika() {
    if (window.__oknoMetrika) { return; }
    window.__oknoMetrika = true;
    (function (m, e, t, r, i, k, a) { m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); }; m[i].l = 1 * new Date(); for (var j = 0; j < document.scripts.length; j++) { if (document.scripts[j].src === r) { return; } } k = e.createElement(t); a = e.getElementsByTagName(t)[0]; k.async = 1; k.src = r; a.parentNode.insertBefore(k, a); })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');
    window.ym(M, 'init', { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: true });
  }
  var ck = null, had = false;
  function ckBuild() {
    if (ck) { return ck; }
    ck = d.createElement('div'); ck.className = 'ck'; ck.setAttribute('role', 'dialog'); ck.setAttribute('aria-label', 'Файлы cookie'); ck.setAttribute('aria-live', 'polite');
    ck.innerHTML = '<div class="ck__box">'
      + '<div class="ck__main"><div><p class="eyebrow">Cookie</p><p><b>Мы используем файлы cookie</b>, чтобы сайт работал и становился удобнее. Нажимая «Хорошо», вы соглашаетесь с обработкой данных согласно <a href="/politika/">Политике обработки персональных данных</a> и <a href="/cookie/">Уведомлению об использовании cookie</a>.</p></div>'
      + '<div class="ck__btns"><button type="button" class="ck__btn" data-ck="all">Хорошо</button><div class="ck__row"><button type="button" class="ck__btn ck__btn--ghost" data-ck="settings">Настроить</button><button type="button" class="ck__link" data-ck="necessary">Только нужные</button></div></div></div>'
      + '<div class="ck__settings" hidden><div class="ck__head"><div><p class="eyebrow">Настройки cookie</p><p>Выберите, что разрешить</p></div><button type="button" class="ck__link" data-ck="back">&larr; Назад</button></div>'
      + '<div class="ck__opt"><div><b>Необходимые</b><p>Работа сайта: отправка формы, защита от спама, запоминание вашего выбора на этом баннере. Отключить нельзя.</p></div><span class="ck__on">ВКЛ</span></div>'
      + '<div class="ck__opt"><div><b>Аналитика</b><p>Статистика посещений: какие страницы читают, а какие закрывают сразу. Используется Яндекс.Метрика. Без этого разрешения счётчик не загружается.</p></div><label class="ck__sw"><input type="checkbox" checked aria-label="Разрешить аналитику"><span></span></label></div>'
      + '<div class="ck__row2"><button type="button" class="ck__btn" data-ck="save">Сохранить выбор</button><button type="button" class="ck__btn ck__btn--ghost" data-ck="all">Принять всё</button></div></div>'
      + '</div>';
    ck.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-ck]'); if (!b) { return; }
      var act = b.getAttribute('data-ck'), st = ck.querySelector('.ck__settings'), mn = ck.querySelector('.ck__main'), sw = ck.querySelector('.ck__sw input');
      if (act === 'settings') { mn.hidden = true; st.hidden = false; }
      else if (act === 'back') { st.hidden = true; mn.hidden = false; }
      else if (act === 'all') { ckDecide(true); }
      else if (act === 'necessary') { ckDecide(false); }
      else if (act === 'save') { ckDecide(!!sw.checked); }
    });
    return ck;
  }
  function ckShow(expanded) {
    var el = ckBuild(), saved = ckRead();
    el.querySelector('.ck__sw input').checked = saved ? !!saved.analytics : true;
    el.querySelector('.ck__main').hidden = !!expanded; el.querySelector('.ck__settings').hidden = !expanded;
    if (!el.parentNode) { d.body.appendChild(el); }
    el.hidden = false;
  }
  /* 3. Заявка дошла: send.php ставит ok=1 только после отправки письма. Если согласия на аналитику ещё нет,
     цель ждёт его на этой же странице; после засчёта метка убирается, чтобы обновление страницы не дало второй цели. */
  var leadPending = location.pathname === '/spasibo/' && /[?&]ok=1(&|$)/.test(location.search);
  function leadDone() {
    if (!leadPending || !window.__oknoMetrika) { return; }
    leadPending = false;
    goal('FORM_SUBMIT'); goal('lead');
    try { history.replaceState(null, '', location.pathname + location.search.replace(/([?&])ok=1(&|$)/, '$1').replace(/[?&]$/, '')); } catch (e) {}
  }
  function ckDecide(allow) {
    ckWrite(allow); if (ck) { ck.hidden = true; }
    if (allow) { startMetrika(); leadDone(); }
    else if (had && window.__oknoMetrika) { location.reload(); } // согласие отозвали после запуска счётчика
    had = !!allow;
  }
  function ckInit() {
    var saved = ckRead();
    if (saved) { had = !!saved.analytics; if (saved.analytics) { startMetrika(); leadDone(); } }
    else { ckShow(false); }
    d.addEventListener('click', function (ev) {
      var t = ev.target.closest && ev.target.closest('[data-cookie-settings]');
      if (!t) { return; }
      ev.preventDefault(); ckShow(true);
    });
  }
  function init() { onReady(); estimate(); ckInit(); }
  if (d.readyState === 'loading') { d.addEventListener('DOMContentLoaded', init); } else { init(); }
})();
