import re, json

data = open("js/school-data.js", encoding="utf-8").read()
parts = re.split(r'"([A-Za-z][A-Za-z ]+)":\s*\{', data)
region=None; count=0; empty=0; cls_counts={}; samples=[]
for i,part in enumerate(parts):
    if i%2==1: region=part.strip()
    elif region:
        for m in re.finditer(r'id:\s*(\d+),\s*name:\s*"([^"]+)",\s*location:\s*"([^"]*)",\s*gender:\s*"([^"]*)",\s*school_type:\s*"([^"]*)",\s*status:\s*"([^"]*)",\s*programs:\s*\[[^\]]*\],?\s*classification:\s*\[([^\]]*)\]', part):
            count+=1
            cls = m.group(7).strip()
            if not cls: empty+=1
            for c in cls.split(','):
                c=c.strip().strip('"').strip()
                if c: cls_counts[c]=cls_counts.get(c,0)+1
            samples.append((m.group(1), m.group(2), cls))
print('parsed:', count, 'empty:', empty)
print(cls_counts)
print()
print('samples:')
for s in samples[:15]:
    print(f"  #{s[0]:>3} {s[1][:40]:<40} {s[2]}")
