from __future__ import annotations

import pytest

from backend.config import settings
from backend.services import energy_ai


class _FakeResponse:
    def raise_for_status(self) -> None:
        return None

    def json(self) -> dict:
        return {
            "choices": [
                {"message": {"content": "Grid import is high because demand exceeds renewable output."}}
            ]
        }


def test_energy_ai_requires_server_key(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "groq_api_key", "")
    with pytest.raises(energy_ai.EnergyAiUnavailable):
        energy_ai.ask_energy_ai("Why is grid import high?", {"demand_kw": 100})


def test_energy_ai_sends_grounded_context(monkeypatch: pytest.MonkeyPatch) -> None:
    captured: dict = {}

    def fake_post(url, *, headers, json, timeout):
        captured.update(url=url, headers=headers, json=json, timeout=timeout)
        return _FakeResponse()

    monkeypatch.setattr(settings, "groq_api_key", "secret-test-key")
    monkeypatch.setattr(settings, "groq_model", "openai/gpt-oss-20b")
    monkeypatch.setattr(energy_ai.requests, "post", fake_post)

    answer = energy_ai.ask_energy_ai(
        "Why is grid import high?",
        {"demand_kw": 100, "solar_kw": 25, "grid_import_kw": 75},
        [{"role": "user", "content": "Give me a system summary"}],
    )

    assert answer.startswith("Grid import is high")
    assert captured["url"] == energy_ai.GROQ_CHAT_URL
    assert captured["headers"]["Authorization"] == "Bearer secret-test-key"
    assert captured["json"]["model"] == "openai/gpt-oss-20b"
    assert '"grid_import_kw":75' in captured["json"]["messages"][-1]["content"]
    assert captured["timeout"] == 25
