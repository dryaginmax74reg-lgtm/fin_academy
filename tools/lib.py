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
def num(q,ans,tol,unit,why): return {"k":"num","q":q,"ans":ans,"tol":tol,"unit":unit,"why":why}
def choice(q,opts,ans,why): return {"k":"choice","q":q,"opts":opts,"ans":ans,"why":why}
def open_(q,model,crit): return {"k":"open","q":q,"model":model,"crit":crit}
def calc(title,intro,inputs,outs,verdict=None,kicker="Поиграй"):
    return {"t":"calc","kicker":kicker,"title":title,"intro":intro,"inputs":inputs,"outs":outs,"verdict":verdict}
def inp(id,label,min,max,step,val,unit="",dec=2): return {"id":id,"label":label,"min":min,"max":max,"step":step,"val":val,"unit":unit,"dec":dec}
def out(label,expr,unit="",dec=2): return {"label":label,"expr":expr,"unit":unit,"dec":dec}
def lesson(n,predict,reads,calc_step,client,quiz,tip,wrap,cards,calc_after=1,minutes=(12,5,15)):
    steps=[predict]+reads[:calc_after]+[calc_step]+reads[calc_after:]
    steps+=[{"t":"client","title":client[0],"html":client[1]},{"t":"quiz"},tip,wrap]
    return {"n":n,"minutes":{"read":minutes[0],"practice":minutes[1],"test":minutes[2]},"steps":steps,"quiz":quiz,"cards":[{"id":f"{n}-{chr(97+i)}","q":q,"a":a} for i,(q,a) in enumerate(cards)]}
def predict(title,lead,q,opts,correct,reveal,after=None,after_title="А в жизни",kicker="История"):
    d={"t":"predict","kicker":kicker,"title":title,"lead":lead,"q":q,"opts":opts,"correct":correct,"reveal":reveal}
    if after: d["after"]=after;d["afterTitle"]=after_title
    return d
def tip(fact,fact2,question,why): return {"t":"tip","fact":fact,"fact2":fact2,"question":question,"why":why}
def wrap(can,links): return {"t":"wrap","can":can,"links":links}
def link(title,sub,url): return {"title":title,"sub":sub,"url":url}
def book(title,kind="Книга"): return {"kind":kind,"title":title}
