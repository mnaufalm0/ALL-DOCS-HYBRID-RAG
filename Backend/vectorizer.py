from pinecone import Pinecone
from pinecone_text.sparse import BM25Encoder
from embedder import get_embeddings
from dotenv import load_dotenv
import uuid
import os

load_dotenv()

pc    = Pinecone(os.getenv("PINECONE_API_KEY"))
index = pc.Index(os.getenv("PINECONE_INDEX"))
bm25  = BM25Encoder()

BATCH_SIZE = 100

def batch_insert(chunks, source_filename):
    total_stored = 0
    bm25.fit(chunks)

    for i in range(0, len(chunks), BATCH_SIZE):
        batch_chunks = chunks[i:i + BATCH_SIZE]

        dense_embeddings  = get_embeddings(batch_chunks)    # ✅ API call
        sparse_embeddings = bm25.encode_documents(batch_chunks)

        vectors = []
        for j, (chunk, dense, sparse) in enumerate(
            zip(batch_chunks, dense_embeddings, sparse_embeddings)
        ):
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
        print(f"Inserted batch {i // BATCH_SIZE + 1} — Total: {total_stored}")

    print(f"✅ Done — {total_stored} chunks from {source_filename}")
    return bm25