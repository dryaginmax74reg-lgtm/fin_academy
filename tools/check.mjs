import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url),read=p=>fs.readFileSync(new URL(p,root),'utf8'),json=p=>JSON.parse(read(p));
let checks=0;function check(ok,msg){assert.ok(ok,msg);checks++}
const index=json('miniapp/daily/index.json');check(index.lessons.length===30,'30 daily lessons');
const supported=new Set(['choice','num','tf','pick','spot','match','order','sort','case','estimate']);
for(const l of index.lessons){const d=json(`miniapp/daily/${l.n}.json`);check(d.n===l.n&&d.steps.length>0&&d.quiz.length>=5,`lesson ${l.n}: material and full test`);for(const q of d.quiz){check(supported.has(q.k),`supported type ${q.k}`);if(q.k==='choice')check(q.ans>=0&&q.ans<q.opts.length,'choice key');if(q.k==='num')check(Number.isFinite(q.ans)&&q.tol>=0,'numeric key');}check(!JSON.stringify(d).includes(''),'no broken ChatGPT UI tokens')}
const cases=json('miniapp/daily/cases.json');check(cases.filter(c=>c.region==='РФ').length>=4,'Russian cases');check(cases.some(c=>c.region==='США'),'US cases retained');check(cases.every(c=>/^https:\/\//.test(c.url)&&c.limit&&c.question),'case attribution and retrieval question');
const script=read('miniapp/index.html').match(/<script>([\s\S]*)<\/script><\/body>/)[1];new vm.Script(script);check(!script.includes('__CATALOG__')&&!script.includes('__CASES__'),'built placeholders resolved');
const els=new Map(),get=id=>els.get(id)||{innerHTML:'',style:{},scrollTop:0,querySelector:()=>null};
const ctx=vm.createContext({console,Date,Math,JSON,Number,String,Object,Array,Set,Map,Promise,URL,Blob,setTimeout:()=>0,location:{hash:'#daily'},history:{replaceState(){}},localStorage:{getItem(){return null},setItem(){}},window:{scrollTo(){}},document:{querySelector:get,body:{style:{},appendChild(){}},createElement:()=>({style:{},remove(){}}),getElementById:id=>get(id)},fetch:async url=>({ok:true,json:async()=>json('miniapp/'+url)})});
// Declarations only; avoid async application boot during unit checks.
vm.runInContext(script.split('/* ===== BOOT ===== */')[0],ctx);
const run=s=>vm.runInContext(s,ctx);
check(run("dailyPeriod('week','2026-11-02')")==='2026-11-01','Monday exam cutoff');check(run("dailyPeriod('week','2026-11-01')")==='2026-11-01','Sunday cutoff');check(run("dailyPeriod('month','2026-11-02')")==='2026-10-31','month cutoff');check(run("dailyPeriod('month','2028-02-29')")==='2028-02-29','leap month');
run(`DAILY=${JSON.stringify(index)}; S.events=[['2026-10-31 12:00:00','Ежедневный',1,'x',5,5,1],['2026-11-02 12:00:00','Ежедневный',2,'x',5,5,1],['2026-10-31 12:00:00','Тест',3,'x',5,5,1]]`);
check(JSON.stringify(run("dailyEligible('2026-11-01')"))==='[1]','exams include actual daily completion by cutoff only');
run(`P={review:false};WS={};REG={};`);
check(!run(`wdraw({k:'choice',q:'q',opts:['a','b'],ans:1,why:'secret'},'c').html.includes('secret')`),'no answer before submission');
run(`WS.c.a=0`);check(run(`wscore({k:'choice',q:'q',opts:['a','b'],ans:1,why:'secret'},'c')`)===0,'wrong answer score');
run(`WS.c.a=1`);check(run(`wscore({k:'choice',q:'q',opts:['a','b'],ans:1,why:'secret'},'c')`)===1,'correct answer score');
check(!run(`T('<b onclick="alert(1)">x</b>')`).includes('<b onclick'),'markup attributes escaped');
run(`P={daily:{kind:'lesson'},n:1,q:{done:true}};S.dailyDrafts={};saveDailyDraft()`);check(run('Object.keys(S.dailyDrafts).length')===0,'completed lesson does not become draft');
for(const n of index.lessons.map(l=>l.n)){await run(`dailyLesson(${n})`)}
for(const n of index.lessons.map(l=>l.n)){
  await run(`openDaily(${n})`);
  run(`for(let i=0;i<P.D.steps.length-1;i++){P.i=i;drawPlayer()}`);
  check(true,`daily lesson ${n}: all material and first test question render`);
}
await run(`openDailyExam('week','2026-11-01')`);check(run('P.D.quiz.length')===2,'weekly two questions for completed topic');check(run('P.D.quiz.every(q=>q.from===1&&!q.hint)'),'exam source and no hints');
check(run('validProgress({events:[],cards:{}})'),'empty backup accepted');check(!run('validProgress({events:[[1]],cards:{}})'),'bad backup rejected');
console.log(`FINLAB checks passed: ${checks}`);
