from semantic_text_splitter import TextSplitter
from tokenizers import Tokenizer

tokenizer = Tokenizer.from_pretrained("bert-base-uncased")
splitter = TextSplitter.from_huggingface_tokenizer(tokenizer, capacity=256)

def chunk_text(cleaned_elements):
    all_chunks = []
    for chunk in cleaned_elements:
        chunks = splitter.chunks(chunk)
        all_chunks.extend(chunks)
    return all_chunks