import redis.asyncio as redis
from dotenv import load_dotenv
import os
import json

load_dotenv()

# Connection via URL
redis_client = redis.from_url(
    os.getenv("REDIS_URL"),
    decode_responses=True
)

CACHE_TTL = 60 * 60  # 1 hour

# ── Query Cache ──────────────────────────────────

async def get_cached_answer(question: str):
    cached = await redis_client.get(f"query:{question}")
    if cached:
        return json.loads(cached)
    return None

async def cache_answer(question: str, answer: str):
    await redis_client.setex(
        f"query:{question}",
        CACHE_TTL,
        json.dumps({"answer": answer})
    )

# ── Session Management ───────────────────────────

async def create_session(user_id: int, token: str):
    await redis_client.setex(
        f"session:{token}",
        CACHE_TTL,
        json.dumps({"user_id": user_id})
    )

async def get_session(token: str):
    session = await redis_client.get(f"session:{token}")
    if session:
        return json.loads(session)
    return None

async def delete_session(token: str):
    await redis_client.delete(f"session:{token}")