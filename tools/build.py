#!/usr/bin/env python3
"""Собирает miniapp/index.html из src/ и обновляет miniapp/lessons/index.json."""
import json,glob,os,re
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
cat=open(f'{R}/src/catalog.json').read()
css=open(f'{R}/src/style.css').read()
js=open(f'{R}/src/app.js').read().replace('__CATALOG__',cat).replace('/*__WIDGETS__*/',open(f'{R}/src/widgets.js').read()).replace('/*__PLAYER__*/',open(f'{R}/src/player.js').read()).replace('/*__ARSENAL__*/',open(f'{R}/src/arsenal.js').read())
html=f'''<!doctype html>
<html lang="ru"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#2D3CFF">
<meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Знания">
<link rel="apple-touch-icon" href="icon-180.png"><link rel="icon" href="icon-192.png"><link rel="manifest" href="manifest.json">
<title>FinLab Academy</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Unbounded:wght@500;700;800&display=swap">
<style>{css}</style></head><body>
<div class="shell"><nav class="rail" id="rail" aria-label="Разделы"></nav><main class="main" id="view"></main></div>
<nav class="tabbar" id="tabbar" aria-label="Разделы"></nav><div id="layer"></div>
<script>{js}</script></body></html>'''
open(f'{R}/miniapp/index.html','w').write(html)
av=[];cards={}
for f in glob.glob(f'{R}/miniapp/lessons/[0-9]*.json'):
    d=json.load(open(f));av.append(d['n']);cards[str(d['n'])]=d.get('cards',[])
av.sort()
json.dump({"available":av,"cards":cards},open(f'{R}/miniapp/lessons/index.json','w'),ensure_ascii=False)
import importlib.util
gl=[];seen=set()
for f in sorted(glob.glob(f'{R}/tools/terms/T_*.py')):
    sp=importlib.util.spec_from_file_location(os.path.basename(f)[:-3],f);m=importlib.util.module_from_spec(sp)
    try: sp.loader.exec_module(m)
    except Exception as e: print('TERMS ERROR',f,e);continue
    for n,items in sorted(m.TERMS.items()):
        for it in items:
            k=it['t'].strip().lower()
            if k in seen: continue
            seen.add(k);gl.append({"id":f"{n}|{it['t']}","n":n,**it})
gl.sort(key=lambda x:(x['n'],x['t']))
json.dump(gl,open(f'{R}/miniapp/glossary.json','w'),ensure_ascii=False)
# --- истории, правила из уроков, сценарии ---
import html as _h
sys_path=os.path.join(R,'tools');import sys;sys.path.insert(0,sys_path)
import rules as _r,scenarios as _s
BL={c[0]:c[1] for c in json.loads(cat)}
WHO={"cons":r"вклад|пенсион|облигац|дефолт|депозит|надёжн|инфляц|консерват","biz":r"бизнес|компани|долг|кредит|владел|продаж|выручк|EBITDA|грузовик|предприним","risk":r"IPO|пузыр|плеч|спекул|акци|крипт|азарт|быстр|ставк[аи] на|рекорд"}
st=[];hk=[]
for f in sorted(glob.glob(f'{R}/miniapp/lessons/[0-9]*.json'),key=lambda x:int(os.path.basename(x)[:-5])):
    d=json.load(open(f));n=d['n'];i=0
    for s in d['steps']:
        if s['t']=='hack': hk.append({"n":n,**{k:v for k,v in s.items() if k in('name','what','formula','example')}})
        if s['t']!='read': continue
        for m in re.finditer(r'<div class="callout warm"><div class="eyebrow">(.*?)</div>(.*?)</div>',s['html'],re.S):
            eb=re.sub('<[^>]+>','',m.group(1)).strip()
            mk=re.match(r'^(Кейс|Факт|История|Для щегольства)[^:·]*\s*[:·]\s*(.+)$',eb)
            if not mk: continue
            kind=mk.group(1);title=mk.group(2).strip();title=title[:1].upper()+title[1:]
            body=m.group(2).replace(' class="p" style="font-size:17px;margin-bottom:8px"','')
            txt=re.sub('<[^>]+>',' ',body);i+=1
            w=[k for k,rx in WHO.items() if re.search(rx,title+' '+txt,re.I)]
            st.append({"id":f"{n}-{i}","n":n,"g":BL.get(n,'0'),"k":kind,"t":title,"h":body,"x":txt,"w":w})
json.dump(st,open(f'{R}/miniapp/stories.json','w'),ensure_ascii=False)
json.dump({"rules":_r.RULES,"hacks":hk},open(f'{R}/miniapp/rules.json','w'),ensure_ascii=False)
cl=[]
for c in _s.SCEN:
    sol=_s.solutions(c['lim']);assert sol,c['id']
    best=max(sol,key=lambda w:-_s.metrics(w)[1]+0.01*_s.metrics(w)[0])
    cl.append({**c,"ex":best})
json.dump({"assets":[{"id":a[0],"n":a[1],"s":a[2],"r":a[3],"d":a[4]} for a in _s.ASSETS],"clients":cl},open(f'{R}/miniapp/scenarios.json','w'),ensure_ascii=False)
print('built, lessons:',av,'terms:',len(gl),'stories:',len(st),'rules:',len(_r.RULES),'scen:',len(cl))
