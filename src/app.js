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
function tests2(type,id){return S.events.filter(r=>r[1]===type&&Number(r[2])===id)}
function tbest(type,id){const t=tests2(type,id);return t.length?Math.max(...t.map(r=>r[4]/r[5])):null}
const tpassed=(type,id)=>{const b=tbest(type,id);return b!==null&&b>=.7};
const rangeReady=(a,b)=>{for(let n=a;n<=b;n++)if(!hasContent(n))return false;return true};
function pendingTest(){for(let w=1;w<=12;w++){if(!taken(w*5))return null;if(!tpassed("Недельный",w))return ["Недельный",w];if(w%2===0&&!tpassed("Итоговый",w/2))return ["Итоговый",w/2]}return null}
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
  ${(()=>{const pt=pendingTest();if(!pt)return"";const W=pt[0]==="Недельный",ok=W?rangeReady(pt[1]*5-4,pt[1]*5):rangeReady(1,pt[1]*10);if(!ok)return"";return `<button class="card row" onclick="openTest('${pt[0]}',${pt[1]})" style="text-align:left"><div class="grow"><b>${W?`Тест недели ${pt[1]}`:`Итоговый тест: уроки 1–${pt[1]*10}`}</b><div class="ls">Закрепление пройденного. Можно сегодня или утром в понедельник.</div></div><span class="btn ghost" style="min-height:40px;padding:0 16px">Начать</span></button>`})()}
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
    const wn=w+1,rdy=rangeReady(1,wn*5);
    h+=testRow("Недельный",wn,wn*5,rangeReady(wn*5-4,wn*5));
    if(wn%2===0)h+=testRow("Итоговый",wn/2,wn*5,rdy);
    h+=`</section>`;
  }
  return h+"</div>";
}
function testRow(type,id,end,ready){
  const W=type==="Недельный",num=id,b=tbest(type,num),open=ready&&taken(end),title=W?`Тест недели ${num}`:`Итоговый тест: уроки 1–${num*10}`;
  const sub=b!==null?`${Math.round(b*100)}%${b>=.7?"":" · пересдать"}`:open?"Доступен, 15 заданий":"Откроется после урока "+end;
  return `<button class="lrow trow ${b!==null&&b>=.7?"done":""}" ${open?`onclick="openTest('${type}',${num})"`:"disabled"}><span class="lnum num">${b!==null&&b>=.7?"✓":W?"Т":"★"}</span><span class="grow"><span class="lt"><span class="bchip">${W?"Закрепление":"Итог"}</span>${title}</span><br><span class="ls">${sub}</span></button>`}
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
  const weak=CATALOG.filter(l=>taken(l[0])&&!passed(l[0])),log=S.events.filter(r=>["Тест","Недельный","Итоговый"].includes(r[1])).slice(-6).reverse();
  return `<div class="stack"><div class="top"><h1 class="title">Прогресс</h1>${syncChip()}</div>
  <div class="stats"><div class="stat"><b class="num">${done}</b><span>пройдено</span></div><div class="stat"><b class="num">${streak()}</b><span>серия</span></div><div class="stat"><b class="num">${avgScore()}</b><span>ср. балл</span></div></div>
  <div class="card"><div class="eyebrow" style="margin-bottom:10px">60 уроков · ${tk} с тестом</div><div class="hm">${hm}</div></div>
  <div class="card"><div class="eyebrow" style="margin-bottom:12px">По блокам</div>${blocks}</div>
  ${weak.length?`<div class="card callout warm"><div class="eyebrow">Вернуться</div>${weak.map(l=>`<div>№ ${l[0]} · ${esc(l[2])}</div>`).join("")}</div>`:""}
  <div class="card"><div class="eyebrow" style="margin-bottom:10px">Тесты недели и итоговые</div>${[1,2,3,4,5,6,7,8,9,10,11,12].map(w=>{const b=tbest("Недельный",w),c=w%2===0?tbest("Итоговый",w/2):undefined;return `<div class="row" style="padding:4px 0"><span class="grow">Неделя ${w}</span><b class="num" style="color:${b===null?"var(--fg3)":b>=.7?"var(--ok)":"var(--bad)"}">${b===null?"—":Math.round(b*100)+"%"}</b>${c!==undefined?`<span class="bchip" style="margin-left:8px">итог ${w/2}: ${c===null?"—":Math.round(c*100)+"%"}</span>`:""}</div>`}).join("")}</div>
  <div class="card"><div class="eyebrow" style="margin-bottom:8px">Последние тесты</div>${log.length?log.map(r=>`<div class="row" style="padding:6px 0"><span class="grow">${r[1]==="Тест"?"Урок "+r[2]:r[1]==="Недельный"?"Тест недели "+r[2]:"Итоговый тест "+r[2]}</span><b class="num">${f1(r[4],2)} / ${r[5]}</b></div>`).join(""):'<p class="ls">После первого теста здесь появится история.</p>'}</div>
  <div class="card stack"><div class="eyebrow">Синхронизация с Google Таблицей</div>
   <div class="field"><label for="cfgurl">Адрес веб-приложения Apps Script</label><input type="text" id="cfgurl" value="${esc(CFG.url)}" placeholder="https://script.google.com/macros/s/…/exec" style="font:500 15px var(--ui)"></div>
   <div class="field"><label for="cfgtok">Токен</label><input type="text" id="cfgtok" value="${esc(CFG.token)}" placeholder="тот же, что в скрипте" style="font:500 15px var(--ui)"></div>
   <button class="btn block" onclick="saveCfg()">Сохранить и проверить</button><p class="ls">${esc(syncMsg)}. Результаты сохраняются и на устройстве, и в таблице.</p></div>
  </div>`;
}

/*__WIDGETS__*/
/*__PLAYER__*/
/* ===== BOOT ===== */
(async()=>{render();await loadIndex();render();if(CFG.url){setSync("","Подключаю таблицу…");pull()}})();
