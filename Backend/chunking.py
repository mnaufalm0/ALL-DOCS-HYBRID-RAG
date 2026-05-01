from transformers import AutoTokenizer
import semchunk

MODEL_NAME = "bert-base-uncased"
CHUNK_SIZE = 254


tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
chunker   = semchunk.chunkerify(tokenizer, chunk_size=CHUNK_SIZE)

def chunk_text(cleaned_elements: list[str]) -> list[str]:
    all_chunks = []
    for text in cleaned_elements:
        chunks = chunker(text)
        all_chunks.extend(chunks)
    return all_chunks