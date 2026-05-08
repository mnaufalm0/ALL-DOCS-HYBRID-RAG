from pinecone import Pinecone
from pinecone_text.sparse import BM25Encoder
from dotenv import load_dotenv
import os

load_dotenv()
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index = pc.Index(os.getenv("PINECONE_INDEX"))

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


def batch_insert(chunks: list[str], source_filename: str, file_id: str) -> list[str]:
    """
    Inserts chunks into Pinecone. Returns list of all vector IDs stored,
    so the caller can persist them for later deletion.
    """
    all_vector_ids = []

    for i in range(0, len(chunks), BATCH_SIZE):
        batch_chunks = chunks[i:i + BATCH_SIZE]
        dense_embeddings = get_embedder().encode(batch_chunks).tolist()
        sparse_embeddings = get_bm25().encode_documents(batch_chunks)

        vectors = []
        for j, (chunk, dense, sparse) in enumerate(
            zip(batch_chunks, dense_embeddings, sparse_embeddings)
        ):
            chunk_index = i + j
            # Deterministic ID — tied to file_id so we can reconstruct if needed
            vector_id = f"{file_id}-{chunk_index}"

            vectors.append({
                "id": vector_id,
                "values": dense,
                "sparse_values": sparse,
                "metadata": {
                    "text": chunk,
                    "source": source_filename,
                    "file_id": file_id,        # ← for metadata filtering (paid tier)
                    "chunk_index": chunk_index
                }
            })
            all_vector_ids.append(vector_id)

        index.upsert(vectors=vectors)
        print(f"✅ Batch {i // BATCH_SIZE + 1} — {len(all_vector_ids)} chunks so far")

    print(f"🎉 Done — {len(all_vector_ids)} total chunks stored from {source_filename}")
    return all_vector_ids