/* Calendar exams use the existing journal, never the planned lesson calendar. */
function examPeriod(day=todayMsk()) {
  const cutoff=day.slice(0,7)+'-01';
  return {id:day.slice(0,7),cutoff,kind:[1,4,7,10].includes(+day.slice(5,7))?'Квартальный':'Ежемесячный'};
}
function examLessons(cutoff,events=S.events){
  return [...new Set(events.filter(r=>r[1]==='Тест' && /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}$/.test(String(r[0])) && String(r[0]).slice(0,10)<cutoff && Number.isInteger(+r[2]) && +r[2]>0 && Number.isFinite(+r[4]) && +r[5]>0 && +r[4]<=+r[5] && +r[4]/+r[5]>=.7).map(r=>+r[2]))].sort((a,b)=>a-b);
}
function examRecords(){
  const records={};
  for(const row of S.events){
    if(!['Экзамен:снимок','Экзамен:ответы','Экзамен:сдан'].includes(row[1]))continue;
    try {const d=JSON.parse(row[3]);if(!d.id||!Array.isArray(d.questions)||!d.questions.length)continue;
      const old=records[d.id];if(!old||!old.submitted)records[d.id]=d;
    }catch(e){}
  }
  return records;
}
function examWrite(e,type){addEvent(type,e.id,JSON.stringify(e),e.score??'',e.questions.length,'')}
function examQuestions(d,n){
  const out=[];
  for(const q of [...(d.review||[]),...(d.quiz||[])]){
    if(q.k==='num')out.push({from:n,q:q.q,ans:q.ans,tol:q.tol||0,unit:q.unit||'',why:q.why||''});
    if(q.k==='choice')out.push({from:n,q:q.q,opts:q.opts,ans:q.ans,why:q.why||''});
    if(q.k==='case')out.push({from:n,q:(q.scen?q.scen+'\n':'')+q.q,opts:q.opts.map(o=>o.t),ans:q.opts.findIndex(o=>o.s>=1),why:q.opts.map(o=>o.t+': '+o.fb).join('\n')});
    if(q.k==='tf')for(const t of q.stmts)out.push({from:n,q:t.t,opts:['Верно','Неверно'],ans:t.v?0:1,why:t.why||''});
  }
  return out.filter(q=>q.ans!==-1);
}
let examBusy=false,examError='',examSelected=null;
async function startExam(){
  if(examBusy)return;
  const p=examPeriod();if(examRecords()[p.id]){examSelected=p.id;render();return}
  const lessons=examLessons(p.cutoff);if(!lessons.length)return;
  examBusy=true;examError='';render();
  try {
    const questions=[];const random=rng(p.id);
    for(const n of lessons){const pool=examQuestions(await loadLesson(n),n);if(!pool.length)throw new Error('Нет проверяемых вопросов в уроке '+n);questions.push(...shuf(pool,random).slice(0,p.kind==='Квартальный'?3:2))}
    const e={...p,lessons,questions:shuf(questions,random),answers:{},created:nowMsk()};
    examWrite(e,'Экзамен:снимок');examSelected=p.id;
  }catch(err){examError='Экзамен не создан: '+err.message+'. Проверь связь и повтори.'}
  examBusy=false;render();
}
function examAnswer(i,value){
  const e=examRecords()[examSelected];if(!e||e.submitted)return;
  if(!Number.isInteger(i)||!e.questions[i])return;
  if(value==='')delete e.answers[i];else if(Number.isFinite(+value))e.answers[i]=+value;
  examWrite(e,'Экзамен:ответы');
}
function examGrade(e){return e.questions.map((q,i)=>Object.hasOwn(e.answers,i)&&(q.opts?e.answers[i]===q.ans:Math.abs(e.answers[i]-q.ans)<=q.tol)?1:0)}
function submitExam(){
  const e=examRecords()[examSelected];if(!e||e.submitted)return;
  if(e.questions.some((q,i)=>!Object.hasOwn(e.answers,i))){toast('Ответь на все вопросы перед сдачей');return}
  const grades=examGrade(e);e.score=grades.reduce((a,b)=>a+b,0);e.submitted=nowMsk();
  e.miss=[...new Set(e.questions.filter((q,i)=>!grades[i]).map(q=>q.from))];
  examWrite(e,'Экзамен:сдан');
  for(const n of e.miss)for(const c of INDEX.cards[n]||[])S.cards[c.id]={box:0,due:todayMsk()};
  save();rep.queue=null;render();
}
function examNotice(){const p=examPeriod(),e=examRecords()[p.id];return `<button class="card row" onclick="go('exams')" style="text-align:left"><span class="grow"><b>${p.kind} экзамен · ${p.id}</b><br><span class="ls">${e?.submitted?'Сдан · разбор и повторение':e?'Продолжить сохранённый экзамен':examLessons(p.cutoff).length?'Доступен по журналу завершённых уроков':'Пока нет завершённых уроков до '+p.cutoff}</span></span></button>`}
function vExams(){
  const p=examPeriod(),all=examRecords(),e=all[examSelected||p.id],lessons=examLessons(p.cutoff);
  let h='<div class="stack"><div class="top"><h1 class="title">Экзамены</h1>'+syncChip()+'</div><p class="p">Первого числа каждого месяца — накопительный экзамен. В январе, апреле, июле и октябре — квартальный вместо месячного. Только уроки с тестом от 70% до начала месяца; все ранее завершённые темы входят в охват. Ответы и разбор — после сдачи.</p>';
  h+='<p class="ls">Источник: журнал FINLAB на этом устройстве'+(CFG.url?' и подключённая таблица.':' (таблица не подключена).')+' Состав фиксируется при создании. Пропущенный экзамен текущего месяца можно сдать позже.</p>';
  if(!e)h+=`<div class="card"><h2>${p.kind} · ${p.id}</h2><p>Подтверждено уроков до ${p.cutoff}: ${lessons.length}.</p><button class="btn" onclick="startExam()" ${!lessons.length||examBusy?'disabled':''}>${examBusy?'Собираем вопросы…':'Создать экзамен'}</button>${examError?`<p role="alert">${esc(examError)}</p>`:''}</div>`;
  else {
    const done=!!e.submitted,grades=done?examGrade(e):[];
    h+=`<h2>${esc(e.kind)} · ${esc(e.id)}</h2><p class="ls">Уроки: ${e.lessons.join(', ')}. Вопросов: ${e.questions.length}. Порог: 70%.</p>`;
    if(done)h+=`<p class="p"><b>${Math.round(e.score/e.questions.length*100)}% · ${e.score/e.questions.length>=.7?'Сдан':'Нужно повторить'}</b></p><p>Ошибки добавлены в «Повтор». Можно повторить исходные уроки и вернуться к разбору.</p>`;
    h+=e.questions.map((q,i)=>`<section class="card stack"><h3>${i+1}. Урок ${q.from}</h3><p class="p">${esc(q.q)}</p>${q.opts?q.opts.map((o,j)=>`<label class="row"><input type="radio" name="exam${i}" ${e.answers[i]===j?'checked':''} ${done?'disabled':''} onchange="examAnswer(${i},${j})"><span>${esc(o)}</span></label>`).join(''):`<label>Ответ ${esc(q.unit)}<input class="inp" type="number" step="any" value="${e.answers[i]??''}" ${done?'disabled':''} oninput="examAnswer(${i},this.value)"></label>`}${done?`<p><b>${grades[i]?'Верно':'Ошибка'}</b> · Твой ответ: ${esc(q.opts?q.opts[e.answers[i]]:e.answers[i])}. Правильный: ${esc(q.opts?q.opts[q.ans]:q.ans)}</p><p>${esc(q.why)}</p><button class="btn ghost" onclick="openLesson(${q.from})">Повторить урок ${q.from}</button>`:''}</section>`).join('');
    if(!done)h+='<button class="btn block" onclick="submitExam()">Сдать экзамен и открыть разбор</button><p class="ls">Ответы сохраняются автоматически. Можно закрыть приложение и продолжить позже.</p>';
  }
  h+='<h2>История и прогресс</h2>';
  for(const x of Object.values(all).sort((a,b)=>b.id.localeCompare(a.id)))h+=`<button class="lrow" onclick="examSelected='${x.id}';render()"><span class="grow">${esc(x.kind)} · ${x.id}</span><b>${x.submitted?Math.round(x.score/x.questions.length*100)+'%':Object.keys(x.answers).length+'/'+x.questions.length}</b></button>`;
  if(examSelected&&examSelected!==p.id)h+='<button class="btn ghost" onclick="examSelected=null;render()">К текущему месяцу</button>';
  return h+'</div>';
}
