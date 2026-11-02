/* Ежедневная учёба внутри FINLAB. Existing course and event identifiers stay independent. */
let DAILY={lessons:[],planned:30},dailyCache={},dailyBusy=false;
const CASES=__CASES__;
function caseHTML(c){return `<p class="ls">${esc(c.region)} · исторический кейс</p><h2 class="daily-heading">Что произошло</h2><p class="p">${esc(c.fact)}</p><h2 class="daily-heading">Как работает механизм</h2><p class="p">${esc(c.mechanism)}</p><h2 class="daily-heading">Где аналогия заканчивается</h2><p class="p">${esc(c.limit)}</p><div class="callout"><b>Вопрос клиенту</b><p class="p">${esc(c.client)}</p></div><p class="ls"><a href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.source)}</a></p>`}
function openCase(id){const c=CASES.find(c=>c.id===id);if(!c)return;WS={};REG={};P={n:null,hdr:c.region+' · история',i:0,D:{steps:[{t:'read',title:c.title,min:2,html:caseHTML(c)},{t:'play',title:'Проверь вывод',items:[c.question]}]},pick:{},q:{done:false}};drawPlayer()}
const dailyEvents=()=>S.events.filter(r=>r[1]==='Ежедневный');
const dailyTaken=n=>dailyEvents().some(r=>+r[2]===n);
const dailyBest=n=>{const rows=dailyEvents().filter(r=>+r[2]===n);return rows.length?Math.max(...rows.map(r=>r[4]/r[5])):null};
async function loadDaily(){try{const r=await fetch('daily/index.json',{cache:'no-cache'});if(!r.ok)throw Error();DAILY=await r.json();render()}catch(e){toast('Не удалось загрузить ежедневную программу. Обнови страницу.')}}
async function dailyLesson(n){if(dailyCache[n])return dailyCache[n];const r=await fetch(`daily/${n}.json`,{cache:'no-cache'});if(!r.ok)throw Error();const d=await r.json();const cases=CASES.filter(c=>c.n===n);d.steps.push(...cases.map(c=>({t:'read',title:c.title,min:2,html:caseHTML(c)})));d.quiz.push(...cases.map(c=>c.question));return dailyCache[n]=d}
function dailyPeriod(type,date=todayMsk()){
  const d=new Date(date+'T12:00:00Z');
  if(type==='week'){d.setUTCDate(d.getUTCDate()-d.getUTCDay());return d.toISOString().slice(0,10)}
  const last=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0,12));
  if(date===last.toISOString().slice(0,10))return date;
  return new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),0,12)).toISOString().slice(0,10);
}
function dailyEligible(cutoff){return DAILY.lessons.filter(l=>dailyEvents().some(r=>+r[2]===l.n&&String(r[0]).slice(0,10)<=cutoff)).map(l=>l.n)}
function dailyDraftKey(){return P?.daily?(P.daily.kind==='lesson'?'lesson-'+P.n:P.daily.kind+'-'+P.daily.cutoff):null}
function saveDailyDraft(){const k=dailyDraftKey();if(!k||P.q.done)return;S.dailyDrafts=S.dailyDrafts||{};S.dailyDrafts[k]={P:JSON.parse(JSON.stringify(P)),WS:JSON.parse(JSON.stringify(WS)),saved:nowMsk()};save()}
function dailySession(data,key){
  const draft=S.dailyDrafts?.[key];WS={};REG={};
  if(draft&&!draft.P.q.done){P=draft.P;WS=draft.WS;P.shown=false;toast('Продолжаем с сохранённого места')}
  else P=data;
  drawPlayer();
}
async function openDaily(n){
  if(dailyBusy)return;dailyBusy=true;
  try{const d=await dailyLesson(n);const body=JSON.parse(JSON.stringify(d));
    body.steps=[{t:'dailyintro'},...body.steps,{t:'quiz'},{t:'dailywrap'}];
    dailySession({n,D:body,daily:{kind:'lesson',title:d.title},i:0,t0:Date.now(),pick:{},q:{i:0,done:false,res:null}},'lesson-'+n);
  }catch(e){toast('Не удалось открыть занятие. Проверь соединение.')}finally{dailyBusy=false}
}
async function openDailyExam(kind,cutoff=dailyPeriod(kind)){
  if(dailyBusy)return;dailyBusy=true;
  try{
    const from=dailyEligible(cutoff);if(!from.length){toast('Сначала пройди тест урока до даты экзамена');return}
    const type=kind==='week'?'Недельный ежедневный':'Месячный ежедневный';
    const attempt=S.events.filter(r=>r[1]===type&&r[2]===cutoff).length;
    const random=rng(kind+cutoff+'#'+attempt),items=[];
    for(const n of from){const d=await dailyLesson(n);const pool=(d.review||[]).concat(d.quiz).filter(q=>q.k!=='open');
      items.push(...shuf(pool,random).slice(0,kind==='week'?2:3).map(q=>({...q,from:n,hint:undefined})))
    }
    const title=(kind==='week'?'Недельный экзамен':'Месячный экзамен')+' · '+fmtD(cutoff);
    const quiz=shuf(items,random);if(!quiz.length)throw Error('Empty exam');
    dailySession({n:null,hdr:title,daily:{kind,cutoff,from,type,title},D:{title,quiz,steps:[{t:'dailyintro'},{t:'quiz'},{t:'dailywrap'}]},i:0,t0:Date.now(),pick:{},q:{i:0,done:false,res:null}},kind+'-'+cutoff);
  }catch(e){toast('Не удалось собрать экзамен. Попробуй снова.')}finally{dailyBusy=false}
}
function dailyFinish(per){
  const score=Math.round(per.reduce((a,b)=>a+b,0)*100)/100,max=per.length;
  const miss=[...new Set(P.D.quiz.filter((q,i)=>per[i]<.7).map(q=>q.from||P.n))];
  P.q={...P.q,done:true,res:{score,max,pct:score/max,miss}};
  const type=P.daily.kind==='lesson'?'Ежедневный':P.daily.type,id=P.n||P.daily.cutoff;
  // Persist review and summary together before attempting optional remote sync.
  S.dailyHistory=S.dailyHistory||[];
  S.dailyHistory.push({at:nowMsk(),type,id,title:P.daily.title,from:P.daily.from||[P.n],result:P.q.res,answers:P.D.quiz.map((q,i)=>({question:q,state:JSON.parse(JSON.stringify(wk('q'+i))),score:per[i]}))});
  const row=[nowMsk(),type,id,P.daily.title,score,max,Math.round((Date.now()-P.t0)/1000)];S.events.push(row);
  delete (S.dailyDrafts||{})[dailyDraftKey()];P.i=P.D.steps.length-1;save();flush();drawPlayer();
}
STEPS.dailyintro=()=>({html:`<h1 class="h">${esc(P.D.title)}</h1>${P.daily.kind==='lesson'?`<p class="ls">${esc(P.D.provenance)}</p><p class="p">Материал, затем ${P.D.quiz.length} заданий. Порог — 70%. Разбор появляется после ответа; закрытый урок можно продолжить с сохранённого места.</p>`:`<p class="p">Накопительный экзамен по ${P.daily.from.length} изученным темам: ${P.daily.from.join(', ')}. Учитываются только тесты, пройденные до ${fmtD(P.daily.cutoff)} включительно.</p><p class="p">${P.D.quiz.length} заданий, порог — 70%. После каждого ответа — разбор, в конце — темы для повторения.</p>`}`,noback:true});
STEPS.dailywrap=()=>{const r=P.q.res;return {html:`<h1 class="h">${r?.pct>=.7?'Зачёт':'Нужно повторить'}</h1><div class="card"><p class="disp num">${r?Math.round(r.pct*100)+'%':'—'}</p><p class="p">${r?f1(r.score,2)+' из '+r.max:''}. Результат сохранён.</p></div>${r?.miss.length?`<h2 class="daily-heading">Повторить темы</h2>${r.miss.map(n=>`<button class="lrow" onclick="closeLesson();openDaily(${n})"><span class="lnum">${n}</span><span class="grow">${esc(DAILY.lessons.find(l=>l.n===n)?.title||'Урок '+n)}</span></button>`).join('')}`:'<p class="p">Все вопросы решены верно.</p>'}<p class="ls">История ответов и разбор доступны в ежедневной программе. Новая попытка сохраняется отдельно.</p>`,noback:true}};
function dailyExamRow(kind){const cutoff=dailyPeriod(kind),ready=dailyEligible(cutoff),type=kind==='week'?'Недельный ежедневный':'Месячный ежедневный';const rows=S.events.filter(r=>r[1]===type&&r[2]===cutoff),last=rows.at(-1);return `<button class="lrow trow" ${ready.length?`onclick="openDailyExam('${kind}')"`:'disabled'}><span class="grow"><b>${kind==='week'?'Недельный':'Месячный'} экзамен</b><br><span class="ls">На ${fmtD(cutoff)} · ${ready.length} изученных тем${last?' · последняя оценка '+Math.round(last[4]/last[5]*100)+'%':''}</span></span></button>`}
function vDaily(){const next=DAILY.lessons.find(l=>(dailyBest(l.n)??0)<.7),history=S.dailyHistory||[];
  return `<div class="stack daily"><div class="top"><h1 class="title">Ежедневная учёба</h1><button class="btn ghost" onclick="go('prog')">Основной курс</button></div><p class="p">${DAILY.lessons.filter(l=>(dailyBest(l.n)??0)>=.7).length} из ${DAILY.lessons.length} занятий пройдено. Вся программа из ${DAILY.planned} занятий доступна сразу. Выбирай следующий урок или нужную тему.</p>${next?`<button class="btn block" onclick="openDaily(${next.n})">Продолжить · занятие ${next.n}</button>`:''}<section><h2 class="daily-heading">Занятия</h2>${DAILY.lessons.map(l=>{const b=dailyBest(l.n);return `<button class="lrow" onclick="openDaily(${l.n})"><span class="lnum num">${b>=.7?'✓':l.n}</span><span class="grow"><span class="lt">${esc(l.title)}</span><br><span class="ls">${b===null?'Доступно':Math.round(b*100)+'%'+(b<.7?' · повторить':'')}${l.n<7?' · восстановлено по FINLAB':''}${S.dailyDrafts?.['lesson-'+l.n]?' · есть сохранение':''}</span></span></button>`}).join('')}</section><section><h2 class="daily-heading">Экзамены</h2><p class="ls">Недельный — по воскресеньям, месячный — в последний день месяца. Охват накопительный, по фактическому прохождению к дате экзамена.</p>${dailyExamRow('week')}${dailyExamRow('month')}</section><section><h2 class="daily-heading">История и разбор</h2>${history.length?history.map((a,i)=>`<button class="lrow" onclick="openDailyReview(${i})"><span class="grow">${esc(a.title)}<br><span class="ls">${esc(a.at)} · ${Math.round(a.result.pct*100)}% · ${a.answers.length} заданий</span></span></button>`).reverse().join(''):'<p class="p">Пройди первый тест — здесь появятся ответы, оценки и темы для повторения.</p>'}</section><section><h2 class="daily-heading">Резервная копия</h2><p class="ls">Прогресс хранится в этом браузере. Экспортируй копию для переноса между телефоном, Telegram и компьютером. Удаление данных браузера удалит локальный прогресс.</p><div class="pair"><button class="btn ghost" onclick="exportProgress()">Скачать прогресс</button><label class="btn ghost" for="progress-file">Восстановить</label><input hidden id="progress-file" type="file" accept="application/json,.json" onchange="importProgress(this.files[0])"></div></section></div>`;
}
function openDailyReview(i){const a=S.dailyHistory[i];WS={};REG={};P={n:null,hdr:'Разбор',daily:null,review:true,D:{steps:a.answers.map((x,k)=>({t:'dailyreview',x,k}))},i:0,shown:false};drawPlayer()}
STEPS.dailyreview=st=>{const x=st.x,key='review'+st.k;WS[key]=JSON.parse(JSON.stringify(x.state));const w=wdraw(x.question,key);return {html:`<h1 class="h">${T(x.question.q)}</h1><p class="ls">Оценка: ${f1(x.score,2)} из 1</p>${w.html}`}};
function exportProgress(){const blob=new Blob([JSON.stringify({format:'finlab-progress',version:1,state:S},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='finlab-progress-'+todayMsk()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
async function importProgress(file){
  if(!file)return;try{if(file.size>10*1024*1024)throw Error();const d=JSON.parse(await file.text());
    if(d.format!=='finlab-progress'||d.version!==1||!validProgress(d.state))throw Error();
    // Only published questions may enter the review renderer. Never import executable lesson HTML.
    for(const a of d.state.dailyHistory||[]){for(const x of a.answers){
      const n=x.question.from||a.id;if(!Number.isInteger(n)||n<1||n>DAILY.lessons.length)throw Error();
      const lesson=await dailyLesson(n);const canonical=lesson.quiz.find(q=>q.q===x.question.q&&q.k===x.question.k);if(!canonical)throw Error();
      const clean={...canonical};if(x.question.from)clean.from=n;x.question=clean;
      const st=x.state;if('a' in st&&!Array.isArray(st.a)&&!(Number.isFinite(st.a)&&(!['choice','case'].includes(clean.k)||(Number.isInteger(st.a)&&st.a>=0&&st.a<clean.opts.length))))throw Error();
    }}
    const current=JSON.parse(JSON.stringify(S));store.set('fl_before_import',current);
    const ids=new Set(S.events.map(r=>JSON.stringify(r)));for(const r of d.state.events)if(!ids.has(JSON.stringify(r))){S.events.push(r);ids.add(JSON.stringify(r))}
    const history=S.dailyHistory||[],hids=new Set(history.map(r=>JSON.stringify(r)));for(const r of d.state.dailyHistory||[])if(!hids.has(JSON.stringify(r))){history.push(r);hids.add(JSON.stringify(r))}
    S.dailyHistory=history;S.cards={...d.state.cards,...S.cards};S.events.sort((a,b)=>String(a[0]).localeCompare(String(b[0])));save();flush();render();toast('Прогресс объединён с текущим');
  }catch(e){toast('Не удалось прочитать копию FINLAB. Текущий прогресс сохранён.')}
}
function validProgress(s){return s&&Array.isArray(s.events)&&s.events.every(r=>Array.isArray(r)&&r.length>=7&&typeof r[0]==='string'&&typeof r[1]==='string'&&typeof r[3]==='string'&&Number.isFinite(r[4])&&Number.isFinite(r[5])&&r[5]>0)&&s.cards&&typeof s.cards==='object'&&(!s.dailyHistory||Array.isArray(s.dailyHistory)&&s.dailyHistory.every(a=>a&&typeof a.title==='string'&&a.result&&Number.isFinite(a.result.pct)&&Array.isArray(a.answers)&&a.answers.every(x=>x.question&&WD[x.question.k]&&x.state&&Number.isFinite(x.score))))}
function initTelegram(){const tg=window.Telegram?.WebApp;if(!tg)return;try{tg.ready();tg.expand();tg.BackButton?.onClick(()=>P?closeLesson():go('today'));tg.onEvent?.('viewportChanged',()=>{document.documentElement.style.setProperty('--tg-height',tg.viewportStableHeight+'px')})}catch(e){}}
