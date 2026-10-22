import os
import pymupdf
import pytesseract
from PIL import Image
import io

pytesseract.pytesseract.tesseract_cmd = r"C:\Users\AI-DEV\AppData\Local\Programs\Tesseract-OCR\tesseract.exe"

PDF = "docs/2025-SECOND-CYCLE-SCHOOLS-REGISTER-NEW-FINAL-160525_for-approval-2 (1).pdf"
OUT = "data/ocr_out"
os.makedirs(OUT, exist_ok=True)

doc = pymupdf.open(PDF)
for i in range(doc.page_count):
    dest = os.path.join(OUT, f"page_{i+1:03d}.txt")
    if os.path.exists(dest) and os.path.getsize(dest) > 0:
        print(f"skip page {i+1}")
        continue
    page = doc[i]
    pix = page.get_pixmap(dpi=300)
    img = Image.open(io.BytesIO(pix.tobytes("png")))
    txt = pytesseract.image_to_string(img, lang="eng", config="--psm 4")
    with open(dest, "w", encoding="utf-8") as f:
        f.write(txt)
    print(f"done page {i+1}: {len(txt)} chars", flush=True)

print("ALL DONE")
