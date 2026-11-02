"""Compile the remaining daily programme from existing FINLAB material without renumbering the main course."""
import json,pathlib,runpy,sys,datetime,copy
R=pathlib.Path(__file__).resolve().parents[1];sys.path.insert(0,str(R/'tools'))
mapping=[
(13,9,'Кривая доходности и ожидания ставок'),
(14,39,'ФРС, ЕЦБ и Банк России: как политика влияет на капитал'),
(15,6,'Российский рынок: биржа, брокер и инфраструктура'),
(16,16,'Индексы Мосбиржи и РТС: что именно растёт'),
(17,17,'P/E, P/B и EV/EBITDA: как сравнивать компании'),
(18,18,'Дивиденды и дивидендный гэп'),
(19,10,'Кредитный риск и портфель облигаций'),
(20,26,'Финансовая отчётность: прибыль, баланс и деньги'),
(21,27,'EBITDA и свободный денежный поток: качество прибыли'),
(22,30,'Оценка российской компании: полный кейс'),
(23,33,'Распределение активов под цели семьи'),
(24,32,'Марковиц и CAPM: модели и их ограничения'),
(25,34,'Просадка, VaR, стресс-тест и ликвидность'),
(26,35,'Инвестиционная политика: полный кейс клиента'),
(27,25,'Российский рынок: нефть, курс, ставки и шоки'),
(28,37,'Государственный долг, бюджет и устойчивость'),
(29,41,'Пузыри и поведение: как не купить красивую историю')]
idx=json.load(open(R/'miniapp/daily/index.json'));idx['lessons']=[l for l in idx['lessons'] if l['n']<=12]
for n,base,title in mapping:
    p=R/f'miniapp/lessons/{base}.json'
    d=json.load(open(p)) if p.exists() else runpy.run_path(str(R/f'tools/lessons/L{base:02}.py'))['LESSON']
    obj=copy.deepcopy(d);obj.update(n=n,title=title,date=(datetime.date(2026,10,21)+datetime.timedelta(days=n-1)).isoformat(),provenance=f'Составлено из существующего материала FINLAB, основной урок {base}. Номер ежедневного занятия отличается от номера основного курса.')
    obj['steps']=[s for s in d['steps'] if s['t'] not in ('quiz','tip','wrap')]
    json.dump(obj,open(R/f'miniapp/daily/{n}.json','w'),ensure_ascii=False,indent=2)
    idx['lessons'].append({k:obj[k] for k in ('n','title','date','provenance')})
title='Итоговая аттестация: капитал семьи и карта рисков'
quiz=[]
for n in range(1,30):
    d=json.load(open(R/f'miniapp/daily/{n}.json'))
    pool=[q for q in d['quiz'] if q['k']!='open'];q=copy.deepcopy(pool[(n-1)%len(pool)]);q['from']=n;q.pop('hint',None);quiz.append(q)
obj=dict(n=30,title=title,date='2026-11-19',provenance='Итоговая работа по всем 29 занятиям FINLAB. Один вопрос на каждую тему; результаты прошлых занятий автоматически не засчитываются.',steps=[dict(t='read',title='Перед встречей с семьёй',min=3,html='<p class="p">Семья предпринимателя готовится продать часть бизнеса. Есть рублёвые облигации, акции российских компаний, недвижимость, зарубежные расходы и обязательства перед наследниками. Начни с полной карты активов и обязательств, отдели резерв доступных денег, проверь кредитный, процентный и валютный риски.</p><p class="p">Не выбирай инструмент по одному показателю доходности. Сопоставь срок, валюту и доступность денег с целями семьи; проверь налоги, комиссии и ограничения. Для бизнеса разделяй прибыль и денежный поток. Для портфеля — число строк и независимость факторов риска.</p><p class="p">Дальше — 29 заданий по всем темам. Ответы и объяснения появляются после решения. В конце получишь список тем для повторения. Этот итоговый тест доступен сразу; недельный и месячный экзамены отдельно учитывают только фактически пройденные занятия.</p>')],quiz=quiz)
json.dump(obj,open(R/'miniapp/daily/30.json','w'),ensure_ascii=False,indent=2);idx['lessons'].append({k:obj[k] for k in ('n','title','date','provenance')});idx['planned']=30
json.dump(idx,open(R/'miniapp/daily/index.json','w'),ensure_ascii=False,indent=2)
print('Daily curriculum:',len(idx['lessons']),'lessons')
