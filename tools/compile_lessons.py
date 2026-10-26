#!/usr/bin/env python3
import glob,json,os,runpy,sys
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0,os.path.join(R,'tools'))
for f in sorted(glob.glob(f'{R}/tools/lessons/L*.py')):
    L=runpy.run_path(f)['LESSON']
    words=sum(len(__import__('re').sub('<[^>]+>',' ',s['html']).split()) for s in L['steps'] if s['t']=='read')
    json.dump(L,open(f'{R}/miniapp/lessons/{L["n"]}.json','w'),ensure_ascii=False,indent=1)
    kinds=[q['k'] for q in L['quiz']]
    plays=[ (s['t'], [i['k'] for i in s['items']] if s['t']=='play' else '') for s in L['steps'] if s['t'] in ('play','story','hack')]
    assert 'open' not in kinds
    assert len(L['review'])>=4,'review<4'
    print(L['n'],'слов:',words,'квиз:',kinds,'игры:',plays,'карт:',len(L['cards']))
