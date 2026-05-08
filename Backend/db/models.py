from tortoise import fields
from tortoise.models import Model

# ── User ─────────────────────────────────────────────────────

class User(Model):
    id           = fields.UUIDField(pk=True)
    email        = fields.CharField(max_length=255, unique=True)
    display_name = fields.CharField(max_length=255, null=True)
    avatar_url   = fields.CharField(max_length=500, null=True)
    is_active    = fields.BooleanField(default=True)
    is_verified  = fields.BooleanField(default=False)
    created_at   = fields.DatetimeField(auto_now_add=True)
    updated_at   = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "users"


# ── Email Auth ───────────────────────────────────────────────

class EmailAuth(Model):
    """
    Only for users who signed up with email.
    Google users won't have a record here.
    """
    id            = fields.UUIDField(pk=True)
    user          = fields.OneToOneField("models.User", related_name="email_auth")
    password_hash = fields.CharField(max_length=255)
    created_at    = fields.DatetimeField(auto_now_add=True)
    updated_at    = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "email_auth"


# ── Google Auth ──────────────────────────────────────────────

class GoogleAuth(Model):
    """
    Only for users who signed up with Google.
    Email users won't have a record here.
    """
    id               = fields.UUIDField(pk=True)
    user             = fields.OneToOneField("models.User", related_name="google_auth")
    google_id        = fields.CharField(max_length=255, unique=True)  # Google's user ID
    access_token     = fields.TextField(null=True)
    refresh_token    = fields.TextField(null=True)
    token_expires_at = fields.DatetimeField(null=True)
    created_at       = fields.DatetimeField(auto_now_add=True)
    updated_at       = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "google_auth"


# ── Email Verification + Password Reset ──────────────────────

class EmailToken(Model):
    """
    Handles both:
    - Email verification after signup
    - Password reset requests
    """
    id         = fields.UUIDField(pk=True)
    user       = fields.ForeignKeyField("models.User", related_name="email_tokens")
    token      = fields.CharField(max_length=255, unique=True)
    token_type = fields.CharField(max_length=50)   # "verify" or "reset"
    expires_at = fields.DatetimeField()
    used       = fields.BooleanField(default=False)
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "email_tokens"


# ── Files ────────────────────────────────────────────────────

class UploadedFile(Model):
    id            = fields.UUIDField(pk=True)
    user          = fields.ForeignKeyField("models.User", related_name="files")
    filename      = fields.CharField(max_length=255)
    original_name = fields.CharField(max_length=255)
    file_hash     = fields.CharField(max_length=255)
    file_size     = fields.IntField()
    file_type     = fields.CharField(max_length=50)
    chunks_stored = fields.IntField()
    status        = fields.CharField(max_length=50)  # processing, completed, failed
    error_message = fields.TextField(null=True)
    uploaded_at   = fields.DatetimeField(auto_now_add=True)
    updated_at    = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "uploaded_files"


# ── Query History ────────────────────────────────────────────

class QueryHistory(Model):
    id            = fields.UUIDField(pk=True)
    user          = fields.ForeignKeyField("models.User", related_name="queries")
    question      = fields.TextField()
    answer        = fields.TextField()
    source_files  = fields.JSONField(null=True)
    tokens_used   = fields.IntField(null=True)
    response_time = fields.FloatField(null=True)
    was_cached    = fields.BooleanField(default=False)
    asked_at      = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "query_history"


# ── System Prompts ───────────────────────────────────────────

class SystemPrompt(Model):
    id         = fields.UUIDField(pk=True)
    user       = fields.ForeignKeyField("models.User", related_name="prompts")
    name       = fields.CharField(max_length=255)
    prompt     = fields.TextField()
    is_active  = fields.BooleanField(default=False)
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "system_prompts"