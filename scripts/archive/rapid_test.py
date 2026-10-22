import pymupdf, io, os
from PIL import Image
import numpy as np
from rapidocr_onnxruntime import RapidOCR

PDF = "docs/2025-SECOND-CYCLE-SCHOOLS-REGISTER-NEW-FINAL-160525_for-approval-2 (1).pdf"
doc = pymupdf.open(PDF)
page = doc[5]
pix = page.get_pixmap(dpi=300)
img = Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGB")
arr = np.array(img)

engine = RapidOCR()
result, elapse = engine(arr)
print("boxes:", len(result), "elapse:", elapse)
# sort by y then x
items = []
for box, text, score in result:
    ys = [p[1] for p in box]; xs = [p[0] for p in box]
    items.append((min(ys), min(xs), text, score))
items.sort()
for y, x, t, s in items:
    print(f"{int(y):5d} {int(x):5d}  {float(s):.2f}  {t}")
