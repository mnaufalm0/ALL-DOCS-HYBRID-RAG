from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from dotenv import load_dotenv
import os

load_dotenv()

config = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD"),
    MAIL_FROM=os.getenv("MAIL_FROM"),
    MAIL_SERVER=os.getenv("MAIL_SERVER"),
    MAIL_PORT=587,
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False
)

mail = FastMail(config)

async def send_verification_email(email: str, token: str):
    verify_url = f"http://localhost:8000/api/v1/auth/verify/{token}"

    message = MessageSchema(
        subject="Verify Your Email",
        recipients=[email],
        body=f"""
        <h2>Welcome to ALL-DOCS RAG</h2>
        <p>Click the link below to verify your email:</p>
        <a href="{verify_url}">Verify Email</a>
        <p>This link expires in 24 hours.</p>
        """,
        subtype="html"
    )

    await mail.send_message(message)

async def send_reset_email(email: str, token: str):
    reset_url = f"http://localhost:8000/api/v1/auth/password/reset-confirm"

    message = MessageSchema(
        subject="Password Reset Request",
        recipients=[email],
        body=f"""
        <h2>Password Reset</h2>
        <p>Your reset token:</p>
        <code>{token}</code>
        <p>This token expires in 15 minutes.</p>
        """,
        subtype="html"
    )

    await mail.send_message(message)