import json
rep = json.load(open("data/classification_report.json",encoding="utf-8"))
print("unresolved:", rep["unresolved_count"])
print("\n=== category ambiguity (should be 0) ===")
for a in rep["category_ambiguity"]:
    print(f"  #{a['id']:>3} {a['name'][:45]:<45} {a['cats']}")
print("\n=== unresolved sample ===")
for s in rep["unresolved"][:30]:
    print(f"  #{s['id']:>3} {s['name'][:45]:<45} [{s['region']}] {s['type']}")
