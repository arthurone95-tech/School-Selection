import json, sys

p = int(sys.argv[1]) if len(sys.argv) > 1 else 32
n = int(sys.argv[2]) if len(sys.argv) > 2 else 60
bs = json.load(open(f"data/ocr_boxes/page_{p:03d}.json", encoding="utf-8"))
bs = sorted(bs, key=lambda b: (b["y"], b["x"]))
for b in bs[:n]:
    print(f"y={b['y']:6.0f} x={b['x']:6.0f} x2={b['x2']:6.0f} {b['t'][:55]}")
