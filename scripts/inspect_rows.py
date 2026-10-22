import json, sys

p = int(sys.argv[1])
ymin = float(sys.argv[2]) if len(sys.argv) > 2 else 0
ymax = float(sys.argv[3]) if len(sys.argv) > 3 else 1e9
bs = json.load(open(f"data/ocr_boxes/page_{p:03d}.json", encoding="utf-8"))
bs = sorted(bs, key=lambda b: (b["y"], b["x"]))
rows = []
cur = []
last = None
for b in bs:
    if last is None or b["y"] - last <= 22:
        cur.append(b)
    else:
        rows.append(cur); cur = [b]
    last = b["y"]
if cur:
    rows.append(cur)
for r in rows:
    y = min(b["y"] for b in r)
    if not (ymin <= y <= ymax):
        continue
    parts = [f"{int(b['x'])}:{b['t']}" for b in sorted(r, key=lambda b: b["x"])]
    print(f"y={int(y):5d}  " + " | ".join(parts))
