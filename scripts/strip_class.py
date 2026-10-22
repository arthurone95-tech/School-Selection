import re

path = "js/school-data.js"
text = open(path, encoding="utf-8").read()
# remove any existing classification lines (with optional trailing comma)
new = re.sub(r'\n\s*classification:\s*\[[^\]]*\],?', '', text)
open(path, "w", encoding="utf-8").write(new)
print("stripped classification lines. old len", len(text), "new len", len(new))
print("remaining classification count:", new.count("classification"))
