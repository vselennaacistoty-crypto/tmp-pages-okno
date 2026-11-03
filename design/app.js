'use strict';
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const menu = $('.menu-toggle');
function closeMenu(){ $('#navigation').classList.remove('open'); menu.setAttribute('aria-expanded','false'); menu.setAttribute('aria-label','Открыть меню'); }
menu.addEventListener('click',()=>{const open=$('#navigation').classList.toggle('open');menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Закрыть меню':'Открыть меню');});
$$('#navigation a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});

const ideas={office:{title:'Ваш маленький <br>большой кабинет.',description:'Свет у рабочего стола, место для любимых книг и возможность сосредоточиться.',image:'assets/office.webp',alt:'Рабочее место на светлой лоджии',number:'ИДЕЯ 01'},rest:{title:'Утро, которое <br>хочется продлить.',description:'Удобное кресло, чашка кофе и зелень за окном. Личное место для спокойных минут дома.',image:'assets/hero.webp',alt:'Зона отдыха с креслом на балконе',number:'ИДЕЯ 02'}};
$$('[data-idea]').forEach(button=>button.addEventListener('click',()=>{const idea=ideas[button.dataset.idea];$('#idea-image').src=idea.image;$('#idea-image').alt=idea.alt;$('#idea-title').innerHTML=idea.title;$('#idea-description').textContent=idea.description;$('#idea-number').textContent=idea.number;$$('[data-idea]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});}));

let glazing='warm';
const glazingNames={cold:'Холодное алюминиевое остекление',warm:'Тёплое остекление ПВХ',panorama:'Панорамное остекление'};
const glazingTitles={cold:'Холодный балкон',warm:'Тёплый балкон',panorama:'Панорамный балкон'};
const fmt=n=>Number(n).toLocaleString('ru-RU',{maximumFractionDigits:2});
function configuration(){const length=Number($('#length').value);const depth=Number($('#depth').value);const works=$$('[name=work]:checked').map(x=>x.value);return {length,depth,works,glazing};}
function updateSummary(){const c=configuration();$('#length-value').textContent=fmt(c.length)+' м';$('#depth-value').textContent=fmt(c.depth)+' м';$('#plan-length').textContent=fmt(c.length)+' м';$('#summary-title').textContent=glazingTitles[glazing];$('#summary-size').textContent=`${fmt(c.length)} × ${fmt(c.depth)} м · площадь пола ${fmt(c.length*c.depth)} м²`;$('#summary-items').replaceChildren(...[glazingNames[glazing],...c.works].map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));$('#config-status').textContent=`${glazingTitles[glazing]}, ${fmt(c.length)} на ${fmt(c.depth)} метра. Выбрано дополнительных работ: ${c.works.length}.`;}
function setGlazing(value){glazing=value;$$('[data-glazing]').forEach(b=>{const active=b.dataset.glazing===glazing;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});updateSummary();}
$$('[data-glazing]').forEach(b=>b.addEventListener('click',()=>setGlazing(b.dataset.glazing)));
$$('[data-select-glazing]').forEach(b=>b.addEventListener('click',()=>{setGlazing(b.dataset.selectGlazing);$('#configurator').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}));
$$('.presets button').forEach(b=>b.addEventListener('click',()=>{$('#length').value=b.dataset.length;$('#depth').value=b.dataset.depth;$$('.presets button').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b));});updateSummary();}));
$$('input[type=range]').forEach(input=>input.addEventListener('input',()=>{$$('.presets button').forEach(b=>{b.classList.remove('active');b.setAttribute('aria-pressed','false');});updateSummary();}));
$$('[name=work]').forEach(input=>input.addEventListener('change',updateSummary));
$('#transfer-config').addEventListener('click',()=>{const c=configuration();$('#wish').value=`Балкон ${fmt(c.length)} × ${fmt(c.depth)} м. ${glazingNames[c.glazing]}. Дополнительно: ${c.works.length?c.works.join(', '):'не выбрано'}.`;});
$('#idea-cta').addEventListener('click',()=>setGlazing('warm'));

$$('[data-region]').forEach(b=>b.addEventListener('click',()=>{$$('[data-region]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b));});$$('.cities a').forEach(a=>{a.hidden=b.dataset.region!=='all'&&a.dataset.cityRegion!==b.dataset.region;});}));

$('#phone').addEventListener('input',()=>$('#phone').setCustomValidity(''));
$('#lead-form').addEventListener('submit',event=>{event.preventDefault();const digits=$('#phone').value.replace(/\D/g,'');if(digits.length<10||digits.length>15){$('#phone').setCustomValidity('Введите номер телефона: от 10 до 15 цифр.');$('#phone').reportValidity();return;}$('#form-status').textContent='Демонстрация завершена: заявка не отправлена. Для записи на замер позвоните по номеру +7 (949) 961-60-77.';});
updateSummary();
if(!matchMedia('(prefers-reduced-motion: reduce)').matches){const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('reveal');observer.unobserve(e.target);}}),{threshold:.07});$$('.section-top,.heading-row,.service-intro,.glazing-card,.process-layout,.geo-layout,.journal-card,.contact-copy').forEach(el=>observer.observe(el));}
