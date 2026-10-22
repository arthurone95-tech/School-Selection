import json, re

rep = json.load(open("data/classification_report.json",encoding="utf-8"))
un = rep["unresolved"]
print("unresolved:", len(un))
# show a sample by region/type
from collections import Counter
print("by type:", Counter(s["type"] for s in un))
print("by region:", Counter(s["region"] for s in un))
print()
print("first 25 unresolved:")
for s in un[:25]:
    print(f"  #{s['id']:>3} {s['name'][:45]:<45} [{s['region']}] {s['type']}")
