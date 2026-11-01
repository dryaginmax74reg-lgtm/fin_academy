const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const ctx=vm.createContext({S:{events:[]},todayMsk:()=> '2026-11-01'});
vm.runInContext(fs.readFileSync('src/exams.js','utf8'),ctx);
const evaluate=s=>JSON.parse(JSON.stringify(vm.runInContext(s,ctx)));
test('quarter replaces month on all four boundaries',()=>{
 for(const m of ['01','04','07','10'])assert.equal(evaluate(`examPeriod('2027-${m}-01')`).kind,'Квартальный');
 assert.equal(evaluate("examPeriod('2026-11-30')").cutoff,'2026-11-01');
 assert.equal(evaluate("examPeriod('2026-11-01')").kind,'Ежемесячный');
});
test('only successful dated journal tests strictly before cutoff, unique lessons',()=>{
 ctx.S.events=[['2026-10-31 23:59:59','Тест',1,'',7,10],['2026-10-30 12:00:00','Тест',1,'',10,10],['2026-11-01 00:00:00','Тест',2,'',10,10],['2026-10-30 12:00:00','Тест',3,'',6,10],['2026-10-30 12:00:00','Недельный',4,'',10,10],['bad','Тест',5,'',10,10]];
 assert.deepEqual(evaluate("examLessons('2026-11-01')"),[1]);
});
test('all 40 published lessons have existing assessable questions',()=>{
 for(let n=1;n<=40;n++){
 ctx.lesson=JSON.parse(fs.readFileSync(`miniapp/lessons/${n}.json`));
 assert.ok(evaluate(`examQuestions(lesson,${n})`).length>=2,`lesson ${n}`);
 }
});
test('grading accepts numeric tolerance and option zero',()=>{
 ctx.attempt={questions:[{ans:0,opts:['a','b']},{ans:10,tol:.1},{ans:3,tol:0}],answers:{0:0,1:10.05}};
 assert.deepEqual(evaluate('examGrade(attempt)'),[1,1,0]);
});
test('submitted snapshot survives later draft events',()=>{
 const a={id:'2026-11',questions:[{ans:1}],answers:{},submitted:'2026-11-01'};
 ctx.S.events=[['','Экзамен:сдан','',JSON.stringify(a)],['','Экзамен:ответы','',JSON.stringify({...a,submitted:null})]];
 assert.equal(evaluate('examRecords()')['2026-11'].submitted,a.submitted);
});
