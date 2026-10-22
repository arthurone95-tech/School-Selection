import json, re

refs = json.load(open("data/reference_sections_v2.json",encoding="utf-8"))
content = open("js/school-data.js", encoding="utf-8").read()
parts = re.split(r'"([A-Za-z][A-Za-z ]+)":\s*\{', content)
schools=[]
region=None
for i,part in enumerate(parts):
    if i%2==1: region=part.strip()
    elif region:
        for m in re.finditer(r'id:\s*(\d+),\s*name:\s*"([^"]+)",\s*location:\s*"([^"]*)",\s*gender:\s*"([^"]*)",\s*school_type:\s*"([^"]*)",\s*status:\s*"([^"]*)",\s*programs:\s*\[[^\]]*\]', part):
            schools.append({"id":int(m.group(1)),"name":m.group(2),"location":m.group(3),"gender":m.group(4),"type":m.group(5),"status":m.group(6),"region":region})

# search for specific schools
targets = ["Aduman", "Bechem Presby", "Bankoman", "Beposo", "Dwamena", "Agogo State"]
for t in targets:
    print("=== search:", t)
    # find dataset school
    ds = [s for s in schools if t.lower() in s["name"].lower()]
    for s in ds[:2]:
        print(f"  DS: #{s['id']} {s['name']} [{s['region']}] {s['type']}")
    for sec in ["Cat A","Cat B","Cat C"]:
        hits = [r for r in refs[sec] if t.lower() in r["name"].lower()]
        for h in hits[:3]:
            print(f"    {sec}: {h['name'][:50]!r} [{h.get('region')}] code={h.get('code')}")
