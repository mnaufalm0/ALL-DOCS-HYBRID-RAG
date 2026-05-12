from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from db.models import QueryHistory, SystemPrompt
from db.redis import get_cached_answer, cache_answer, check_rate_limit
from middleware.auth import get_current_user
from query import query_rag
import time
import uuid

router = APIRouter()

class QueryRequest(BaseModel):
    question: str
    top_k: int = 10
    top_n: int = 3

@router.post("/")
async def query(
    request: QueryRequest,
    user=Depends(get_current_user)
):
    user_id = user["user_id"]

    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    # Rate limit check
    allowed = await check_rate_limit(user_id)
    if not allowed:
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Max 50 queries/hour")

    # Check Redis cache
    cached = await get_cached_answer(request.question)
    if cached:
        await QueryHistory.create(
            id=uuid.uuid4(),
            user_id=user_id,
            question=request.question,
            answer=cached["answer"],
            was_cached=True
        )
        return {"answer": cached["answer"], "source": "cache"}

    # Get active system prompt
    active_prompt = await SystemPrompt.filter(
        user_id=user_id,
        is_active=True
    ).first()

    # Run RAG
    start = time.time()
    try:
        answer = await query_rag(
            user_question=request.question,
            user_id=user_id,                                         
            top_k=request.top_k,
            system_prompt=active_prompt.prompt if active_prompt else None
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error occurred while querying RAG: {str(e)}")
    response_time = time.time() - start

    # Cache answer
    await cache_answer(request.question, answer)

    # Save to history
    await QueryHistory.create(
        id=uuid.uuid4(),
        user_id=user_id,
        question=request.question,
        answer=answer,
        response_time=response_time,
        was_cached=False
    )

    return {
        "answer": answer,
        "source": "rag",
        "response_time": round(response_time, 2)
    }


@router.get("/history")
async def query_history(user=Depends(get_current_user)):
    history = await QueryHistory.filter(
        user_id=user["user_id"]
    ).order_by("-asked_at").limit(50)

    return {"history": [
        {
            "question": h.question,
            "answer": h.answer,
            "was_cached": h.was_cached,
            "response_time": h.response_time,
            "asked_at": str(h.asked_at)
        }
        for h in history
    ]}