# SURYA backend — FastAPI + Alembic migrations
FROM python:3.11-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt \
    && addgroup --system surya \
    && adduser --system --ingroup surya surya

# Application code + Alembic config (migrations run at container start)
COPY backend ./backend
COPY alembic.ini ./

RUN chown -R surya:surya /app
USER surya

EXPOSE 8000

# Healthcheck hits the public /health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=4).status == 200 else 1)"

# Apply schema migrations, then start the API server.
CMD ["sh", "-c", "alembic upgrade head && exec python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000"]
