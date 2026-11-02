"""One-off import of the available ChatGPT lessons; source is outside the repository."""
import json, re, html, pathlib, sys, datetime
R = pathlib.Path(__file__).resolve().parents[1]
out = R / 'miniapp/daily'
out.mkdir(exist_ok=True)
sources = json.load(open(sys.argv[1]))
def inline(s):
    s = html.escape(s)
    s = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', s)
    return re.sub(r'\[([^\]]+)\]\((https?://[^ )]+)\)', r'<a href="\2" target="_blank" rel="noopener">\1</a>', s)
def render(text):
    text = re.sub(r'genui.*?', '', text, flags=re.S)
    text = re.sub(r'url([^]+)([^]+)', r'[\1](\2)', text)
    text = re.sub(r'(?:cite|[^]+).*?', '', text)
    text = text.replace('\\:', ':').replace('\\.', '.').replace('\\+', '+')
    text = re.sub(r'\\\[(.*?)\\\]', lambda m: '<mathblock>'+m[1].strip()+'</mathblock>', text, flags=re.S)
    chunks=[]; paragraph=[]; table=[]
    def flush():
        if paragraph: chunks.append('<p class="p">'+inline(' '.join(paragraph))+'</p>'); paragraph.clear()
        if table:
            chunks.append('<div class="daily-table"><table>'+''.join('<tr>'+''.join('<td>'+inline(c.strip())+'</td>' for c in row.strip('|').split('|'))+'</tr>' for row in table if not re.match(r'^\|[ :|\-]+\|$',row))+'</table></div>');table.clear()
    # Protect display math from paragraph splitting.
    blocks=[]
    def mathblock(m):
        blocks.append(m[1]);return '\nMATHBLOCK'+str(len(blocks)-1)+'\n'
    text=re.sub(r'<mathblock>(.*?)</mathblock>',mathblock,text,flags=re.S)
    for line in text.splitlines():
        s=line.strip()
        if not s: flush();continue
        if s.startswith('MATHBLOCK'):
            flush(); m=blocks[int(s[9:])]; chunks.append('<div class="formula">\\['+html.escape(m)+'\\]</div>');continue
        if s.startswith('|'): flush() if paragraph else None;table.append(s);continue
        flush() if table else None
        if s.startswith('#'):
            flush();chunks.append('<h2 class="daily-heading">'+inline(s.lstrip('# '))+'</h2>')
        elif s.startswith(('- ', '* ')) or re.match(r'^\d+\. ',s):
            flush();chunks.append('<p class="p daily-item">'+inline(s)+'</p>')
        elif s=='---': flush()
        else: paragraph.append(s)
    flush();return '\n'.join(chunks)
mapping=[(1,4,'Инфляция и реальная доходность'),(2,1,'Временная стоимость денег и дисконтирование'),(3,7,'Облигации: цена и доходность'),(4,8,'Дюрация и процентный риск'),(5,29,'Оценка акций и бизнеса'),(6,28,'Корпоративные финансы и стоимость капитала')]
index=[]
for n,base,title in mapping:
    d=json.load(open(R/f'miniapp/lessons/{base}.json'))
    reads=[s for s in d['steps'] if s['t'] in ('read','hack','client')]
    wrap=next(s for s in d['steps'] if s['t']=='wrap')
    obj={'n':n,'title':title,'date':(datetime.date(2026,10,21)+datetime.timedelta(days=n-1)).isoformat(),'provenance':f'Восстановлено по материалам FINLAB, урок {base}. Исходный текст занятия из чата недоступен; для №3–4 порядок тем восстановлен по программе, точное соответствие не подтверждено.','steps':reads,'quiz':d['quiz'],'links':wrap.get('links',[])}
    json.dump(obj,open(out/f'{n}.json','w'),ensure_ascii=False,indent=2)
    index.append({k:obj[k] for k in ('n','title','date','provenance')})
for msg in sources:
    text=msg['text'];n=int(re.search(r'занятие № (\d+)',text)[1])
    if n<7: continue
    title=re.search(r'^## (.+)$',text,re.M)[1]
    # The original embedded test was an unavailable interactive widget. Import theory and journal;
    # replace its empty placeholder with real, graded questions in daily_questions.json.
    theory=re.split(r'(?:#|\*\*)+(?:\s*)Часть II|\n## (?:Часть II|Мини-тест)|\n# Мини-тест',text)[0]
    theory=re.split(r'\n#{1,3} .*?(?:Мини-тест|мини-тест|Тест №)',theory)[0]
    # Keep no instructions asking the learner to reply in chat.
    theory=theory.split('## Журнал прогресса')[0]
    sections=re.split(r'(?=^## \d)',theory,flags=re.M)
    reads=[{'t':'read','title':title if i==0 else re.search(r'^## (.+)',sec)[1].replace('\\.','.'),'min':max(1,round(len(sec.split())/160)),'html':render(sec)} for i,sec in enumerate(sections) if sec.strip()]
    obj={'n':n,'title':title,'date':(datetime.date(2026,10,21)+datetime.timedelta(days=n-1)).isoformat(),'provenance':'Перенесено из чата «Ежедневная учёба», занятие №'+str(n)+'. Числовые данные и нормы относятся к дате материала.','steps':reads,'quiz':[],'links':[]}
    json.dump(obj,open(out/f'{n}.json','w'),ensure_ascii=False,indent=2)
    index.append({k:obj[k] for k in ('n','title','date','provenance')})
json.dump({'title':'Ежедневная учёба','planned':30,'lessons':sorted(index,key=lambda x:x['n'])},open(out/'index.json','w'),ensure_ascii=False,indent=2)
