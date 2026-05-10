import cohere
from dotenv import load_dotenv
import os

load_dotenv()

co = cohere.Client(os.getenv("COHERE_API_KEY"))

def rerank(query: str, documents: list[str], top_n: int = 3) -> list[dict]:
    if not documents:
        return []

    response = co.rerank(
        model="rerank-english-v3.0",
        query=query,
        documents=documents,
        top_n=top_n
    )

    return [
        {
            "index":           result.index,
            "text":            documents[result.index],
            "relevance_score": result.relevance_score
        }
        for result in response.results
    ]