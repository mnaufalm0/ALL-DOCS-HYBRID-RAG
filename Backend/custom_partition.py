import re
import os
from pathlib import Path
from collections import Counter
import fitz  
import pytesseract
from PIL import Image
import io
# ─────────────────────────────────────────
# Element Classes — mirrors unstructured
# ─────────────────────────────────────────

class Element:
    def __init__(self, text: str):
        self.text = text
    def __repr__(self):
        return f"{type(self).__name__}(text={self.text[:50]!r})"

class Title(Element): pass
class NarrativeText(Element): pass
class ListItem(Element): pass
class Table(Element): pass
class Header(Element): pass
class Footer(Element): pass
class PageNumber(Element): pass
class PhoneNumber(Element): pass
class EmailAddress(Element): pass
class FigureCaption(Element): pass
class Text(Element): pass
class UncategorizedText(Element): pass

# ─────────────────────────────────────────
# Smart Element Classifier
# ─────────────────────────────────────────

PHONE_RE       = re.compile(r'^\+?[\d\s\-\(\)\.]{7,20}$')
EMAIL_RE       = re.compile(r'^[\w\.-]+@[\w\.-]+\.\w+$')
PAGE_NO_RE     = re.compile(r'^\s*(page\s*)?\d+\s*(of\s*\d+)?\s*$', re.IGNORECASE)
LIST_RE        = re.compile(r'^[\s]*[\-\*\•\–\—\d+\.\)]+\s+\S')
CAPTION_RE     = re.compile(r'^(figure|fig|table|chart|image|diagram)\s*[\d\.\:]+', re.IGNORECASE)
HEADER_FOOTER_RE = re.compile(
    r'(confidential|all rights reserved|www\.|http[s]?://|©|copyright|\bprivacy policy\b)',
    re.IGNORECASE
)
TITLE_RE = re.compile(r'^[A-Z0-9][A-Z0-9\s\:\-\&\,\.]{2,80}$')


def classify(text: str, is_heading: bool = False,
             is_header_section: bool = False,
             is_footer_section: bool = False,
             is_table: bool = False) -> Element:
    t = text.strip()

    if not t:
        return UncategorizedText(t)

    if is_table:
        return Table(t)
    if is_header_section:
        return Header(t)
    if is_footer_section:
        return Footer(t)
    if PAGE_NO_RE.match(t):
        return PageNumber(t)
    if PHONE_RE.match(t):
        return PhoneNumber(t)
    if EMAIL_RE.match(t):
        return EmailAddress(t)
    if CAPTION_RE.match(t):
        return FigureCaption(t)
    if HEADER_FOOTER_RE.search(t):
        return Footer(t)
    if LIST_RE.match(t):
        return ListItem(t)
    if is_heading or (len(t.split()) <= 12 and not t.endswith('.') and TITLE_RE.match(t)):
        return Title(t)
    if len(t.split()) >= 10:
        return NarrativeText(t)

    return Text(t)


# ─────────────────────────────────────────
# PDF Parser — pymupdf + OCR
# ─────────────────────────────────────────

def _parse_pdf(filepath: str) -> list[Element]:
    

    doc = fitz.open(filepath)
    elements = []

    # Detect repeated text across pages = headers/footers
    page_texts = []
    for page in doc:
        blocks = page.get_text("blocks")
        page_texts.append([b[4].strip() for b in blocks if b[4].strip()])

    all_texts = [t for page in page_texts for t in page]
    text_counts = Counter(all_texts)
    repeated = {t for t, count in text_counts.items() if count > len(doc) * 0.4}

    for page_num, page in enumerate(doc):
        page_height = page.rect.height

        # ── Text Blocks ──────────────────────────────
        blocks = page.get_text("blocks", sort=True)
        blocks_dict = page.get_text("dict")

        for block in blocks:
            x0, y0, x1, y1, text, block_no, block_type = block

            if block_type != 0:
                continue

            text = text.strip()
            if not text or text in repeated:
                continue

            relative_y = y0 / page_height
            is_header = relative_y < 0.08
            is_footer = relative_y > 0.92

            if is_header:
                elements.append(Header(text))
                continue
            if is_footer:
                elements.append(Footer(text))
                continue

            # Detect bold/large font = title
            is_title = False
            for b in blocks_dict.get("blocks", []):
                if b.get("type") == 0:
                    for line in b.get("lines", []):
                        for span in line.get("spans", []):
                            if span.get("text", "").strip() in text:
                                if span.get("size", 0) > 14 or "Bold" in span.get("font", ""):
                                    is_title = True

            elements.append(classify(text, is_heading=is_title))

        # ── Images + OCR ─────────────────────────────
        for img in page.get_images(full=True):
            xref = img[0]
            try:
                base_image = doc.extract_image(xref)
                image_bytes = base_image["image"]
                image = Image.open(io.BytesIO(image_bytes))
                ocr_text = pytesseract.image_to_string(image, lang='eng').strip()
                if ocr_text and len(ocr_text.split()) >= 3:
                    elements.append(classify(ocr_text))
            except Exception:
                pass

        # ── Tables ───────────────────────────────────
        try:
            tabs = page.find_tables()
            for tab in tabs:
                df = tab.to_pandas()
                rows = []
                for _, row in df.iterrows():
                    cells = [str(c).strip() for c in row if str(c).strip() and str(c) != 'None']
                    if cells:
                        rows.append(' | '.join(cells))
                if rows:
                    elements.append(Table('\n'.join(rows)))
        except Exception:
            pass

    doc.close()
    return elements


# ─────────────────────────────────────────
# DOCX Parser
# ─────────────────────────────────────────

def _parse_docx(filepath: str) -> list[Element]:
    from docx import Document
    doc = Document(filepath)
    elements = []

    header_footer_texts = set()
    for section in doc.sections:
        for para in section.header.paragraphs:
            if para.text.strip():
                header_footer_texts.add(para.text.strip())
                elements.append(Header(para.text.strip()))
        for para in section.footer.paragraphs:
            if para.text.strip():
                header_footer_texts.add(para.text.strip())
                elements.append(Footer(para.text.strip()))

    for para in doc.paragraphs:
        text = para.text.strip()
        if not text or text in header_footer_texts:
            continue
        is_heading = para.style.name.startswith('Heading')
        elements.append(classify(text, is_heading=is_heading))

    for table in doc.tables:
        rows = []
        for row in table.rows:
            cells = [cell.text.strip() for cell in row.cells if cell.text.strip()]
            if cells:
                rows.append(' | '.join(cells))
        if rows:
            elements.append(Table('\n'.join(rows)))

    return elements


# ─────────────────────────────────────────
# PPTX Parser
# ─────────────────────────────────────────

def _parse_pptx(filepath: str) -> list[Element]:
    from pptx import Presentation
    prs = Presentation(filepath)
    elements = []
    for slide in prs.slides:
        for shape in slide.shapes:
            if not hasattr(shape, "text") or not shape.text.strip():
                continue
            is_heading = (
                hasattr(shape, 'placeholder_format') and
                shape.placeholder_format is not None and
                shape.placeholder_format.idx == 0
            )
            elements.append(classify(shape.text.strip(), is_heading=is_heading))
    return elements


# ─────────────────────────────────────────
# XLSX Parser
# ─────────────────────────────────────────

def _parse_xlsx(filepath: str) -> list[Element]:
    from openpyxl import load_workbook
    wb = load_workbook(filepath, read_only=True, data_only=True)
    elements = []
    for sheet in wb.worksheets:
        rows = []
        for row in sheet.iter_rows(values_only=True):
            cells = [str(c) for c in row if c is not None]
            if cells:
                rows.append(' | '.join(cells))
        if rows:
            elements.append(Table('\n'.join(rows)))
    return elements


# ─────────────────────────────────────────
# TXT Parser
# ─────────────────────────────────────────

def _parse_txt(filepath: str) -> list[Element]:
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    elements = []
    for para in content.split('\n\n'):
        para = para.strip()
        if para:
            elements.append(classify(para))
    return elements


# ─────────────────────────────────────────
# CSV Parser
# ─────────────────────────────────────────

def _parse_csv(filepath: str) -> list[Element]:
    import csv
    rows = []
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        reader = csv.reader(f)
        for row in reader:
            cells = [c.strip() for c in row if c.strip()]
            if cells:
                rows.append(' | '.join(cells))
    return [Table('\n'.join(rows))] if rows else []


# ─────────────────────────────────────────
# HTML Parser
# ─────────────────────────────────────────

def _parse_html(filepath: str) -> list[Element]:
    from bs4 import BeautifulSoup
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        soup = BeautifulSoup(f.read(), 'html.parser')

    for tag in soup(['script', 'style']):
        tag.decompose()

    elements = []

    for tag in soup.find_all('header'):
        t = tag.get_text(separator=' ').strip()
        if t:
            elements.append(Header(t))
        tag.decompose()

    for tag in soup.find_all('footer'):
        t = tag.get_text(separator=' ').strip()
        if t:
            elements.append(Footer(t))
        tag.decompose()

    for tag in soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']):
        t = tag.get_text().strip()
        if t:
            elements.append(Title(t))

    for tag in soup.find_all(['p', 'li', 'td', 'th']):
        t = tag.get_text().strip()
        if t:
            elements.append(classify(t))

    return elements


# ─────────────────────────────────────────
# Markdown Parser
# ─────────────────────────────────────────

def _parse_md(filepath: str) -> list[Element]:
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        lines = f.readlines()

    elements = []
    buffer = []

    for line in lines:
        stripped = line.strip()
        if stripped.startswith('#'):
            if buffer:
                elements.append(classify('\n'.join(buffer)))
                buffer = []
            title = re.sub(r'^#{1,6}\s+', '', stripped)
            elements.append(Title(title))
        elif stripped == '':
            if buffer:
                elements.append(classify('\n'.join(buffer)))
                buffer = []
        else:
            stripped = re.sub(r'\*{1,2}(.+?)\*{1,2}', r'\1', stripped)
            stripped = re.sub(r'`(.+?)`', r'\1', stripped)
            stripped = re.sub(r'\[(.+?)\]\(.+?\)', r'\1', stripped)
            buffer.append(stripped)

    if buffer:
        elements.append(classify('\n'.join(buffer)))

    return elements


# ─────────────────────────────────────────
# RTF Parser
# ─────────────────────────────────────────

def _parse_rtf(filepath: str) -> list[Element]:
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    content = re.sub(r'\\[a-z]+\d*\s?', ' ', content)
    content = re.sub(r'[{}]', '', content)
    elements = []
    for para in content.split('\n\n'):
        para = para.strip()
        if para:
            elements.append(classify(para))
    return elements


# ─────────────────────────────────────────
# EPUB Parser
# ─────────────────────────────────────────

def _parse_epub(filepath: str) -> list[Element]:
    import zipfile
    from bs4 import BeautifulSoup
    elements = []
    with zipfile.ZipFile(filepath, 'r') as z:
        for name in z.namelist():
            if name.endswith(('.html', '.xhtml', '.htm')):
                with z.open(name) as f:
                    soup = BeautifulSoup(f.read(), 'html.parser')
                    for tag in soup.find_all(['h1', 'h2', 'h3']):
                        t = tag.get_text().strip()
                        if t:
                            elements.append(Title(t))
                    for tag in soup.find_all(['p', 'li']):
                        t = tag.get_text().strip()
                        if t:
                            elements.append(classify(t))
    return elements


# ─────────────────────────────────────────
# File Type Dispatcher
# ─────────────────────────────────────────

PARSERS = {
    '.pdf':  _parse_pdf,
    '.docx': _parse_docx,
    '.doc':  _parse_docx,
    '.pptx': _parse_pptx,
    '.ppt':  _parse_pptx,
    '.xlsx': _parse_xlsx,
    '.xls':  _parse_xlsx,
    '.txt':  _parse_txt,
    '.csv':  _parse_csv,
    '.html': _parse_html,
    '.htm':  _parse_html,
    '.md':   _parse_md,
    '.rtf':  _parse_rtf,
    '.epub': _parse_epub,
}


# ─────────────────────────────────────────
# Main partition() — drop-in for unstructured
# ─────────────────────────────────────────

def _parse_pdf_ocr_only(filepath: str) -> list[Element]:
    
    doc = fitz.open(filepath)
    elements = []

    for page in doc:
        mat = fitz.Matrix(2, 2)
        pix = page.get_pixmap(matrix=mat)
        image = Image.open(io.BytesIO(pix.tobytes("png")))
        ocr_text = pytesseract.image_to_string(image, lang='eng').strip()
        if not ocr_text:
            continue
        for para in ocr_text.split('\n\n'):
            para = para.strip()
            if para and len(para.split()) >= 3:
                elements.append(classify(para))

    doc.close()
    return elements


def _parse_pdf_hi_res(filepath: str) -> list[Element]:

    doc = fitz.open(filepath)
    elements = []

    page_texts = []
    for page in doc:
        blocks = page.get_text("blocks")
        page_texts.append([b[4].strip() for b in blocks if b[4].strip()])

    all_texts = [t for page in page_texts for t in page]
    text_counts = Counter(all_texts)
    repeated = {t for t, count in text_counts.items() if count > len(doc) * 0.4}

    for page in doc:
        page_height = page.rect.height
        blocks = page.get_text("blocks", sort=True)
        blocks_dict = page.get_text("dict")

        for block in blocks:
            x0, y0, x1, y1, text, block_no, block_type = block
            if block_type != 0:
                continue
            text = text.strip()
            if not text or text in repeated:
                continue
            relative_y = y0 / page_height
            if relative_y < 0.08:
                elements.append(Header(text))
                continue
            if relative_y > 0.92:
                elements.append(Footer(text))
                continue
            is_title = False
            for b in blocks_dict.get("blocks", []):
                if b.get("type") == 0:
                    for line in b.get("lines", []):
                        for span in line.get("spans", []):
                            if span.get("text", "").strip() in text:
                                if span.get("size", 0) > 14 or "Bold" in span.get("font", ""):
                                    is_title = True
            elements.append(classify(text, is_heading=is_title))

        mat = fitz.Matrix(3, 3)
        pix = page.get_pixmap(matrix=mat)
        image = Image.open(io.BytesIO(pix.tobytes("png")))
        ocr_text = pytesseract.image_to_string(image, lang='eng').strip()
        existing_text = ' '.join([e.text for e in elements])
        for para in ocr_text.split('\n\n'):
            para = para.strip()
            if para and len(para.split()) >= 3 and para not in existing_text:
                elements.append(classify(para))

        for img in page.get_images(full=True):
            xref = img[0]
            try:
                base_image = doc.extract_image(xref)
                image = Image.open(io.BytesIO(base_image["image"]))
                ocr_text = pytesseract.image_to_string(image, lang='eng').strip()
                if ocr_text and len(ocr_text.split()) >= 3:
                    elements.append(classify(ocr_text))
            except Exception:
                pass

        try:
            for tab in page.find_tables():
                df = tab.to_pandas()
                rows = []
                for _, row in df.iterrows():
                    cells = [str(c).strip() for c in row if str(c).strip() and str(c) != 'None']
                    if cells:
                        rows.append(' | '.join(cells))
                if rows:
                    elements.append(Table('\n'.join(rows)))
        except Exception:
            pass

    doc.close()
    return elements


def partition(filename: str = None, strategy: str = "fast",
              languages: list = None, **kwargs) -> list[Element]:
    if not filename:
        raise ValueError("filename is required")
    if not os.path.exists(filename):
        raise FileNotFoundError(f"File not found: {filename}")

    ext = Path(filename).suffix.lower()

    if ext == '.pdf':
        if strategy == "ocr_only":
            return _parse_pdf_ocr_only(filename)
        elif strategy == "hi_res":
            return _parse_pdf_hi_res(filename)
        else:
            return _parse_pdf(filename)

    parser = PARSERS.get(ext)
    if not parser:
        raise ValueError(f"Unsupported file type: {ext}")

    return parser(filename)