import pymupdf
import pytesseract
from PIL import Image
import io

pytesseract.pytesseract.tesseract_cmd = r"C:\Users\AI-DEV\AppData\Local\Programs\Tesseract-OCR\tesseract.exe"

PDF = "docs/2025-SECOND-CYCLE-SCHOOLS-REGISTER-NEW-FINAL-160525_for-approval-2 (1).pdf"
doc = pymupdf.open(PDF)

start, end = 1, 16
for i in range(start - 1, end):
    page = doc[i]
    pix = page.get_pixmap(dpi=220)
    img = Image.open(io.BytesIO(pix.tobytes("png")))
    txt = pytesseract.image_to_string(img, lang="eng", config="--psm 4")
    lines = [l for l in (x.rstrip() for x in txt.splitlines()) if l.strip()]
    print("\n" + "#" * 70)
    print(f"PAGE {i+1}  (lines={len(lines)})")
    print("#" * 70)
    for l in lines[:8]:
        print("  ", l)
    print("   ...")
    for l in lines[-4:]:
        print("  ", l)
