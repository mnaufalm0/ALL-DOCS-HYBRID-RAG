from pinecone import Pinecone
from pinecone_text.sparse import BM25Encoder
from embedder import get_query_embedding
from groq import Groq
from system_prompt import SYSTEM_PROMPT
from dotenv import load_dotenv
import os

load_dotenv()

pc = Pinecone(os.getenv("PINECONE_API_KEY"))
index = pc.Index(os.getenv("PINECONE_INDEX"))

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

bm25 = BM25Encoder().default()


def query_rag(
    user_question: str,
    user_id: str,
    top_k: int = 5,
    system_prompt: str = None
):
    # Dense embedding
    dense_embedding = get_query_embedding(user_question)

    # Sparse embedding
    sparse_embedding = bm25.encode_queries(user_question)

    # Hybrid retrieval
    results = index.query(
        vector=dense_embedding,
        sparse_vector=sparse_embedding,
        top_k=top_k,
        include_metadata=True,
        namespace=str(user_id)
    )

    print(results)

    # Context building
    context = "\n\n".join([
        f"Source: {match['metadata']['source']}\n{match['metadata']['text']}"
        for match in results["matches"]
    ])

    final_prompt = (system_prompt or SYSTEM_PROMPT).format(
        context=context
    )

    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": final_prompt},
            {"role": "user", "content": user_question}
        ]
    )

    return response.choices[0].message.content