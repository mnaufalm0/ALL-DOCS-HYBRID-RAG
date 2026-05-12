from pinecone import Pinecone
from pinecone_text.sparse import BM25Encoder
from embedder import get_query_embedding
from groq import Groq
from system_prompt import SYSTEM_PROMPT
from reranker import rerank
from dotenv import load_dotenv
from typing import Optional, Dict, Any
import os

load_dotenv()

pinecone_api_key = os.getenv("PINECONE_API_KEY")
pinecone_index = os.getenv("PINECONE_INDEX")
groq_api_key = os.getenv("GROQ_API_KEY")

if pinecone_api_key is None:
    raise ValueError("PINECONE_API_KEY environment variable is not set")
if pinecone_index is None:
    raise ValueError("PINECONE_INDEX environment variable is not set")
if groq_api_key is None:
    raise ValueError("GROQ_API_KEY environment variable is not set")

pc          = Pinecone(pinecone_api_key)
index       = pc.Index(pinecone_index)
groq_client = Groq(api_key=groq_api_key)

bm25        = BM25Encoder().default()

async def query_rag(
    user_question: str,
    user_id: str,
    top_k: int = 10,        
    top_n: int = 3,         
    system_prompt: Optional[str] = None
):

    dense_embedding  = await get_query_embedding(user_question)
    sparse_embedding = bm25.encode_queries(user_question)

    
    results = index.query(
        vector=dense_embedding,
        sparse_vector=sparse_embedding,
        top_k=top_k,
        include_metadata=True,
        namespace=str(user_id)
    )

    print(results)

    
    candidates = [
        {
            "text":   match["metadata"]["text"],
            "source": match["metadata"]["source"]
        }
        for match in results["matches"]
    ]

    if not candidates:
        return "I could not find any relevant information in your documents."

    
    reranked = rerank(
        query=user_question,
        documents=[c["text"] for c in candidates],
        top_n=top_n
    )

    
    context = "\n\n".join([
        f"Source: {candidates[r['index']]['source']}\n{r['text']}"
        for r in reranked
    ])

    
    final_prompt = (system_prompt or SYSTEM_PROMPT).format(context=context)

    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": final_prompt},
            {"role": "user",   "content": user_question}
        ]
    )

    return response.choices[0].message.content