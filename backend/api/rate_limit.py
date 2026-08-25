"""In-memory sliding-window rate limiting for sensitive endpoints.

Suitable for a single-process deployment. For multi-worker/multi-node
deployments, replace with a shared store (e.g. Redis).
"""
from __future__ import annotations

import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request, status

from backend.config import settings


class SlidingWindowLimiter:
    """Limits each key to ``max_requests`` within ``window_seconds``."""

    def __init__(self, max_requests: int, window_seconds: float = 60.0):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._hits: dict[str, deque[float]] = defaultdict(deque)

    def hit(self, key: str) -> None:
        now = time.monotonic()
        window = self._hits[key]
        while window and now - window[0] > self.window_seconds:
            window.popleft()
        if len(window) >= self.max_requests:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests. Please try again later.",
                headers={"Retry-After": str(int(self.window_seconds))},
            )
        window.append(now)
        if len(self._hits) > 10_000:
            stale = [k for k, v in self._hits.items() if not v]
            for k in stale:
                del self._hits[k]


auth_rate_limiter = SlidingWindowLimiter(settings.rate_limit_auth_per_minute)


async def rate_limit_auth(request: Request) -> None:
    """FastAPI dependency: rate-limit by client IP (for login/signup/google)."""
    client_ip = request.client.host if request.client else "unknown"
    auth_rate_limiter.hit(client_ip)
