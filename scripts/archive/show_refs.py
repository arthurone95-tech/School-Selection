import json

refs = json.load(open("data/reference_sections_v2.json",encoding="utf-8"))
for sec in ["Cat A"]:
    print("==",sec,len(refs[sec]))
    for r in refs[sec][:15]:
        print(f"  {r['code'] or '':>8} [{r['region']}] {r['name'][:60]!r} | {r['status'][:14]!r} {r['type'][:8]!r}")
