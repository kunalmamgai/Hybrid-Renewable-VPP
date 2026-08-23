"""Authentication routes for email/password and Google Identity Services."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.concurrency import run_in_threadpool
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from jwt.exceptions import InvalidTokenError
from pwdlib import PasswordHash
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.api.rate_limit import rate_limit_auth
from backend.config import settings
from backend.db.database import get_session
from backend.models.user import User

router = APIRouter(prefix="/api/v1/auth", tags=["authentication"])
password_hash = PasswordHash.recommended()
dummy_password_hash = password_hash.hash("surya-dummy-password")
bearer_scheme = HTTPBearer(auto_error=False)


class SignUpRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

    @field_validator("full_name")
    @classmethod
    def clean_name(cls, value: str) -> str:
        value = " ".join(value.split())
        if len(value) < 2:
            raise ValueError("Name must contain at least 2 characters")
        return value


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class GoogleAuthRequest(BaseModel):
    credential: str = Field(min_length=20)


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: EmailStr
    full_name: str
    avatar_url: str | None
    auth_provider: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


def _create_access_token(user_id: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "iat": now,
        "exp": now + timedelta(minutes=settings.jwt_access_token_expire_minutes),
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm="HS256")


def _auth_response(user: User) -> AuthResponse:
    return AuthResponse(
        access_token=_create_access_token(user.id),
        user=UserResponse.model_validate(user),
    )


def decode_access_token(token: str) -> str | None:
    """Return the user_id encoded in a valid, non-expired token, else None."""
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=["HS256"],
        )
    except InvalidTokenError:
        return None
    user_id = payload.get("sub")
    return user_id if isinstance(user_id, str) else None


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    session: AsyncSession = Depends(get_session),
) -> User:
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Your session is invalid or has expired",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise unauthorized

    user_id = decode_access_token(credentials.credentials)
    if user_id is None:
        raise unauthorized

    user = await session.get(User, user_id)
    if user is None or not user.is_active:
        raise unauthorized
    return user


@router.post(
    "/signup",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(rate_limit_auth)],
)
async def signup(
    payload: SignUpRequest,
    session: AsyncSession = Depends(get_session),
) -> AuthResponse:
    email = str(payload.email).strip().lower()
    existing = (
        await session.execute(select(User).where(User.email == email))
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="An account with this email already exists")

    user = User(
        email=email,
        full_name=payload.full_name,
        password_hash=password_hash.hash(payload.password),
        auth_provider="local",
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return _auth_response(user)


@router.post("/login", response_model=AuthResponse, dependencies=[Depends(rate_limit_auth)])
async def login(
    payload: LoginRequest,
    session: AsyncSession = Depends(get_session),
) -> AuthResponse:
    email = str(payload.email).strip().lower()
    user = (
        await session.execute(select(User).where(User.email == email))
    ).scalar_one_or_none()

    stored_hash = user.password_hash if user and user.password_hash else dummy_password_hash
    try:
        password_valid = password_hash.verify(payload.password, stored_hash)
    except Exception:
        password_valid = False

    if user is None or not user.password_hash or not password_valid or not user.is_active:
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    return _auth_response(user)


@router.post("/google", response_model=AuthResponse, dependencies=[Depends(rate_limit_auth)])
async def google_auth(
    payload: GoogleAuthRequest,
    session: AsyncSession = Depends(get_session),
) -> AuthResponse:
    if not settings.google_client_id:
        raise HTTPException(
            status_code=503,
            detail="Google sign-in is not configured on this server",
        )

    try:
        claims = await run_in_threadpool(
            google_id_token.verify_oauth2_token,
            payload.credential,
            google_requests.Request(),
            settings.google_client_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=401, detail="Google could not verify this sign-in") from exc

    if claims.get("iss") not in {"accounts.google.com", "https://accounts.google.com"}:
        raise HTTPException(status_code=401, detail="Invalid Google token issuer")
    if not claims.get("email_verified"):
        raise HTTPException(status_code=401, detail="Your Google email is not verified")

    google_sub = claims.get("sub")
    email = str(claims.get("email", "")).strip().lower()
    if not google_sub or not email:
        raise HTTPException(status_code=401, detail="Google did not provide a valid account")

    user = (
        await session.execute(
            select(User).where(or_(User.google_sub == google_sub, User.email == email))
        )
    ).scalars().first()

    if user:
        if user.google_sub and user.google_sub != google_sub:
            raise HTTPException(status_code=409, detail="This email is linked to another Google account")
        user.google_sub = google_sub
        user.avatar_url = claims.get("picture") or user.avatar_url
        if not user.password_hash:
            user.auth_provider = "google"
        elif "google" not in user.auth_provider:
            user.auth_provider = "local,google"
    else:
        user = User(
            email=email,
            full_name=claims.get("name") or email.split("@", 1)[0],
            google_sub=google_sub,
            avatar_url=claims.get("picture"),
            auth_provider="google",
        )
        session.add(user)

    await session.commit()
    await session.refresh(user)
    return _auth_response(user)


@router.get("/me", response_model=UserResponse)
async def current_user(user: User = Depends(get_current_user)) -> User:
    return user
