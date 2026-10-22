import os, io, json, sys, time
import pymupdf
from PIL import Image
import numpy as np
from rapidocr_onnxruntime import RapidOCR

PDF = "docs/2025-SECOND-CYCLE-SCHOOLS-REGISTER-NEW-FINAL-160525_for-approval-2 (1).pdf"
OUT = "data/ocr_boxes"
os.makedirs(OUT, exist_ok=True)

doc = pymupdf.open(PDF)
engine = RapidOCR()

for i in sys.argv[1:]:
    p = int(i) - 1
    dest = os.path.join(OUT, f"page_{int(i):03d}.json")
    t0 = time.time()
    page = doc[p]
    pix = page.get_pixmap(dpi=300)
    img = Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGB")
    arr = np.array(img)
    result, _ = engine(arr)
    boxes = []
    if result:
        for box, text, score in result:
            xs = [pt[0] for pt in box]; ys = [pt[1] for pt in box]
            boxes.append({"x": round(min(xs),1), "y": round(min(ys),1), "x2": round(max(xs),1), "y2": round(max(ys),1), "t": text, "s": float(score)})
    tmp = dest + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(boxes, f, ensure_ascii=False); f.flush(); os.fsync(f.fileno())
    os.replace(tmp, dest)
    print(f"page {int(i)}: {len(boxes)} boxes in {time.time()-t0:.1f}s")
