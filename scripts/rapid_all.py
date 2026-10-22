import os, io, json, time
import pymupdf
from PIL import Image
import numpy as np
from rapidocr_onnxruntime import RapidOCR

PDF = "docs/2025-SECOND-CYCLE-SCHOOLS-REGISTER-NEW-FINAL-160525_for-approval-2 (1).pdf"
OUT = "data/ocr_boxes"
os.makedirs(OUT, exist_ok=True)

doc = pymupdf.open(PDF)
engine = RapidOCR()

for i in range(doc.page_count):
    dest = os.path.join(OUT, f"page_{i+1:03d}.json")
    if os.path.exists(dest) and os.path.getsize(dest) > 10:
        print(f"skip {i+1}", flush=True)
        continue
    t0 = time.time()
    page = doc[i]
    pix = page.get_pixmap(dpi=300)
    img = Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGB")
    arr = np.array(img)
    result, _ = engine(arr)
    boxes = []
    if result:
        for box, text, score in result:
            xs = [p[0] for p in box]; ys = [p[1] for p in box]
            boxes.append({"x": round(min(xs), 1), "y": round(min(ys), 1),
                          "x2": round(max(xs), 1), "y2": round(max(ys), 1),
                          "t": text, "s": float(score)})
    tmp = dest + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(boxes, f, ensure_ascii=False)
        f.flush()
        os.fsync(f.fileno())
    os.replace(tmp, dest)
    print(f"page {i+1}: {len(boxes)} boxes in {time.time()-t0:.1f}s", flush=True)

print("ALL DONE", flush=True)
