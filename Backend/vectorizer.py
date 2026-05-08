from sentence_transformers import SentenceTransformer
from pinecone import Pinecone
from dotenv import load_dotenv
from  pinecone_text.sparse import BM25Encoder
import os
import uuid

load_dotenv()

pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
embedder = SentenceTransformer("nomic-ai/nomic-embed-text-v1.5", trust_remote_code=True)
pinecone_index_name = os.getenv("PINECONE_INDEX")
index = pc.Index(pinecone_index_name)
BATCH_SIZE = 100

bm25 = BM25Encoder().default()

def batch_insert(chunks, source_filename):
    

    total_stored = 0
    BATCH_SIZE = 100

    for i in range(0, len(chunks), BATCH_SIZE):
        batch_chunks = chunks[i:i + BATCH_SIZE]

        
        dense_embeddings = embedder.encode(batch_chunks).tolist()

        
        sparse_embeddings = bm25.encode_documents(batch_chunks)

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
    
    return bm25

