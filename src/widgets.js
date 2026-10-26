/* ===== WIDGETS: общий движок заданий (для шагов-игр, тестов урока и тестов недели) ===== */
let WS={},REG={};
const wk=k=>WS[k]||(WS[k]={});
const T=s=>String(s??"").replace(/&(?!amp;|lt;|gt;|#|nbsp;)/g,"&amp;").replace(/<(?!\/?(b|i|em|sup|sub|br)\b)/g,"&lt;");
function rng(seed){let h=1779033703^seed.length;for(let i=0;i<seed.length;i++){h=Math.imul(h^seed.charCodeAt(i),3432918353);h=h<<13|h>>>19}let a=h>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const shuf=(arr,r)=>{const a=arr.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const fbk=(tone,title,text)=>`<div class="callout ${tone} pop"><div class="eyebrow">${title}</div><p class="p">${T(text)}</p></div>`;
const toneOf=s=>s>=.99?"ok":s>0?"warm":"bad";
function wact(key,act,v){const it=REG[key];if(!it)return;WA[it.k](it,wk(key),act,v,key);redrawKeep()}
function wdraw(it,key){REG[key]=it;return WD[it.k](it,wk(key),key)}
function wscore(it,key){return wdraw(it,key).score||0}
const WD={
 choice(it,st,key){const a=st.a,d=a!==undefined;
  return {done:d,score:d&&a===it.ans?1:0,html:`<div class="opts">${it.opts.map((o,k)=>`<button class="opt ${d?(k===it.ans?"good":k===a?"wrong":""):""}" ${d?"disabled":""} onclick="wact('${key}','pick',${k})">${T(o)}</button>`).join("")}</div>${d?fbk(a===it.ans?"ok":"bad",a===it.ans?"Верно":"Не совсем",it.why):""}`}},
 num(it,st,key){const d=st.a!==undefined,ok=d&&Math.abs(st.a-it.ans)<=it.tol;
  return {done:d,score:ok?1:0,foot:d?"":`<button class="btn block" onclick="wact('${key}','check')">Проверить</button>`,
   html:`${it.hint&&!d?`<p class="ls">Подсказка: ${T(it.hint)}</p>`:""}<div class="field"><input type="number" inputmode="decimal" step="any" id="ni_${key}" value="${d?st.a:""}" ${d?"disabled":""} placeholder="Ответ${it.unit?", "+esc(it.unit):""}" aria-label="Ответ"></div>${d?fbk(ok?"ok":"bad",ok?"Верно":"Не совсем",(ok?"":`Правильный ответ: <b>${f1(it.ans,4)} ${esc(it.unit||"")}</b>. `)+it.why):""}`}},
 tf(it,st,key){st.a=st.a||[];const n=it.stmts.length,dn=st.a.filter(x=>x!==undefined).length===n&&n>0;
  const sc=st.a.reduce((s,x,i)=>s+(x===it.stmts[i].v?1:0),0)/n;
  return {done:dn,score:sc,html:it.stmts.map((s,i)=>{const a=st.a[i],d=a!==undefined,ok=a===s.v;
   return `<div class="tfr ${d?(ok?"ok":"bad"):""}"><div class="tft">${T(s.t)}</div><div class="pair"><button class="opt ${d&&s.v===true?"good":d&&a===true?"wrong":""}" ${d?"disabled":""} onclick="wact('${key}','set',[${i},true])">Верно</button><button class="opt ${d&&s.v===false?"good":d&&a===false?"wrong":""}" ${d?"disabled":""} onclick="wact('${key}','set',[${i},false])">Неверно</button></div>${d?`<p class="ls pop" style="color:var(--fg2)">${T(s.why)}</p>`:""}</div>`}).join("")}},
 pick(it,st,key){st.sel=st.sel||[];const d=!!st.chk,need=it.opts.filter(o=>o.ok).length;
  let hit=0,wr=0;it.opts.forEach((o,i)=>{if(st.sel.includes(i)){o.ok?hit++:wr++}});const sc=Math.max(0,(hit-wr)/need);
  return {done:d,score:d?sc:0,foot:d?"":`<button class="btn block" ${st.sel.length?"":"disabled"} onclick="wact('${key}','check')">Проверить</button>`,
   html:`<div class="opts">${it.opts.map((o,i)=>{const on=st.sel.includes(i);let c=on?"on":"";if(d){c=o.ok?"on":on?"badc":""}
    return `<button class="check ${c}" ${d?"disabled":""} onclick="wact('${key}','tog',${i})"><span class="bx">${d?(o.ok?"✓":on?"✕":""):on?"✓":""}</span><span>${T(o.t)}${d&&o.why?`<small class="why">${T(o.why)}</small>`:""}</span></button>`}).join("")}</div>${d?fbk(toneOf(sc),sc>=.99?"Всё верно":"Разбор",`Найдено ${hit} из ${need}${wr?`, лишних отметок: ${wr}`:""}. ${it.why||""}`):""}`}},
 match(it,st,key){const n=it.pairs.length;if(!st.perm){st.perm=shuf([...Array(n).keys()],rng(key+it.q));st.lock=[];st.err=0;st.sel=null}
  const dn=st.lock.length===n,sc=Math.max(0,1-st.err/n);
  return {done:dn,score:dn?sc:0,html:`<div class="mt"><div class="mc">${it.pairs.map((p,i)=>`<button class="opt ${st.lock.includes(i)?"good":st.sel===i?"sel":""}" ${st.lock.includes(i)?"disabled":""} onclick="wact('${key}','l',${i})">${T(p[0])}</button>`).join("")}</div><div class="mc">${st.perm.map(j=>`<button class="opt ${st.lock.includes(j)?"good":""} ${st.flash===j?"wrong":""}" ${st.lock.includes(j)?"disabled":""} onclick="wact('${key}','r',${j})">${T(it.pairs[j][1])}</button>`).join("")}</div></div><p class="ls">Нажми на левую карточку, потом на подходящую правую. Ошибок: ${st.err}</p>${dn?fbk(toneOf(sc),"Готово",it.why||""):""}`}},
 order(it,st,key){const n=it.items.length;if(!st.list){let l;const r=rng(key+it.q);do{l=shuf([...Array(n).keys()],r)}while(l.every((v,i)=>v===i)&&n>1);st.list=l}
  const d=!!st.chk,right=st.list.filter((v,i)=>v===i).length,sc=right/n;
  return {done:d,score:d?sc:0,foot:d?"":`<button class="btn block" onclick="wact('${key}','check')">Проверить порядок</button>`,
   html:`<p class="ls">${T(it.top||"Первое")} ↑ · ↓ ${T(it.bottom||"последнее")}</p><div class="ord">${st.list.map((v,i)=>`<div class="orow ${d?(v===i?"good":"wrong"):""}"><span class="grow">${T(it.items[v])}</span>${d?"":`<button class="mv" aria-label="Выше" ${i?"":"disabled"} onclick="wact('${key}','up',${i})">▲</button><button class="mv" aria-label="Ниже" ${i<n-1?"":"disabled"} onclick="wact('${key}','dn',${i})">▼</button>`}</div>`).join("")}</div>${d?fbk(toneOf(sc),`На своих местах: ${right} из ${n}`,`Верный порядок: ${it.items.map((x,i)=>`${i+1}) ${x}`).join("; ")}. ${it.why||""}`):""}`}},
 sort(it,st,key){st.i=st.i||0;st.sc=st.sc||0;const n=it.items.length,d=st.i>=n&&!st.fb,cur=it.items[st.i];
  const body=d?fbk(toneOf(st.sc/n),`Верно ${st.sc} из ${n}`,it.why||""):`<div class="card sortcard"><div class="eyebrow">${st.i+1} из ${n}</div><div class="disp" style="font-size:20px;margin-top:6px">${T(cur.t)}</div></div>`+
   (st.fb!==undefined?fbk(st.fb.ok?"ok":"bad",st.fb.ok?"Верно":"Нет",cur.why):`<div class="bins">${it.bins.map((b,k)=>`<button class="btn ghost bin" onclick="wact('${key}','bin',${k})">${T(b)}</button>`).join("")}</div>`);
  return {done:d,score:d?st.sc/n:0,foot:st.fb!==undefined?`<button class="btn block" onclick="wact('${key}','nx')">Дальше</button>`:"",html:body}},
 case(it,st,key){const a=st.a,d=a!==undefined;
  return {done:d,score:d?it.opts[a].s:0,html:`${it.scen?`<div class="callout"><div class="eyebrow">Ситуация</div><p class="p">${T(it.scen)}</p></div>`:""}<div class="opts">${it.opts.map((o,k)=>{const c=d?(o.s>=1?"good":k===a?(o.s>0?"part":"wrong"):""):"";return `<button class="opt ${c}" ${d?"disabled":""} onclick="wact('${key}','pick',${k})">${T(o.t)}${d&&(k===a||o.s>=1)?`<small class="why">${k===a?"Твой ответ. ":""}${T(o.fb)}</small>`:""}</button>`}).join("")}</div>${d?fbk(toneOf(it.opts[a].s),it.opts[a].s>=1?"Сильный ход":it.opts[a].s>0?"Частично":"Слабый ход",it.why||""):""}`}},
 estimate(it,st,key){const lo=it.log?Math.log(it.min):it.min,hi=it.log?Math.log(it.max):it.max,pos=st.p??50,val=it.log?Math.exp(lo+(hi-lo)*pos/100):lo+(hi-lo)*pos/100;
  const v=it.step?Math.round(val/it.step)*it.step:val,d=st.done,err=d?Math.abs(st.v-it.truth)/Math.abs(it.truth):0,sc=d?(err<=it.tol?1:err<=2*it.tol?.5:0):0;
  return {done:d,score:sc,foot:d?"":`<button class="btn block" onclick="wact('${key}','lock')">Зафиксировать оценку</button>`,
   html:`<div class="est"><div class="num estv" id="ev_${key}">${f1(d?st.v:v,it.dec??0)} ${esc(it.unit||"")}</div><input type="range" min="0" max="100" step="0.5" value="${pos}" ${d?"disabled":""} oninput="estMove('${key}',this.value)" aria-label="Твоя оценка"><div class="row" style="justify-content:space-between"><small class="ls">${f1(it.min,it.dec??0)}</small><small class="ls">${f1(it.max,it.dec??0)}</small></div></div>${d?fbk(toneOf(sc),sc>=1?"В точку":sc>0?"Близко":"Мимо",`Правильный ответ: <b>${f1(it.truth,it.dec??0)} ${esc(it.unit||"")}</b>. Твоя оценка ${err<.005?"точная":`отличалась на ${f1(err*100,0)}%`}. ${it.why||""}`):""}`}}
};
const WA={
 choice:(it,st,a,v)=>{if(st.a===undefined)st.a=v},
 case:(it,st,a,v)=>{if(st.a===undefined)st.a=v},
 num:(it,st,a,v,key)=>{const x=parseFloat(String(document.getElementById("ni_"+key).value).replace(",","."));if(isNaN(x)){toast("Введи число");return}st.a=x},
 tf:(it,st,a,v)=>{const[i,b]=v;st.a=st.a||[];if(st.a[i]===undefined)st.a[i]=b},
 pick:(it,st,a,v)=>{if(a==="tog"){st.sel=st.sel||[];const k=st.sel.indexOf(v);k>=0?st.sel.splice(k,1):st.sel.push(v)}else st.chk=true},
 match:(it,st,a,v)=>{if(a==="l"){st.sel=v;st.flash=undefined}else if(st.sel!==null&&st.sel!==undefined){if(v===st.sel){st.lock.push(v);st.sel=null;st.flash=undefined}else{st.err++;st.flash=v}}else toast("Сначала выбери карточку слева")},
 order:(it,st,a,v)=>{if(a==="check")st.chk=true;else{const j=a==="up"?v-1:v+1;[st.list[v],st.list[j]]=[st.list[j],st.list[v]]}},
 sort:(it,st,a,v)=>{if(a==="bin"){const ok=v===it.items[st.i||0].b;st.fb={ok};if(ok)st.sc=(st.sc||0)+1}else{st.fb=undefined;st.i=(st.i||0)+1}},
 estimate:(it,st,a)=>{if(a==="lock"){st.done=true;const lo=it.log?Math.log(it.min):it.min,hi=it.log?Math.log(it.max):it.max,pos=st.p??50,val=it.log?Math.exp(lo+(hi-lo)*pos/100):lo+(hi-lo)*pos/100;st.v=it.step?Math.round(val/it.step)*it.step:val}}
};
WA.spot=WA.pick;WD.spot=WD.pick;
function estMove(key,pos){const it=REG[key],st=wk(key);st.p=+pos;const lo=it.log?Math.log(it.min):it.min,hi=it.log?Math.log(it.max):it.max,val=it.log?Math.exp(lo+(hi-lo)*pos/100):lo+(hi-lo)*pos/100,v=it.step?Math.round(val/it.step)*it.step:val;const e=document.getElementById("ev_"+key);if(e)e.textContent=f1(v,it.dec??0)+" "+(it.unit||"")}
