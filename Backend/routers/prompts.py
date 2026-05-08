from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from db.models import SystemPrompt
from middleware.auth import get_current_user
import uuid

router = APIRouter()

class PromptRequest(BaseModel):
    name: str
    prompt: str


@router.post("/")
async def create_prompt(
    body: PromptRequest,
    user=Depends(get_current_user)
):
    prompt = await SystemPrompt.create(
        id=uuid.uuid4(),
        user_id=user["user_id"],
        name=body.name,
        prompt=body.prompt,
        is_active=False
    )
    return {"message": "✅ Prompt created", "prompt_id": str(prompt.id)}


@router.get("/")
async def list_prompts(user=Depends(get_current_user)):
    prompts = await SystemPrompt.filter(
        user_id=user["user_id"]
    ).order_by("-created_at")

    return {"prompts": [
        {
            "id": str(p.id),
            "name": p.name,
            "prompt": p.prompt,
            "is_active": p.is_active
        }
        for p in prompts
    ]}


@router.patch("/{prompt_id}/activate")
async def activate_prompt(
    prompt_id: str,
    user=Depends(get_current_user)
):
    # Deactivate all first
    await SystemPrompt.filter(user_id=user["user_id"]).update(is_active=False)

    # Activate selected
    prompt = await SystemPrompt.filter(
        id=prompt_id,
        user_id=user["user_id"]
    ).first()

    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")

    await SystemPrompt.filter(id=prompt_id).update(is_active=True)

    return {"message": f"✅ '{prompt.name}' is now active"}


@router.delete("/{prompt_id}")
async def delete_prompt(
    prompt_id: str,
    user=Depends(get_current_user)
):
    prompt = await SystemPrompt.filter(
        id=prompt_id,
        user_id=user["user_id"]
    ).first()

    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")

    await prompt.delete()
    return {"message": "✅ Prompt deleted"}