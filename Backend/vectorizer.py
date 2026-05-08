from pinecone import Pinecone
from pinecone_text.sparse import BM25Encoder
from dotenv import load_dotenv
import os
import uuid

load_dotenv()

pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
pinecone_index_name = os.getenv("PINECONE_INDEX")
index = pc.Index(pinecone_index_name)
BATCH_SIZE = 100
_embedder = None
_bm25 = None

def get_embedder():
    global _embedder
    if _embedder is None:
        from sentence_transformers import SentenceTransformer
        _embedder = SentenceTransformer("all-MiniLM-L6-v2")
    return _embedder

def get_bm25():
    global _bm25
    if _bm25 is None:
        _bm25 = BM25Encoder.default()
    return _bm25

def batch_insert(chunks, source_filename):
    total_stored = 0
    for i in range(0, len(chunks), BATCH_SIZE):
        batch_chunks = chunks[i:i + BATCH_SIZE]
        dense_embeddings = get_embedder().encode(batch_chunks).tolist()
        sparse_embeddings = get_bm25().encode_documents(batch_chunks)
        vectors = []
        for j, (chunk, dense, sparse) in enumerate(
            zip(batch_chunks, dense_embeddings, sparse_embeddings)):
            vectors.append({
                "id": str(uuid.uuid4()),
                "values": dense,
                "sparse_values": sparse,
                "metadata": {
                    "text": chunk,
                    "source": source_filename,
                    "chunk_index": i + j
                }
            })
        index.upsert(vectors=vectors)
        total_stored += len(vectors)
        print(f"✅ Uploaded batch {i // BATCH_SIZE + 1} — {total_stored} chunks so far")
    print(f"🎉 Done — {total_stored} total chunks stored from {source_filename}")