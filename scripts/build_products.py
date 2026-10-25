#!/usr/bin/env python3
"""atistirmaliklar_etiket_bilgisi.csv + gorseller -> src/data/products.json + public/img/p/*.webp
Kullanım: python3 scripts/build_products.py <csv> <gorseller_klasoru> [--review-out rapor.csv]
Etiket verisi YALNIZCA ürün adı ile Migros adı güvenilir eşleştiğinde 'verified' olur."""
import csv,re,os,sys,json,unicodedata
from PIL import Image
csv_path,img_dir=sys.argv[1],sys.argv[2]
review_out=sys.argv[sys.argv.index('--review-out')+1] if '--review-out' in sys.argv else None
OUT='src/data/products.json';IMG_OUT='public/img/p'
def norm(s):
    s=s.lower().replace('ı','i').replace('İ','i').replace('ğ','g').replace('ü','u').replace('ş','s').replace('ö','o').replace('ç','c').replace('â','a')
    s=unicodedata.normalize('NFKD',s);return ''.join(c for c in s if not unicodedata.combining(c))
def slug(s):return re.sub(r'[^a-z0-9]+','-',norm(s)).strip('-')
def toks(s):return set(t for t in re.sub(r'[^a-z0-9 ]+',' ',norm(s)).split() if t and not t.isdigit() and t not in {'g','gr','ml','x'})
def grams(s):return [x.replace(',','.') for x in re.findall(r'(\d+(?:[.,]\d+)?)\s*(?:g|gr|ml)\b',norm(s))]
def ean_ok(e):
    if not re.fullmatch(r'\d{13}',e or ''):return False
    s=sum(int(c)*(3 if i%2 else 1) for i,c in enumerate(e[:12]));return (10-s%10)%10==int(e[12])
# İsim farkı yalnızca adlandırma olan, elle gözden geçirilmiş eşleşmeler (ürün adı + gramaj)
ALLOW={("Lay's Klasik Sade Patates Cipsi Mega Boy","193 g"),("Lay's Klasik Sade Patates Cipsi Parti Boy","150 g"),("Lay's Klasik Sade Patates Cipsi Süper Boy","107 g"),
("Doritos Nacho Peynirli Mısır Cipsi Parti Boy","169 g"),("Doritos Nacho Peynirli Mısır Cipsi Süper Boy","113 g"),("Pringles Ekşi Krema & Soğan","40 g"),("Pringles Ekşi Krema & Soğan","165 g"),
("Eti Browni Classic","40 g"),("Eti Browni Intense Fındıklı & Çikolatalı Kek","48 g"),("Snickers Çubuk Dondurma","91 ml"),("Snickers Dondurma","53 ml"),("Snickers White Dondurma","45 ml"),("Twix Dondurma","50 ml"),
("Ülker Dankek Pöti Muffin Kek Meyveli","35 g"),("Ülker Dankek Pöti Muffin Kek Havuçlu Tarçınlı","35 g"),("Ülker Metro Big 3","45 g"),("Ülker Yupo Yumuşak Şekerleme Eğlenjeli Kış","80 g"),
("Burn Enerji İçeceği Original","250 ml"),("Burn Enerji İçeceği Original","500 ml"),("Eti Canga Cookie Karamel","45 g"),("Ferrero Rocher Fındıklı Çikolata","200 g"),("Ülker Halley Mini Granüllü","66 g"),
("Ülker Dankek 8 Kek Muzlu","55 g"),("Ülker Biskrem Ekstra Kakao Kremalı","184 g"),("Eti Puf Pufi Karamelli & Vanilyalı","42 g"),("Eti Browni Gold Mini Çikolatalı Kek","180 g"),("Ülker Dankek 8 Kek Çikolatalı","55 g"),
("Ülker Fındıklı ve Üzümlü Kare Çikolata","65 g")}
rows=list(csv.DictReader(open(csv_path,encoding='utf-8-sig')))
imgs={f[:-5]:f for f in os.listdir(img_dir) if f.lower().endswith('.jpeg')}
def num(v):
    v=(v or '').strip().replace(',','.')
    try:return float(v)
    except:return None
out=[];review=[];used=set();os.makedirs(IMG_OUT,exist_ok=True)
for i,x in enumerate(rows):
    name=x['Ürün Adı (CSV)'].strip();size=x['Gramaj'].strip();mg=x['Migros Adı'].strip();ean=x['Barkod'].strip()
    found=x["Migros'ta Bulundu"].strip()=='evet'
    ing=x['İçindekiler'].strip();al=x['Alerjen Beyanı'].strip()
    a,b=toks(name),toks(mg);cont=len(a&b)/max(1,len(a));ga,gb=grams(size),grams(mg)
    gram_ok=(not ga) or (not gb) or ga[0] in gb or (abs(float(ga[0])-float(gb[0]))<=0.6 if ga and gb else False)
    has=bool(found and ing)
    if not has:status='no_label'
    elif (name,size) in ALLOW:status='verified'
    elif cont>=0.8 and gram_ok:status='verified'
    else:status='needs_review'
    pid=ean if ean_ok(ean) else f'p{i+1:03d}'
    rec={'id':pid,'ean':ean if re.fullmatch(r'\d{13}',ean) else None,'eanValid':ean_ok(ean),'name':name,'size':size or None,'matchStatus':status,'image':None,'label':None}
    if status=='verified':
        rec['label']={'ingredients':ing,'allergenStatement':al or None,'nutrition':{k:num(x[c]) for k,c in [('kcal','Enerji (kcal/100g)'),('kj','Enerji (kJ/100g)'),('fat','Yağ (g/100g)'),('satFat','Doymuş Yağ (g/100g)'),('transFat','Trans Yağ (g/100g)'),('carb','Karbonhidrat (g/100g)'),('sugar','Şeker (g/100g)'),('fiber','Lif (g/100g)'),('protein','Protein (g/100g)'),('salt','Tuz (g/100g)')]},'source':'Migros web sitesi (derleme)','sourceName':mg}
        for c in [slug(name+' '+size),slug(name),slug(mg),slug(mg+' '+size)]:
            if c in imgs and c not in used:
                used.add(c);im=Image.open(os.path.join(img_dir,imgs[c])).convert('RGB');im.thumbnail((360,360));im.save(f'{IMG_OUT}/{pid}.webp','WEBP',quality=78);rec['image']=f'img/p/{pid}.webp';break
    if status in('needs_review',) or (has and status!='verified') or not rec['eanValid']:
        review.append({'ürün':name,'gramaj':size,'barkod':ean,'migros_adı':mg,'durum':status,'barkod_geçerli':rec['eanValid'],'isim_skoru':round(cont,2),'gramaj_uyumu':gram_ok})
    out.append(rec)
json.dump(out,open(OUT,'w'),ensure_ascii=False,indent=0)
import collections
print(len(out),collections.Counter(r['matchStatus'] for r in out),'görsel:',sum(1 for r in out if r['image']),'geçersiz barkod:',sum(1 for r in out if not r['eanValid']))
if review_out:
    w=csv.DictWriter(open(review_out,'w',newline='',encoding='utf-8-sig'),fieldnames=list(review[0].keys()));w.writeheader();w.writerows(review);print('gözden geçirme listesi:',len(review))
