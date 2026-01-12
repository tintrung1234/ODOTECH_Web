from pypdf import PdfReader
from pathlib import Path

pdf_path = Path(r"d:\ODOTECH\Yêu cầu.pdf")
reader = PdfReader(str(pdf_path))
texts = []
for i, page in enumerate(reader.pages):
    t = page.extract_text() or ""
    texts.append(f"\n\n===== PAGE {i+1} =====\n" + t)
full = "".join(texts)
out_path = Path(r"d:\ODOTECH\web\requirements_extracted.txt")
out_path.write_text(full, encoding="utf-8", errors="ignore")
print("pages:", len(reader.pages))
print("wrote:", out_path)
print("chars:", len(full))
