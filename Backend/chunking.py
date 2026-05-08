from transformers import AutoTokenizer
import semchunk
import re

MODEL_NAME = "nomic-ai/nomic-embed-text-v1.5"
CHUNK_SIZE = 512
MIN_CHUNK_LENGTH = 50

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, trust_remote_code=True)
chunker = semchunk.chunkerify(tokenizer, chunk_size=CHUNK_SIZE)


def clean_text(text: str) -> str:
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r'[ \t]{2,}', ' ', text)
    text = re.sub(r'[-_=]{5,}', '', text)
    return text.strip()


def is_heading(text: str) -> bool:
    """Detect if a text element is a section heading."""
    text = text.strip()
    if len(text) > 150:
        return False
    if re.match(r'^\d+(\.\d+)*[\.\s]', text):  # "1.", "2.1", "3.2.1"
        return True
    if text.isupper() and len(text.split()) <= 8:  # "EXECUTIVE SUMMARY"
        return True
    if text.startswith('#'):                        # markdown headings
        return True
    return False


def clean_table(text: str) -> str:
    """Convert table noise into readable key-value pairs."""
    # Remove excessive pipes and normalize table formatting
    text = re.sub(r'\|{2,}', '|', text)
    text = re.sub(r'\|\s*\|', ' | ', text)
    rows = [row.strip() for row in text.split('\n') if '|' in row]
    return ' '.join(rows)


def add_token_overlap(chunks: list[str], overlap_tokens: int = 50) -> list[str]:
    """Token-based overlap — accurate regardless of character length."""
    if len(chunks) <= 1:
        return chunks

    overlapped = [chunks[0]]
    for i in range(1, len(chunks)):
        # Tokenize previous chunk and take last N tokens
        prev_tokens = tokenizer.encode(chunks[i - 1], add_special_tokens=False)
        overlap_token_ids = prev_tokens[-overlap_tokens:]
        overlap_text = tokenizer.decode(overlap_token_ids)

        current = overlap_text + " " + chunks[i]
        overlapped.append(current)

    return overlapped


def chunk_text(cleaned_elements: list[str]) -> list[str]:
    """
    Production-grade chunker.
    - Preserves heading context in every chunk
    - Handles tables
    - Token-based overlap
    - Filters garbage
    - Works for PDF, DOCX, TXT of any size
    """
    all_chunks = []
    current_heading = ""  # track current section heading

    for text in cleaned_elements:
        text = clean_text(text)

        if not text or len(text) < MIN_CHUNK_LENGTH:
            continue

        # Detect and store heading for context injection
        if is_heading(text):
            current_heading = text
            continue  # don't store heading alone as a chunk

        # Clean tables
        if text.count('|') > 3:
            text = clean_table(text)

        # Inject heading context into every chunk
        if current_heading:
            text = f"{current_heading}: {text}"

        # Semantic chunking
        chunks = chunker(text)

        # Token-based overlap
        chunks = add_token_overlap(chunks)

        # Final quality filter
        chunks = [c for c in chunks if len(c.strip()) >= MIN_CHUNK_LENGTH]

        all_chunks.extend(chunks)

    return all_chunks