import tiktoken
import semchunk
import re


CHUNK_SIZE = 512
MIN_CHUNK_LENGTH = 50

tokenizer = tiktoken.get_encoding("cl100k_base")
chunker   = semchunk.chunkerify(tokenizer, chunk_size=CHUNK_SIZE)

def clean_text(text: str) -> str:
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r'[ \t]{2,}', ' ', text)
    text = re.sub(r'[-_=]{5,}', '', text)
    return text.strip()

def is_heading(text: str) -> bool:
    text = text.strip()
    if len(text) > 150:
        return False
    if re.match(r'^\d+(\.\d+)*[\.\s]', text):
        return True
    if text.isupper() and len(text.split()) <= 8:
        return True
    if text.startswith('#'):
        return True
    return False

def clean_table(text: str) -> str:
    text = re.sub(r'\|{2,}', '|', text)
    text = re.sub(r'\|\s*\|', ' | ', text)
    rows = [row.strip() for row in text.split('\n') if '|' in row]
    return ' '.join(rows)

def add_token_overlap(chunks: list[str], overlap_tokens: int = 50) -> list[str]:
    if len(chunks) <= 1:
        return chunks
    overlapped = [chunks[0]]
    for i in range(1, len(chunks)):
        prev_tokens    = tokenizer.encode(chunks[i - 1], add_special_tokens=False)
        overlap_ids    = prev_tokens[-overlap_tokens:]
        overlap_text   = tokenizer.decode(overlap_ids)
        overlapped.append(overlap_text + " " + chunks[i])
    return overlapped

def chunk_text(cleaned_elements: list[str]) -> list[str]:
    all_chunks      = []
    current_heading = ""

    for text in cleaned_elements:
        text = clean_text(text)

        if not text or len(text) < MIN_CHUNK_LENGTH:
            continue

        if is_heading(text):
            current_heading = text
            continue

        if text.count('|') > 3 and '\n' in text:   # ✅ better table check
            text = clean_table(text)

        if current_heading:
            text = f"{current_heading}: {text}"

        chunks = chunker(text)
        chunks = add_token_overlap(chunks)
        chunks = [c for c in chunks if len(c.strip()) >= MIN_CHUNK_LENGTH]
        all_chunks.extend(chunks)

    return all_chunks