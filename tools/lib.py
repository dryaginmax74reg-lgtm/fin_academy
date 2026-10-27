"""Хелперы для написания уроков на Python. Урок = tools/lessons/Lxx.py с переменной LESSON."""
def P(*paras): return ''.join(f'<p>{p}</p>' for p in paras)
def H(t): return f'<h2 class="rh">{t}</h2>'
def UL(*items): return '<ul>'+''.join(f'<li>{i}</li>' for i in items)+'</ul>'
def FORMULA(t): return f'<div class="formula">{t}</div>'
def TABLE(head,rows,hl=None):
    h=''.join(f'<th>{c}</th>' for c in head)
    b=''.join('<tr>'+''.join(f'<td{" class=\"hl\"" if hl==(i,j) else ""}>{c}</td>' for j,c in enumerate(r))+'</tr>' for i,r in enumerate(rows))
    return f'<div class="tblw"><table class="tbl"><thead><tr>{h}</tr></thead><tbody>{b}</tbody></table></div>'
def CASE(tag,*paras): return '<div class="callout warm"><div class="eyebrow">'+tag+'</div>'+''.join(f'<p class="p" style="font-size:17px;margin-bottom:8px">{p}</p>' for p in paras)+'</div>'
def NOTE(tag,text,kind=''): return f'<div class="callout {kind}"><div class="eyebrow">{tag}</div><p class="p" style="font-size:17px">{text}</p></div>'
def read(title,minutes,*blocks): return {"t":"read","min":minutes,"title":title,"html":''.join(blocks)}

# ---------- элементы заданий (одинаковы для шагов-игр, теста урока и тестов недели) ----------
def num(q,ans,tol,unit,why,hint=None):
    d={"k":"num","q":q,"ans":ans,"tol":tol,"unit":unit,"why":why}
    if hint: d["hint"]=hint
    return d
def choice(q,opts,ans,why): return {"k":"choice","q":q,"opts":opts,"ans":ans,"why":why}
def tf(q,*stmts): return {"k":"tf","q":q,"stmts":[{"t":t,"v":v,"why":w} for t,v,w in stmts]}
def pick(q,opts,why="",spot=False): return {"k":"spot" if spot else "pick","q":q,"opts":[{"t":t,"ok":ok,"why":w} for t,ok,w in opts],"why":why}
def spot(q,opts,why=""): return pick(q,opts,why,True)
def match(q,pairs,why=""): return {"k":"match","q":q,"pairs":[list(p) for p in pairs],"why":why}
def order(q,items,why="",top="Первое",bottom="последнее"): return {"k":"order","q":q,"items":items,"why":why,"top":top,"bottom":bottom}
def sort(q,bins,items,why=""): return {"k":"sort","q":q,"bins":bins,"items":[{"t":t,"b":b,"why":w} for t,b,w in items],"why":why}
def case(q,scen,opts,why=""): return {"k":"case","q":q,"scen":scen,"opts":[{"t":t,"s":s,"fb":fb} for t,s,fb in opts],"why":why}
def est(q,lo,hi,truth,tol,unit="",why="",log=False,dec=0,step=None):
    d={"k":"estimate","q":q,"min":lo,"max":hi,"truth":truth,"tol":tol,"unit":unit,"why":why,"log":log,"dec":dec}
    if step: d["step"]=step
    return d
# ---------- шаги урока ----------
def play(title,intro,items,outro=None,kicker="Задание"):
    d={"t":"play","kicker":kicker,"title":title,"intro":intro,"items":items}
    if outro: d["outro"]=outro
    return d
def hack(name,what,formula=None,how=None,example=None,limit=None):
    d={"t":"hack","name":name,"what":what}
    for k,v in (("formula",formula),("how",how),("example",example),("limit",limit)):
        if v: d[k]=v
    return d
def story(title,intro,vars_,nodes,outro=None,start="a",kicker="Игра"):
    """vars_: {id:(label,start,unit)}; nodes: {id:{text,ch:[(label,to,fb,delta_dict,tone)]} | {end:True,title,text,tone}}"""
    vs={k:{"label":l,"v":v,"unit":u} for k,(l,v,u) in vars_.items()}
    nn={}
    for k,n in nodes.items():
        if n.get("end"): nn[k]=n
        else: nn[k]={"text":n["text"],"ch":[dict(zip(("t","to","fb","d","tone"),c)) for c in n["ch"]]}
        if not nn[k].get("end"):
            for c in nn[k]["ch"]:
                for kk in [x for x,v in c.items() if v is None]: del c[kk]
    d={"t":"story","kicker":kicker,"title":title,"intro":intro,"vars":vs,"nodes":nn,"start":start}
    if outro: d["outro"]=outro
    return d
def predict(title,lead,q,opts,correct,reveal,after=None,after_title="А в жизни",kicker="История"):
    d={"t":"predict","kicker":kicker,"title":title,"lead":lead,"q":q,"opts":opts,"correct":correct,"reveal":reveal}
    if after: d["after"]=after;d["afterTitle"]=after_title
    return d
def tip(fact,fact2,question,why): return {"t":"tip","fact":fact,"fact2":fact2,"question":question,"why":why}
def wrap(can,links): return {"t":"wrap","can":can,"links":links}
def link(title,sub,url): return {"title":title,"sub":sub,"url":url}
def book(title,kind="Книга"): return {"kind":kind,"title":title}
def watch(title): return {"kind":"YouTube · найди","title":title}
def client(title,html): return {"t":"client","title":title,"html":html}
def lesson(n,pred,body,cl,quiz,review,tp,wr,cards,minutes=(13,6,15)):
    k=(n*3)%len(quiz) if len(quiz)>1 else 0
    quiz=quiz[k:]+quiz[:k]  # разный порядок типов заданий от урока к уроку
    steps=[pred]+body+[cl,{"t":"quiz"},tp,wr]
    return {"n":n,"minutes":{"read":minutes[0],"practice":minutes[1],"test":minutes[2]},"steps":steps,"quiz":quiz,"review":review,
            "cards":[{"id":f"{n}-{chr(97+i)}","q":q,"a":a} for i,(q,a) in enumerate(cards)]}
from urllib.parse import quote as _q
def wiki(title,query): return {"title":title,"sub":"Статья · Википедия","url":"https://ru.wikipedia.org/w/index.php?search="+_q(query)}
def yt(title,query): return {"title":title,"sub":"Видео · YouTube, поиск по запросу","url":"https://www.youtube.com/results?search_query="+_q(query)}

# ---------- словарь профи ----------
def term(name, eng, plain, pro, say, trap=""):
    """name — термин по-русски (как говорят профи); eng — оригинал/аббревиатура ('' если нет);
    plain — простыми словами с образом/аналогией (2–3 предложения);
    pro — строгое определение (1–2 предложения, с формулой если есть);
    say — фраза клиенту (до 25 слов, живой язык);
    trap — частая путаница/ошибка (1 предложение, можно пусто)."""
    return {"t":name,"e":eng,"p":plain,"d":pro,"s":say,"x":trap}
