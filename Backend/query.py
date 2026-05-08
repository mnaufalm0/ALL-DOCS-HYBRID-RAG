from sentence_transformers import SentenceTransformer
from pinecone import Pinecone
from pinecone_text.sparse import BM25Encoder
from groq import Groq
from system_prompt import SYSTEM_PROMPT
from dotenv import load_dotenv
from db.models import UploadedFile
import os
load_dotenv()
pinecone_api_key = os.getenv("PINECONE_API_KEY")
groq_api_key = os.getenv("GROQ_API_KEY")
pinecone_index_name = os.getenv("PINECONE_INDEX")
embedder = SentenceTransformer("nomic-ai/nomic-embed-text-v1.5", trust_remote_code=True)
pc = Pinecone(api_key=pinecone_api_key)
index = pc.Index(pinecone_index_name)
groq_client = Groq(api_key=groq_api_key)
bm25 = BM25Encoder.default()

def query_rag(user_question: str, top_k: int = 5, system_prompt: str = None):
    
    dense_embedding = embedder.encode([user_question]).tolist()[0]

    
    sparse_embedding = bm25.encode_queries(user_question)

    
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