from pinecone import Pinecone
from pinecone_text.sparse import BM25Encoder
from groq import Groq
from system_prompt import SYSTEM_PROMPT
from dotenv import load_dotenv
import os

load_dotenv()

pinecone_api_key = os.getenv("PINECONE_API_KEY")
groq_api_key = os.getenv("GROQ_API_KEY")
pinecone_index_name = os.getenv("PINECONE_INDEX")

pc = Pinecone(api_key=pinecone_api_key)
index = pc.Index(pinecone_index_name)
groq_client = Groq(api_key=groq_api_key)

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

def query_rag(user_question: str, top_k: int = 5, system_prompt: str = None):
    dense_embedding = get_embedder().encode([user_question]).tolist()[0]
    sparse_embedding = get_bm25().encode_queries(user_question)
    results = index.query(
        vector=dense_embedding,
        sparse_vector=sparse_embedding,
        top_k=top_k,
        include_metadata=True
    )
    context = "\n\n".join([
        f"Source: {match['metadata']['source']}\n{match['metadata']['text']}"
        for match in results["matches"]
    ])
    final_prompt = SYSTEM_PROMPT.format(context=context)
    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": final_prompt},
            {"role": "user", "content": user_question}
        ]
    )
    return response.choices[0].message.content