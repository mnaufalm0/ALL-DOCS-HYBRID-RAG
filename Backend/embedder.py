import nomic
from nomic import embed
from dotenv import load_dotenv
import os

load_dotenv()

nomic.login(os.getenv("NOMIC_API_KEY"))

def get_embeddings(texts: list[str]) -> list[list[float]]:
    """
    texts — list of strings
    returns — list of embedding vectors
    """
    response = embed.text(
        texts=texts,
        model="nomic-embed-text-v1.5",
        task_type="search_document"    # for storing docs
    )
    return response["embeddings"]

def get_query_embedding(query: str) -> list[float]:
    """
    Single query embedding — different task_type for better retrieval
    """
    response = embed.text(
        texts=[query],
        model="nomic-embed-text-v1.5",
        task_type="search_query"
    )
    return response["embeddings"][0]