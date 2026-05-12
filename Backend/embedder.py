import httpx
import os
from dotenv import load_dotenv
load_dotenv()

NOMIC_API_KEY = os.getenv("NOMIC_API_KEY")

async def get_embeddings(texts: list[str]) -> list[list[float]]:
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api-atlas.nomic.ai/v1/embedding/text",
            headers={
                "Authorization": f"Bearer {NOMIC_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "texts": texts,
                "model": "nomic-embed-text-v1.5",
                "task_type": "search_document"
            },
            timeout=30
        )
        return response.json()["embeddings"]

async def get_query_embedding(query: str) -> list[float]:
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api-atlas.nomic.ai/v1/embedding/text",
            headers={
                "Authorization": f"Bearer {NOMIC_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "texts": [query],
                "model": "nomic-embed-text-v1.5",
                "task_type": "search_query"
            },
            timeout=30
        )
        return response.json()["embeddings"][0]