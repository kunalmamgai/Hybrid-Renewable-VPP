"""Authenticated Energy AI endpoint grounded in the caller's live VPP snapshot."""
from __future__ import annotations

from typing import Any, Literal

from fastapi import APIRouter, Depends, HTTPException
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel, Field, field_validator

from backend.api.rate_limit import rate_limit_energy_ai
from backend.api.routes_auth import get_current_user
from backend.services.energy_ai import EnergyAiUnavailable, ask_energy_ai

router = APIRouter(
    prefix="/api/v1/ai",
    tags=["energy-ai"],
    dependencies=[Depends(get_current_user), Depends(rate_limit_energy_ai)],
)


class ChatTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=2_000)


class EnergyAiRequest(BaseModel):
    question: str = Field(min_length=2, max_length=600)
    context: dict[str, Any] = Field(default_factory=dict)
    history: list[ChatTurn] = Field(default_factory=list, max_length=8)

    @field_validator("question")
    @classmethod
    def normalize_question(cls, value: str) -> str:
        value = " ".join(value.split())
        if len(value) < 2:
            raise ValueError("Question is too short")
        return value


class EnergyAiResponse(BaseModel):
    answer: str
    provider: str = "groq"
    model: str


@router.post("/chat", response_model=EnergyAiResponse)
async def chat(payload: EnergyAiRequest) -> EnergyAiResponse:
    try:
        answer = await run_in_threadpool(
            ask_energy_ai,
            payload.question,
            payload.context,
            [turn.model_dump() for turn in payload.history],
        )
    except EnergyAiUnavailable as exc:
        raise HTTPException(
            status_code=503,
            detail="Live Energy AI is temporarily unavailable; telemetry fallback is active.",
        ) from exc

    from backend.config import settings

    return EnergyAiResponse(answer=answer, model=settings.groq_model)
