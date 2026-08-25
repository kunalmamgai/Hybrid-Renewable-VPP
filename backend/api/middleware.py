"""Observability: request correlation IDs, access logs, and error handling."""
from __future__ import annotations

import contextvars
import logging
import time
import uuid

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response

logger = logging.getLogger(__name__)

# Correlation ID for the current request ("-" outside a request, e.g. scheduler loop)
request_id_ctx: contextvars.ContextVar[str] = contextvars.ContextVar("request_id", default="-")


def get_request_id() -> str:
    return request_id_ctx.get()


class RequestIdLogFilter(logging.Filter):
    """Injects the current request_id into every LogRecord."""

    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = request_id_ctx.get()
        return True


class RequestContextMiddleware(BaseHTTPMiddleware):
    """Assigns a per-request correlation ID (honors inbound X-Request-ID),
    adds it to the response header, and emits one access-log line."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        rid = request.headers.get("x-request-id") or uuid.uuid4().hex[:12]
        token = request_id_ctx.set(rid)
        start = time.perf_counter()
        try:
            response = await call_next(request)
        finally:
            request_id_ctx.reset(token)
            duration_ms = (time.perf_counter() - start) * 1000
            logger.info(
                "%s %s -> %s (%.1f ms) rid=%s",
                request.method,
                request.url.path,
                getattr(response, "status_code", "?"),
                duration_ms,
                rid,
            )
        response.headers["X-Request-ID"] = rid
        return response


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Last-resort handler: log with traceback, return a safe generic body."""
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "request_id": request_id_ctx.get(),
        },
    )


def configure_logging(level: int = logging.INFO) -> None:
    """Root logging config with request-id-aware formatting."""
    formatter = logging.Formatter(
        "%(asctime)s [%(levelname)s] [%(request_id)s] %(name)s: %(message)s",
    )
    root = logging.getLogger()
    root.setLevel(level)
    for handler in root.handlers:
        handler.setFormatter(formatter)
        handler.addFilter(RequestIdLogFilter())
