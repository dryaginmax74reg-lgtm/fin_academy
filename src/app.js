/* ===== CONFIG ===== */
const START="2026-10-26";
const CATALOG=__CATALOG__;
const BLOCKS={"0":"Основы","A":"Макро","B":"Инструменты","G":"Рынок РФ","D":"Корпфинансы","C":"Капитал клиента","E":"Кризисы","F":"Поведение"};
const WEEKS=["Основы и экономика","Рынок и облигации","Российский рынок: история","Российский рынок: показатели","Российский рынок: связи","Корпфинансы и оценка","Портфель и риск","Макро, валюта, мир","История кризисов","Капитал клиента","Деривативы, фонды, альтернативы","Поведение и аттестация"];
const KEYRATE=14;

/* ===== UTIL ===== */
const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const f1=(n,d=1)=>Number(n).toLocaleString("ru-RU",{maximumFractionDigits:d,minimumFractionDigits:0});
const nowMsk=()=>new Date().toLocaleString("sv-SE",{timeZone:"Europe/Moscow"});
const todayMsk=()=>nowMsk().slice(0,10);
function lessonDate(n){let d=new Date(START+"T12:00:00Z"),c=1;while(c<n){d.setUTCDate(d.getUTCDate()+1);const w=d.getUTCDay();if(w!==0&&w!==6)c++}return d.toISOString().slice(0,10)}
const fmtD=iso=>new Date(iso+"T12:00:00Z").toLocaleDateString("ru-RU",{day:"numeric",month:"long",weekday:"long",timeZone:"UTC"});
const store={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const key=r=>r.slice(0,4).join("|");
function addDays(iso,k){const d=new Date(iso+"T12:00:00Z");d.setUTCDate(d.getUTCDate()+k);return d.toISOString().slice(0,10)}
function toast(m){const t=document.createElement("div");t.className="toast pop";t.textContent=m;document.body.appendChild(t);setTimeout(()=>t.remove(),2600)}

/* ===== LESSON DATA ===== */
let INDEX={available:[1],cards:{}};
const LES={};
async function loadIndex(){try{const r=await fetch("lessons/index.json",{cache:"no-cache"});if(r.ok){INDEX=await r.json();store.set("fl_index",INDEX)}}catch(e){INDEX=store.get("fl_index",INDEX)}}
async function loadLesson(n){if(LES[n])return LES[n];const r=await fetch("lessons/"+n+".json",{cache:"no-cache"});if(!r.ok)throw new Error("no lesson");LES[n]=await r.json();return LES[n]}
const hasContent=n=>INDEX.available.includes(n);

/* ===== STATE & SYNC ===== */
let S=store.get("fl_state",{events:[],synced:[],cards:{}});
let CFG=store.get("fl_cfg",{url:"",token:""});
const save=()=>store.set("fl_state",S);
let syncStatus="off",syncMsg="Только на этом устройстве",syncing=false;
function setSync(st,msg){syncStatus=st;syncMsg=msg;const c=$("#syncchip");if(c){c.className="chip "+st;c.lastChild.textContent=" "+msg}}
const syncChip=()=>`<button class="chip ${syncStatus}" id="syncchip" onclick="go('stat')"><i></i> ${esc(syncMsg)}</button>`;
function addEvent(type,lesson,detail,score,max,sec){const row=[nowMsk(),type,lesson,detail,score,max,sec||""];S.events.push(row);save();flush();return row}
async function flush(){
  if(!CFG.url||syncing)return;
  const todo=S.events.filter(r=>!S.synced.includes(key(r)));
  if(!todo.length)return;
  syncing=true;
  try{
    const r=await fetch(CFG.url,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify({token:CFG.token,rows:todo})});
    const j=await r.json();
    if(j.ok){todo.forEach(x=>S.synced.push(key(x)));save();setSync("ok","Записано в таблицу")}else setSync("bad","Таблица: неверный токен")
  }catch(e){setSync("warn","Нет связи с таблицей, повторю позже")}
  syncing=false;
}
async function pull(){
  if(!CFG.url){setSync("off","Таблица не подключена");return}
  try{
    const r=await fetch(CFG.url+(CFG.url.includes("?")?"&":"?")+"token="+encodeURIComponent(CFG.token));
    const j=await r.json();
    if(j.error){setSync("bad","Таблица: неверный токен");return}
    const have=new Set(S.events.map(key));
    (j.rows||[]).forEach(v=>{const r=[String(v[0]),v[1],Number(v[2])||v[2],v[3],v[4]===""?"":Number(v[4]),v[5]===""?"":Number(v[5]),v[6]];const k=key(r);if(!have.has(k)){S.events.push(r);have.add(k)}if(!S.synced.includes(k))S.synced.push(k)});
    S.events.sort((a,b)=>String(a[0]).localeCompare(String(b[0])));save();
    setSync("ok","Таблица подключена");await flush();render();
  }catch(e){setSync("warn","Нет связи с таблицей")}
}
function saveCfg(){CFG={url:$("#cfgurl").value.trim(),token:$("#cfgtok").value.trim()};store.set("fl_cfg",CFG);setSync("","Подключаю…");pull()}

/* ===== DERIVED ===== */
function tests(n){return S.events.filter(r=>r[1]==="Тест"&&Number(r[2])===n)}
function best(n){const t=tests(n);if(!t.length)return null;return Math.max(...t.map(r=>r[4]/r[5]))}
const passed=n=>{const b=best(n);return b!==null&&b>=.7};
const taken=n=>best(n)!==null;
function days(){return [...new Set(S.events.map(r=>String(r[0]).slice(0,10)))].sort()}
function streak(){const ds=new Set(days());let d=new Date(todayMsk()+"T12:00:00Z"),c=0;if(!ds.has(d.toISOString().slice(0,10)))d.setUTCDate(d.getUTCDate()-1);while(ds.has(d.toISOString().slice(0,10))){c++;d.setUTCDate(d.getUTCDate()-1)}return c}
function nextLesson(){for(const l of CATALOG){if(!passed(l[0]))return l[0]}return 60}
function todayOfTest(n){const t=tests(n);return t.length?String(t[0][0]).slice(0,10):todayMsk()}
function dueCards(){const t=todayMsk(),out=[];for(const n in INDEX.cards){if(!taken(+n))continue;INDEX.cards[n].forEach(c=>{const st=S.cards[c.id];const due=st?st.due:addDays(todayOfTest(+n),1);if(due<=t)out.push({...c,n:+n})})}return out}
const BOX=[1,3,7,30];
function avgScore(){const b=CATALOG.map(l=>best(l[0])).filter(x=>x!==null);return b.length?Math.round(b.reduce((a,c)=>a+c,0)/b.length*100)+"%":"—"}

/* ===== SHELL ===== */
const ICONS={today:'<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',prog:'<path d="M4 6h16M4 12h16M4 18h10"/>',rep:'<path d="M4 12a8 8 0 0 1 14-5.3L20 9M20 4v5h-5M20 12a8 8 0 0 1-14 5.3L4 15M4 20v-5h5"/>',stat:'<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>'};
let tab=(location.hash||"#today").slice(1);if(!["today","prog","rep","stat"].includes(tab))tab="today";
const TABS=[["today","Сегодня"],["prog","Программа"],["rep","Повтор"],["stat","Прогресс"]];
function nav(){const due=dueCards().length;
  const h=TABS.map(([k,l])=>`<button class="tab" role="tab" aria-selected="${tab===k}" onclick="go('${k}')"><svg viewBox="0 0 24 24">${ICONS[k]}</svg><span>${l}</span>${k==="rep"&&due?`<em class="dot" style="font-style:normal">${due}</em>`:""}</button>`).join("");
  $("#tabbar").innerHTML=h;$("#rail").innerHTML=`<div class="brand">Fin<b>Lab</b> Academy</div>`+h}
function go(k){tab=k;try{history.replaceState(null,"","#"+k)}catch(e){}render();window.scrollTo(0,0)}
function render(){nav();$("#view").innerHTML=({today:vToday,prog:vProg,rep:vRep,stat:vStat})[tab]()}

/* ===== VIEWS ===== */
function vToday(){
  const n=nextLesson(),L=CATALOG[n-1],d=lessonDate(n),t=todayMsk(),ready=hasContent(n),pre=t<START;
  const due=dueCards().length,s=streak(),done=CATALOG.filter(l=>passed(l[0])).length;
  const label=pre?`Старт ${fmtD(START)}`:(d>t?`По плану ${fmtD(d)}`:"Занятие на сегодня");
  return `<div class="stack">
  <div class="top"><div class="eyebrow">FinLab Academy</div>${syncChip()}</div>
  <h1 class="title">${pre?"Завтра начинаем.":s>1?`Серия ${s} дн.`:"Сегодняшний урок"}</h1>
  <div class="hero"><div class="eyebrow">№ ${n} · ${BLOCKS[L[1]]} · ${label}</div><h2>${esc(L[2])}</h2><p>${esc(L[3])}.</p>
  ${ready?`<button class="btn inv" onclick="openLesson(${n})">${taken(n)?"Пройти ещё раз":"Начать урок"} →</button>`:`<button class="btn inv" disabled>Урок готовится</button>`}</div>
  ${due?`<button class="card row" onclick="go('rep')" style="text-align:left"><div class="grow"><b>Повторение</b><div class="ls">${due} карточ${due===1?"ка":due<5?"ки":"ек"} ждут. 2 минуты.</div></div><span class="btn ghost" style="min-height:40px;padding:0 16px">Начать</span></button>`:""}
  <div class="stats"><div class="stat"><b class="num">${done}</b><span>пройдено из 60</span></div><div class="stat"><b class="num">${s}</b><span>дней подряд</span></div><div class="stat"><b class="num">${avgScore()}</b><span>средний балл</span></div></div>
  <div class="card"><div class="eyebrow">История-крючок</div><p style="margin-top:6px;font-weight:600">${esc(L[4])}</p></div></div>`;
}
function vProg(){
  const nx=nextLesson();let h=`<div class="stack"><div class="top"><h1 class="title">Программа</h1>${syncChip()}</div>`;
  for(let w=0;w<12;w++){
    h+=`<section class="week"><h3>Неделя ${w+1} · ${WEEKS[w]}</h3>`;
    for(let i=1;i<=5;i++){
      const n=w*5+i,L=CATALOG[n-1],ok=passed(n),tk=taken(n),av=hasContent(n);
      const sub=ok?`Тест ${Math.round(best(n)*100)}%`:tk?`Тест ${Math.round(best(n)*100)}% · повторить`:(av?"Доступно":"Готовится");
      h+=`<button class="lrow ${ok?"done":n===nx?"next":""}" ${av?`onclick="openLesson(${n})"`:"disabled"}><span class="lnum num">${ok?"✓":n}</span><span class="grow"><span class="lt"><span class="bchip">${BLOCKS[L[1]]}</span>${esc(L[2])}</span><br><span class="ls">${sub}</span></span></button>`;
    }
    h+=`</section>`;
  }
  return h+"</div>";
}
let rep={i:0,flip:false,queue:null};
function vRep(){
  if(!rep.queue)rep.queue=dueCards();
  const q=rep.queue,head=`<div class="top"><h1 class="title">Повтор</h1>${syncChip()}</div>`;
  if(!q.length||rep.i>=q.length){const had=q.length;rep.queue=null;rep.i=0;
    return `<div class="stack">${head}<div class="card empty"><div class="disp">${had?"Всё повторено":"Пока нечего повторять"}</div><p>${had?"Следующие карточки вернутся по графику 1 → 3 → 7 → 30 дней.":"Карточки появятся после первого теста. Через день они придут сюда."}</p></div></div>`}
  const c=q[rep.i];
  return `<div class="stack">${head}<div class="eyebrow">Карточка ${rep.i+1} из ${q.length} · урок ${c.n}</div>
  <div class="fc">${rep.flip?`<div class="face back pop"><div class="disp">${esc(c.a)}</div></div>`:`<button class="face" onclick="rep.flip=true;render()"><div class="eyebrow">Вопрос</div><div class="disp">${esc(c.q)}</div><div class="ls">Вспомни, потом нажми</div></button>`}</div>
  ${rep.flip?`<div class="pair"><button class="btn ghost" onclick="rate(0)">Не вспомнил</button><button class="btn" onclick="rate(1)">Вспомнил</button></div>`:""}</div>`;
}
function rate(ok){const c=rep.queue[rep.i],st=S.cards[c.id]||{box:0};st.box=ok?Math.min(st.box+1,BOX.length-1):0;st.due=addDays(todayMsk(),BOX[st.box]);S.cards[c.id]=st;save();addEvent("Карточка",c.n,c.id,ok,1);rep.i++;rep.flip=false;render()}
function vStat(){
  const done=CATALOG.filter(l=>passed(l[0])).length,tk=CATALOG.filter(l=>taken(l[0])).length,nxt=nextLesson();
  let blocks="";Object.keys(BLOCKS).forEach(b=>{const ls=CATALOG.filter(l=>l[1]===b),d=ls.filter(l=>passed(l[0])).length;blocks+=`<div class="bl"><span>${BLOCKS[b]}</span><div class="bar"><i style="width:${d/ls.length*100}%"></i></div><small class="num">${d}/${ls.length}</small></div>`});
  const hm=CATALOG.map(l=>{const n=l[0];return `<i class="${passed(n)?"d":taken(n)?"w":""} ${n===nxt?"n":""}" title="Урок ${n}"></i>`}).join("");
  const weak=CATALOG.filter(l=>taken(l[0])&&!passed(l[0])),log=S.events.filter(r=>r[1]==="Тест").slice(-5).reverse();
  return `<div class="stack"><div class="top"><h1 class="title">Прогресс</h1>${syncChip()}</div>
  <div class="stats"><div class="stat"><b class="num">${done}</b><span>пройдено</span></div><div class="stat"><b class="num">${streak()}</b><span>серия</span></div><div class="stat"><b class="num">${avgScore()}</b><span>ср. балл</span></div></div>
  <div class="card"><div class="eyebrow" style="margin-bottom:10px">60 уроков · ${tk} с тестом</div><div class="hm">${hm}</div></div>
  <div class="card"><div class="eyebrow" style="margin-bottom:12px">По блокам</div>${blocks}</div>
  ${weak.length?`<div class="card callout warm"><div class="eyebrow">Вернуться</div>${weak.map(l=>`<div>№ ${l[0]} · ${esc(l[2])}</div>`).join("")}</div>`:""}
  <div class="card"><div class="eyebrow" style="margin-bottom:8px">Последние тесты</div>${log.length?log.map(r=>`<div class="row" style="padding:6px 0"><span class="grow">Урок ${r[2]}</span><b class="num">${f1(r[4],2)} / ${r[5]}</b></div>`).join(""):'<p class="ls">После первого теста здесь появится история.</p>'}</div>
  <div class="card stack"><div class="eyebrow">Синхронизация с Google Таблицей</div>
   <div class="field"><label for="cfgurl">Адрес веб-приложения Apps Script</label><input type="text" id="cfgurl" value="${esc(CFG.url)}" placeholder="https://script.google.com/macros/s/…/exec" style="font:500 15px var(--ui)"></div>
   <div class="field"><label for="cfgtok">Токен</label><input type="text" id="cfgtok" value="${esc(CFG.token)}" placeholder="тот же, что в скрипте" style="font:500 15px var(--ui)"></div>
   <button class="btn block" onclick="saveCfg()">Сохранить и проверить</button><p class="ls">${esc(syncMsg)}. Результаты сохраняются и на устройстве, и в таблице.</p></div>
  </div>`;
}

/* ===== PLAYER ===== */
let P=null;
async function openLesson(n){
  try{const D=await loadLesson(n);P={n,D,i:0,t0:Date.now(),pick:{},calc:{pv:2,r:12,t:5,m:1},cs:{r:14,p:100},gen:{},q:{i:0,ans:[],crit:[],done:false,res:null}};drawPlayer()}
  catch(e){toast("Не удалось загрузить урок. Проверь интернет.")}
}
function closeLesson(){P=null;$("#layer").innerHTML="";document.body.style.overflow="";render()}
function drawPlayer(){
  const D=P.D,st=D.steps[P.i],L=CATALOG[P.n-1],body=STEPS[st.t](st);
  const last=P.i===D.steps.length-1;
  $("#layer").innerHTML=`<div class="player ${P.shown?"":"enter"}" role="dialog" aria-label="Урок ${P.n}">
   <div class="phead"><div class="row"><button class="x" onclick="closeLesson()" aria-label="Закрыть">✕</button><div class="grow"><div class="eyebrow">Урок ${P.n} · ${BLOCKS[L[1]]}</div></div><span class="ls num">${P.i+1}/${D.steps.length}</span></div>
   <div class="seg">${D.steps.map((_,k)=>`<i class="${k<=P.i?"on":""}"></i>`).join("")}</div></div>
   <div class="pbody" id="pbody"><div class="pin">${body.html}</div></div>
   <div class="pfoot"><div class="in">${P.i>0?`<button class="btn ghost" onclick="stepTo(-1)" aria-label="Назад">←</button>`:""}${body.foot||`<button class="btn block" onclick="${last?"closeLesson()":"stepTo(1)"}">${last?"Готово":"Дальше"}</button>`}</div></div></div>`;
  P.shown=true;document.body.style.overflow="hidden";const pb=$("#pbody");if(pb)pb.scrollTop=0;
}
function stepTo(d){P.i=Math.max(0,Math.min(P.D.steps.length-1,P.i+d));drawPlayer()}
const FV=(pv,r,t,m)=>pv*Math.pow(1+r/100/m,m*t);
function readIdx(st){const rs=P.D.steps.filter(s=>s.t==="read");return [rs.indexOf(st)+1,rs.length]}

const STEPS={
 predict(st){
  const sel=P.pick[P.i],mins=P.D.minutes||{};
  return {html:`<div class="kicker">${esc(st.kicker||"История")}</div><h1 class="h">${esc(st.title)}</h1>
   <div class="lead">${st.lead}</div>
   ${P.D.minutes?`<div class="row" style="flex-wrap:wrap;gap:8px"><span class="rt">📖 Материал ≈ ${mins.read} мин</span><span class="rt">🎛 Практика ≈ ${mins.practice} мин</span><span class="rt">✅ Тест ≈ ${mins.test} мин</span></div>`:""}
   <div class="callout"><div class="eyebrow">Предскажи</div><b>${esc(st.q)}</b></div>
   <div class="opts">${st.opts.map((o,k)=>`<button class="opt ${sel===undefined?"":k===st.correct?"good":k===sel?"wrong":""}" ${sel!==undefined?"disabled":""} onclick="P.pick[P.i]=${k};drawPlayer()">${esc(o)}</button>`).join("")}</div>
   ${sel!==undefined?`<div class="callout ${sel===st.correct?"ok":"warm"} pop"><div class="eyebrow">${sel===st.correct?"Точно":"Почти никто не угадывает"}</div><div class="p">${st.reveal}</div></div>${st.after?`<div class="callout warm pop"><div class="eyebrow">${esc(st.afterTitle||"А в жизни")}</div><div class="p">${st.after}</div></div>`:""}`:""}`,
   foot:sel===undefined?`<button class="btn block" disabled>Выбери вариант</button>`:null};
 },
 read(st){
  const [i,n]=readIdx(st);
  return {html:`<div class="read stack" style="gap:16px"><div class="kicker">Материал · часть ${i} из ${n}</div><span class="rt">⏱ ≈ ${st.min} мин чтения</span><h1 class="h">${esc(st.title)}</h1>${st.html}</div>`};
 },
 calc(st){ // generic calculator
  const g=P.gen[P.i]||(P.gen[P.i]=Object.fromEntries(st.inputs.map(x=>[x.id,x.val])));
  const ids=st.inputs.map(x=>x.id);
  const ev=(expr)=>{try{return new Function(...ids,"fmt","return ("+expr+")")(...ids.map(k=>g[k]),f1)}catch(e){return "—"}};
  return {html:`<div class="kicker">${esc(st.kicker||"Поиграй")}</div><h1 class="h">${esc(st.title)}</h1><div class="p">${st.intro||""}</div>
   ${st.inputs.map(x=>`<div class="field"><label>${esc(x.label)} <output id="o_${x.id}">${f1(g[x.id],x.dec??2)} ${esc(x.unit||"")}</output></label><input type="range" min="${x.min}" max="${x.max}" step="${x.step}" value="${g[x.id]}" oninput="P.gen[P.i]['${x.id}']=+this.value;updGen()" aria-label="${esc(x.label)}"></div>`).join("")}
   <div id="genout">${genOut(st,ev)}</div>`};
 },
 compound(st){
  const c=P.calc;
  return {html:`<div class="kicker">Поиграй</div><h1 class="h">Сложный процент: проценты на проценты</h1>
   <p class="p">Двигай ползунки. Смотри, как расходятся две линии: простой процент растёт по прямой, сложный — всё круче.</p>
   <div class="field"><label>Сумма <output>${f1(c.pv)} млн ₽</output></label><input type="range" min="0.5" max="10" step="0.5" value="${c.pv}" oninput="P.calc.pv=+this.value;updCalc()" aria-label="Сумма"></div>
   <div class="field"><label>Ставка в год <output>${f1(c.r)}%</output></label><input type="range" min="1" max="30" step="0.5" value="${c.r}" oninput="P.calc.r=+this.value;updCalc()" aria-label="Ставка"></div>
   <div class="field"><label>Срок <output>${c.t} лет</output></label><input type="range" min="1" max="40" step="1" value="${c.t}" oninput="P.calc.t=+this.value;updCalc()" aria-label="Срок"></div>
   <div class="field"><label>Капитализация</label><div class="pair"><button class="opt ${c.m===1?"sel":""}" onclick="P.calc.m=1;drawPlayer()">Раз в год</button><button class="opt ${c.m===12?"sel":""}" onclick="P.calc.m=12;drawPlayer()">Ежемесячно</button></div></div>
   <div id="calcout">${calcOut()}</div>`};
 },
 deferred(st){
  const c=P.cs,r=c.r/100,pvB=350+350/Math.pow(1+r,2)*(c.p/100),be=(Math.sqrt(350/250)-1)*100;
  return {html:`<div class="kicker">Кейс</div><h1 class="h">Продажа бизнеса: 600 сейчас или 350 + 350 через два года?</h1>
   <p class="p">Покупатель предлагает два варианта. Какой выгоднее? Зависит от ставки, по которой клиент может использовать деньги, и от того, насколько надёжен второй платёж. Ключевая ставка Банка России сейчас <b>${KEYRATE}%</b>.</p>
   <div class="field"><label>Ставка клиента (альтернатива) <output>${f1(c.r)}%</output></label><input type="range" min="0" max="30" step="0.5" value="${c.r}" oninput="P.cs.r=+this.value;updCase()" aria-label="Ставка"></div>
   <div class="field"><label>Вероятность получить 2-й платёж <output>${c.p}%</output></label><input type="range" min="50" max="100" step="1" value="${c.p}" oninput="P.cs.p=+this.value;updCase()" aria-label="Вероятность"></div>
   <div id="caseout">${caseOut(pvB,pvB>600,be)}</div>`};
 },
 client(st){return {html:`<div class="kicker">Клиент</div><h1 class="h">${esc(st.title)}</h1>${st.html}`}},
 quiz(){
  const Q=P.D.quiz,q=P.q;
  if(q.done){const r=q.res;return {html:`<div class="kicker">Тест завершён</div><h1 class="h">${Math.round(r.pct*100)}%: ${f1(r.score,2)} из ${r.max}</h1><p class="p">Результат записан. Дальше фишка для встречи.</p>`}}
  const item=Q[q.i],a=q.ans[q.i];let inner="",foot="";
  if(item.k==="num"){inner=`<div class="field"><input type="number" inputmode="decimal" step="any" id="numin" value="${a!==undefined?a.v:""}" ${a!==undefined?"disabled":""} placeholder="Ответ, ${esc(item.unit||"")}" aria-label="Ответ"></div>`;if(a===undefined)foot=`<button class="btn block" onclick="answerNum()">Проверить</button>`}
  else if(item.k==="choice"){inner=`<div class="opts">${item.opts.map((o,k)=>`<button class="opt ${a!==undefined?(k===item.ans?"good":k===a.v?"wrong":""):""}" ${a!==undefined?"disabled":""} onclick="answerChoice(${k})">${esc(o)}</button>`).join("")}</div>`}
  else{inner=`<textarea id="opentxt" placeholder="Напиши ответ своими словами, как сказал бы клиенту" ${a!==undefined?"disabled":""}>${a!==undefined?esc(a.v):""}</textarea>`;
    if(a===undefined)foot=`<button class="btn block" onclick="answerOpen()">Показать эталон</button>`;
    else inner+=`<div class="callout ok pop"><div class="eyebrow">Эталонный ответ</div><p class="p">${esc(item.model)}</p></div><div class="eyebrow">Отметь, что ты учёл</div>${item.crit.map((c,k)=>`<button class="check ${q.crit[k]?"on":""}" onclick="P.q.crit[${k}]=!P.q.crit[${k}];drawPlayer()"><span class="bx">${q.crit[k]?"✓":""}</span><span>${esc(c)}</span></button>`).join("")}`}
  if(a!==undefined&&item.k!=="open")inner+=`<div class="callout ${a.ok?"ok":"bad"} pop"><div class="eyebrow">${a.ok?"Верно":"Не совсем"}</div><p class="p">${esc(item.why)}</p></div>`;
  if(a!==undefined)foot=`<button class="btn block" onclick="nextQ()">${q.i===Q.length-1?"Завершить тест":"Дальше"}</button>`;
  return {html:`<div class="kicker">Тест · вопрос ${q.i+1} из ${Q.length} · ≈ 15 мин на весь тест</div><h1 class="h" style="font-size:clamp(20px,5vw,26px)">${esc(item.q)}</h1>${inner}`,foot};
 },
 tip(st){return {html:`<div class="kicker">Фишка для встречи</div><h1 class="h">Скажи это клиенту</h1>
   <div class="hero" style="border-radius:24px"><div class="eyebrow">Факт</div><h2>${esc(st.fact)}</h2><p>${esc(st.fact2||"")}</p></div>
   <div class="card"><div class="eyebrow">Вопрос клиенту</div><p class="p" style="font-size:19px;font-weight:700;margin-top:6px">${esc(st.question)}</p></div>
   <p class="ls">${esc(st.why||"")}</p>`}},
 wrap(st){const r=P.q.res;
  return {html:`<div class="kicker">Итог</div><h1 class="h">${r&&r.pct>=.7?"Урок пройден":"Урок записан, тему стоит повторить"}</h1>
   ${r?`<div class="card row"><div class="big num">${Math.round(r.pct*100)}%</div><div class="grow"><b>${f1(r.score,2)} из ${r.max}</b><div class="ls">Порог перехода — 70%</div></div></div>`:`<div class="callout warm">Пройди тест, чтобы результат записался.</div>`}
   <div class="callout"><div class="eyebrow">Что ты теперь умеешь</div><p class="p">${esc(st.can)}</p></div>
   <div class="eyebrow">Углубиться</div><div class="links">${(st.links||[]).map(l=>l.url?`<a href="${esc(l.url)}" target="_blank" rel="noopener"><b>${esc(l.title)}</b><span>${esc(l.sub||"")}</span></a>`:`<div class="mini" style="margin-bottom:8px"><span>${esc(l.kind||"Книга")}</span><b style="font-family:var(--ui);font-size:16px">${esc(l.title)}</b></div>`).join("")}</div>
   <div class="callout ok"><div class="eyebrow">Карточки</div><p class="p">${(INDEX.cards[P.n]||[]).length} карточек придут во вкладку «Повтор» завтра.</p></div>`};
 }
};
function genOut(st,ev){
  return `<div class="pair">${st.outs.map(o=>`<div class="mini"><span>${esc(o.label)}</span><b class="num">${typeof ev(o.expr)==="number"?f1(ev(o.expr),o.dec??2):ev(o.expr)} ${esc(o.unit||"")}</b></div>`).join("")}</div>${st.verdict?`<div class="callout"><div class="eyebrow">Вывод</div><p class="p">${ev("`"+st.verdict+"`")}</p></div>`:""}`;
}
function updGen(){
  const st=P.D.steps[P.i],g=P.gen[P.i],ids=st.inputs.map(x=>x.id);
  const ev=(expr)=>{try{return new Function(...ids,"fmt","return ("+expr+")")(...ids.map(k=>g[k]),f1)}catch(e){return "—"}};
  $("#genout").innerHTML=genOut(st,ev);
  st.inputs.forEach(x=>{const o=$("#o_"+x.id);if(o)o.textContent=f1(g[x.id],x.dec??2)+" "+(x.unit||"")});
}
function calcOut(){
  const c=P.calc,F=FV(c.pv,c.r,c.t,c.m),Fs=c.pv*(1+c.r/100*c.t),eff=(Math.pow(1+c.r/100/c.m,c.m)-1)*100;
  const pts=[],pts2=[],N=Math.min(c.t,60);
  for(let i=0;i<=N;i++){const tt=c.t*i/N;pts.push([i/N,FV(c.pv,c.r,tt,c.m)]);pts2.push([i/N,c.pv*(1+c.r/100*tt)])}
  const mx=Math.max(F,Fs,1),W=600,H=180;
  const path=a=>a.map((p,i)=>(i?"L":"M")+(p[0]*(W-20)+10).toFixed(1)+" "+(H-12-(p[1]/mx)*(H-30)).toFixed(1)).join(" ");
  return `<div class="pair"><div class="mini"><span>Сложный процент</span><b class="num">${f1(F,2)} млн</b></div><div class="mini"><span>Простой процент</span><b class="num">${f1(Fs,2)} млн</b></div></div>
  <svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="График роста"><path d="${path(pts2)}" fill="none" stroke="var(--fg3)" stroke-width="2.5" stroke-dasharray="6 6"/><path d="${path(pts)}" fill="none" stroke="var(--tint)" stroke-width="4" stroke-linecap="round"/></svg>
  <div class="callout"><div class="eyebrow">Разница</div><p class="p">Сложный процент добавил <b>${f1(F-Fs,2)} млн ₽</b> сверх простого. Эффективная ставка <b>${f1(eff,2)}%</b>, удвоение примерно за <b>${f1(72/c.r,1)}</b> лет по правилу 72.</p></div>`;
}
function updCalc(){$("#calcout").innerHTML=calcOut();const c=P.calc,o=document.querySelectorAll(".pin .field output");o[0].textContent=f1(c.pv)+" млн ₽";o[1].textContent=f1(c.r)+"%";o[2].textContent=c.t+" лет"}
function caseOut(pvB,ok,be){
  return `<div class="pair"><div class="mini"><span>Вариант А</span><b class="num">600 млн</b></div><div class="mini"><span>Вариант Б сегодня</span><b class="num">${f1(pvB,1)} млн</b></div></div>
  <div class="callout ${ok?"ok":"bad"}"><div class="eyebrow">Вердикт</div><p class="p">${ok?"Вариант Б стоит дороже: ждать выгодно.":"Вариант А выгоднее: деньги сегодня весомее."} Разница <b>${f1(Math.abs(pvB-600),1)} млн ₽</b>.</p></div>
  <p class="ls">Формула: 350 + 350 × вероятность / (1 + r)². Ставка безубыточности при 100% надёжности — <b>${f1(be,2)}%</b>. При ставке ${KEYRATE}% второй платёж должен быть надёжным минимум на <b>${f1(250*Math.pow(1+KEYRATE/100,2)/350*100,1)}%</b>.</p>`;
}
function updCase(){const c=P.cs,r=c.r/100,pvB=350+350/Math.pow(1+r,2)*(c.p/100),be=(Math.sqrt(350/250)-1)*100;$("#caseout").innerHTML=caseOut(pvB,pvB>600,be);const o=document.querySelectorAll(".pin .field output");o[0].textContent=f1(c.r)+"%";o[1].textContent=c.p+"%"}
function answerNum(){const v=parseFloat(String($("#numin").value).replace(",","."));if(isNaN(v)){toast("Введи число");return}const it=P.D.quiz[P.q.i];P.q.ans[P.q.i]={v,ok:Math.abs(v-it.ans)<=it.tol};drawPlayer()}
function answerChoice(k){const it=P.D.quiz[P.q.i];P.q.ans[P.q.i]={v:k,ok:k===it.ans};drawPlayer()}
function answerOpen(){const v=$("#opentxt").value.trim();if(v.length<3){toast("Напиши хотя бы пару слов, потом сверимся с эталоном");return}P.q.ans[P.q.i]={v,ok:true};P.q.crit=[];drawPlayer()}
function nextQ(){
  const Q=P.D.quiz;
  if(P.q.i<Q.length-1){P.q.i++;drawPlayer();return}
  let score=0;Q.forEach((it,i)=>{const a=P.q.ans[i];if(it.k==="open")score+=P.q.crit.filter(Boolean).length/it.crit.length;else if(a&&a.ok)score++});
  score=Math.round(score*100)/100;const sec=Math.round((Date.now()-P.t0)/1000);
  P.q.res={score,max:Q.length,pct:score/Q.length};P.q.done=true;
  addEvent("Тест",P.n,Q.length+" вопросов",score,Q.length,sec);
  const oi=Q.findIndex(x=>x.k==="open");if(oi>=0)addEvent("Открытый",P.n,"критериев "+P.q.crit.filter(Boolean).length+" из "+Q[oi].crit.length,P.q.crit.filter(Boolean).length,Q[oi].crit.length);
  P.i=P.D.steps.findIndex(s=>s.t==="tip");drawPlayer();
}

/* ===== BOOT ===== */
(async()=>{render();await loadIndex();render();if(CFG.url){setSync("","Подключаю таблицу…");pull()}})();
