import redis.asyncio as redis
from dotenv import load_dotenv
import os
import json

load_dotenv()

redis_client = redis.from_url(
    os.getenv("REDIS_URL"),
    decode_responses=True
)

CACHE_TTL   = 60 * 60        # 1 hour
SESSION_TTL = 60 * 60 * 24   # 24 hours
RESET_TTL   = 60 * 15        # 15 mins

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

async def create_session(user_id: str, token: str, auth_type: str):
    """auth_type: 'email' or 'google'"""
    await redis_client.setex(
        f"session:{token}",
        SESSION_TTL,
        json.dumps({
            "user_id": user_id,
            "auth_type": auth_type
        })
    )

async def get_session(token: str):
    session = await redis_client.get(f"session:{token}")
    if session:
        return json.loads(session)
    return None

async def delete_session(token: str):
    await redis_client.delete(f"session:{token}")

# ── Rate Limiting ────────────────────────────────

async def check_rate_limit(user_id: str, limit: int = 50):
    key = f"rate:{user_id}"
    count = await redis_client.get(key)

    if count and int(count) >= limit:
        return False

    pipe = redis_client.pipeline()
    await pipe.incr(key)
    await pipe.expire(key, 3600)
    await pipe.execute()

    return True

# ── Upload Status ────────────────────────────────

async def set_upload_status(file_id: str, status: str):
    await redis_client.setex(
        f"upload:{file_id}",
        3600,
        json.dumps({"status": status})
    )

async def get_upload_status(file_id: str):
    status = await redis_client.get(f"upload:{file_id}")
    if status:
        return json.loads(status)
    return None

# ── Password Reset ───────────────────────────────

async def store_reset_token(email: str, token: str):
    await redis_client.setex(
        f"reset:{token}",
        RESET_TTL,
        json.dumps({"email": email})
    )

async def get_reset_token(token: str):
    data = await redis_client.get(f"reset:{token}")
    if data:
        return json.loads(data)
    return None

async def delete_reset_token(token: str):
    await redis_client.delete(f"reset:{token}")