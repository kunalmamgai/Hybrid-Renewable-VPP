"""Authentication flow tests for local email/password accounts."""
from __future__ import annotations

import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from backend.api.routes_auth import (
    LoginRequest,
    SignUpRequest,
    get_current_user,
    login,
    signup,
)
from backend.models.user import Base as UserBase


@pytest.mark.asyncio
async def test_signup_login_and_restore_session():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    async with engine.begin() as connection:
        await connection.run_sync(UserBase.metadata.create_all)

    async with session_factory() as session:
        created = await signup(
            SignUpRequest(
                full_name="Test Operator",
                email="operator@example.com",
                password="correct-horse-battery-staple",
            ),
            session,
        )
        assert created.user.email == "operator@example.com"
        assert created.user.auth_provider == "local"

        authenticated = await login(
            LoginRequest(
                email="operator@example.com",
                password="correct-horse-battery-staple",
            ),
            session,
        )
        restored = await get_current_user(
            HTTPAuthorizationCredentials(
                scheme="Bearer",
                credentials=authenticated.access_token,
            ),
            session,
        )
        assert restored.id == created.user.id

        with pytest.raises(HTTPException) as invalid_login:
            await login(
                LoginRequest(email="operator@example.com", password="wrong-password"),
                session,
            )
        assert invalid_login.value.status_code == 401

    await engine.dispose()
