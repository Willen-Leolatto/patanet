
import json
from pathlib import Path
def norm(p):
    try: return str(Path(p).resolve()).replace('\\','/').lower()
    except: return str(p).replace('\\','/').lower()

head = json.load(open('index/head_meta.json','r',encoding='utf-8'))
total = len(head)
with_crop = [m for m in head if isinstance(m.get('crop'), str) and m['crop']]
uniq = len({norm(m['crop']) for m in with_crop})
missing = total - len(with_crop)
print('total:', total, '| with_crop:', len(with_crop), '| uniq_norm_crop:', uniq, '| missing_crop:', missing)
for i,m in enumerate(head):
    if not isinstance(m.get('crop'), str):
        print('exemplo_sem_crop@', i, 'keys=', list(m.keys())[:10]); break

