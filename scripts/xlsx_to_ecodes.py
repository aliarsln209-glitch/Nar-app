# Kullanım: python3 scripts/xlsx_to_ecodes.py <ANA_TABLO.xlsx>  →  src/data/ecodes.json
import sys, re, json, openpyxl
ws = openpyxl.load_workbook(sys.argv[1], data_only=True).active
rows = list(ws.iter_rows(values_only=True)); h = list(rows[0]); out = []
g = lambda r, n: (str(r[h.index(n)]).strip() if r[h.index(n)] not in (None, '') else '')
for r in rows[1:]:
    out.append({
        'code': g(r, 'comp_id'), 'name': g(r, 'comp_name'),
        'tags': [t.strip() for t in g(r, 'comp_tag').split(',') if t.strip()],
        'compExp': g(r, 'comp_exp'), 'academicExp': g(r, 'academik_exp'),
        'riskHalk': g(r, 'risk_warn_halk'), 'riskBilimsel': g(r, 'risk_warn_bilimsel'),
        'riskValue': g(r, 'risk_value'), 'notSuitable': g(r, 'not_suitable'),
        'sources': re.findall(r'https?://[^\s,;]+', g(r, 'data_source'))
    })
json.dump(out, open('src/data/ecodes.json', 'w'), ensure_ascii=False, separators=(',', ':'))
print(len(out), 'kayıt')
