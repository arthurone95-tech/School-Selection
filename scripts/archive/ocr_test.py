import pymupdf
import pytesseract
from PIL import Image
import io

pytesseract.pytesseract.tesseract_cmd = r"C:\Users\AI-DEV\AppData\Local\Programs\Tesseract-OCR\tesseract.exe"

PDF = "docs/2025-SECOND-CYCLE-SCHOOLS-REGISTER-NEW-FINAL-160525_for-approval-2 (1).pdf"
doc = pymupdf.open(PDF)

page = doc[5]  # page 6 (0-indexed 5)
pix = page.get_pixmap(dpi=300)
img = Image.open(io.BytesIO(pix.tobytes("png")))
print("image size:", img.size)

for psm in (6, 4):
    txt = pytesseract.image_to_string(img, lang="eng", config=f"--psm {psm}")
    print("=" * 30, "PSM", psm, "=" * 30)
    print(txt[:2500])
