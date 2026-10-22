import pymupdf, pytesseract, io, re
from PIL import Image

pytesseract.pytesseract.tesseract_cmd = r"C:\Users\AI-DEV\AppData\Local\Programs\Tesseract-OCR\tesseract.exe"
PDF = "docs/2025-SECOND-CYCLE-SCHOOLS-REGISTER-NEW-FINAL-160525_for-approval-2 (1).pdf"
doc = pymupdf.open(PDF)
page = doc[5]  # page 6

for dpi in (300, 400, 500):
    pix = page.get_pixmap(dpi=dpi)
    img = Image.open(io.BytesIO(pix.tobytes("png")))
    for psm in (4, 6):
        cfg = f"--psm {psm} -c preserve_interword_spaces=1"
        txt = pytesseract.image_to_string(img, lang="eng", config=cfg)
        codes = re.findall(r"(?<!\d)(\d{6,7})(?!\d)", txt)
        print(f"dpi={dpi} psm={psm} codes={len(codes)} sample={codes[:12]}")
