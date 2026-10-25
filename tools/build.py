#!/usr/bin/env python3
"""Собирает miniapp/index.html из src/ и обновляет miniapp/lessons/index.json."""
import json,glob,os,re
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
cat=open(f'{R}/src/catalog.json').read()
css=open(f'{R}/src/style.css').read()
js=open(f'{R}/src/app.js').read().replace('__CATALOG__',cat)
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
print('built, lessons:',av)
