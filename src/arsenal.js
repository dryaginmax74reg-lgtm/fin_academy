/* ===== АРСЕНАЛ: библиотека историй, калькулятор правил, сценарии клиентов ===== */
let ST=store.get("fl_st",[]),RL=store.get("fl_rl",{rules:[],hacks:[]}),SC=store.get("fl_sc",{assets:[],clients:[]});
async function loadAr(){
  for(const [f,k,set] of [["stories.json","fl_st",v=>ST=v],["rules.json","fl_rl",v=>RL=v],["scenarios.json","fl_sc",v=>SC=v]]){
    try{const r=await fetch(f,{cache:"no-cache"});if(r.ok){const v=await r.json();set(v);store.set(k,v)}}catch(e){}
  }
  if(tab==="ar")render();
}
const ar={v:"home",sf:0,sw:"",sq:"",so:null,rq:"",rg:"",ro:null,rv:{},co:null,cw:{},cres:null};
const arBack=`<button class="btn ghost" style="min-height:36px" onclick="ar.v='home';render();window.scrollTo(0,0)">← Арсенал</button>`;
const chip=(on,label,fn)=>`<button class="btn ${on?"":"ghost"}" style="min-height:36px;padding:0 12px" onclick="${fn}">${label}</button>`;
const inpCss="width:100%;min-height:48px;border-radius:14px;border:2px solid var(--line);padding:0 14px;background:var(--surface);color:var(--fg);font:inherit";
function vAr(){
  if(ar.v==="st")return vSt();
  if(ar.v==="calc")return vCalc();
  if(ar.v==="sc")return vSc();
  const ok=Object.values(S.scen||{}).filter(x=>x.done).length;
  const items=ST.filter(s=>taken(s.n)).length;
  return `<div class="stack"><div class="top"><h1 class="title">Арсенал</h1></div>
  <p class="p ls">То, что пригодится на встрече: истории, правила «в уме» и тренировка на разных клиентах.</p>
  <button class="card row" style="text-align:left" onclick="ar.v='st';render();window.scrollTo(0,0)"><div class="grow"><b>Библиотека историй</b><div class="ls">Кейсы и факты «для пощеголять». Открыто ${items} из ${ST.length}: истории урока открываются после его теста.</div></div><span>›</span></button>
  <button class="card row" style="text-align:left" onclick="ar.v='calc';render();window.scrollTo(0,0)"><div class="grow"><b>Калькулятор правил</b><div class="ls">${RL.rules.length} простых правил вроде «72»: считаются в уме и точно, с фразой для клиента.</div></div><span>›</span></button>
  <button class="card row" style="text-align:left" onclick="ar.v='sc';render();window.scrollTo(0,0)"><div class="grow"><b>Сценарии клиентов</b><div class="ls">${SC.clients.length} разных клиентов: соберите портфель под их условия. Решено: ${ok} из ${SC.clients.length}.</div></div><span>›</span></button></div>`;
}
/* --- истории --- */
const WHO={cons:"Консервативному",biz:"Предпринимателю",risk:"Азартному"};
function stFilter(){const q=ar.sq.trim().toLowerCase();return ST.filter(s=>taken(s.n)&&(!ar.sf||s.g===ar.sf)&&(!ar.sw||(s.w||[]).includes(ar.sw))&&(!q||(s.t+" "+s.x).toLowerCase().includes(q)))}
function stList(l){if(!l.length)return `<div class="card empty"><p>${ST.some(s=>taken(s.n))?"Ничего не найдено.":"Пройди тест первого урока: его истории появятся здесь."}</p></div>`;
  return l.map(s=>ar.so===s.id?`<div class="card stack pop" style="gap:10px"><div class="eyebrow">${esc(s.k)} · урок ${s.n} · ${esc(BLOCKS[s.g]||"")}</div><h2 class="disp" style="margin:0">${esc(s.t)}</h2><div class="rd">${s.h}</div>
   <div class="ls">${(s.w||[]).map(w=>"Подойдёт: "+WHO[w]).join(" · ")}</div><div class="row" style="gap:8px"><button class="btn ghost" onclick="ar.so=null;render()">Свернуть</button>${(INDEX.available||[]).includes(s.n)?`<button class="btn ghost" onclick="openLesson(${s.n})">Урок ${s.n}</button>`:""}</div></div>`
   :`<button class="card row" style="text-align:left" onclick="ar.so='${s.id}';render()"><div class="grow"><b>${esc(s.t)}</b><div class="ls">${esc(s.k)} · урок ${s.n}</div></div><span>›</span></button>`).join("")}
function stKeep(){const el=$("#stlist");if(el)el.innerHTML=stList(stFilter())}
function vSt(){
  const open=ST.filter(s=>taken(s.n)),bl=[...new Set(open.map(s=>s.g))];
  return `<div class="stack"><div class="top"><h1 class="title">Истории</h1>${arBack}</div>
  <div class="ls">Открыто ${open.length} из ${ST.length}. Выбери историю, прочитай и перескажи клиенту своими словами.</div>
  <input placeholder="Найти историю…" value="${esc(ar.sq)}" oninput="ar.sq=this.value;stKeep()" style="${inpCss}">
  <div class="row" style="flex-wrap:wrap;gap:6px">${chip(!ar.sf,"Все темы","ar.sf=0;render()")}${bl.map(b=>chip(ar.sf===b,BLOCKS[b],`ar.sf='${b}';render()`)).join("")}</div>
  <div class="row" style="flex-wrap:wrap;gap:6px">${chip(!ar.sw,"Любому клиенту","ar.sw='';render()")}${Object.entries(WHO).map(([k,l])=>chip(ar.sw===k,l,`ar.sw='${k}';render()`)).join("")}</div>
  <div id="stlist" class="stack">${stList(stFilter())}</div></div>`}
/* --- калькулятор --- */
function rcFmt(f,v){if(!isFinite(v))return "—";if(f==="rub")return f1(Math.round(v))+" ₽";const d=f==="n0"?0:f==="n2"?2:1;return f1(v,d)}
function rcVals(r){const o={};r.in.forEach(i=>{const x=parseFloat(String((ar.rv[r.id]||{})[i.k]??i.def).replace(",","."));o[i.k]=isNaN(x)?0:x});return o}
function rcCalc(r){const v=rcVals(r),ks=Object.keys(v),vs=ks.map(k=>v[k]);
  const outs=r.out.map(o=>{try{return new Function(...ks,"return ("+o.e+")")(...vs)}catch(e){return NaN}});
  const txt=r.say.replace(/\{(o\d+|\w+)\}/g,(m,k)=>k[0]==="o"&&/^o\d+$/.test(k)?rcFmt(r.out[+k.slice(1)].f,outs[+k.slice(1)]):(k in v?f1(v[k],2):m));
  return {outs,txt}}
function rcShow(r){const {outs,txt}=rcCalc(r);return `<div class="stack" style="gap:8px">${r.out.map((o,i)=>`<div class="row" style="justify-content:space-between;gap:10px"><span class="ls">${esc(o.label)}</span><b class="num ${o.main?"disp":""}" style="${o.main?"font-size:24px":""}">${rcFmt(o.f,outs[i])}</b></div>`).join("")}</div>
  <div class="callout ok"><div class="eyebrow">Скажи клиенту</div><p class="p">«${esc(txt)}»</p></div>`}
function rcIn(id,k,val){ar.rv[id]=ar.rv[id]||{};ar.rv[id][k]=val;const r=RL.rules.find(x=>x.id===id),el=$("#rcout");if(el)el.innerHTML=rcShow(r)}
function rcCard(r){return `<div class="card stack pop" style="gap:12px"><div class="eyebrow">${esc(r.g)}</div><h2 class="disp" style="margin:0">${esc(r.name)}</h2><p class="p">${esc(r.short)}</p>
  <div class="formula" style="font-size:16px;line-height:1.4">${esc(r.formula)}</div>
  ${r.in.map(i=>`<div class="field"><label for="rc-${i.k}">${esc(i.label)}</label><input id="rc-${i.k}" type="text" inputmode="decimal" value="${esc(String((ar.rv[r.id]||{})[i.k]??i.def))}" oninput="rcIn('${r.id}','${i.k}',this.value)" style="font:600 18px var(--ui)"></div>`).join("")}
  <div id="rcout" class="stack" style="gap:12px">${rcShow(r)}</div>
  <div class="callout"><div class="eyebrow">Пример</div><p class="p">${esc(r.ex)}</p></div>
  <div class="callout warm"><div class="eyebrow">Где перестаёт работать</div><p class="p">${esc(r.lim)}</p></div>
  <div class="row" style="gap:8px"><button class="btn ghost" onclick="ar.ro=null;render()">Свернуть</button>${r.n&&(INDEX.available||[]).includes(r.n)?`<button class="btn ghost" onclick="openLesson(${r.n})">Урок ${r.n}</button>`:""}</div></div>`}
function rcList(){const q=ar.rq.trim().toLowerCase(),L=RL.rules.filter(r=>(!ar.rg||r.g===ar.rg)&&(!q||(r.name+" "+r.short+" "+r.formula).toLowerCase().includes(q)));
  if(!L.length)return `<div class="card empty"><p>Ничего не найдено.</p></div>`;
  return L.map(r=>ar.ro===r.id?rcCard(r):`<button class="card row" style="text-align:left" onclick="ar.ro='${r.id}';render();window.scrollTo(0,0)"><div class="grow"><b>${esc(r.name)}</b><div class="ls">${esc(r.short)}</div></div><span>›</span></button>`).join("")}
function rcKeep(){if(ar.ro)return;const el=$("#rclist");if(el)el.innerHTML=rcList()}
function vCalc(){
  const gs=[...new Set(RL.rules.map(r=>r.g))];
  const hk=RL.hacks.filter(h=>taken(h.n)||(INDEX.available||[]).includes(h.n));
  return `<div class="stack"><div class="top"><h1 class="title">Правила</h1>${arBack}</div>
  <div class="ls">Каждое правило: быстрая прикидка в уме, точный расчёт и фраза для клиента. Меняй числа — всё пересчитывается.</div>
  ${ar.ro?"":`<input placeholder="Найти правило…" value="${esc(ar.rq)}" oninput="ar.rq=this.value;rcKeep()" style="${inpCss}">
  <div class="row" style="flex-wrap:wrap;gap:6px">${chip(!ar.rg,"Все","ar.rg='';render()")}${gs.map(g=>chip(ar.rg===g,esc(g),`ar.rg='${g}';render()`)).join("")}</div>`}
  <div id="rclist" class="stack">${rcList()}</div>
  ${!ar.ro&&hk.length?`<details class="card"><summary><b>Правила из уроков (${hk.length})</b></summary><div class="stack" style="margin-top:12px">${hk.map(h=>`<div class="callout"><div class="eyebrow">Урок ${h.n}</div><p class="p"><b>${esc(h.name)}</b></p><p class="p">${esc(h.what)}</p>${h.formula?`<div class="formula">${esc(h.formula)}</div>`:""}${h.example?`<p class="p ls">Пример: ${esc(h.example)}</p>`:""}</div>`).join("")}</div></details>`:""}</div>`}
/* --- сценарии клиентов --- */
function scW(c){return ar.cw[c.id]||(ar.cw[c.id]=Object.fromEntries(SC.assets.map(a=>[a.id,0])))}
function scMet(w){let r=0,d=0;SC.assets.forEach(a=>{r+=w[a.id]*a.r/100;d-=w[a.id]*a.d/100});return {ret:r,dd:d}}
function scChecks(c,w){const l=c.lim,m=scMet(w),mx=Math.max(...Object.values(w)),out=[];
  const add=(ok,t)=>out.push({ok,t});
  if(l.ret!=null)add(m.ret>=l.ret-1e-9,`Доходность ≥ ${f1(l.ret)}% (у вас ${f1(m.ret,1)}%)`);
  if(l.dd!=null)add(m.dd<=l.dd+1e-9,`Стресс-потеря ≤ ${f1(l.dd)}% (у вас ${f1(m.dd,1)}%)`);
  const nm=Object.fromEntries(SC.assets.map(a=>[a.id,a.n]));
  if(l.cash_min)add(w.cash>=l.cash_min,`Ликвидность ≥ ${l.cash_min}% (у вас ${w.cash}%)`);
  if(l.ofz_min)add(w.ofz>=l.ofz_min,`ОФЗ ≥ ${l.ofz_min}% (у вас ${w.ofz}%)`);
  if(l.stk_min)add(w.stk>=l.stk_min,`Акции ≥ ${l.stk_min}% (у вас ${w.stk}%)`);
  if(l.stk_max!=null&&l.stk_max<100)add(w.stk<=l.stk_max,`Акции ≤ ${l.stk_max}% (у вас ${w.stk}%)`);
  if(l.corp_max!=null&&l.corp_max<100)add(w.corp<=l.corp_max,`Корп. облигации ≤ ${l.corp_max}% (у вас ${w.corp}%)`);
  if(l.gold_min)add(w.gold>=l.gold_min,`Золото ≥ ${l.gold_min}% (у вас ${w.gold}%)`);
  if(l.gold_max!=null&&l.gold_max<100)add(w.gold<=l.gold_max,`Золото ≤ ${l.gold_max}% (у вас ${w.gold}%)`);
  if(l.one_max!=null&&l.one_max<100)add(mx<=l.one_max,`Один класс ≤ ${l.one_max}% (максимум у вас ${mx}%)`);
  return out}
function scSet(id,a,d){const c=SC.clients.find(x=>x.id===id),w=scW(c),sum=Object.values(w).reduce((x,y)=>x+y,0);
  if(d>0&&sum>=100)return;if(d<0&&w[a]<=0)return;w[a]+=d*10;ar.cres=null;render()}
function scCheck(id){const c=SC.clients.find(x=>x.id===id),w=scW(c),ch=scChecks(c,w),ok=ch.every(x=>x.ok);
  S.scen=S.scen||{};const s=S.scen[id]=S.scen[id]||{done:0,tries:0};s.tries++;if(ok)s.done=1;save();ar.cres={id,ok,ch};render()}
function scReset(id){const c=SC.clients.find(x=>x.id===id);delete ar.cw[id];ar.cres=null;render()}
function scOpen(id){ar.co=id;ar.cres=null;render();window.scrollTo(0,0)}
function vSc(){
  if(ar.co){const c=SC.clients.find(x=>x.id===ar.co),w=scW(c),sum=Object.values(w).reduce((x,y)=>x+y,0),m=scMet(w),st=(S.scen||{})[c.id]||{},res=ar.cres&&ar.cres.id===c.id?ar.cres:null;
    return `<div class="stack"><div class="top"><h1 class="title">${esc(c.name)}, ${c.age}</h1><button class="btn ghost" style="min-height:36px" onclick="ar.co=null;ar.cres=null;render()">← Клиенты</button></div>
    <div class="card stack" style="gap:10px"><p class="p">${esc(c.fact)}</p><div class="callout warm"><p class="p">${esc(c.quote)}</p></div></div>
    <div class="card stack" style="gap:8px"><div class="eyebrow">Условия клиента</div>${c.asks.map(a=>`<div>• ${esc(a)}</div>`).join("")}<div class="ls">Общее правило советника: ни один класс не больше ${c.lim.one_max}%, золота не больше ${c.lim.gold_max}%, если не сказано иначе.</div></div>
    <div class="card stack" style="gap:10px"><div class="eyebrow">Портфель (шаг 10%)</div>
    ${SC.assets.map(a=>`<div class="row" style="gap:10px"><div class="grow"><b>${esc(a.n)}</b><div class="ls">${esc(a.s)}</div></div><button class="btn ghost" style="min-height:44px;min-width:44px;padding:0" aria-label="Меньше" onclick="scSet('${c.id}','${a.id}',-1)">−</button><b class="num" style="min-width:48px;text-align:center">${w[a.id]}%</b><button class="btn ghost" style="min-height:44px;min-width:44px;padding:0" aria-label="Больше" onclick="scSet('${c.id}','${a.id}',1)">+</button></div>`).join("")}
    <div class="row" style="justify-content:space-between"><span class="ls">Всего ${sum}% из 100%</span><span class="ls">Доходность ${f1(m.ret,1)}% · стресс −${f1(m.dd,1)}%</span></div></div>
    <div class="ls">Модель условная: доходности и стресс-потери — учебные допущения, не прогноз. ${SC.assets.map(a=>a.n+" "+a.r+"% / "+(a.d?"−"+(-a.d):"0")+"%").join("; ")}.</div>
    <div class="pair"><button class="btn ghost" onclick="scReset('${c.id}')">Сбросить</button><button class="btn" ${sum===100?"":"disabled"} onclick="scCheck('${c.id}')">Проверить</button></div>
    ${res?`<div class="card stack pop" style="gap:8px"><div class="eyebrow">${res.ok?"Все условия выполнены":"Не все условия выполнены"}</div>${res.ch.map(x=>`<div style="color:var(--${x.ok?"ok":"bad"})">${x.ok?"✓":"✗"} ${esc(x.t)}</div>`).join("")}</div>`:""}
    ${(res&&res.ok)||(st.tries>=3)?`<div class="callout"><div class="eyebrow">Разбор</div><p class="p">${esc(c.why)}</p></div><div class="callout ok"><div class="eyebrow">Скажи клиенту</div><p class="p">${esc(c.say)}</p></div>${c.ex?`<div class="callout warm"><div class="eyebrow">Один из верных портфелей</div><p class="p">${SC.assets.map(a=>esc(a.n)+" "+c.ex[a.id]+"%").join(" · ")}</p></div>`:""}`:""}</div>`}
  return `<div class="stack"><div class="top"><h1 class="title">Клиенты</h1>${arBack}</div><div class="ls">У каждого свои цели, страхи и ограничения. Соберите портфель, который им подходит.</div>
  ${SC.clients.map(c=>{const s=(S.scen||{})[c.id]||{};return `<button class="card row" style="text-align:left" onclick="scOpen('${c.id}')"><div class="grow"><b>${esc(c.name)}, ${c.age}</b><div class="ls">${esc(c.fact)}</div></div><span>${s.done?"✓":"›"}</span></button>`}).join("")}</div>`}
