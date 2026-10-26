/* ===== PLAYER ===== */
let P=null,keepNext=false;
async function openLesson(n){
  try{const D=await loadLesson(n);WS={};REG={};P={n,D,i:0,t0:Date.now(),pick:{},q:{i:0,done:false,res:null}};drawPlayer()}
  catch(e){toast("Не удалось загрузить урок. Проверь интернет.")}
}
function closeLesson(){P=null;WS={};REG={};$("#layer").innerHTML="";document.body.style.overflow="";render()}
function redrawKeep(){keepNext=true;drawPlayer()}
function drawPlayer(){
  const D=P.D,st=D.steps[P.i],body=STEPS[st.t](st),last=P.i===D.steps.length-1;
  const pb0=$("#pbody"),sc=pb0?pb0.scrollTop:0;
  const hdr=P.n?`Урок ${P.n} · ${BLOCKS[CATALOG[P.n-1][1]]}`:P.hdr;
  $("#layer").innerHTML=`<div class="player ${P.shown?"":"enter"}" role="dialog" aria-label="${esc(hdr)}">
   <div class="phead"><div class="row"><button class="x" onclick="closeLesson()" aria-label="Закрыть">✕</button><div class="grow"><div class="eyebrow">${esc(hdr)}</div></div><span class="ls num">${P.i+1}/${D.steps.length}</span></div>
   <div class="seg">${D.steps.map((_,k)=>`<i class="${k<=P.i?"on":""}"></i>`).join("")}</div></div>
   <div class="pbody" id="pbody"><div class="pin">${body.html}</div></div>
   <div class="pfoot"><div class="in">${P.i>0&&!body.noback?`<button class="btn ghost" onclick="stepTo(-1)" aria-label="Назад">←</button>`:""}${body.foot||`<button class="btn block" onclick="${last?"closeLesson()":"stepTo(1)"}">${last?"Готово":"Дальше"}</button>`}</div></div></div>`;
  P.shown=true;document.body.style.overflow="hidden";const pb=$("#pbody");if(pb)pb.scrollTop=keepNext?sc:0;keepNext=false;
}
function stepTo(d){P.i=Math.max(0,Math.min(P.D.steps.length-1,P.i+d));drawPlayer()}
function readIdx(st){const rs=P.D.steps.filter(s=>s.t==="read");return [rs.indexOf(st)+1,rs.length]}
function playNext(){wk("p"+P.i).i++;drawPlayer()}
function storyPick(k){const g=wk("s"+P.i),st=P.D.steps[P.i],nd=st.nodes[g.node],ch=nd.ch[k];g.pick=k;Object.entries(ch.d||{}).forEach(([a,b])=>{g.vars[a].v=Math.round((g.vars[a].v+b)*100)/100});redrawKeep()}
function storyGo(){const g=wk("s"+P.i),st=P.D.steps[P.i];g.node=st.nodes[g.node].ch[g.pick].to;g.pick=undefined;drawPlayer()}
function storyReset(){delete WS["s"+P.i];drawPlayer()}

const STEPS={
 predict(st){
  const sel=P.pick[P.i],mins=P.D.minutes||{};
  return {html:`<div class="kicker">${esc(st.kicker||"История")}</div><h1 class="h">${esc(st.title)}</h1>
   <div class="lead">${st.lead}</div>
   ${P.D.minutes?`<div class="row" style="flex-wrap:wrap;gap:8px"><span class="rt">📖 Материал ≈ ${mins.read} мин</span><span class="rt">🎯 Практика ≈ ${mins.practice} мин</span><span class="rt">✅ Тест ≈ ${mins.test} мин</span></div>`:""}
   <div class="callout"><div class="eyebrow">Предскажи</div><b>${T(st.q)}</b></div>
   <div class="opts">${st.opts.map((o,k)=>`<button class="opt ${sel===undefined?"":k===st.correct?"good":k===sel?"wrong":""}" ${sel!==undefined?"disabled":""} onclick="P.pick[P.i]=${k};drawPlayer()">${T(o)}</button>`).join("")}</div>
   ${sel!==undefined?`<div class="callout ${sel===st.correct?"ok":"warm"} pop"><div class="eyebrow">${sel===st.correct?"Точно":"Почти никто не угадывает"}</div><div class="p">${st.reveal}</div></div>${st.after?`<div class="callout warm pop"><div class="eyebrow">${esc(st.afterTitle||"А в жизни")}</div><div class="p">${st.after}</div></div>`:""}`:""}`,
   foot:sel===undefined?`<button class="btn block" disabled>Выбери вариант</button>`:null};
 },
 read(st){
  const [i,n]=readIdx(st);
  return {html:`<div class="read stack" style="gap:16px"><div class="kicker">Материал · часть ${i} из ${n}</div><span class="rt">⏱ ≈ ${st.min} мин чтения</span><h1 class="h">${esc(st.title)}</h1>${st.html}</div>`};
 },
 hack(st){
  return {html:`<div class="hack"><div class="eyebrow">Лайфхак</div><h1 class="hname">${T(st.name)}</h1>${st.formula?`<div class="hform">${st.formula}</div>`:""}<p class="p" style="color:inherit">${st.what}</p></div>
   ${st.how?`<div class="card"><div class="eyebrow">Как пользоваться</div><ul class="hl">${st.how.map(x=>`<li>${x}</li>`).join("")}</ul></div>`:""}
   ${st.example?`<div class="callout"><div class="eyebrow">Пример на салфетке</div><p class="p">${st.example}</p></div>`:""}
   ${st.limit?`<div class="callout warm"><div class="eyebrow">Где ломается</div><p class="p">${st.limit}</p></div>`:""}`};
 },
 play(st){
  const g=wk("p"+P.i);g.i=g.i||0;const items=st.items,n=items.length,it=items[g.i],key=`p${P.i}.${g.i}`,w=wdraw(it,key),lastItem=g.i===n-1;
  let foot=w.foot;
  if(!foot)foot=w.done?(lastItem?`<button class="btn block" onclick="stepTo(1)">Дальше</button>`:`<button class="btn block" onclick="playNext()">Следующее задание</button>`):`<button class="btn block" disabled>Выполни задание</button>`;
  return {html:`<div class="kicker">${esc(st.kicker||"Задание")}${n>1?` · ${g.i+1} из ${n}`:""}</div><h1 class="h">${esc(st.title)}</h1>${st.intro&&g.i===0?`<div class="p">${st.intro}</div>`:""}${it.q?`<div class="qq">${T(it.q)}</div>`:""}${w.html}${w.done&&lastItem&&st.outro?`<div class="callout ok pop"><div class="eyebrow">Что из этого следует</div><div class="p">${st.outro}</div></div>`:""}`,foot};
 },
 story(st){
  const g=wk("s"+P.i);if(!g.node){g.node=st.start||"a";g.vars=JSON.parse(JSON.stringify(st.vars||{}));g.step=0}
  const nd=st.nodes[g.node],vs=Object.values(g.vars).map(v=>`<span class="vch"><small>${esc(v.label)}</small><b class="num">${f1(v.v,1)}${esc(v.unit||"")}</b></span>`).join("");
  let html=`<div class="kicker">${esc(st.kicker||"Игра")}</div><h1 class="h">${esc(st.title)}</h1>${st.intro&&g.node===(st.start||"a")?`<div class="p">${st.intro}</div>`:""}${vs?`<div class="vrow">${vs}</div>`:""}`;
  if(nd.end){
   html+=`<div class="callout ${nd.tone||"ok"} pop"><div class="eyebrow">${esc(nd.title||"Итог")}</div><div class="p">${nd.text}</div></div>${st.outro?`<div class="callout"><div class="eyebrow">Что из этого следует</div><div class="p">${st.outro}</div></div>`:""}`;
   return {html,foot:`<button class="btn ghost" onclick="storyReset()">Ещё раз</button><button class="btn block" onclick="stepTo(1)">Дальше</button>`};
  }
  html+=`<div class="card"><div class="p">${nd.text}</div></div><div class="opts">${nd.ch.map((c,k)=>`<button class="opt ${g.pick===undefined?"":k===g.pick?"sel":""}" ${g.pick!==undefined?"disabled":""} onclick="storyPick(${k})">${T(c.t)}</button>`).join("")}</div>`;
  if(g.pick!==undefined){const c=nd.ch[g.pick];html+=`<div class="callout ${c.tone||""} pop"><div class="eyebrow">Что произошло</div><div class="p">${c.fb}</div></div>`}
  return {html,foot:g.pick===undefined?`<button class="btn block" disabled>Сделай ход</button>`:`<button class="btn block" onclick="storyGo()">Дальше</button>`};
 },
 client(st){return {html:`<div class="kicker">Клиент</div><h1 class="h">${esc(st.title)}</h1>${st.html}`}},
 quizintro(){const t=P.test;return {html:`<div class="kicker">${esc(P.hdr)}</div><h1 class="h">${esc(t.title)}</h1><p class="p">${t.desc}</p><div class="callout"><div class="eyebrow">Правила</div><p class="p">${P.D.quiz.length} заданий разных типов, порог 70%. В тесте недели каждый урок представлен двумя вопросами; в итоговом больше вопросов по последним урокам. Подсказок нет, зато каждый ответ разбирается.</p></div>`,noback:true,foot:`<button class="btn block" onclick="stepTo(1)">Начать</button>`}},
 quiz(){
  const Q=P.D.quiz,q=P.q;
  if(q.done){const r=q.res;return {html:`<div class="kicker">Тест завершён</div><h1 class="h">${Math.round(r.pct*100)}%: ${f1(r.score,2)} из ${r.max}</h1><p class="p">Результат записан.</p>`,noback:true}}
  const it=Q[q.i],key="q"+q.i,w=wdraw(it,key);
  const foot=w.foot||(w.done?`<button class="btn block" onclick="nextQ()">${q.i===Q.length-1?"Завершить тест":"Дальше"}</button>`:`<button class="btn block" disabled>Ответь, чтобы продолжить</button>`);
  return {html:`<div class="kicker">Тест · ${q.i+1} из ${Q.length}${it.from?` · урок ${it.from}`:""}</div><h1 class="h" style="font-size:clamp(20px,5vw,26px)">${T(it.q)}</h1>${w.html}`,foot,noback:true};
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
 },
 twrap(){const r=P.q.res,miss=r?r.miss:[];
  return {html:`<div class="kicker">Итог</div><h1 class="h">${r&&r.pct>=.7?"Тест сдан":"Тест записан, есть что повторить"}</h1>
   ${r?`<div class="card row"><div class="big num">${Math.round(r.pct*100)}%</div><div class="grow"><b>${f1(r.score,2)} из ${r.max}</b><div class="ls">Порог — 70%. Можно пересдать: набор вопросов изменится.</div></div></div>`:""}
   ${miss.length?`<div class="callout warm"><div class="eyebrow">Где были ошибки</div>${miss.map(n=>`<button class="lrow" style="margin:8px 0 0" onclick="closeLesson();openLesson(${n})"><span class="lnum num">${n}</span><span class="grow lt">${esc(CATALOG[n-1][2])}</span></button>`).join("")}</div>`:`<div class="callout ok"><div class="eyebrow">Без пробелов</div><p class="p">Все темы закреплены.</p></div>`}`,noback:true};
 }
};
function nextQ(){
  const Q=P.D.quiz;
  if(P.q.i<Q.length-1){P.q.i++;drawPlayer();return}
  const per=Q.map((it,i)=>wscore(it,"q"+i));let score=Math.round(per.reduce((a,b)=>a+b,0)*100)/100;
  const sec=Math.round((Date.now()-P.t0)/1000);
  const miss=P.test?[...new Set(Q.filter((it,i)=>per[i]<.7).map(it=>it.from))].sort((a,b)=>a-b):[];
  P.q.res={score,max:Q.length,pct:score/Q.length,miss};P.q.done=true;
  if(P.test)addEvent(P.test.type,P.test.id,Q.length+" заданий",score,Q.length,sec);
  else addEvent("Тест",P.n,Q.length+" вопросов",score,Q.length,sec);
  P.i=P.D.steps.findIndex(s=>s.t==="tip"||s.t==="twrap");drawPlayer();
}
/* ===== TESTS: недели и итоговые ===== */
async function buildTest(type,id){
  const W=type==="Недельный",end=W?id*5:id*10,start=W?end-4:1,from=[];
  for(let n=start;n<=end;n++)from.push(n);
  const D=await Promise.all(from.map(loadLesson));
  const attempt=tests2(type,id).length,r=rng(type+id+"#"+attempt);
  const pool=n=>{const d=D[n-start];return [...(d.review||[]),...d.quiz].filter(x=>x.k!=="open").map(x=>({...x,from:n}))};
  let items=[];
  if(W){from.forEach(n=>{items.push(...shuf(pool(n),r).slice(0,2))});items=shuf(items,r)}
  else{
    const cand=[];from.forEach(n=>pool(n).forEach(x=>cand.push({x,w:n>end-5?4:n>end-10?2.5:1})));
    const k=Math.min(15,cand.length);
    for(let j=0;j<k;j++){const tot=cand.reduce((a,c)=>a+c.w,0);let t=r()*tot,i=0;while(i<cand.length-1&&(t-=cand[i].w)>0)i++;items.push(cand[i].x);const ln=cand[i].x.from;cand.splice(i,1)}
    items=shuf(items,r);
  }
  return items;
}
async function openTest(type,id){
  try{
    const W=type==="Недельный",items=await buildTest(type,id),end=W?id*5:id*10;
    const title=W?`Тест недели ${id}: уроки ${end-4}–${end}`:`Итоговый тест: уроки 1–${end}`;
    const desc=W?`Закрепляем неделю «${WEEKS[id-1]}». Вопросы собраны из всех пяти уроков недели.`:`Проверяем всё пройденное: от первого урока до ${end}-го. Самый большой вес у уроков ${end-4}–${end}, затем ${Math.max(1,end-9)}–${end-5}, остальные идут реже.`;
    WS={};REG={};
    P={n:null,hdr:W?`Тест недели ${id}`:`Итоговый тест ${end/10}`,test:{type,id,title,desc},D:{quiz:items,steps:[{t:"quizintro"},{t:"quiz"},{t:"twrap"}]},i:0,t0:Date.now(),pick:{},q:{i:0,done:false,res:null}};
    drawPlayer();
  }catch(e){toast("Не удалось собрать тест. Проверь интернет.")}
}
