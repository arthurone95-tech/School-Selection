import json, os

def load(p):
    fp = f"data/ocr_boxes/page_{p:03d}.json"
    if not os.path.exists(fp):
        return []
    return json.load(open(fp, encoding="utf-8"))

for p in (6, 10, 17, 32, 39, 46, 61, 62):
    boxes = load(p)
    print("=" * 70)
    print(f"PAGE {p}: {len(boxes)} boxes")
    if not boxes:
        continue
    # sort by y
    bs = sorted(boxes, key=lambda b: (b["y"], b["x"]))
    for b in bs[:30]:
        print(f"  y={b['y']:6.0f} x={b['x']:6.0f}  {b['t'][:60]}")
