from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from tortoise.contrib.fastapi import register_tortoise
from dotenv import load_dotenv
from routers import auth, files, query, prompts
import os

load_dotenv()

app = FastAPI(
    title="ALL-DOCS RAG API",
    version="1.0.0"
)

# ── CORS ─────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

# ── Routers ──────────────────────────────────────

app.include_router(auth.router,    prefix="/api/v1/auth",    tags=["Auth"])
app.include_router(files.router,   prefix="/api/v1/files",   tags=["Files"])
app.include_router(query.router,   prefix="/api/v1/query",   tags=["Query"])
app.include_router(prompts.router, prefix="/api/v1/prompts", tags=["Prompts"])

# ── Tortoise ORM ─────────────────────────────────

register_tortoise(
    app,
    db_url=os.getenv("DATABASE_URL"),
    modules={"models": ["db.models"]},
    generate_schemas=True,
    add_exception_handlers=True
)

# ── Health Check ─────────────────────────────────

@app.get("/")
async def root():
    return {"status": "✅ ALL-DOCS RAG API is running"}