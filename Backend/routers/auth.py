from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from db.models import User, EmailAuth, GoogleAuth, EmailToken
from db.redis import create_session, delete_session, store_reset_token, get_reset_token, delete_reset_token
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
import httpx
import secrets
import uuid
import os
from utils.mailer import send_verification_email, send_reset_email
router = APIRouter()
pwd = CryptContext(schemes=["bcrypt"])

# ── Schemas ──────────────────────────────────────

class EmailSignupRequest(BaseModel):
    email: EmailStr
    password: str
    display_name: str

class EmailLoginRequest(BaseModel):
    email: EmailStr
    password: str

class GoogleAuthRequest(BaseModel):
    google_token: str   # token from Google on frontend

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

# ── Email Signup ─────────────────────────────────

@router.post("/email/signup", status_code=status.HTTP_201_CREATED)
async def email_signup(body: EmailSignupRequest):
    # Check if email exists
    existing = await User.filter(email=body.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create user
    user = await User.create(
        id=uuid.uuid4(),
        email=body.email,
        display_name=body.display_name,
        is_verified=False
    )

    # Store hashed password
    await EmailAuth.create(
        id=uuid.uuid4(),
        user=user,
        password_hash=pwd.hash(body.password.encode("utf-8")[:72])
    )

    # Create verification token
    token = secrets.token_urlsafe(32)
    await EmailToken.create(
        id=uuid.uuid4(),
        user=user,
        token=token,
        token_type="verify",
        expires_at=datetime.now(timezone.utc) + timedelta(hours=24)
    )

    await send_verification_email(body.email, token)

    return {"message": "✅ Signup successful. Please verify your email."}


# ── Email Login ──────────────────────────────────

@router.post("/email/login")
async def email_login(body: EmailLoginRequest):
    # Find user
    user = await User.filter(email=body.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Check password
    email_auth = await EmailAuth.filter(user=user).first()
    if not email_auth or not pwd.verify(body.password.encode("utf-8")[:72], email_auth.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Check verified
    if not user.is_verified:
        raise HTTPException(status_code=403, detail="Please verify your email first")

    # Create session
    token = secrets.token_urlsafe(32)
    await create_session(str(user.id), token, "email")

    return {
        "token": token,
        "user": {
            "id": str(user.id),
            "email": user.email,
            "display_name": user.display_name
        }
    }


# ── Google Auth ──────────────────────────────────

@router.post("/google")
async def google_auth(body: GoogleAuthRequest):
    # Verify token with Google
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {body.google_token}"}
        )

    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid Google token")

    google_data = response.json()
    google_id   = google_data["sub"]
    email       = google_data["email"]
    name        = google_data.get("name")
    avatar      = google_data.get("picture")

    # Check if Google account already linked
    google_auth = await GoogleAuth.filter(google_id=google_id).prefetch_related("user").first()

    if google_auth:
        # Existing user — just login
        user = google_auth.user
    else:
        # New user — create account
        user = await User.filter(email=email).first()
        if not user:
            user = await User.create(
                id=uuid.uuid4(),
                email=email,
                display_name=name,
                avatar_url=avatar,
                is_verified=True    # Google already verified email
            )

        await GoogleAuth.create(
            id=uuid.uuid4(),
            user=user,
            google_id=google_id
        )

    # Create session
    token = secrets.token_urlsafe(32)
    await create_session(str(user.id), token, "google")

    return {
        "token": token,
        "user": {
            "id": str(user.id),
            "email": user.email,
            "display_name": user.display_name,
            "avatar_url": user.avatar_url
        }
    }


# ── Verify Email ─────────────────────────────────

@router.get("/verify/{token}")
async def verify_email(token: str):
    email_token = await EmailToken.filter(
        token=token,
        token_type="verify",
        used=False
    ).prefetch_related("user").first()

    if not email_token:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    if email_token.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Token expired")

    # Mark verified
    await User.filter(id=email_token.user.id).update(is_verified=True)
    await EmailToken.filter(id=email_token.id).update(used=True)

    return {"message": "✅ Email verified successfully"}


# ── Password Reset ───────────────────────────────

@router.post("/password/reset-request")
async def reset_request(body: PasswordResetRequest):
    user = await User.filter(email=body.email).first()
    if not user:
        # Don't reveal if email exists
        return {"message": "If this email exists, a reset link has been sent"}

    token = secrets.token_urlsafe(32)
    await store_reset_token(body.email, token)

    await send_reset_email(body.email, token)

    return {"message": "If this email exists, a reset link has been sent"}


@router.post("/password/reset-confirm")
async def reset_confirm(body: PasswordResetConfirm):
    data = await get_reset_token(body.token)
    if not data:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    user = await User.filter(email=data["email"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    email_auth = await EmailAuth.filter(user=user).first()
    if not email_auth:
        raise HTTPException(status_code=400, detail="This account uses Google login")

    await EmailAuth.filter(id=email_auth.id).update(
        password_hash=pwd.hash(body.new_password.encode("utf-8")[:72])
    )
    await delete_reset_token(body.token)

    return {"message": "✅ Password reset successful"}


# ── Logout ───────────────────────────────────────

@router.post("/logout")
async def logout(token: str):
    await delete_session(token)
    return {"message": "✅ Logged out successfully"}